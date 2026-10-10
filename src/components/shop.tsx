"use client";
import { useRef } from "react";
import Link from "next/link";
import { X, SlidersHorizontal, Search } from "lucide-react";
import { categories, sizes, type Product } from "@/lib/types";
import { filterProducts, type Filters } from "@/lib/filter";
import { ProductCard } from "./product-card";
function FilterFields({
  values,
  colours,
}: {
  values: Filters;
  colours: string[];
}) {
  return (
    <>
      <label>
        Category
        <select name="category" defaultValue={values.category || ""}>
          <option value="">All clothing</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Size
        <select name="size" defaultValue={values.size || ""}>
          <option value="">All sizes</option>
          {sizes.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Colour
        <select name="colour" defaultValue={values.colour || ""}>
          <option value="">All colours</option>
          {colours.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Price
        <select name="max" defaultValue={values.max || ""}>
          <option value="">All prices</option>
          <option value="2000">Up to ₹2,000</option>
          <option value="3000">Up to ₹3,000</option>
          <option value="4000">Up to ₹4,000</option>
        </select>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          name="stock"
          value="1"
          defaultChecked={Boolean(values.stock)}
        />{" "}
        In stock only
      </label>
    </>
  );
}
export function Shop({
  products,
  values,
  title,
  base = "/shop",
}: {
  products: Product[];
  values: Filters;
  title?: string;
  base?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = filterProducts(products, values);
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(values.page || "1") || 1),
  );
  const colours = [
    ...new Set(
      products.flatMap((p) =>
        p.variants.filter((v) => v.active !== false).map((v) => v.colour),
      ),
    ),
  ].sort();
  const url = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries({ ...values, ...changes }).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `${base}?${params}`;
  };
  const hidden = (
    <>
      {values.sale && <input type="hidden" name="sale" value="1" />}
      {values.featured && <input type="hidden" name="featured" value="1" />}
    </>
  );
  return (
    <div className="container section">
      <div className="shop-heading">
        <div>
          <p className="eyebrow">KING AND QUEEN STORE</p>
          <h1>
            {title ||
              values.category ||
              (values.sale ? "The sale edit" : "Your next great look.")}
          </h1>
          <p>Everyday essentials. Standout moments. Find your style.</p>
        </div>
        <span className="muted">{filtered.length} products</span>
      </div>
      <div className="shop-layout">
        <aside className="shop-sidebar">
          <form
            action={base}
            className="form-stack"
            key={JSON.stringify(values)}
          >
            <h3>Refine your style</h3>
            <input type="hidden" name="q" value={values.q || ""} />
            <input type="hidden" name="sort" value={values.sort || ""} />
            {hidden}
            <FilterFields values={values} colours={colours} />
            <button className="button">Apply filters</button>
            <Link href={base} className="text-link">
              Clear filters
            </Link>
          </form>
        </aside>
        <div>
          <form
            action={base}
            className="shop-toolbar"
            key={JSON.stringify(values)}
          >
            <div className="search-field">
              <Search size={18} />
              <input
                name="q"
                defaultValue={values.q}
                placeholder="Search clothing, colour or style"
                aria-label="Search clothing"
              />
            </div>
            {["category", "size", "colour", "max", "stock"].map(
              (k) =>
                values[k as keyof Filters] && (
                  <input
                    type="hidden"
                    key={k}
                    name={k}
                    value={values[k as keyof Filters]}
                  />
                ),
            )}
            {hidden}
            <label>
              Sort by
              <select name="sort" defaultValue={values.sort || ""}>
                <option value="">Featured</option>
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
            <button className="button small">Search</button>
            <button
              type="button"
              className="button outline filter-mobile"
              aria-label="Open filters"
              onClick={() => dialog.current?.showModal()}
            >
              <SlidersHorizontal size={18} /> Filters
            </button>
          </form>
          <div className="filter-chips">
            {Object.entries(values)
              .filter(
                ([k, v]) =>
                  v && !["sort", "page", "featured", "sale"].includes(k),
              )
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={url({ [k]: undefined, page: undefined })}
                  aria-label={`Remove ${k} filter`}
                >
                  {k === "stock" ? "In stock" : k === "max" ? `Up to ₹${v}` : v}
                  <X size={13} />
                </Link>
              ))}
            {Object.values(values).some(Boolean) && (
              <Link href={base} className="text-link">
                Clear all
              </Link>
            )}
          </div>
          {filtered.length ? (
            <>
              <div className="product-grid shop-grid">
                {filtered.slice((page - 1) * 12, page * 12).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <nav className="pagination" aria-label="Product pages">
                {Array.from({ length: pages }, (_, i) => (
                  <Link
                    key={i}
                    href={url({ page: String(i + 1) })}
                    aria-current={page === i + 1 ? "page" : undefined}
                  >
                    {i + 1}
                  </Link>
                ))}
              </nav>
            </>
          ) : (
            <div className="empty">
              <Search size={35} />
              <h2>No products found</h2>
              <p>Try a broader search or remove a filter.</p>
              <Link className="button" href={base}>
                See the collection
              </Link>
            </div>
          )}
        </div>
      </div>
      <dialog
        ref={dialog}
        className="filter-dialog"
        aria-label="Product filters"
      >
        <div className="dialog-heading">
          <h2>Filters</h2>
          <button
            className="icon-button"
            aria-label="Close filters"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <form action={base} className="form-stack" key={JSON.stringify(values)}>
          <input type="hidden" name="q" value={values.q || ""} />
          <input type="hidden" name="sort" value={values.sort || ""} />
          {hidden}
          <FilterFields values={values} colours={colours} />
          <button className="button">Apply filters</button>
        </form>
      </dialog>
    </div>
  );
}
