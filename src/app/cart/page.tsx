import { products, coupons } from "@/lib/db";
import { Cart } from "@/components/cart";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your shopping bag" };
export default function Page() {
  return <Cart products={products(true)} coupons={coupons()} />;
}
