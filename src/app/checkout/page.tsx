import { products, coupons } from "@/lib/db";
import { Cart } from "@/components/cart";
export const dynamic = "force-dynamic";
export const metadata = { title: "Guest checkout" };
export default function Page() {
  return <Cart products={products(true)} coupons={coupons()} isCheckout />;
}
