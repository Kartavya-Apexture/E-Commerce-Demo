"use client";
import { useSyncExternalStore } from "react";
import { demoStateSchema, freshDemoState, type DemoState } from "./demo-state";
import type { Result } from "./types";
export const demoKey = "kg-browser-demo-v1";
const sessionKey = "kg-browser-demo-admin";
let cachedRaw: string | null | undefined;
let cached: { data: DemoState | null; error: string } = {
  data: null,
  error: "",
};
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}
function snapshot() {
  try {
    const raw = localStorage.getItem(demoKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const value: unknown = raw ? JSON.parse(raw) : freshDemoState();
      const parsed = demoStateSchema.safeParse(value);
      cached = parsed.success
        ? { data: parsed.data, error: "" }
        : {
            data: null,
            error:
              "Saved demo data could not be read. Reset this browser demo to start again.",
          };
    }
  } catch {
    if (
      cached.error !==
      "Browser storage is unavailable. Enable site storage to use this demo."
    )
      cached = {
        data: null,
        error:
          "Browser storage is unavailable. Enable site storage to use this demo.",
      };
  }
  return cached;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
const empty = { data: null, error: "" };
export function useDemo() {
  return useSyncExternalStore(subscribe, snapshot, () => empty);
}
export function readDemo() {
  const current = snapshot();
  if (!current.data) throw new Error(current.error);
  return current.data;
}
export async function mutateDemo<T>(
  action: (state: DemoState) => Result<T>,
): Promise<Result<T>> {
  const run = (): Result<T> => {
    try {
      const draft = structuredClone(readDemo());
      const result = action(draft);
      if (!result.ok) return result;
      const parsed = demoStateSchema.safeParse(draft);
      if (!parsed.success)
        return {
          ok: false,
          error: "Demo data limit reached. Nothing was saved.",
        };
      // One write commits the order and stock together. Failed writes retain previous data.
      localStorage.setItem(demoKey, JSON.stringify(parsed.data));
      emit();
      return result;
    } catch {
      return {
        ok: false,
        error:
          "Could not save the demo. Check browser storage space. Your bag has not been cleared.",
      };
    }
  };
  // Serialise writes across tabs on browsers supporting Web Locks.
  return navigator.locks ? navigator.locks.request(demoKey, run) : run();
}
export function resetDemo() {
  localStorage.removeItem(demoKey);
  cachedRaw = undefined;
  emit();
}
export function demoAdmin() {
  try {
    return Number(sessionStorage.getItem(sessionKey)) > Date.now();
  } catch {
    return false;
  }
}
export function setDemoAdmin(active: boolean) {
  if (active)
    sessionStorage.setItem(sessionKey, String(Date.now() + 6 * 3600000));
  else sessionStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event("kg-demo-auth"));
}
export function adminMutation<T>(
  action: (state: DemoState) => Result<T>,
): Promise<Result<T>> {
  return mutateDemo((state) =>
    demoAdmin()
      ? action(state)
      : { ok: false, error: "Sign in to the demo admin first." },
  );
}
