import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { productById } from "@/lib/db";
import { ProductForm } from "@/components/admin";
export const metadata = { title: "Edit product" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const product = id === "new" ? undefined : productById(id);
  if (id !== "new" && !product) notFound();
  return (
    <>
      <Link href="/admin/products" className="text-link mb-6">
        ← All products
      </Link>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">YOUR COLLECTION, YOUR WAY</p>
          <h1>{product ? "A little refresh." : "Meet your next piece."}</h1>
          <p className="muted">
            {product ? product.name : "Add a new piece to the storefront."}
          </p>
        </div>
      </div>
      <ProductForm product={product} />
    </>
  );
}
