export const categories = [
  "Dresses",
  "Tops",
  "Co-ords",
  "Bottoms",
  "Outerwear",
] as const;
export const sizes = ["XS", "S", "M", "L", "XL"] as const;
export const imageLibrary = [
  "/images/fashion-0.jpg",
  "/images/fashion-1.jpg",
  "/images/fashion-2.jpg",
  "/images/fashion-3.jpg",
  "/images/fashion-5.jpg",
];
export type Category = (typeof categories)[number];
export type Size = (typeof sizes)[number];
export type Variant = { id: string; size: Size; colour: string; stock: number };
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  originalPrice: number | null;
  image: string;
  description: string;
  fabric: string;
  archived: boolean;
  variants: Variant[];
};
export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
};
export const statuses = [
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;
export type OrderStatus = (typeof statuses)[number];
export type OrderItem = {
  productId: string;
  variantId: string;
  name: string;
  image: string;
  size: string;
  colour: string;
  quantity: number;
  price: number;
};
export type Order = {
  id: string;
  token: string;
  requestId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  payment: "cod" | "online";
  paymentStatus: "Pending" | "Demo paid";
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
export function delivery(subtotal: number) {
  return subtotal >= 199900 ? 0 : 9900;
}
