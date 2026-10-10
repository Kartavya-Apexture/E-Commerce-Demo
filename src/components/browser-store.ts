"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { CartLine, Result } from "@/lib/types";
export const addressSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pin: z.string(),
});
export type SavedAddress = z.infer<typeof addressSchema>;
const schema = z.object({
  cart: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().min(1).max(10),
        price: z.number().int().positive(),
      }),
    )
    .max(30),
  wishlist: z.array(z.string()).max(100),
  recent: z.array(z.string()).max(8).default([]),
  orders: z
    .array(z.string().regex(/^[a-f0-9]{48}$/))
    .max(50)
    .default([]),
  address: addressSchema.nullable().default(null),
  coupon: z.string().max(30).default(""),
});
type Data = z.infer<typeof schema>;
type Store = Data & { ready: boolean };
const defaults: Data = {
  cart: [],
  wishlist: [],
  recent: [],
  orders: [],
  address: null,
  coupon: "",
};
const empty: Store = { ...defaults, ready: false };
let lastRaw: string | null | undefined;
let snapshot: Store = empty;
function getSnapshot(): Store {
  let raw: string | null = null;
  try {
    raw =
      localStorage.getItem("kgstore-v2") || localStorage.getItem("aurelle-v1");
  } catch {
    /* Browser storage may be disabled. */
  }
  if (lastRaw !== raw) {
    lastRaw = raw;
    try {
      const value: unknown = raw ? JSON.parse(raw) : defaults;
      const parsed = schema.safeParse(value);
      snapshot = { ...(parsed.success ? parsed.data : defaults), ready: true };
    } catch {
      snapshot = { ...defaults, ready: true };
    }
  }
  return snapshot;
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("kgstore-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("kgstore-change", callback);
  };
}
function write(value: Store): Result<string> {
  try {
    const parsed = schema.parse(value);
    localStorage.setItem("kgstore-v2", JSON.stringify(parsed));
    localStorage.removeItem("aurelle-v1");
    lastRaw = localStorage.getItem("kgstore-v2");
    snapshot = { ...parsed, ready: true };
    window.dispatchEvent(new Event("kgstore-change"));
    return { ok: true, value: "Saved" };
  } catch {
    return {
      ok: false,
      error:
        "Your browser could not save this change. Check browser storage and try again.",
    };
  }
}
export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty);
}
export function addToCart(line: CartLine, max: number): Result<string> {
  const state = getSnapshot();
  const existing = state.cart.find((i) => i.variantId === line.variantId);
  if (!existing && state.cart.length >= 30)
    return { ok: false, error: "Your bag has reached its 30-item limit." };
  if (
    line.quantity < 1 ||
    line.quantity + (existing?.quantity || 0) > Math.min(max, 10)
  )
    return {
      ok: false,
      error: `You can add up to ${Math.min(max, 10)} of this size in total.`,
    };
  const quantity = (existing?.quantity || 0) + line.quantity;
  const result = write({
    ...state,
    cart: existing
      ? state.cart.map((i) =>
          i.variantId === line.variantId ? { ...line, quantity } : i,
        )
      : [...state.cart, { ...line, quantity }],
  });
  if (result.ok)
    queueMicrotask(() => window.dispatchEvent(new Event("kgstore-open-bag")));
  return result;
}
export function setQuantity(variantId: string, quantity: number) {
  const state = getSnapshot();
  return write({
    ...state,
    cart:
      quantity < 1
        ? state.cart.filter((l) => l.variantId !== variantId)
        : state.cart.map((l) =>
            l.variantId === variantId
              ? { ...l, quantity: Math.min(quantity, 10) }
              : l,
          ),
  });
}
export function clearCart() {
  return write({ ...getSnapshot(), cart: [], coupon: "" });
}
export function toggleWishlist(id: string) {
  const state = getSnapshot();
  if (!state.wishlist.includes(id) && state.wishlist.length >= 100)
    return {
      ok: false as const,
      error: "Your wishlist has reached its 100-item limit.",
    };
  return write({
    ...state,
    wishlist: state.wishlist.includes(id)
      ? state.wishlist.filter((i) => i !== id)
      : [...state.wishlist, id],
  });
}
export function saveRecent(id: string) {
  const state = getSnapshot();
  if (state.recent[0] === id) return;
  write({
    ...state,
    recent: [id, ...state.recent.filter((i) => i !== id)].slice(0, 8),
  });
}
export function saveOrder(token: string) {
  const state = getSnapshot();
  return write({
    ...state,
    orders: [token, ...state.orders.filter((t) => t !== token)].slice(0, 50),
  });
}
export function saveAddress(address: SavedAddress | null) {
  return write({ ...getSnapshot(), address });
}
export function saveCoupon(coupon: string) {
  return write({ ...getSnapshot(), coupon });
}
export function clearBrowserData() {
  return write({ ...defaults, ready: true });
}
