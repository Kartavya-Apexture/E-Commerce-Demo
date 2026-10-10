"use client";
import * as server from "@/app/actions";
import {
  demoCheckout,
  demoQuote,
  demoStatus,
  demoRequestReturn,
  demoReturnStatus,
  demoContact,
  demoSaveProduct,
} from "./demo-commerce";
import {
  readDemo,
  mutateDemo,
  adminMutation,
  demoAdmin,
  setDemoAdmin,
} from "./browser-demo-store";
import type { Result } from "./types";
const browser = process.env.NEXT_PUBLIC_BROWSER_DEMO === "true";
function navigate(path: string) {
  window.dispatchEvent(new CustomEvent("kg-demo-navigation", { detail: path }));
}
export async function checkout(input: unknown) {
  return browser
    ? mutateDemo((s) => demoCheckout(s, input))
    : server.checkout(input);
}
export async function getQuote(input: unknown) {
  return browser ? demoQuote(readDemo(), input) : server.getQuote(input);
}
export async function login(state: string, form: FormData) {
  if (!browser) return server.login(state, form);
  if (
    form.get("email") !== "admin@kgstore.demo" ||
    form.get("password") !== "KGStoreDemo2026!"
  )
    return "Incorrect email or password.";
  setDemoAdmin(true);
  navigate("/admin");
  return "";
}
export async function logout() {
  if (!browser) return server.logout();
  setDemoAdmin(false);
  navigate("/admin/login");
}
export async function saveProduct(
  state: Result<string> | null,
  form: FormData,
) {
  if (!browser) return server.saveProduct(state, form);
  const result = await adminMutation((s) => demoSaveProduct(s, form));
  if (result.ok) navigate("/admin/products");
  return result;
}
export async function updateStatus(
  state: Result<string> | null,
  form: FormData,
) {
  return browser
    ? adminMutation((s) =>
        demoStatus(s, String(form.get("id")), String(form.get("status"))),
      )
    : server.updateStatus(state, form);
}
export async function updateReturn(
  state: Result<string> | null,
  form: FormData,
) {
  return browser
    ? adminMutation((s) =>
        demoReturnStatus(s, String(form.get("id")), String(form.get("status"))),
      )
    : server.updateReturn(state, form);
}
export async function customerCancel(
  state: Result<string> | null,
  form: FormData,
) {
  return browser
    ? mutateDemo((s) => {
        const o = s.orders.find((o) => o.token === form.get("token"));
        return o
          ? demoStatus(s, o.id, "Cancelled")
          : { ok: false, error: "Order not found." };
      })
    : server.customerCancel(state, form);
}
export async function customerReturn(
  state: Result<string> | null,
  form: FormData,
) {
  return browser
    ? mutateDemo((s) =>
        demoRequestReturn(
          s,
          String(form.get("token")),
          String(form.get("reason")),
        ),
      )
    : server.customerReturn(state, form);
}
export async function contact(state: Result<string> | null, form: FormData) {
  return browser
    ? mutateDemo((s) => demoContact(s, form))
    : server.contact(state, form);
}
export async function privateOrderSummaries(input: unknown) {
  if (!browser) return server.privateOrderSummaries(input);
  if (
    !Array.isArray(input) ||
    input.length > 50 ||
    !input.every(
      (v: unknown) => typeof v === "string" && /^[a-f0-9]{48}$/.test(v),
    )
  )
    return [];
  return readDemo()
    .orders.filter((o) => input.includes(o.token))
    .map((o) => ({
      token: o.token,
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    }));
}
export async function archiveProduct(form: FormData) {
  if (!browser) return server.archiveProduct(form);
  const r = await adminMutation((s) => {
    const p = s.products.find((p) => p.id === form.get("id"));
    if (!p) return { ok: false, error: "Product not found." };
    p.archived = !p.archived;
    return { ok: true, value: p.id };
  });
  if (!r.ok) window.alert(r.error);
}
export async function toggleCoupon(form: FormData) {
  if (!browser) return server.toggleCoupon(form);
  const r = await adminMutation((s) => {
    const c = s.coupons.find((c) => c.code === form.get("code"));
    if (!c) return { ok: false, error: "Coupon not found." };
    c.active = !c.active;
    return { ok: true, value: c.code };
  });
  if (!r.ok) window.alert(r.error);
}
export async function resolveMessage(form: FormData) {
  if (!browser) return server.resolveMessage(form);
  if (!demoAdmin()) return;
  const r = await adminMutation((s) => {
    const m = s.messages.find((m) => m.id === form.get("id"));
    if (!m) return { ok: false, error: "Message not found." };
    m.status = "Resolved";
    return { ok: true, value: m.id };
  });
  if (!r.ok) window.alert(r.error);
}
