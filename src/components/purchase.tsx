"use client";
import { useRef, useState } from "react";
import { Heart, Ruler, X, ShoppingBag } from "lucide-react";
import { sizes, type Product, type Size } from "@/lib/types";
import { addToCart, toggleWishlist, useStore } from "./browser-store";
export function Purchase({
  product,
  onColour,
  onAdded,
}: {
  product: Product;
  onColour?: (colour: string) => void;
  onAdded?: () => void;
}) {
  const active = product.variants.filter((v) => v.active !== false);
  const colours = [...new Set(active.map((v) => v.colour))];
  const [colour, setColour] = useState(colours[0] || "");
  const [size, setSize] = useState<Size | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const guide = useRef<HTMLDialogElement>(null);
  const state = useStore();
  const saved = state.wishlist.includes(product.id);
  const variant = active.find((v) => v.colour === colour && v.size === size);
  const inBag =
    state.cart.find((l) => l.variantId === variant?.id)?.quantity || 0;
  const available = Math.max(0, Math.min(variant?.stock || 0, 10) - inBag);
  return (
    <div className="purchase">
      <div className="option-title">
        Colour: <strong>{colour}</strong>
      </div>
      <div className="colour-options">
        {colours.map((c) => (
          <button
            type="button"
            key={c}
            aria-pressed={c === colour}
            className={c === colour ? "selected" : ""}
            onClick={() => {
              setColour(c);
              setSize(null);
              setQuantity(1);
              setMessage("");
              onColour?.(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="option-title">
        Select size{" "}
        <button
          type="button"
          className="text-link"
          onClick={() => guide.current?.showModal()}
        >
          <Ruler size={15} /> Size guide
        </button>
      </div>
      <div className="size-options">
        {sizes.map((s) => {
          const v = active.find((v) => v.colour === colour && v.size === s);
          return (
            <button
              type="button"
              key={s}
              disabled={!v?.stock}
              className={size === s ? "selected" : ""}
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                setQuantity(1);
                setMessage("");
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
      <p className="stock-note">
        {variant
          ? available
            ? variant.stock <= 2
              ? `Only ${variant.stock} left in this size`
              : "In stock — ready for your next look"
            : "Your bag already contains the available quantity."
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
            {Array.from({ length: Math.max(1, available) }, (_, i) => (
              <option key={i}>{i + 1}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button"
          disabled={!variant || !available || product.archived}
          onClick={() => {
            if (!variant) return;
            const result = addToCart(
              {
                productId: product.id,
                variantId: variant.id,
                quantity,
                price: product.price,
              },
              variant.stock,
            );
            setFailed(!result.ok);
            setMessage(result.ok ? "Added to your bag." : result.error);
            if (result.ok) onAdded?.();
          }}
        >
          <ShoppingBag size={18} /> Add to bag
        </button>
        <button
          type="button"
          className="button outline square"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
          onClick={() => {
            const r = toggleWishlist(product.id);
            if (!r.ok) {
              setFailed(true);
              setMessage(r.error);
            }
          }}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div aria-live="polite">
        {message && <p className={failed ? "error" : "success"}>{message}</p>}
      </div>
      <dialog ref={guide} className="filter-dialog" aria-label="Size guide">
        <div className="dialog-heading">
          <h2>{product.category} size guide</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close size guide"
            onClick={() => guide.current?.close()}
          >
            <X />
          </button>
        </div>
        <p>
          Sample body measurements in centimetres. Measure your bust, natural
          waist, and fullest hips.
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
            {sizes.map((s, i) => (
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
          {product.fit} These measurements are illustrative. No actual
          manufacturing specification is supplied.
        </p>
      </dialog>
    </div>
  );
}
