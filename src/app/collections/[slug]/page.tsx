import { notFound } from "next/navigation";
import { products } from "@/lib/db";
import { Shop } from "@/components/shop";
export const dynamic = "force-dynamic";
const collections: {
  [key: string]: {
    title: string;
    values: { sort?: string; featured?: string; sale?: string };
  };
} = {
  "new-arrivals": { title: "New arrivals", values: { sort: "newest" } },
  featured: { title: "The K&G edit", values: { featured: "1" } },
  sale: { title: "The sale edit", values: { sale: "1" } },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const collection = collections[slug];
  if (!collection) notFound();
  const raw = await searchParams;
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw))
    if (typeof v === "string") values[k] = v;
  return (
    <Shop
      products={products()}
      values={{
        ...values,
        ...collection.values,
        sort: values.sort || collection.values.sort,
      }}
      title={collection.title}
      base={`/collections/${slug}`}
    />
  );
}
