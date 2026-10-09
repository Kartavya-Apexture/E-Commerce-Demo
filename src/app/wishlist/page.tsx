import { products } from "@/lib/db";
import { Wishlist } from "@/components/cart";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your wishlist" };
export default function Page() {
  return <Wishlist products={products()} />;
}
