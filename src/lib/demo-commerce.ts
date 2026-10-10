import { checkoutSchema, contactSchema, productSchema } from "./validation";
import {
  delivery,
  variantImage,
  statuses,
  returnStatuses,
  type Quote,
  type Result,
  type Order,
  type OrderItem,
} from "./types";
import { eligibleReturn, type DemoState } from "./demo-state";
const fail = (error: string): Result<never> => ({ ok: false, error });
export function demoQuote(state: DemoState, input: unknown): Result<Quote> {
  const parsed = checkoutSchema
    .pick({ lines: true, couponCode: true })
    .safeParse(input);
  if (!parsed.success) return fail("Please check your bag and coupon.");
  let subtotal = 0;
  const seen = new Set<string>();
  for (const line of parsed.data.lines) {
    const p = state.products.find((p) => p.id === line.productId);
    const v = p?.variants.find((v) => v.id === line.variantId);
    if (!p || p.archived || !v || v.active === false || v.stock < line.quantity)
      return fail(
        "An item is unavailable or its stock has changed. Review your bag.",
      );
    if (seen.has(v.id)) return fail("Duplicate item. Review your bag.");
    seen.add(v.id);
    if (p.price !== line.price)
      return fail(
        "An item price has changed. Return to your bag to review it.",
      );
    subtotal += p.price * line.quantity;
  }
  const code = parsed.data.couponCode?.trim().toUpperCase() || null;
  let discount = 0;
  if (code) {
    const c = state.coupons.find((c) => c.code === code && c.active);
    if (!c)
      return fail("This coupon is unavailable. Remove it or choose another.");
    if (subtotal < c.minimum)
      return fail(
        `This coupon requires merchandise of ₹${c.minimum / 100} or more.`,
      );
    discount = Math.min(
      subtotal,
      c.cap,
      c.kind === "percent" ? Math.round((subtotal * c.amount) / 100) : c.amount,
    );
  }
  const shipping = delivery(subtotal);
  return {
    ok: true,
    value: {
      subtotal,
      shipping,
      discount,
      total: subtotal + shipping - discount,
      couponCode: code,
    },
  };
}
export function demoCheckout(
  state: DemoState,
  input: unknown,
): Result<{ token: string }> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success)
    return fail(
      parsed.error.issues[0]?.message || "Check your delivery details.",
    );
  const data = parsed.data;
  const existing = state.orders.find((o) => o.requestId === data.requestId);
  if (existing) return { ok: true, value: { token: existing.token } };
  if (state.orders.length >= 100)
    return fail(
      "Demo order limit reached. Reset the browser demo to continue.",
    );
  if (data.payment === "online" && data.simulateFailure)
    return fail("Demo payment declined. Your cart and stock have not changed.");
  const quote = demoQuote(state, data);
  if (!quote.ok) return quote;
  if (data.reviewedTotal !== quote.value.total)
    return fail(
      "Your total has changed. Review your order again before placing it.",
    );
  const items: OrderItem[] = data.lines.map((line) => {
    const p = state.products.find((p) => p.id === line.productId)!;
    const v = p.variants.find((v) => v.id === line.variantId)!;
    return {
      ...line,
      name: p.name,
      image: variantImage(p, v.colour),
      size: v.size,
      colour: v.colour,
    };
  });
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
  const at = new Date().toISOString();
  const order: Order = {
    ...data,
    ...quote.value,
    id: `KG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    token,
    items,
    status: "Placed",
    paymentStatus: data.payment === "online" ? "Demo paid" : "Pending",
    createdAt: at,
    deliveredAt: null,
    history: [{ status: "Placed", at }],
  };
  for (const item of items)
    state.products
      .find((p) => p.id === item.productId)!
      .variants.find((v) => v.id === item.variantId)!.stock -= item.quantity;
  state.orders.unshift(order);
  return { ok: true, value: { token } };
}
function restock(state: DemoState, order: Order) {
  for (const item of order.items) {
    const v = state.products
      .find((p) => p.id === item.productId)
      ?.variants.find((v) => v.id === item.variantId);
    if (v) v.stock += item.quantity;
  }
}
export function demoStatus(
  state: DemoState,
  id: string,
  status: string,
): Result<string> {
  const o = state.orders.find((o) => o.id === id);
  if (!o || !statuses.some((s) => s === status))
    return fail("Order not found.");
  if (o.status === status) return { ok: true, value: status };
  const flow = ["Placed", "Processing", "Shipped", "Delivered"];
  const cancel =
    status === "Cancelled" && ["Placed", "Processing"].includes(o.status);
  if (
    ["Delivered", "Cancelled"].includes(o.status) ||
    (!cancel && flow.indexOf(status) !== flow.indexOf(o.status) + 1)
  )
    return fail("This status change is not allowed.");
  if (cancel) restock(state, o);
  o.status = status as Order["status"];
  const at = new Date().toISOString();
  o.history = [...(o.history || []), { status: o.status, at }];
  if (status === "Delivered") o.deliveredAt = at;
  return { ok: true, value: status };
}
export function demoRequestReturn(
  state: DemoState,
  token: string,
  reason: string,
): Result<string> {
  const o = state.orders.find((o) => o.token === token);
  if (!o || !eligibleReturn(o))
    return fail(
      "Returns are available within seven days of recorded delivery.",
    );
  if (reason.trim().length < 10 || reason.length > 1000)
    return fail("Please explain the reason in 10–1,000 characters.");
  if (state.returns.some((r) => r.orderId === o.id))
    return fail("A return request already exists for this order.");
  const id = `RET-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    at = new Date().toISOString();
  state.returns.unshift({
    id,
    orderId: o.id,
    reason: reason.trim(),
    status: "Requested",
    createdAt: at,
    updatedAt: at,
  });
  return { ok: true, value: id };
}
export function demoReturnStatus(
  state: DemoState,
  id: string,
  status: string,
): Result<string> {
  const r = state.returns.find((r) => r.id === id);
  if (!r || !returnStatuses.some((s) => s === status))
    return fail("Return not found.");
  if (r.status === status) return { ok: true, value: status };
  if (
    !(r.status === "Requested" && ["Approved", "Rejected"].includes(status)) &&
    !(r.status === "Approved" && status === "Received")
  )
    return fail("This return status change is not allowed.");
  if (status === "Received") {
    const o = state.orders.find((o) => o.id === r.orderId);
    if (!o) return fail("Order not found.");
    restock(state, o);
  }
  r.status = status as typeof r.status;
  r.updatedAt = new Date().toISOString();
  return { ok: true, value: status };
}
export function demoContact(state: DemoState, form: FormData): Result<string> {
  const p = contactSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return fail("Check your name, email and message.");
  if (state.messages.length >= 100) return fail("Demo message limit reached.");
  const id = `MSG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  state.messages.unshift({
    ...p.data,
    id,
    status: "New",
    createdAt: new Date().toISOString(),
  });
  return { ok: true, value: id };
}
export function demoSaveProduct(
  state: DemoState,
  form: FormData,
): Result<string> {
  let groups: unknown;
  try {
    groups = JSON.parse(String(form.get("groups"))) as unknown;
  } catch {
    return fail("Check your colour and stock groups.");
  }
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(form),
    groups,
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message || "Check product details.");
  const p = parsed.data,
    old = state.products.find((v) => v.id === p.id);
  if (p.id && !old) return fail("Product not found.");
  if (!old && state.products.length >= 200)
    return fail("Demo product limit reached.");
  if (p.originalPrice && p.originalPrice < p.price)
    return fail("Original price must be at least the selling price.");
  const ids = p.groups
    .flatMap((g) => g.variants.map((v) => v.id))
    .filter(Boolean);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !old?.variants.some((v) => v.id === id)) ||
    new Set(p.groups.map((g) => g.colour.toLowerCase())).size !==
      p.groups.length ||
    p.groups.some((g) => new Set(g.variants.map((v) => v.size)).size !== 5)
  )
    return fail(
      "Check unique colours, all five sizes and variant identifiers.",
    );
  const id = old?.id || crypto.randomUUID();
  const variants = p.groups.flatMap((g) =>
    g.variants.map((v) => ({
      ...v,
      id: v.id || crypto.randomUUID(),
      colour: g.colour,
      active: true,
    })),
  );
  variants.push(
    ...(old?.variants || [])
      .filter((v) => !variants.some((n) => n.id === v.id))
      .map((v) => ({ ...v, active: false })),
  );
  const next = {
    id,
    slug:
      old?.slug ||
      `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(0, 6)}`,
    name: p.name,
    category: p.category,
    price: Math.round(p.price * 100),
    originalPrice: p.originalPrice ? Math.round(p.originalPrice * 100) : null,
    image: p.groups[0].images[0],
    description: p.description,
    fabric: p.fabric,
    fit: p.fit,
    archived: old?.archived || false,
    featured: form.get("featured") === "on",
    createdAt: old?.createdAt || new Date().toISOString(),
    variants,
    galleries: p.groups.map((g) => ({ colour: g.colour, images: g.images })),
  };
  if (old) state.products[state.products.indexOf(old)] = next;
  else state.products.push(next);
  return { ok: true, value: id };
}
