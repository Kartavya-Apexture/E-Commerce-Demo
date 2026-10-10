"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, X } from "lucide-react";
import { money, type Product } from "@/lib/types";
import { useStore, toggleWishlist } from "./browser-store";
import { Purchase } from "./purchase";
export function ProductCard({ product }: { product: Product }) {
  const saved = useStore().wishlist.includes(product.id);
  const soldOut = product.variants
    .filter((v) => v.active !== false)
    .every((v) => !v.stock);
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
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
            alt={product.name}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 24vw"
          />
        </Link>
        <span
          className={`product-badge ${product.originalPrice ? "sale-badge" : ""}`}
        >
          {soldOut
            ? "SOLD OUT"
            : product.originalPrice
              ? `${Math.round((1 - product.price / product.originalPrice) * 100)}% OFF`
              : "NEW"}
        </span>
        <button
          className="heart-button"
          aria-label={`${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} wishlist`}
          aria-pressed={saved}
          onClick={() => {
            const r = toggleWishlist(product.id);
            setError(r.ok ? "" : r.error);
          }}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <button
          disabled={soldOut}
          className="card-shop"
          onClick={() => dialog.current?.showModal()}
          aria-label={`Quick add ${product.name}`}
        >
          <Plus size={17} /> Quick add
        </button>
      </div>
      <div className="product-meta">
        <p>
          {product.category} ·{" "}
          {product.variants
            .filter((v) => v.active !== false)
            .map((v) => v.colour)
            .filter((c, i, a) => a.indexOf(c) === i)
            .join(" / ")}
        </p>
        <Link href={`/product/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        <div className="product-price">
          {money(product.price)}{" "}
          {product.originalPrice && <del>{money(product.originalPrice)}</del>}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <dialog
        ref={dialog}
        className="quick-dialog"
        aria-label={`Quick add ${product.name}`}
      >
        <div className="dialog-heading">
          <h2>{product.name}</h2>
          <button
            className="icon-button"
            aria-label="Close quick add"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <p className="detail-price">{money(product.price)}</p>
        <Purchase product={product} onAdded={() => dialog.current?.close()} />
        <Link className="text-link" href={`/product/${product.slug}`}>
          View full details →
        </Link>
      </dialog>
    </article>
  );
}
