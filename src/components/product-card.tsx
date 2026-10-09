"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, ArrowUpRight } from "lucide-react";
import { money, type Product } from "@/lib/types";
import { useStore, toggleWishlist } from "./browser-store";
export function ProductCard({ product }: { product: Product }) {
  const saved = useStore().wishlist.includes(product.id);
  const soldOut = product.variants.every((v) => v.stock === 0);
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link
          href={`/product/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={product.image}
            alt={`${product.variants[0]?.colour} ${product.name}`}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 24vw"
          />
        </Link>
        <span
          className={`product-badge ${soldOut ? "" : product.originalPrice ? "sale-badge" : ""}`}
        >
          {soldOut
            ? "SOLD OUT"
            : product.originalPrice
              ? "THE SALE EDIT"
              : "NEW SEASON"}
        </span>
        <button
          aria-label={`${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} wishlist`}
          aria-pressed={saved}
          className="heart-button"
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
        <Link href={`/product/${product.slug}`} className="card-shop">
          Discover this piece <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="product-meta">
        <p>
          {product.category} <span> / {product.variants[0]?.colour}</span>
        </p>
        <Link href={`/product/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        <div className="product-price">
          {money(product.price)}
          {product.originalPrice && <del>{money(product.originalPrice)}</del>}
        </div>
      </div>
    </article>
  );
}
