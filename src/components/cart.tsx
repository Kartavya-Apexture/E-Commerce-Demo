"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Trash2, ShieldCheck } from "lucide-react";
import { useStore, setQuantity, clearCart } from "./browser-store";
import { checkout } from "@/app/actions";
import { delivery, money, type Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function Wishlist({ products }: { products: Product[] }) {
  const store = useStore();
  const saved = products.filter((p) => store.wishlist.includes(p.id));
  return (
    <div className="container section">
      <p className="eyebrow">A LITTLE COLLECTION OF YOU</p>
      <h1>Your wishlist</h1>
      <p className="muted mb-8">Good things are worth keeping close.</p>
      {saved.length ? (
        <div className="product-grid">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>
            {store.ready
              ? "Your favourites start here."
              : "Loading your favourites…"}
          </h2>
          <p>Tap the heart on a piece you love to save it for later.</p>
          <Link href="/shop" className="button">
            Explore the collection
          </Link>
        </div>
      )}
    </div>
  );
}
export function Cart({
  products,
  isCheckout = false,
}: {
  products: Product[];
  isCheckout?: boolean;
}) {
  const store = useStore();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [payment, setPayment] = useState("cod");
  const router = useRouter();
  const requestId = useRef<string>("");
  const entries = store.cart.map((line) => ({
    line,
    product: products.find((p) => p.id === line.productId),
    variant: products
      .find((p) => p.id === line.productId)
      ?.variants.find((v) => v.id === line.variantId),
  }));
  const unavailable = entries.some(
    (e) =>
      !e.product ||
      e.product.archived ||
      !e.variant ||
      e.variant.stock < e.line.quantity,
  );
  const subtotal = entries.reduce(
    (sum, e) => sum + (e.product?.price || 0) * e.line.quantity,
    0,
  );
  const shipping = delivery(subtotal);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      const result = await checkout({
        ...Object.fromEntries(form),
        requestId: requestId.current,
        simulateFailure: form.get("simulateFailure") === "on",
        lines: entries.map((e) => ({
          ...e.line,
          price: e.product?.price || e.line.price,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      clearCart();
      router.push(`/order/${result.value.token}`);
    } catch {
      setError("We could not connect. Your bag is saved; please try again.");
      setPending(false);
    }
  }
  if (!store.ready || !entries.length)
    return (
      <div className="container section empty">
        <ShoppingBag size={38} />
        <h1>
          {store.ready
            ? "Your bag has room for something lovely."
            : "Opening your bag…"}
        </h1>
        <p>Let’s find your next everyday favourite.</p>
        <Link href="/shop" className="button">
          Explore the collection <ArrowRight size={17} />
        </Link>
      </div>
    );
  const summary = (
    <aside className="order-summary">
      <p className="eyebrow">THE LITTLE DETAILS</p>
      <h2>Order summary</h2>
      {isCheckout &&
        entries.map((e) => (
          <p key={e.line.variantId} className="summary-item">
            {e.product?.name || "Unavailable item"} × {e.line.quantity}
            <span>{money((e.product?.price || 0) * e.line.quantity)}</span>
          </p>
        ))}
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{shipping ? money(shipping) : "Complimentary"}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>{money(subtotal + shipping)}</dd>
        </div>
      </dl>
      <p className="muted">
        {shipping
          ? `${money(199900 - subtotal)} away from free shipping.`
          : "A little extra: your delivery is on us."}
      </p>
      {!isCheckout && (
        <Link
          href={unavailable ? "/cart" : "/checkout"}
          aria-disabled={unavailable}
          className={`button ${unavailable ? "disabled" : ""}`}
        >
          Continue as guest <ArrowRight size={17} />
        </Link>
      )}
      <p className="demo-note">
        <ShieldCheck size={17} /> Demo checkout. No real payments or deliveries.
      </p>
    </aside>
  );
  return (
    <div className="container section">
      <div className="breadcrumbs">
        <Link href="/cart">Shopping bag</Link>
        <span>/</span>
        <span>{isCheckout ? "Guest checkout" : "Your pieces"}</span>
      </div>
      <p className="eyebrow">
        {isCheckout ? "ONE STEP CLOSER" : "GOOD CHOICES, ALL ROUND"}
      </p>
      <h1>{isCheckout ? "Make them yours." : "Your shopping bag"}</h1>
      <p className="muted mb-8">
        {isCheckout
          ? "Guest checkout · No account needed."
          : `${store.cart.reduce((s, l) => s + l.quantity, 0)} pieces, a little more you.`}
      </p>
      {unavailable && (
        <p className="error" role="alert">
          An item is unavailable or its stock has changed. Update your bag
          before checkout. <Link href="/cart">Review bag</Link>
        </p>
      )}
      <div className="cart-layout">
        {isCheckout ? (
          <form onSubmit={submit} className="checkout-form">
            <h2>Where should they go?</h2>
            <div className="form-grid">
              {[
                { name: "name", label: "Full name", auto: "name" },
                {
                  name: "email",
                  label: "Email address",
                  type: "email",
                  auto: "email",
                },
                {
                  name: "phone",
                  label: "Mobile number",
                  pattern: "[6-9][0-9]{9}",
                  auto: "tel",
                  placeholder: "10-digit Indian number",
                },
                {
                  name: "pin",
                  label: "PIN code",
                  pattern: "[1-9][0-9]{5}",
                  auto: "postal-code",
                },
                {
                  name: "address",
                  label: "Street address",
                  auto: "street-address",
                  min: 8,
                },
                { name: "city", label: "City", auto: "address-level2" },
                { name: "state", label: "State", auto: "address-level1" },
              ].map((f) => (
                <label
                  className={f.name === "address" ? "full-span" : ""}
                  key={f.name}
                >
                  {f.label}
                  <input
                    name={f.name}
                    required
                    type={f.type || "text"}
                    pattern={f.pattern}
                    minLength={
                      f.min ||
                      (f.name === "phone" || f.name === "pin" ? undefined : 2)
                    }
                    maxLength={f.name === "address" ? 300 : 200}
                    autoComplete={f.auto}
                    placeholder={f.placeholder}
                  />
                </label>
              ))}
            </div>
            <h2 className="mt-8">How would you like to pay?</h2>
            <label className="payment-choice">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={payment === "cod"}
                onChange={() => setPayment("cod")}
              />
              <span>
                <strong>Cash on delivery</strong>
                <small>
                  Demonstration only. No actual delivery or collection.
                </small>
              </span>
            </label>
            <label className="payment-choice">
              <input
                type="radio"
                name="payment"
                value="online"
                checked={payment === "online"}
                onChange={() => setPayment("online")}
              />
              <span>
                <strong>Simulated online payment</strong>
                <small>Try a successful payment. No card details needed.</small>
              </span>
            </label>
            {payment === "online" && (
              <label className="failure-choice">
                <input type="checkbox" name="simulateFailure" /> Demonstrate a
                declined payment
              </label>
            )}
            <div aria-live="polite">
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <button
              disabled={pending || unavailable}
              className="button full-width"
            >
              {pending ? "Placing your demo order…" : "Place demo order"}
              <ArrowRight size={17} />
            </button>
            <p className="muted text-sm mt-3">
              All amounts are sample retail prices. This order is saved only in
              the local demo.
            </p>
          </form>
        ) : (
          <div className="cart-items">
            {entries.map(({ line, product, variant }) => (
              <article key={line.variantId} className="cart-item">
                {product && (
                  <Link href={`/product/${product.slug}`}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={120}
                      height={150}
                    />
                  </Link>
                )}
                <div>
                  <p className="eyebrow">
                    {product?.category || "Unavailable"}
                  </p>
                  <h3>
                    {product ? (
                      <Link href={`/product/${product.slug}`}>
                        {product.name}
                      </Link>
                    ) : (
                      "This piece is no longer available"
                    )}
                  </h3>
                  <p className="muted">
                    {variant?.colour} / Size {variant?.size}
                  </p>
                  <p>
                    {money(product?.price || 0)}
                    {product && product.price !== line.price && (
                      <small className="price-change">
                        {" "}
                        Price updated since you added this piece.
                      </small>
                    )}
                  </p>
                  <div className="quantity-control">
                    <button
                      aria-label={`Decrease quantity ${product?.name}`}
                      onClick={() =>
                        setQuantity(line.variantId, line.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      disabled={
                        !variant || line.quantity >= Math.min(variant.stock, 10)
                      }
                      aria-label={`Increase quantity ${product?.name}`}
                      onClick={() =>
                        setQuantity(line.variantId, line.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  {variant && variant.stock < line.quantity && (
                    <p className="error">Only {variant.stock} in stock.</p>
                  )}
                </div>
                <button
                  className="icon-button remove-button"
                  aria-label={`Remove ${product?.name || "item"} from bag`}
                  onClick={() => setQuantity(line.variantId, 0)}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
            <Link href="/shop" className="text-link mt-5">
              ← Keep exploring
            </Link>
          </div>
        )}
        {summary}
      </div>
    </div>
  );
}
