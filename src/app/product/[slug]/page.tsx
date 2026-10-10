import { notFound } from "next/navigation";
import { products } from "@/lib/db";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title:
      products().find((p) => p.slug === slug)?.name || "Product unavailable",
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalogue = products();
  const product = catalogue.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <>
      <ProductDetail product={product} />
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KEEP EXPLORING</p>
            <h2>A few more favourites</h2>
          </div>
        </div>
        <div className="product-grid">
          {catalogue
            .filter(
              (p) => p.id !== product.id && p.category === product.category,
            )
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
    </>
  );
}
