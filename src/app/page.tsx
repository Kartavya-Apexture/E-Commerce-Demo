import { products, coupons } from "@/lib/db";
import { HomeView } from "@/components/home-view";
export const dynamic = "force-dynamic";
export default function Home() {
  return <HomeView catalogue={products()} offers={coupons()} />;
}
