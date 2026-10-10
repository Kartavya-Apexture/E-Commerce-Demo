import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { db, productById, orders, coupons, orderByToken } from "./db";
import {
  delivery,
  statuses,
  type Order,
  type OrderItem,
  type Result,
  type OrderStatus,
  type Quote,
  type ReturnStatus,
  type ReturnRequest,
  variantImage,
} from "./types";

export const checkoutSchema = z.object({
  requestId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  address: z.string().trim().min(8).max(300),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pin: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid six-digit PIN code."),
  payment: z.enum(["cod", "online"]),
  simulateFailure: z.boolean().default(false),
  couponCode: z.string().trim().max(30).optional(),
  reviewedTotal: z.number().int().nonnegative().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().min(1).max(10),
        price: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(30),
});
export function placeOrder(input: unknown): Result<{ token: string }> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Please check your details.",
    };
  const data = parsed.data;
  try {
    return db
      .transaction((): Result<{ token: string }> => {
        const existing = db
          .prepare("SELECT token FROM orders WHERE requestId=?")
          .get(data.requestId) as { token: string } | undefined;
        if (existing) return { ok: true, value: existing };
        if (data.payment === "online" && data.simulateFailure)
          return {
            ok: false,
            error:
              "Demo payment declined. Your cart and stock have not changed. Try again or choose cash on delivery.",
          };
        const seen = new Set<string>();
        const items: OrderItem[] = data.lines.map((line) => {
          if (seen.has(line.variantId))
            throw new Error("Duplicate item. Please refresh your cart.");
          seen.add(line.variantId);
          const product = productById(line.productId);
          const variant = product?.variants.find(
            (v) => v.id === line.variantId,
          );
          if (
            !product ||
            product.archived ||
            !variant ||
            variant.active === false
          )
            throw new Error(
              "An item is no longer available. Please update your cart.",
            );
          if (variant.stock < line.quantity)
            throw new Error(
              `${product.name}: only ${variant.stock} available. Please update your cart.`,
            );
          if (product.price !== line.price)
            throw new Error(
              `${product.name}: the price has changed. Return to your cart to review the updated price.`,
            );
          return {
            ...line,
            name: product.name,
            image: variantImage(product, variant.colour),
            size: variant.size,
            colour: variant.colour,
            price: product.price,
          };
        });
        const subtotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const shipping = delivery(subtotal);
        const discountResult = discountFor(subtotal, data.couponCode);
        if (!discountResult.ok) throw new Error(discountResult.error);
        const { discount, couponCode } = discountResult.value;
        const total = subtotal + shipping - discount;
        if (data.reviewedTotal !== undefined && data.reviewedTotal !== total)
          throw new Error(
            "Your total has changed. Review your order again before placing it.",
          );
        const at = new Date().toISOString();
        const order: Order = {
          ...data,
          id: `KG-${randomUUID().slice(0, 8).toUpperCase()}`,
          token: randomBytes(24).toString("hex"),
          paymentStatus: data.payment === "online" ? "Demo paid" : "Pending",
          status: "Placed",
          subtotal,
          shipping,
          total,
          discount,
          couponCode,
          deliveredAt: null,
          history: [{ status: "Placed", at }],
          createdAt: at,
          items,
        };
        for (const item of items)
          db.prepare("UPDATE variants SET stock=stock-? WHERE id=?").run(
            item.quantity,
            item.variantId,
          );
        db.prepare("INSERT INTO orders VALUES (?,?,?,?)").run(
          order.id,
          order.token,
          order.requestId,
          JSON.stringify(order),
        );
        return { ok: true, value: { token: order.token } };
      })
      .immediate();
  } catch (error: unknown) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not place your order. Please try again.",
    };
  }
}
export function changeOrderStatus(
  id: string,
  status: OrderStatus,
): Result<string> {
  return db
    .transaction((): Result<string> => {
      const order = orders().find((o) => o.id === id);
      if (!order || !statuses.includes(status))
        return { ok: false, error: "Order not found." };
      if (order.status === status) return { ok: true, value: status };
      const flow = ["Placed", "Processing", "Shipped", "Delivered"];
      const canCancel =
        status === "Cancelled" &&
        ["Placed", "Processing"].includes(order.status);
      if (
        (!canCancel &&
          flow.indexOf(status) !== flow.indexOf(order.status) + 1) ||
        order.status === "Cancelled" ||
        order.status === "Delivered"
      )
        return { ok: false, error: "This status change is not allowed." };
      if (canCancel)
        for (const item of order.items)
          db.prepare("UPDATE variants SET stock=stock+? WHERE id=?").run(
            item.quantity,
            item.variantId,
          );
      order.status = status;
      const at = new Date().toISOString();
      order.history = [...(order.history || []), { status, at }];
      if (status === "Delivered") order.deliveredAt = at;
      db.prepare("UPDATE orders SET payload=? WHERE id=?").run(
        JSON.stringify(order),
        id,
      );
      return { ok: true, value: status };
    })
    .immediate();
}
export function discountFor(
  subtotal: number,
  rawCode?: string,
): Result<{ discount: number; couponCode: string | null }> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return { ok: true, value: { discount: 0, couponCode: null } };
  const coupon = coupons().find((c) => c.code === code && c.active);
  if (!coupon)
    return {
      ok: false,
      error: "This coupon is unavailable. Remove it or try another code.",
    };
  if (subtotal < coupon.minimum)
    return {
      ok: false,
      error: `This coupon needs a merchandise subtotal of ₹${coupon.minimum / 100} or more.`,
    };
  const discount = Math.min(
    subtotal,
    coupon.cap,
    coupon.kind === "percent"
      ? Math.floor((subtotal * coupon.amount) / 100)
      : coupon.amount,
  );
  return { ok: true, value: { discount, couponCode: code } };
}
const quoteSchema = checkoutSchema.pick({ lines: true, couponCode: true });
export function quoteOrder(input: unknown): Result<Quote> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check your shopping bag." };
  let subtotal = 0;
  const seen = new Set<string>();
  for (const line of parsed.data.lines) {
    const p = productById(line.productId);
    const v = p?.variants.find(
      (v) => v.id === line.variantId && v.active !== false,
    );
    if (!p || p.archived || !v || v.stock < line.quantity)
      return {
        ok: false,
        error:
          "An item is unavailable or its stock has changed. Review your bag.",
      };
    if (seen.has(v.id))
      return { ok: false, error: "Duplicate item. Review your bag." };
    seen.add(v.id);
    if (p.price !== line.price)
      return {
        ok: false,
        error: "An item price has changed. Return to your bag to review it.",
      };
    subtotal += p.price * line.quantity;
  }
  const result = discountFor(subtotal, parsed.data.couponCode);
  if (!result.ok) return result;
  const shipping = delivery(subtotal);
  return {
    ok: true,
    value: {
      subtotal,
      shipping,
      ...result.value,
      total: subtotal + shipping - result.value.discount,
    },
  };
}
export function cancelCustomerOrder(token: string): Result<string> {
  const order = orderByToken(token);
  if (!order) return { ok: false, error: "Order not found." };
  return changeOrderStatus(order.id, "Cancelled");
}
export function returnEligible(order: Order) {
  return (
    order.status === "Delivered" &&
    Boolean(order.deliveredAt) &&
    Date.now() - Date.parse(order.deliveredAt || "") <= 7 * 86400000
  );
}
export function requestReturn(token: string, reason: string): Result<string> {
  if (reason.trim().length < 10 || reason.length > 1000)
    return {
      ok: false,
      error: "Please explain the reason in 10–1,000 characters.",
    };
  return db
    .transaction((): Result<string> => {
      const order = orderByToken(token);
      if (
        !order ||
        order.status !== "Delivered" ||
        !order.deliveredAt ||
        Date.now() - Date.parse(order.deliveredAt) > 7 * 86400000
      )
        return {
          ok: false,
          error:
            "Returns are available within seven days of recorded delivery.",
        };
      if (
        db
          .prepare("SELECT id FROM return_requests WHERE orderId=?")
          .get(order.id)
      )
        return {
          ok: false,
          error: "A return request already exists for this order.",
        };
      const id = `RET-${randomUUID().slice(0, 8).toUpperCase()}`;
      const at = new Date().toISOString();
      db.prepare("INSERT INTO return_requests VALUES (?,?,?,?,?,?)").run(
        id,
        order.id,
        reason.trim(),
        "Requested",
        at,
        at,
      );
      return { ok: true, value: id };
    })
    .immediate();
}
export function changeReturnStatus(
  id: string,
  status: ReturnStatus,
): Result<string> {
  return db
    .transaction((): Result<string> => {
      const request = db
        .prepare("SELECT * FROM return_requests WHERE id=?")
        .get(id) as ReturnRequest | undefined;
      if (!request) return { ok: false, error: "Return not found." };
      if (request.status === status) return { ok: true, value: status };
      if (
        !(
          request.status === "Requested" &&
          ["Approved", "Rejected"].includes(status)
        ) &&
        !(request.status === "Approved" && status === "Received")
      )
        return {
          ok: false,
          error: "This return status change is not allowed.",
        };
      if (status === "Received") {
        const order = orders().find((o) => o.id === request.orderId);
        if (!order) return { ok: false, error: "Order not found." };
        for (const item of order.items)
          db.prepare("UPDATE variants SET stock=stock+? WHERE id=?").run(
            item.quantity,
            item.variantId,
          );
      }
      db.prepare(
        "UPDATE return_requests SET status=?,updatedAt=? WHERE id=?",
      ).run(status, new Date().toISOString(), id);
      return { ok: true, value: status };
    })
    .immediate();
}
