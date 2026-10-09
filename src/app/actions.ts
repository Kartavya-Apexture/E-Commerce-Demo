"use server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { placeOrder, changeOrderStatus } from "@/lib/commerce";
import { db } from "@/lib/db";
import {
  adminEmail,
  checkPassword,
  createSession,
  endSession,
  requireAdmin,
} from "@/lib/auth";
import {
  categories,
  sizes,
  imageLibrary,
  statuses,
  type Result,
} from "@/lib/types";

export async function checkout(input: unknown) {
  const result = placeOrder(input);
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
export async function login(_state: string, form: FormData) {
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  if (password.length > 200 || email !== adminEmail || !checkPassword(password))
    return "Incorrect email or password.";
  await createSession();
  redirect("/admin");
}
export async function logout() {
  await endSession();
  redirect("/admin/login");
}
const productSchema = z.object({
  id: z.string().max(80),
  name: z.string().trim().min(3).max(120),
  category: z.enum(categories),
  price: z.coerce.number().positive().max(100000),
  originalPrice: z.coerce.number().min(0).max(100000),
  image: z.enum(imageLibrary as [string, ...string[]]),
  description: z.string().trim().min(10).max(2000),
  fabric: z.string().trim().min(3).max(200),
  colour: z.string().trim().min(2).max(40),
  stock: z.array(z.coerce.number().int().min(0).max(10000)).length(5),
});
export async function saveProduct(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(form),
    stock: sizes.map((size) => form.get(`stock-${size}`)),
  });
  if (!parsed.success)
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message || "Please check the product details.",
    };
  const p = parsed.data;
  if (p.originalPrice > 0 && p.originalPrice < p.price)
    return {
      ok: false,
      error: "Original price must be at least the selling price.",
    };
  const id = p.id || randomUUID();
  const existing = db
    .prepare("SELECT slug FROM products WHERE id=?")
    .get(id) as { slug: string } | undefined;
  const slug =
    existing?.slug ||
    p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "") +
      "-" +
      id.slice(0, 6);
  db.transaction(() => {
    db.prepare(
      `INSERT INTO products VALUES (@id,@slug,@name,@category,@price,@originalPrice,@image,@description,@fabric,0) ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, price=excluded.price, originalPrice=excluded.originalPrice, image=excluded.image, description=excluded.description, fabric=excluded.fabric`,
    ).run({
      ...p,
      id,
      slug,
      price: Math.round(p.price * 100),
      originalPrice: p.originalPrice ? Math.round(p.originalPrice * 100) : null,
    });
    sizes.forEach((size, i) =>
      db
        .prepare(
          "INSERT INTO variants VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET colour=excluded.colour, stock=excluded.stock",
        )
        .run(`${id}-${size}`, id, size, p.colour, p.stock[i]),
    );
  })();
  revalidatePath("/", "layout");
  redirect("/admin/products");
}
export async function archiveProduct(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  db.prepare(
    "UPDATE products SET archived=CASE WHEN archived=0 THEN 1 ELSE 0 END WHERE id=?",
  ).run(id);
  revalidatePath("/", "layout");
}
export async function updateStatus(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  await requireAdmin();
  const parsed = z.enum(statuses).safeParse(form.get("status"));
  if (!parsed.success) return { ok: false, error: "Choose a valid status." };
  const result = changeOrderStatus(String(form.get("id")), parsed.data);
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
