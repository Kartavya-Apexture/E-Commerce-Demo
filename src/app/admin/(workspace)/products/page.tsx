import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { products } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { archiveProduct } from "@/app/actions";
import { money } from "@/lib/types";
export const metadata = { title: "Manage products" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const catalogue = products(true).filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">THE COLLECTION</p>
          <h1>Your pieces, in one place.</h1>
          <p className="muted">
            Manage details, pricing, and stock. Changes appear in the store on
            refresh.
          </p>
        </div>
        <Link href="/admin/products/new" className="button">
          <Plus size={17} /> Add product
        </Link>
      </div>
      <form className="admin-search">
        <input
          name="q"
          aria-label="Search products"
          placeholder="Find a product…"
          defaultValue={q}
        />
        <button className="button small">Search</button>
        <Link href="/admin/products" className="text-link">
          Clear
        </Link>
      </form>
      <section className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {catalogue.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    className="table-product"
                    href={`/admin/products/${p.id}`}
                  >
                    <Image src={p.image} alt="" width={44} height={56} />
                    <strong>{p.name}</strong>
                  </Link>
                </td>
                <td>{p.category}</td>
                <td>{money(p.price)}</td>
                <td>
                  {p.variants.reduce((sum, v) => sum + v.stock, 0)}
                  <small className="block muted">
                    {p.variants.map((v) => `${v.size} ${v.stock}`).join(" / ")}
                  </small>
                </td>
                <td>
                  <span
                    className={`status ${p.archived ? "" : "status-delivered"}`}
                  >
                    {p.archived ? "Archived" : "Active"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link
                      className="text-link"
                      href={`/admin/products/${p.id}`}
                    >
                      Edit
                    </Link>
                    <form action={archiveProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-link">
                        {p.archived ? "Restore" : "Archive"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!catalogue.length && (
          <p className="empty">No products match your search.</p>
        )}
      </section>
    </>
  );
}
