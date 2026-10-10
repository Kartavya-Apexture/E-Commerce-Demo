import { z } from "zod";
import { categories, sizes, imageLibrary } from "./types";
const imageSchema = z
  .string()
  .refine((v) => imageLibrary.includes(v), "Select a supplied image.");
export const productSchema = z.object({
  id: z.string().max(80),
  name: z.string().trim().min(3).max(120),
  category: z.enum(categories),
  price: z.coerce.number().positive().max(100000),
  originalPrice: z.coerce.number().min(0).max(100000),
  description: z.string().trim().min(10).max(2000),
  fabric: z.string().trim().min(3).max(200),
  fit: z.string().trim().min(3).max(300),
  groups: z
    .array(
      z.object({
        colour: z.string().trim().min(2).max(40),
        images: z.array(imageSchema).min(1).max(5),
        variants: z
          .array(
            z.object({
              id: z.string().max(100),
              size: z.enum(sizes),
              stock: z.coerce.number().int().min(0).max(10000),
            }),
          )
          .length(5),
      }),
    )
    .min(1)
    .max(8),
});
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});
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
