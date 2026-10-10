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
  ...[0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 17, 18, 19, 23, 24, 25].map(
    (i) => `/images/catalogue/look-${i}.jpg`,
  ),
];
export type Category = (typeof categories)[number];
export type Size = (typeof sizes)[number];
export type Variant = {
  id: string;
  size: Size;
  colour: string;
  stock: number;
  active?: boolean;
};
export type ProductGallery = { colour: string; images: string[] };
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
  createdAt: string;
  featured: boolean;
  fit: string;
  galleries: ProductGallery[];
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
  discount?: number;
  couponCode?: string | null;
  deliveredAt?: string | null;
  history?: { status: OrderStatus; at: string | null }[];
};
export type Coupon = {
  code: string;
  kind: "percent" | "fixed";
  amount: number;
  minimum: number;
  cap: number;
  active: boolean;
};
export const returnStatuses = [
  "Requested",
  "Approved",
  "Received",
  "Rejected",
] as const;
export type ReturnStatus = (typeof returnStatuses)[number];
export type ReturnRequest = {
  id: string;
  orderId: string;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
};
export type SupportMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "New" | "Resolved";
  createdAt: string;
};
export type Quote = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
};
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
export function variantImage(product: Product, colour: string) {
  return (
    product.galleries.find((g) => g.colour === colour)?.images[0] ||
    product.image
  );
}
export function delivery(subtotal: number) {
  return subtotal >= 199900 ? 0 : 9900;
}
