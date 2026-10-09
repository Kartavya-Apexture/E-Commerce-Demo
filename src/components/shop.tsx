"use client";
import { useRef } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { categories, sizes, type Product } from "@/lib/types";
import { ProductCard } from "./product-card";
type Filters = {
  q?: string;
  category?: string;
  size?: string;
  colour?: string;
  max?: string;
  sort?: string;
  sale?: string;
};
function FilterFields({ values }: { values: Filters }) {
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
          {["Scarlet", "Red", "Yellow", "Blush", "Blue"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Price
        <select name="max" defaultValue={values.max || ""}>
          <option value="">All prices</option>
          <option value="2000">Under ₹2,000</option>
          <option value="3000">Under ₹3,000</option>
          <option value="4000">Under ₹4,000</option>
        </select>
      </label>
    </>
  );
}
export function Shop({
  products,
  values,
}: {
  products: Product[];
  values: Filters;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  let filtered = products.filter(
    (p) =>
      (!values.q ||
        `${p.name} ${p.category}`
          .toLowerCase()
          .includes(values.q.toLowerCase())) &&
      (!values.category || p.category === values.category) &&
      (!values.max || p.price <= Number(values.max) * 100) &&
      (!values.sale || Boolean(p.originalPrice)) &&
      p.variants.some(
        (v) =>
          (!values.size || (v.size === values.size && v.stock > 0)) &&
          (!values.colour || v.colour === values.colour),
      ),
  );
  if (values.sort === "price-asc")
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (values.sort === "price-desc")
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (values.sort === "newest") filtered = [...filtered].reverse();
  return (
    <div className="container section">
      <div className="shop-heading">
        <div>
          <p className="eyebrow">THE AURELLE WARDROBE</p>
          <h1>
            {values.category ||
              (values.sale ? "The sale edit" : "Find your next favourite.")}
          </h1>
          <p>Easy to wear. Hard not to love.</p>
        </div>
        <span className="muted">{filtered.length} pieces to make your own</span>
      </div>
      <form action="/shop" className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <input
            name="q"
            defaultValue={values.q}
            placeholder="Search your style…"
            aria-label="Search clothing"
          />
        </div>
        <div className="desktop-filters">
          <FilterFields values={values} />
        </div>
        <label className="sort-field">
          <span>Sort by</span>
          <select name="sort" defaultValue={values.sort || ""}>
            <option value="">Featured</option>
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
        {values.sale && <input type="hidden" name="sale" value="1" />}
        <button className="button small" type="submit">
          Apply
        </button>
        <Link href="/shop" className="text-link">
          Clear
        </Link>
        <button
          type="button"
          className="icon-button filter-mobile"
          aria-label="Open filters"
          onClick={() => dialog.current?.showModal()}
        >
          <SlidersHorizontal size={20} />
        </button>
      </form>
      <dialog
        ref={dialog}
        className="filter-dialog"
        aria-label="Product filters"
      >
        <div className="flex justify-between">
          <h2>Find your fit</h2>
          <button
            aria-label="Close filters"
            className="icon-button"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <form action="/shop" className="form-stack">
          <input type="hidden" name="q" value={values.q || ""} />
          <input type="hidden" name="sort" value={values.sort || ""} />
          {values.sale && <input type="hidden" name="sale" value="1" />}
          <FilterFields values={values} />
          <button className="button">Apply filters</button>
        </form>
      </dialog>
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Search size={35} />
          <h2>No pieces found</h2>
          <p>Try another search or give your filters a little more room.</p>
          <Link className="button" href="/shop">
            See all clothing
          </Link>
        </div>
      )}
    </div>
  );
}
