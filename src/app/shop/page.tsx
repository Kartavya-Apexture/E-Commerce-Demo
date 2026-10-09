import { products } from "@/lib/db";
import { Shop } from "@/components/shop";
export const dynamic = "force-dynamic";
export const metadata = { title: "The collection" };
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(params))
    if (typeof value === "string") values[key] = value;
  return <Shop products={products()} values={values} />;
}
