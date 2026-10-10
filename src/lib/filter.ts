import type { Product } from "./types";
export type Filters = {
  q?: string;
  category?: string;
  size?: string;
  colour?: string;
  max?: string;
  sort?: string;
  sale?: string;
  stock?: string;
  featured?: string;
  page?: string;
};
export function matchesSearch(p: Product, q: string) {
  return `${p.name} ${p.category} ${p.description} ${p.variants
    .filter((v) => v.active !== false)
    .map((v) => v.colour)
    .join(" ")}`
    .toLowerCase()
    .includes(q.trim().toLowerCase());
}
export function filterProducts(products: Product[], values: Filters) {
  const list = products.filter(
    (p) =>
      !p.archived &&
      (!values.q || matchesSearch(p, values.q)) &&
      (!values.category || p.category === values.category) &&
      (!values.max || p.price <= Number(values.max) * 100) &&
      (!values.sale || Boolean(p.originalPrice && p.originalPrice > p.price)) &&
      (!values.featured || p.featured) &&
      p.variants.some(
        (v) =>
          v.active !== false &&
          (!values.size || (v.size === values.size && v.stock > 0)) &&
          (!values.colour || v.colour === values.colour) &&
          (!values.stock || v.stock > 0),
      ),
  );
  return list.sort((a, b) =>
    values.sort === "price-asc"
      ? a.price - b.price
      : values.sort === "price-desc"
        ? b.price - a.price
        : values.sort === "newest"
          ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
          : Number(b.featured) - Number(a.featured),
  );
}
