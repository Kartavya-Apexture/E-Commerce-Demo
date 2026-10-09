import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  categories,
  sizes,
  type Product,
  type Variant,
  type Order,
} from "./types";

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
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);`);
type ProductRow = Omit<Product, "variants" | "archived"> & { archived: number };
export function products(includeArchived = false): Product[] {
  const rows = db
    .prepare(
      `SELECT * FROM products ${includeArchived ? "" : "WHERE archived = 0"} ORDER BY rowid`,
    )
    .all() as ProductRow[];
  const getVariants = db.prepare(
    "SELECT id, size, colour, stock FROM variants WHERE productId = ?",
  );
  return rows.map((row) => ({
    ...row,
    archived: Boolean(row.archived),
    variants: getVariants.all(row.id) as Variant[],
  }));
}
export function productById(id: string) {
  return products(true).find((product) => product.id === id);
}
export function orders(): Order[] {
  return (
    db.prepare("SELECT payload FROM orders ORDER BY rowid DESC").all() as {
      payload: string;
    }[]
  ).map((row) => JSON.parse(row.payload) as Order);
}
export function orderByToken(token: string): Order | undefined {
  const row = db
    .prepare("SELECT payload FROM orders WHERE token = ?")
    .get(token) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as Order) : undefined;
}
export function seed() {
  if (
    (
      db.prepare("SELECT COUNT(*) AS count FROM products").get() as {
        count: number;
      }
    ).count > 0
  )
    return;
  const base = [
    {
      name: "Scarlet occasion dress",
      category: categories[0],
      colour: "Scarlet",
      image: "/images/fashion-2.jpg",
      price: 289900,
      fabric: "Soft woven occasion fabric",
    },
    {
      name: "Tomato graphic sweatshirt",
      category: categories[1],
      colour: "Red",
      image: "/images/fashion-3.jpg",
      price: 149900,
      fabric: "Cotton-blend fleece",
    },
    {
      name: "Sunshine lounge co-ord",
      category: categories[2],
      colour: "Yellow",
      image: "/images/fashion-1.jpg",
      price: 249900,
      fabric: "Cotton-blend jersey",
    },
    {
      name: "Blush pocket joggers",
      category: categories[3],
      colour: "Blush",
      image: "/images/fashion-5.jpg",
      price: 179900,
      fabric: "Soft woven cotton blend",
    },
    {
      name: "Powder blue longline coat",
      category: categories[4],
      colour: "Blue",
      image: "/images/fashion-0.jpg",
      price: 349900,
      fabric: "Wool-look woven blend",
    },
  ];
  const insert = db.prepare(
    "INSERT INTO products VALUES (@id,@slug,@name,@category,@price,@originalPrice,@image,@description,@fabric,0)",
  );
  const variant = db.prepare("INSERT INTO variants VALUES (?,?,?,?,?)");
  db.transaction(() => {
    for (let i = 0; i < 24; i++) {
      const item = base[i % base.length];
      const id = `p${i + 1}`;
      const name =
        item.name + (i >= 5 ? ` · Edit ${Math.floor(i / 5) + 1}` : "");
      insert.run({
        ...item,
        id,
        name,
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-$/, ""),
        price: item.price + Math.floor(i / 5) * 10000,
        originalPrice: i % 3 === 0 ? item.price + 50000 : null,
        description:
          "An effortless piece for your everyday wardrobe. Thoughtfully selected for an easy silhouette and a confident, individual style. Photography illustrates this sample design; edit labels represent demo catalogue entries.",
      });
      sizes.forEach((size, index) =>
        variant.run(
          `${id}-${size}`,
          id,
          size,
          item.colour,
          i === 23 || (i === 0 && index === 0) ? 0 : index === 4 ? 2 : 8,
        ),
      );
    }
    for (let i = 0; i < 3; i++) {
      const item = base[i];
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
        status: ["Placed", "Processing", "Delivered"][i] as Order["status"],
        subtotal: item.price,
        shipping: item.price >= 199900 ? 0 : 9900,
        total: item.price + (item.price >= 199900 ? 0 : 9900),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
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
