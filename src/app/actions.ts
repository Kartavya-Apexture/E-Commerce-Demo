"use server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  placeOrder,
  quoteOrder,
  changeOrderStatus,
  cancelCustomerOrder,
  requestReturn,
  changeReturnStatus,
} from "@/lib/commerce";
import { db, productById, orderByToken } from "@/lib/db";
import {
  adminEmail,
  checkPassword,
  createSession,
  endSession,
  requireAdmin,
} from "@/lib/auth";
import {
  statuses,
  returnStatuses,
  type Result,
} from "@/lib/types";
import { productSchema, contactSchema } from "@/lib/validation";
const refresh = () => revalidatePath("/", "layout");
export async function checkout(input: unknown) {
  const reviewed = z
    .object({ reviewedTotal: z.number().int().nonnegative() })
    .safeParse(input);
  if (!reviewed.success)
    return {
      ok: false as const,
      error: "Review your order total before placing it.",
    };
  const result = placeOrder(input);
  if (result.ok) refresh();
  return result;
}
export async function getQuote(input: unknown) {
  return quoteOrder(input);
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
export async function saveProduct(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  await requireAdmin();
  let groups: unknown;
  try {
    groups = JSON.parse(String(form.get("groups")));
  } catch {
    return { ok: false, error: "Check your colour and stock groups." };
  }
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(form),
    groups,
  });
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Please check the details.",
    };
  const p = parsed.data;
  if (p.originalPrice > 0 && p.originalPrice < p.price)
    return {
      ok: false,
      error: "Original price must be at least the selling price.",
    };
  if (
    new Set(p.groups.map((g) => g.colour.toLowerCase())).size !==
      p.groups.length ||
    p.groups.some((g) => new Set(g.variants.map((v) => v.size)).size !== 5)
  )
    return {
      ok: false,
      error: "Each colour must be unique and include all five sizes.",
    };
  const id = p.id || randomUUID();
  const existing = p.id ? productById(p.id) : undefined;
  if (p.id && !existing)
    return { ok: false, error: "Product no longer exists." };
  const variantIds = p.groups
    .flatMap((g) => g.variants.map((v) => v.id))
    .filter(Boolean);
  if (
    new Set(variantIds).size !== variantIds.length ||
    variantIds.some((v) => !existing?.variants.some((e) => e.id === v))
  )
    return {
      ok: false,
      error: "Variant identifiers do not belong to this product.",
    };
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
      `INSERT INTO products (id,slug,name,category,price,originalPrice,image,description,fabric,archived) VALUES (@id,@slug,@name,@category,@price,@originalPrice,@image,@description,@fabric,0) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,price=excluded.price,originalPrice=excluded.originalPrice,image=excluded.image,description=excluded.description,fabric=excluded.fabric`,
    ).run({
      id,
      slug,
      name: p.name,
      category: p.category,
      price: Math.round(p.price * 100),
      originalPrice: p.originalPrice ? Math.round(p.originalPrice * 100) : null,
      image: p.groups[0].images[0],
      description: p.description,
      fabric: p.fabric,
    });
    db.prepare(
      "INSERT INTO product_meta VALUES (?,?,?,?,?) ON CONFLICT(productId) DO UPDATE SET featured=excluded.featured,fit=excluded.fit,galleries=excluded.galleries",
    ).run(
      id,
      existing?.createdAt || new Date().toISOString(),
      form.get("featured") === "on" ? 1 : 0,
      p.fit,
      JSON.stringify(
        p.groups.map((g) => ({ colour: g.colour, images: g.images })),
      ),
    );
    db.prepare("UPDATE variants SET active=0 WHERE productId=?").run(id);
    for (const group of p.groups)
      for (const v of group.variants) {
        const variantId =
          v.id ||
          (!existing && p.groups.length === 1
            ? `${id}-${v.size}`
            : randomUUID());
        db.prepare(
          "INSERT INTO variants (id,productId,size,colour,stock,active) VALUES (?,?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET colour=excluded.colour,stock=excluded.stock,active=1",
        ).run(variantId, id, v.size, group.colour, v.stock);
      }
  })();
  refresh();
  redirect("/admin/products");
}
export async function archiveProduct(form: FormData) {
  await requireAdmin();
  db.prepare(
    "UPDATE products SET archived=CASE WHEN archived=0 THEN 1 ELSE 0 END WHERE id=?",
  ).run(String(form.get("id")));
  refresh();
}
export async function updateStatus(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  await requireAdmin();
  const parsed = z.enum(statuses).safeParse(form.get("status"));
  if (!parsed.success) return { ok: false, error: "Choose a valid status." };
  const result = changeOrderStatus(String(form.get("id")), parsed.data);
  if (result.ok) refresh();
  return result;
}
const tokenSchema = z.string().regex(/^[a-f0-9]{48}$/);
export async function customerCancel(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  const token = tokenSchema.safeParse(form.get("token"));
  if (!token.success) return { ok: false, error: "Order not found." };
  const result = cancelCustomerOrder(token.data);
  if (result.ok) refresh();
  return result;
}
export async function customerReturn(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  const token = tokenSchema.safeParse(form.get("token"));
  if (!token.success) return { ok: false, error: "Order not found." };
  const result = requestReturn(token.data, String(form.get("reason") || ""));
  if (result.ok) refresh();
  return result;
}
export async function updateReturn(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  await requireAdmin();
  const status = z.enum(returnStatuses).safeParse(form.get("status"));
  if (!status.success) return { ok: false, error: "Choose a valid status." };
  const result = changeReturnStatus(String(form.get("id")), status.data);
  if (result.ok) refresh();
  return result;
}
export async function toggleCoupon(form: FormData) {
  await requireAdmin();
  db.prepare(
    "UPDATE coupons SET active=CASE WHEN active=0 THEN 1 ELSE 0 END WHERE code=?",
  ).run(String(form.get("code")));
  refresh();
}
export async function resolveMessage(form: FormData) {
  await requireAdmin();
  db.prepare("UPDATE support_messages SET status='Resolved' WHERE id=?").run(
    String(form.get("id")),
  );
  refresh();
}
export async function contact(
  _state: Result<string> | null,
  form: FormData,
): Promise<Result<string>> {
  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Check your message.",
    };
  const id = `MSG-${randomUUID().slice(0, 8).toUpperCase()}`;
  const p = parsed.data;
  db.prepare("INSERT INTO support_messages VALUES (?,?,?,?,?,?,?)").run(
    id,
    p.name,
    p.email,
    p.subject,
    p.message,
    "New",
    new Date().toISOString(),
  );
  refresh();
  return { ok: true, value: id };
}
export async function privateOrderSummaries(input: unknown) {
  const parsed = z.array(tokenSchema).max(50).safeParse(input);
  if (!parsed.success) return [];
  return parsed.data.flatMap((token) => {
    const o = orderByToken(token);
    return o
      ? [
          {
            token,
            id: o.id,
            status: o.status,
            total: o.total,
            createdAt: o.createdAt,
            itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
          },
        ]
      : [];
  });
}
