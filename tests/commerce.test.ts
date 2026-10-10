import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import Database from "better-sqlite3";

mkdirSync("data", { recursive: true });
process.env.DEMO_DB_PATH = path.join(
  mkdtempSync(path.resolve("data/commerce-tests-")),
  "commerce.sqlite",
);
const { db, seed, products, orders, orderByToken, productById } =
  await import("../src/lib/db");
const {
  placeOrder,
  changeOrderStatus,
  discountFor,
  quoteOrder,
  requestReturn,
  changeReturnStatus,
  cancelCustomerOrder,
} = await import("../src/lib/commerce");
const { delivery } = await import("../src/lib/types");
beforeEach(() => {
  db.exec(
    "DELETE FROM return_requests; DELETE FROM support_messages; DELETE FROM coupons; DELETE FROM orders; DELETE FROM product_meta; DELETE FROM variants; DELETE FROM products; DELETE FROM sessions;",
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
test("legacy migration preserves edited catalogue, stock and private orders across restarts", () => {
  const file = path.join(
    mkdtempSync(path.resolve("data/migration-tests-")),
    "legacy.sqlite",
  );
  const legacy = new Database(file);
  legacy.exec(`CREATE TABLE products (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,name TEXT NOT NULL,category TEXT NOT NULL,price INTEGER NOT NULL,originalPrice INTEGER,image TEXT NOT NULL,description TEXT NOT NULL,fabric TEXT NOT NULL,archived INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE variants (id TEXT PRIMARY KEY,productId TEXT NOT NULL REFERENCES products(id),size TEXT NOT NULL,colour TEXT NOT NULL,stock INTEGER NOT NULL);
    CREATE TABLE orders (id TEXT PRIMARY KEY,token TEXT UNIQUE NOT NULL,requestId TEXT UNIQUE NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE sessions (token TEXT PRIMARY KEY,expires INTEGER NOT NULL);
    INSERT INTO products VALUES ('saved','saved-piece','Client edited piece','Tops',123456,NULL,'/images/fashion-3.jpg','Preserve my description','Preserve my fabric',0);
    INSERT INTO variants VALUES ('saved-M','saved','M','Red',3);
    INSERT INTO sessions VALUES ('old-admin-session',9999999999999);`);
  const order = {
    ...orders()[0],
    id: "SAVED-ORDER",
    token: "a".repeat(48),
    requestId: "saved-request",
    status: "Processing",
    items: [
      { ...orders()[0].items[0], productId: "saved", variantId: "saved-M" },
    ],
  };
  const {
    discount: _discount,
    couponCode: _coupon,
    deliveredAt: _delivered,
    history: _history,
    ...oldOrder
  } = order;
  void _discount;
  void _coupon;
  void _delivered;
  void _history;
  legacy
    .prepare("INSERT INTO orders VALUES (?,?,?,?)")
    .run(order.id, order.token, order.requestId, JSON.stringify(oldOrder));
  legacy.close();
  const script =
    "import {db,products,orderByToken} from './src/lib/db.ts'; console.log(JSON.stringify({products:products(),order:orderByToken('a'.repeat(48)),sessions:db.prepare('SELECT count(*) as count FROM sessions').get()})); db.close();";
  for (let restart = 0; restart < 2; restart++) {
    const output = execFileSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", script],
      { encoding: "utf8", env: { ...process.env, DEMO_DB_PATH: file } },
    );
    const result = JSON.parse(output) as {
      products: {
        id: string;
        slug: string;
        name: string;
        price: number;
        variants: { id: string; stock: number; active: boolean }[];
      }[];
      order: {
        token: string;
        discount: number;
        history: { status: string; at: string | null }[];
      };
      sessions: { count: number };
    };
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].name, "Client edited piece");
    assert.equal(result.products[0].price, 123456);
    assert.equal(result.products[0].slug, "saved-piece");
    assert.deepEqual(result.products[0].variants[0], {
      id: "saved-M",
      size: "M",
      colour: "Red",
      stock: 3,
      active: true,
    });
    assert.equal(result.order.token, order.token);
    assert.equal(result.order.discount, 0);
    assert.deepEqual(result.order.history.at(-1), {
      status: "Processing",
      at: null,
    });
    assert.equal(result.sessions.count, 0);
  }
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
test("fresh catalogue has 24 distinct names and meaningful metadata", () => {
  assert.equal(new Set(products().map((p) => p.name)).size, 24);
  assert.ok(products().every((p) => p.galleries.length && p.createdAt));
  assert.equal(products().filter((p) => p.featured).length, 8);
});
test("coupons enforce thresholds, caps, case handling and exact paise", () => {
  assert.equal(discountFor(99899, "KG10").ok, false);
  assert.deepEqual(discountFor(99900, "kg10"), {
    ok: true,
    value: { discount: 9990, couponCode: "KG10" },
  });
  assert.deepEqual(discountFor(99999, "KG10"), {
    ok: true,
    value: { discount: 9999, couponCode: "KG10" },
  });
  assert.deepEqual(discountFor(400000, "KG10"), {
    ok: true,
    value: { discount: 30000, couponCode: "KG10" },
  });
  assert.equal(discountFor(249899, "STYLE200").ok, false);
  assert.deepEqual(discountFor(249900, "STYLE200"), {
    ok: true,
    value: { discount: 20000, couponCode: "STYLE200" },
  });
});
test("server quote and order store matching discount with pre-discount delivery threshold", () => {
  const data = input({
    couponCode: "KG10",
    lines: [{ productId: "p4", variantId: "p4-M", quantity: 2, price: 179900 }],
  });
  const quote = quoteOrder(data);
  if (!quote.ok) assert.fail(quote.error);
  assert.equal(quote.value.shipping, 0);
  const result = placeOrder({ ...data, reviewedTotal: quote.value.total });
  if (!result.ok) assert.fail(result.error);
  const order = orderByToken(result.value.token)!;
  assert.equal(order.discount, 30000);
  assert.equal(order.total, 329800);
  assert.equal(order.couponCode, "KG10");
});
test("disabled coupons and forged review totals never reserve stock", () => {
  db.prepare("UPDATE coupons SET active=0 WHERE code='KG10'").run();
  assert.equal(placeOrder(input({ couponCode: "KG10" })).ok, false);
  assert.equal(placeOrder(input({ reviewedTotal: 1 })).ok, false);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    8,
  );
});
test("inactive colour variants cannot be quoted or purchased", () => {
  db.prepare("UPDATE variants SET active=0 WHERE id='p2-M'").run();
  assert.equal(quoteOrder(input()).ok, false);
  assert.equal(placeOrder(input()).ok, false);
});
test("private customer cancellation requires a valid token and restores once", () => {
  assert.equal(cancelCustomerOrder("invalid").ok, false);
  const r = placeOrder(input());
  if (!r.ok) assert.fail(r.error);
  assert.equal(cancelCustomerOrder(r.value.token).ok, true);
  assert.equal(cancelCustomerOrder(r.value.token).ok, true);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    8,
  );
});
test("returns require delivery, reject duplicates, and restore only on receipt once", () => {
  const r = placeOrder(input());
  if (!r.ok) assert.fail(r.error);
  const o = orderByToken(r.value.token)!;
  assert.equal(requestReturn(o.token, "The fit does not suit me.").ok, false);
  for (const status of ["Processing", "Shipped", "Delivered"] as const)
    assert.equal(changeOrderStatus(o.id, status).ok, true);
  const returned = requestReturn(o.token, "The fit does not suit me.");
  if (!returned.ok) assert.fail(returned.error);
  assert.equal(requestReturn(o.token, "Duplicate return request.").ok, false);
  assert.equal(changeReturnStatus(returned.value, "Received").ok, false);
  assert.equal(changeReturnStatus(returned.value, "Approved").ok, true);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    7,
  );
  assert.equal(changeReturnStatus(returned.value, "Received").ok, true);
  assert.equal(changeReturnStatus(returned.value, "Received").ok, true);
  assert.equal(
    productById("p2")!.variants.find((v) => v.id === "p2-M")!.stock,
    8,
  );
  assert.equal(orderByToken(o.token)!.paymentStatus, "Pending");
});
test("expired returns, rejected returns and short reasons are handled", () => {
  const r = placeOrder(input());
  if (!r.ok) assert.fail(r.error);
  const o = orderByToken(r.value.token)!;
  for (const status of ["Processing", "Shipped", "Delivered"] as const)
    changeOrderStatus(o.id, status);
  assert.equal(requestReturn(o.token, "short").ok, false);
  const returned = requestReturn(o.token, "This item does not fit.");
  if (!returned.ok) assert.fail(returned.error);
  assert.equal(changeReturnStatus(returned.value, "Rejected").ok, true);
  assert.equal(changeReturnStatus(returned.value, "Approved").ok, false);
  db.prepare("DELETE FROM return_requests WHERE orderId=?").run(o.id);
  const expired = {
    ...orderByToken(o.token)!,
    deliveredAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  };
  db.prepare("UPDATE orders SET payload=? WHERE id=?").run(
    JSON.stringify(expired),
    o.id,
  );
  assert.equal(requestReturn(o.token, "This request is too late.").ok, false);
});
