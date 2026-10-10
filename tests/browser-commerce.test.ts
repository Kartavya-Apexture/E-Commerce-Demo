import { test } from "node:test";
import assert from "node:assert/strict";
import { freshDemoState, demoStateSchema } from "../src/lib/demo-state";
import {
  demoCheckout,
  demoQuote,
  demoStatus,
  demoRequestReturn,
  demoReturnStatus,
  demoContact,
} from "../src/lib/demo-commerce";
function input() {
  return {
    requestId: crypto.randomUUID(),
    name: "Demo Shopper",
    email: "demo@example.com",
    phone: "9876543210",
    address: "12 Sample Lane",
    city: "Mumbai",
    state: "Maharashtra",
    pin: "400001",
    payment: "cod",
    reviewedTotal: 260910,
    couponCode: "kg10",
    lines: [{ productId: "p1", variantId: "p1-S", quantity: 1, price: 289900 }],
  };
}
test("browser checkout coupons, duplicate requests and persisted snapshot retain one order", () => {
  const state = freshDemoState(),
    data = input(),
    result = demoCheckout(state, data);
  assert.equal(result.ok, true);
  assert.equal(state.orders[0].discount, 28990);
  assert.equal(state.products[0].variants[1].stock, 7);
  const restored = demoStateSchema.parse(
    JSON.parse(JSON.stringify(state)) as unknown,
  );
  assert.deepEqual(demoCheckout(restored, data), result);
  assert.equal(restored.orders.length, 1);
  assert.equal(restored.products[0].variants[1].stock, 7);
});
test("browser failures never change stock or orders", () => {
  const s = freshDemoState();
  const before = JSON.stringify(s);
  for (const changes of [
    { pin: "000000" },
    { payment: "online", simulateFailure: true },
    { reviewedTotal: 1 },
    { couponCode: "MISSING" },
    {
      lines: [
        { productId: "p1", variantId: "p1-XS", quantity: 1, price: 289900 },
      ],
    },
    {
      lines: [{ productId: "p1", variantId: "p1-S", quantity: 1, price: 100 }],
    },
  ])
    assert.equal(demoCheckout(s, { ...input(), ...changes }).ok, false);
  assert.equal(JSON.stringify(s), before);
});
test("browser cancellation and return receipt restore exactly once", () => {
  const s = freshDemoState();
  demoCheckout(s, input());
  const o = s.orders[0];
  assert.equal(demoStatus(s, o.id, "Cancelled").ok, true);
  demoStatus(s, o.id, "Cancelled");
  assert.equal(s.products[0].variants[1].stock, 8);
  demoCheckout(s, input());
  const second = s.orders[0];
  assert.equal(demoStatus(s, second.id, "Delivered").ok, false);
  for (const status of ["Processing", "Shipped", "Delivered"])
    assert.equal(demoStatus(s, second.id, status).ok, true);
  assert.equal(demoStatus(s, second.id, "Cancelled").ok, false);
  assert.equal(
    demoRequestReturn(s, second.token, "The fit does not suit me.").ok,
    true,
  );
  assert.equal(
    demoRequestReturn(s, second.token, "Another reason for return.").ok,
    false,
  );
  const r = s.returns[0];
  demoReturnStatus(s, r.id, "Approved");
  assert.equal(s.products[0].variants[1].stock, 7);
  demoReturnStatus(s, r.id, "Received");
  demoReturnStatus(s, r.id, "Received");
  assert.equal(s.products[0].variants[1].stock, 8);
});
test("browser coupons recheck availability, caps and rounding", () => {
  const s = freshDemoState();
  assert.equal(demoQuote(s, input()).ok, true);
  s.coupons[0].active = false;
  assert.equal(demoCheckout(s, input()).ok, false);
  assert.equal(s.orders.length, 0);
  s.coupons[0].active = true;
  s.products[0].price = 400001;
  const q = demoQuote(s, {
    lines: [{ productId: "p1", variantId: "p1-S", quantity: 1, price: 400001 }],
    couponCode: "KG10",
  });
  assert.equal(q.ok && q.value.discount, 30000);
});
test("browser support validates input and stores a reference", () => {
  const s = freshDemoState(),
    f = new FormData();
  assert.equal(demoContact(s, f).ok, false);
  for (const [key, value] of Object.entries({
    name: "Demo Shopper",
    email: "demo@example.com",
    subject: "Size question",
    message: "Please explain the size guide.",
  }))
    f.set(key, value);
  const result = demoContact(s, f);
  assert.equal(result.ok, true);
  assert.equal(s.messages[0].status, "New");
  assert.equal(demoStateSchema.safeParse(s).success, true);
});
