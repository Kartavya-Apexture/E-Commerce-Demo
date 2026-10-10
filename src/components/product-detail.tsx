"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Truck, RotateCcw, Expand, X } from "lucide-react";
import { money, type Product, variantImage } from "@/lib/types";
import { saveRecent, useStore } from "./browser-store";
import { ProductCard } from "./product-card";
import { Purchase } from "./purchase";
export function ProductDetail({ product }: { product: Product }) {
  const [colour, setColour] = useState(
    product.variants.find((v) => v.active !== false)?.colour || "",
  );
  const [view, setView] = useState(0);
  const [crop, setCrop] = useState(false);
  const zoom = useRef<HTMLDialogElement>(null);
  const buy = useRef<HTMLDivElement>(null);
  const gallery = product.galleries.find((g) => g.colour === colour)
    ?.images || [variantImage(product, colour)];
  const image = gallery[Math.min(view, gallery.length - 1)];
  useEffect(() => {
    saveRecent(product.id);
  }, [product.id]);
  return (
    <div className="container section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <div className="product-detail">
        <div>
          <button
            className={`detail-photo ${crop ? "view-1" : ""}`}
            aria-label="Zoom product image"
            onClick={() => zoom.current?.showModal()}
          >
            <Image
              src={image}
              alt={`${colour} ${product.name}${crop ? ", detail crop" : ""}`}
              fill
              sizes="(max-width:768px) 95vw,50vw"
              preload
            />
            <span className="zoom-mark">
              <Expand size={18} /> Zoom
            </span>
          </button>
          <div className="thumbnails">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                className={view === i && !crop ? "selected" : ""}
                onClick={() => {
                  setView(i);
                  setCrop(false);
                }}
              >
                <Image src={src} alt={`View ${i + 1}`} width={64} height={80} />
                <span>{i === 0 ? "Full look" : `View ${i + 1}`}</span>
              </button>
            ))}
            <button
              className={crop ? "selected" : ""}
              onClick={() => setCrop(true)}
            >
              <Image src={image} alt="" width={64} height={80} />
              <span>Detail crop</span>
            </button>
          </div>
          <p className="muted">
            Editorial demo photography · details show a crop of the selected
            image.
          </p>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">K&G STORE / {product.category}</p>
          <h1>{product.name}</h1>
          <div className="detail-price">
            {money(product.price)}{" "}
            {product.originalPrice && <del>{money(product.originalPrice)}</del>}
          </div>
          <p className="muted">
            Sample retail price · delivery shown before ordering
          </p>
          <p className="description">{product.description}</p>
          <div ref={buy} id="purchase-options">
            <Purchase
              product={product}
              onColour={(c) => {
                setColour(c);
                setView(0);
                setCrop(false);
              }}
            />
          </div>
          <div className="detail-perks">
            <p>
              <Truck size={19} /> Free delivery on ₹1,999+ merchandise
            </p>
            <p>
              <RotateCcw size={18} /> 7-day demo returns after delivery
            </p>
          </div>
          <details open>
            <summary>Fit, fabric & care</summary>
            <p>{product.fit}</p>
            <p>
              {product.fabric}. Gentle wash as appropriate; final garment care
              must be confirmed before retail launch.
            </p>
          </details>
          <details>
            <summary>Delivery & returns</summary>
            <p>
              Demo delivery estimate: 3–7 business days within India. ₹99
              delivery below ₹1,999. Unworn items with tags may be requested for
              return within seven days of recorded delivery.
            </p>
            <Link href="/returns" className="text-link">
              Read the sample policy →
            </Link>
          </details>
        </div>
      </div>
      <div className="mobile-purchase-bar">
        <strong>{money(product.price)}</strong>
        <button
          className="button"
          onClick={() =>
            buy.current?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        >
          Choose size
        </button>
      </div>
      <dialog
        ref={zoom}
        className="zoom-dialog"
        aria-label="Product image zoom"
      >
        <button
          className="icon-button"
          aria-label="Close image zoom"
          onClick={() => zoom.current?.close()}
        >
          <X />
        </button>
        <Image
          src={image}
          alt={`${product.name}, enlarged view`}
          width={1000}
          height={1400}
          sizes="90vw"
        />
      </dialog>
    </div>
  );
}
export function RecentlyViewed({ products }: { products: Product[] }) {
  const state = useStore();
  const list = state.recent.flatMap((id) => {
    const p = products.find((p) => p.id === id);
    return p ? [p] : [];
  });
  if (!list.length) return null;
  return (
    <section className="container section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR STYLE TRAIL</p>
          <h2>Recently viewed</h2>
        </div>
      </div>
      <div className="product-grid">
        {list.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
