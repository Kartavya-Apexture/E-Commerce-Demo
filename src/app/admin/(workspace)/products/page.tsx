import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { products } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { archiveProduct } from "@/app/actions";
import { money, categories } from "@/lib/types";
export const metadata = { title: "Manage products" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    visibility?: string;
    stock?: string;
  }>;
}) {
  await requireAdmin();
  const {
    q = "",
    category = "",
    visibility = "",
    stock = "",
  } = await searchParams;
  const catalogue = products(true).filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) &&
      (!category || p.category === category) &&
      (!visibility || (visibility === "archived" ? p.archived : !p.archived)) &&
      (!stock ||
        (stock === "low"
          ? p.variants.some((v) => v.active !== false && v.stock <= 2)
          : p.variants
              .filter((v) => v.active !== false)
              .every((v) => v.stock === 0))),
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">THE COLLECTION</p>
          <h1>Products & inventory</h1>
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
        <select
          name="category"
          aria-label="Filter category"
          defaultValue={category}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          name="visibility"
          aria-label="Filter visibility"
          defaultValue={visibility}
        >
          <option value="">All visibility</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select name="stock" aria-label="Filter stock" defaultValue={stock}>
          <option value="">All inventory</option>
          <option value="low">Low stock</option>
          <option value="out">Sold out</option>
        </select>
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
                  {p.variants
                    .filter((v) => v.active !== false)
                    .reduce((sum, v) => sum + v.stock, 0)}
                  <small className="block muted">
                    {p.variants
                      .filter((v) => v.active !== false)
                      .map((v) => `${v.colour} ${v.size}: ${v.stock}`)
                      .join(" / ")}
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
