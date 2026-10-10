import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  sizes,
  type Product,
  type Variant,
  type Order,
  type Coupon,
  type ReturnRequest,
  type SupportMessage,
} from "./types";
import { sampleCatalogue } from "./catalogue";
const dbPath = path.resolve(
  /* turbopackIgnore: true */ process.env.DEMO_DB_PATH || "data/aurelle.sqlite",
);
mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL CHECK(price > 0), originalPrice INTEGER, image TEXT NOT NULL, description TEXT NOT NULL, fabric TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS variants (id TEXT PRIMARY KEY, productId TEXT NOT NULL REFERENCES products(id), size TEXT NOT NULL, colour TEXT NOT NULL, stock INTEGER NOT NULL CHECK(stock >= 0));
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, requestId TEXT UNIQUE NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS product_meta (productId TEXT PRIMARY KEY REFERENCES products(id), createdAt TEXT NOT NULL, featured INTEGER NOT NULL DEFAULT 0, fit TEXT NOT NULL, galleries TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS coupons (code TEXT PRIMARY KEY, kind TEXT NOT NULL, amount INTEGER NOT NULL, minimum INTEGER NOT NULL, cap INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS return_requests (id TEXT PRIMARY KEY, orderId TEXT UNIQUE NOT NULL REFERENCES orders(id), reason TEXT NOT NULL, status TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS support_messages (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'New', createdAt TEXT NOT NULL);`);
if (!db.prepare("SELECT version FROM migrations WHERE version=1").get())
  db.transaction(() => {
    const columns = db.prepare("PRAGMA table_info(variants)").all() as {
      name: string;
    }[];
    if (!columns.some((c) => c.name === "active"))
      db.exec(
        "ALTER TABLE variants ADD COLUMN active INTEGER NOT NULL DEFAULT 1",
      );
    db.exec("DELETE FROM sessions");
    db.prepare("INSERT INTO migrations VALUES (1)").run();
  })();
type ProductRow = Omit<
  Product,
  "variants" | "archived" | "createdAt" | "featured" | "fit" | "galleries"
> & { archived: number };
const gallerySchema = z.array(
  z.object({ colour: z.string(), images: z.array(z.string()) }),
);
export function products(includeArchived = false): Product[] {
  const rows = db
    .prepare(
      `SELECT * FROM products ${includeArchived ? "" : "WHERE archived=0"} ORDER BY rowid`,
    )
    .all() as ProductRow[];
  return rows.map((row) => {
    const meta = db
      .prepare("SELECT * FROM product_meta WHERE productId=?")
      .get(row.id) as
      | { createdAt: string; featured: number; fit: string; galleries: string }
      | undefined;
    const variants = (
      db
        .prepare(
          "SELECT id,size,colour,stock,active FROM variants WHERE productId=?",
        )
        .all(row.id) as (Omit<Variant, "active"> & { active: number })[]
    ).map((v) => ({ ...v, active: Boolean(v.active) }));
    const parsed = gallerySchema.safeParse(
      meta ? (JSON.parse(meta.galleries) as unknown) : [],
    );
    return {
      ...row,
      archived: Boolean(row.archived),
      variants,
      createdAt: meta?.createdAt || "2026-01-01T00:00:00.000Z",
      featured: Boolean(meta?.featured),
      fit: meta?.fit || "Regular fit. Sample measurements; see size guide.",
      galleries:
        parsed.success && parsed.data.length
          ? parsed.data
          : [{ colour: variants[0]?.colour || "", images: [row.image] }],
    };
  });
}
export function productById(id: string) {
  return products(true).find((p) => p.id === id);
}
function normaliseOrder(order: Order): Order {
  return {
    ...order,
    discount: order.discount || 0,
    couponCode: order.couponCode || null,
    deliveredAt: order.deliveredAt || null,
    history: order.history || [
      { status: "Placed", at: order.createdAt },
      ...(order.status !== "Placed"
        ? [{ status: order.status, at: null }]
        : []),
    ],
  };
}
export function orders(): Order[] {
  return (
    db.prepare("SELECT payload FROM orders ORDER BY rowid DESC").all() as {
      payload: string;
    }[]
  ).map((r) => normaliseOrder(JSON.parse(r.payload) as Order));
}
export function orderByToken(token: string): Order | undefined {
  const row = db
    .prepare("SELECT payload FROM orders WHERE token=?")
    .get(token) as { payload: string } | undefined;
  return row ? normaliseOrder(JSON.parse(row.payload) as Order) : undefined;
}
export function coupons(): Coupon[] {
  return (
    db.prepare("SELECT * FROM coupons ORDER BY code").all() as (Omit<
      Coupon,
      "active"
    > & { active: number })[]
  ).map((c) => ({ ...c, active: Boolean(c.active) }));
}
export function returns(): ReturnRequest[] {
  return db
    .prepare("SELECT * FROM return_requests ORDER BY createdAt DESC")
    .all() as ReturnRequest[];
}
export function supportMessages(): SupportMessage[] {
  return db
    .prepare("SELECT * FROM support_messages ORDER BY createdAt DESC")
    .all() as SupportMessage[];
}
export function seed() {
  db.prepare(
    "INSERT OR IGNORE INTO coupons VALUES ('KG10','percent',10,99900,30000,1)",
  ).run();
  db.prepare(
    "INSERT OR IGNORE INTO coupons VALUES ('STYLE200','fixed',20000,249900,20000,1)",
  ).run();
  if (
    (
      db.prepare("SELECT COUNT(*) AS count FROM products").get() as {
        count: number;
      }
    ).count
  )
    return;
  db.transaction(() => {
    sampleCatalogue.forEach((item, i) => {
      const id = `p${i + 1}`;
      const slug = item.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, "");
      db.prepare(
        "INSERT INTO products (id,slug,name,category,price,originalPrice,image,description,fabric,archived) VALUES (@id,@slug,@name,@category,@price,@originalPrice,@image,@description,@fabric,0)",
      ).run({
        ...item,
        id,
        slug,
        originalPrice: i % 3 === 0 ? item.price + 50000 : null,
        description: `${item.name} brings an easy ${item.colour.toLowerCase()} statement to your wardrobe. Pair it with your everyday essentials or dress it up for your next outing. Fabric and fit details are illustrative demo information.`,
      });
      db.prepare("INSERT INTO product_meta VALUES (?,?,?,?,?)").run(
        id,
        new Date(Date.now() - (23 - i) * 86400000).toISOString(),
        i < 8 ? 1 : 0,
        "Regular fit. Select your usual size for an easy silhouette.",
        JSON.stringify([{ colour: item.colour, images: [item.image] }]),
      );
      sizes.forEach((size, index) =>
        db
          .prepare(
            "INSERT INTO variants (id,productId,size,colour,stock,active) VALUES (?,?,?,?,?,1)",
          )
          .run(
            `${id}-${size}`,
            id,
            size,
            item.colour,
            i === 23 || (i === 0 && index === 0) ? 0 : index === 4 ? 2 : 8,
          ),
      );
    });
    for (let i = 0; i < 3; i++) {
      const item = sampleCatalogue[i];
      const at = new Date(Date.now() - i * 86400000).toISOString();
      const status = (["Placed", "Processing", "Delivered"] as const)[i];
      const order: Order = {
        id: `AU-SAMPLE-${i + 1}`,
        token: randomBytes(24).toString("hex"),
        requestId: `seed-${i}`,
        name: ["Ananya Sharma", "Riya Mehta", "Meera Kapoor"][i],
        email: `sample${i}@example.com`,
        phone: "9876543210",
        address: "12 Sample Lane",
        city: "Mumbai",
        state: "Maharashtra",
        pin: "400001",
        payment: "online",
        paymentStatus: "Demo paid",
        status,
        subtotal: item.price,
        shipping: item.price >= 199900 ? 0 : 9900,
        total: item.price + (item.price >= 199900 ? 0 : 9900),
        createdAt: at,
        discount: 0,
        couponCode: null,
        deliveredAt: status === "Delivered" ? at : null,
        history: [{ status, at }],
        items: [
          {
            productId: `p${i + 1}`,
            variantId: `p${i + 1}-S`,
            name: item.name,
            image: item.image,
            size: "S",
            colour: item.colour,
            quantity: 1,
            price: item.price,
          },
        ],
      };
      db.prepare("INSERT INTO orders VALUES (?,?,?,?)").run(
        order.id,
        order.token,
        order.requestId,
        JSON.stringify(order),
      );
      db.prepare("UPDATE variants SET stock=stock-1 WHERE id=?").run(
        order.items[0].variantId,
      );
    }
  })();
}
seed();
