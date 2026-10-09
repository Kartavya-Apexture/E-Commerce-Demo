"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { CartLine } from "@/lib/types";

type Store = { cart: CartLine[]; wishlist: string[]; ready: boolean };
const empty: Store = { cart: [], wishlist: [], ready: false };
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
});
let lastRaw: string | null | undefined;
let snapshot: Store = empty;
function getSnapshot(): Store {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem("aurelle-v1");
  } catch {
    /* Storage may be unavailable in private browser sessions. */
  }
  if (lastRaw !== raw) {
    lastRaw = raw;
    try {
      const value: unknown = raw ? JSON.parse(raw) : { cart: [], wishlist: [] };
      const parsed = schema.safeParse(value);
      snapshot = {
        ...(parsed.success ? parsed.data : { cart: [], wishlist: [] }),
        ready: true,
      };
    } catch {
      snapshot = { cart: [], wishlist: [], ready: true };
    }
  }
  return snapshot;
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("aurelle-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("aurelle-change", callback);
  };
}
function write(value: Store) {
  snapshot = value;
  try {
    localStorage.setItem("aurelle-v1", JSON.stringify(value));
    lastRaw = localStorage.getItem("aurelle-v1");
  } catch {
    lastRaw = null;
  }
  window.dispatchEvent(new Event("aurelle-change"));
}
export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty);
}
export function addToCart(line: CartLine, max: number) {
  const state = getSnapshot();
  const existing = state.cart.find((item) => item.variantId === line.variantId);
  const quantity = Math.min(max, 10, (existing?.quantity || 0) + line.quantity);
  if (existing)
    write({
      ...state,
      cart: state.cart.map((item) =>
        item.variantId === line.variantId ? { ...line, quantity } : item,
      ),
    });
  else write({ ...state, cart: [...state.cart, { ...line, quantity }] });
}
export function setQuantity(variantId: string, quantity: number) {
  const state = getSnapshot();
  write({
    ...state,
    cart:
      quantity < 1
        ? state.cart.filter((line) => line.variantId !== variantId)
        : state.cart.map((line) =>
            line.variantId === variantId
              ? { ...line, quantity: Math.min(quantity, 10) }
              : line,
          ),
  });
}
export function clearCart() {
  write({ ...getSnapshot(), cart: [] });
}
export function toggleWishlist(id: string) {
  const state = getSnapshot();
  write({
    ...state,
    wishlist: state.wishlist.includes(id)
      ? state.wishlist.filter((item) => item !== id)
      : [...state.wishlist, id],
  });
}
export function clearBrowserData() {
  write({ cart: [], wishlist: [], ready: true });
}
