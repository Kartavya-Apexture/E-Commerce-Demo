import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { db, productById, orders } from "./db";
import {
  delivery,
  statuses,
  type Order,
  type OrderItem,
  type Result,
  type OrderStatus,
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
          if (!product || product.archived || !variant)
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
            image: product.image,
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
        const order: Order = {
          ...data,
          id: `AU-${randomUUID().slice(0, 8).toUpperCase()}`,
          token: randomBytes(24).toString("hex"),
          paymentStatus: data.payment === "online" ? "Demo paid" : "Pending",
          status: "Placed",
          subtotal,
          shipping,
          total: subtotal + shipping,
          createdAt: new Date().toISOString(),
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
      db.prepare("UPDATE orders SET payload=? WHERE id=?").run(
        JSON.stringify(order),
        id,
      );
      return { ok: true, value: status };
    })
    .immediate();
}
