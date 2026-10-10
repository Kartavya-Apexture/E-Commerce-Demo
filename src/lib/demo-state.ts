import { z } from "zod";
import { sampleCatalogue } from "./catalogue";
import {
  categories,
  sizes,
  statuses,
  returnStatuses,
  type Product,
  type Order,
  type Coupon,
  type ReturnRequest,
  type SupportMessage,
} from "./types";
const text = z.string();
const integer = z.number().int().nonnegative();
const variant = z.object({
  id: text,
  size: z.enum(sizes),
  colour: text,
  stock: integer,
  active: z.boolean().optional(),
});
const product = z.object({
  id: text,
  slug: text,
  name: text,
  category: z.enum(categories),
  price: integer,
  originalPrice: integer.nullable(),
  image: text,
  description: text,
  fabric: text,
  archived: z.boolean(),
  variants: z.array(variant).max(200),
  createdAt: text,
  featured: z.boolean(),
  fit: text,
  galleries: z
    .array(z.object({ colour: text, images: z.array(text).max(5) }))
    .max(8),
});
const order = z.object({
  id: text,
  token: text.regex(/^[a-f0-9]{48}$/),
  requestId: text,
  name: text,
  email: text,
  phone: text,
  address: text,
  city: text,
  state: text,
  pin: text,
  payment: z.enum(["cod", "online"]),
  paymentStatus: z.enum(["Pending", "Demo paid"]),
  status: z.enum(statuses),
  subtotal: integer,
  shipping: integer,
  total: integer,
  createdAt: text,
  items: z
    .array(
      z.object({
        productId: text,
        variantId: text,
        name: text,
        image: text,
        size: text,
        colour: text,
        quantity: z.number().int().min(1).max(10),
        price: integer,
      }),
    )
    .max(30),
  discount: integer.optional(),
  couponCode: text.nullable().optional(),
  deliveredAt: text.nullable().optional(),
  history: z
    .array(z.object({ status: z.enum(statuses), at: text.nullable() }))
    .optional(),
});
export const demoStateSchema = z.object({
  version: z.literal(1),
  products: z.array(product).max(200),
  orders: z.array(order).max(100),
  coupons: z
    .array(
      z.object({
        code: text,
        kind: z.enum(["percent", "fixed"]),
        amount: integer,
        minimum: integer,
        cap: integer,
        active: z.boolean(),
      }),
    )
    .max(20),
  returns: z
    .array(
      z.object({
        id: text,
        orderId: text,
        reason: text,
        status: z.enum(returnStatuses),
        createdAt: text,
        updatedAt: text,
      }),
    )
    .max(100),
  messages: z
    .array(
      z.object({
        id: text,
        name: text,
        email: text,
        subject: text,
        message: text,
        status: z.enum(["New", "Resolved"]),
        createdAt: text,
      }),
    )
    .max(100),
});
export type DemoState = {
  version: 1;
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  returns: ReturnRequest[];
  messages: SupportMessage[];
};
export function freshDemoState(): DemoState {
  return {
    version: 1,
    orders: [],
    returns: [],
    messages: [],
    coupons: [
      {
        code: "KG10",
        kind: "percent",
        amount: 10,
        minimum: 99900,
        cap: 30000,
        active: true,
      },
      {
        code: "STYLE200",
        kind: "fixed",
        amount: 20000,
        minimum: 249900,
        cap: 20000,
        active: true,
      },
    ],
    products: sampleCatalogue.map((p, i) => {
      const id = `p${i + 1}`;
      return {
        ...p,
        id,
        slug: p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-$/, ""),
        originalPrice: i % 3 === 0 ? p.price + 50000 : null,
        archived: false,
        description: `${p.name} brings an easy ${p.colour.toLowerCase()} statement to your wardrobe. Fabric and fit details are illustrative demo information.`,
        createdAt: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
        featured: i < 8,
        fit: "Regular fit. Select your usual size for an easy silhouette.",
        galleries: [{ colour: p.colour, images: [p.image] }],
        variants: sizes.map((size, j) => ({
          id: `${id}-${size}`,
          size,
          colour: p.colour,
          stock: i === 23 || (i === 0 && j === 0) ? 0 : j === 4 ? 2 : 8,
          active: true,
        })),
      };
    }),
  };
}
export function eligibleReturn(order: Order) {
  const age = Date.now() - Date.parse(order.deliveredAt || "");
  return order.status === "Delivered" && age >= 0 && age <= 7 * 86400000;
}
