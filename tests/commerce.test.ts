import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

mkdirSync("data", { recursive: true });
process.env.DEMO_DB_PATH = path.join(
  mkdtempSync(path.resolve("data/commerce-tests-")),
  "commerce.sqlite",
);
const { db, seed, products, orders, orderByToken, productById } = await import(
  "../src/lib/db"
);
const { placeOrder, changeOrderStatus } = await import("../src/lib/commerce");
const { delivery } = await import("../src/lib/types");
beforeEach(() => {
  db.exec(
    "DELETE FROM orders; DELETE FROM variants; DELETE FROM products; DELETE FROM sessions;",
  );
  seed();
});
after(() => db.close());
function input(overrides: Record<string, unknown> = {}) {
  return {
    requestId: randomUUID(),
    name: "Test Shopper",
    email: "shopper@example.com",
    phone: "9876543210",
    address: "12 Test Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    pin: "400001",
    payment: "cod",
    simulateFailure: false,
    lines: [
      {
        productId: "p2",
        variantId: "p2-M",
        quantity: 1,
        price: productById("p2")!.price,
      },
    ],
    ...overrides,
  };
}
test("seed provides 24 products, five categories, sold-out sizes, and sample orders", () => {
  assert.equal(products().length, 24);
  assert.equal(new Set(products().map((p) => p.category)).size, 5);
  assert.equal(orders().length, 3);
  assert.equal(
    productById("p24")!.variants.every((v) => !v.stock),
    true,
  );
});
test("successful checkout stores an order and decreases stock atomically", () => {
  const result = placeOrder(input());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const order = orderByToken(result.value.token)!;
  assert.equal(order.total, 159800);
  assert.equal(order.shipping, 9900);
  assert.equal(order.paymentStatus, "Pending");
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    7,
  );
});
test("free delivery applies exactly at the threshold", () => {
  assert.equal(delivery(199899), 9900);
  assert.equal(delivery(199900), 0);
});
test("duplicate request creates one order and decrements stock once", () => {
  const data = input();
  const first = placeOrder(data);
  const second = placeOrder(data);
  assert.deepEqual(first, second);
  assert.equal(orders().length, 4);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    7,
  );
});
test("declined payment leaves order count and inventory unchanged", () => {
  const result = placeOrder(
    input({ payment: "online", simulateFailure: true }),
  );
  assert.equal(result.ok, false);
  assert.equal(orders().length, 3);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    8,
  );
});
test("invalid PIN and phone are rejected", () => {
  assert.equal(placeOrder(input({ pin: "123" })).ok, false);
  assert.equal(placeOrder(input({ phone: "1234567890" })).ok, false);
});
test("price changed after rendering is rejected without reserving stock", () => {
  const data = input();
  db.prepare("UPDATE products SET price=price+10000 WHERE id=?").run("p2");
  const result = placeOrder(data);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /price has changed/);
  assert.equal(orders().length, 3);
});
test("insufficient stock and duplicate variants are rejected", () => {
  assert.equal(
    placeOrder(
      input({
        lines: [
          { productId: "p1", variantId: "p1-XS", quantity: 1, price: 289900 },
        ],
      }),
    ).ok,
    false,
  );
  const line = input().lines[0];
  assert.equal(placeOrder(input({ lines: [line, line] })).ok, false);
});
test("multi-line stock failure rolls back all reservations", () => {
  const result = placeOrder(
    input({
      lines: [
        { productId: "p2", variantId: "p2-M", quantity: 1, price: 149900 },
        { productId: "p1", variantId: "p1-XS", quantity: 1, price: 289900 },
      ],
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    8,
  );
});
test("archived products cannot be purchased", () => {
  db.prepare("UPDATE products SET archived=1 WHERE id=?").run("p2");
  assert.equal(placeOrder(input()).ok, false);
  assert.equal(
    products().some((p) => p.id === "p2"),
    false,
  );
});
test("cancellation restores stock once and keeps payment separate", () => {
  const result = placeOrder(input({ payment: "online" }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const order = orderByToken(result.value.token)!;
  assert.equal(changeOrderStatus(order.id, "Cancelled").ok, true);
  assert.equal(changeOrderStatus(order.id, "Cancelled").ok, true);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    8,
  );
  assert.equal(orderByToken(result.value.token)!.paymentStatus, "Demo paid");
});
test("fulfilment moves forward; shipped orders cannot be cancelled", () => {
  const result = placeOrder(input());
  if (!result.ok) assert.fail(result.error);
  const order = orderByToken(result.value.token)!;
  assert.equal(changeOrderStatus(order.id, "Delivered").ok, false);
  assert.equal(changeOrderStatus(order.id, "Processing").ok, true);
  assert.equal(changeOrderStatus(order.id, "Shipped").ok, true);
  assert.equal(changeOrderStatus(order.id, "Cancelled").ok, false);
  assert.equal(changeOrderStatus(order.id, "Delivered").ok, true);
  assert.equal(orderByToken(result.value.token)!.status, "Delivered");
});
test("private order tokens are unpredictable and invalid tokens return nothing", () => {
  const result = placeOrder(input());
  if (!result.ok) assert.fail(result.error);
  assert.match(result.value.token, /^[a-f0-9]{48}$/);
  assert.equal(orderByToken("AU-SAMPLE-1"), undefined);
});
test("another process reads saved changes and seeding preserves them", () => {
  db.prepare("UPDATE products SET price=199900 WHERE id=?").run("p2");
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "import Database from 'better-sqlite3'; const db = new Database(process.argv[1]); console.log(JSON.stringify(db.prepare('SELECT price FROM products WHERE id=?').get('p2'))); db.close();",
      process.env.DEMO_DB_PATH!,
    ],
    { encoding: "utf8" },
  );
  const row = JSON.parse(output) as { price: number };
  assert.equal(row.price, 199900);
  seed();
  assert.equal(productById("p2")!.price, 199900);
});
test("reset command restores sample data in the selected database", () => {
  db.prepare("UPDATE products SET price=199900 WHERE id=?").run("p2");
  placeOrder(input());
  execFileSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "scripts/demo.ts", "--reset"],
    { encoding: "utf8", env: { ...process.env } },
  );
  assert.equal(productById("p2")!.price, 149900);
  assert.equal(products().length, 24);
  assert.equal(orders().length, 3);
});
