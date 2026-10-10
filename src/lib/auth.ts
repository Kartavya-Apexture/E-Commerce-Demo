import "server-only";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "./db";

export const adminEmail = "admin@kgstore.demo";
export function checkPassword(value: string) {
  const expected = scryptSync(
    process.env.DEMO_ADMIN_PASSWORD || "KGStoreDemo2026!",
    "kgstore-local-demo",
    64,
  );
  return timingSafeEqual(expected, scryptSync(value, "kgstore-local-demo", 64));
}
export async function createSession() {
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES (?,?)").run(
    token,
    Date.now() + 8 * 3600000,
  );
  (await cookies()).set("kgstore-admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.DEMO_HTTPS === "true",
    path: "/",
    maxAge: 8 * 3600,
  });
}
export async function isAdmin() {
  const token = (await cookies()).get("kgstore-admin")?.value;
  if (!token) return false;
  return Boolean(
    db
      .prepare("SELECT token FROM sessions WHERE token=? AND expires>?")
      .get(token, Date.now()),
  );
}
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
export async function endSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("kgstore-admin")?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token=?").run(token);
  cookieStore.delete("kgstore-admin");
}
