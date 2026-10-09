"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Truck,
  RotateCcw,
  X,
  Check,
  ArrowRight,
  Ruler,
} from "lucide-react";
import { money, type Product, type Size } from "@/lib/types";
import { addToCart, toggleWishlist, useStore } from "./browser-store";
export function ProductDetail({ product }: { product: Product }) {
  const [size, setSize] = useState<Size | null>(null);
  const [view, setView] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const colour = product.variants[0]?.colour || "";
  const variant = product.variants.find(
    (v) => v.size === size && v.colour === colour,
  );
  const saved = useStore().wishlist.includes(product.id);
  const guide = useRef<HTMLDialogElement>(null);
  return (
    <div className="container section">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category}`}>
          {product.category}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-detail">
        <div>
          <div className={`detail-photo view-${view}`}>
            <Image
              src={product.image}
              alt={`${colour} ${product.name}, ${view === 1 ? "detail crop" : "full outfit"}`}
              fill
              sizes="(max-width: 768px) 95vw, 50vw"
              priority
            />
          </div>
          <div className="thumbnails">
            {["Full look", "Detail"].map((label, i) => (
              <button
                key={label}
                className={view === i ? "selected" : ""}
                aria-pressed={view === i}
                onClick={() => setView(i)}
              >
                <Image src={product.image} alt="" width={64} height={80} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.category} / THE NEW SEASON</p>
          <h1>{product.name}</h1>
          <div className="detail-price">
            {money(product.price)}{" "}
            {product.originalPrice && <del>{money(product.originalPrice)}</del>}
          </div>
          <p className="muted">
            Sample pricing · Delivery calculated at checkout
          </p>
          <p className="description">{product.description}</p>
          <div className="option-title">
            Colour <strong>{colour}</strong>
          </div>
          <button
            className="colour-swatch"
            aria-label={`Selected colour: ${colour}`}
            aria-pressed="true"
          >
            <span
              style={{
                background:
                  (
                    {
                      Scarlet: "#af233e",
                      Red: "#c73639",
                      Yellow: "#e5b523",
                      Blush: "#d5a69c",
                      Blue: "#91adbe",
                    } as Record<string, string>
                  )[colour] || "#777",
              }}
            />
            {colour}
          </button>
          <div className="option-title">
            Choose your size{" "}
            <button
              className="text-link"
              onClick={() => guide.current?.showModal()}
            >
              <Ruler size={15} /> Size guide
            </button>
          </div>
          <div className="size-options">
            {product.variants.map((v) => (
              <button
                key={v.id}
                disabled={!v.stock}
                aria-pressed={size === v.size}
                className={size === v.size ? "selected" : ""}
                onClick={() => {
                  setSize(v.size);
                  setQuantity(1);
                  setMessage("");
                }}
              >
                {v.size}
              </button>
            ))}
          </div>
          <p className="stock-note">
            {variant
              ? variant.stock <= 2
                ? `Only ${variant.stock} left in this size`
                : "In stock. Your next favourite is waiting."
              : "Select a size to check availability."}
          </p>
          <div className="purchase-controls">
            <label>
              Quantity
              <select
                aria-label="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {Array.from(
                  { length: variant ? Math.min(variant.stock, 10) : 1 },
                  (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ),
                )}
              </select>
            </label>
            <button
              className="button"
              disabled={!variant || product.archived}
              onClick={() => {
                if (variant) {
                  addToCart(
                    {
                      productId: product.id,
                      variantId: variant.id,
                      quantity,
                      price: product.price,
                    },
                    variant.stock,
                  );
                  setMessage("Added to your bag.");
                }
              }}
            >
              Add to bag <ArrowRight size={17} />
            </button>
            <button
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={saved}
              className="button outline square"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={19} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <div aria-live="polite">
            {message && (
              <p className="success">
                <Check size={15} />
                {message} <Link href="/cart">View bag →</Link>
              </p>
            )}
          </div>
          <div className="detail-perks">
            <p>
              <Truck size={19} /> Free delivery on orders ₹1,999+
            </p>
            <p>
              <RotateCcw size={18} /> Sample 7-day returns policy
            </p>
          </div>
          <details open>
            <summary>Fabric & care</summary>
            <p>
              {product.fabric}. Gentle cold wash. Dry in shade. Sample care
              guidance; confirm actual garment labels before launch.
            </p>
          </details>
          <details>
            <summary>Shipping & returns</summary>
            <p>
              Demo delivery estimate: 3–7 business days within India. This
              prototype creates no real shipments.{" "}
              <Link href="/shipping">Read our demo policy.</Link>
            </p>
          </details>
        </div>
      </div>
      <dialog ref={guide} className="size-dialog" aria-label="Size guide">
        <div className="flex justify-between">
          <h2>A little help finding your fit</h2>
          <button
            className="icon-button"
            aria-label="Close size guide"
            onClick={() => guide.current?.close()}
          >
            <X />
          </button>
        </div>
        <p>
          Sample body measurements in centimetres. Measure around the fullest
          part of your bust and hips, and your natural waist.
        </p>
        <table>
          <thead>
            <tr>
              <th>Size</th>
              <th>Bust</th>
              <th>Waist</th>
              <th>Hips</th>
            </tr>
          </thead>
          <tbody>
            {["XS", "S", "M", "L", "XL"].map((s, i) => (
              <tr key={s}>
                <td>{s}</td>
                <td>{80 + i * 5}</td>
                <td>{62 + i * 5}</td>
                <td>{86 + i * 5}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">
          Between sizes? Choose the larger size for a relaxed fit. Demo
          measurements apply to this sample catalogue.
        </p>
      </dialog>
    </div>
  );
}
