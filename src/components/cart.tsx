"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Heart,
  Check,
} from "lucide-react";
import {
  useStore,
  setQuantity,
  clearCart,
  toggleWishlist,
  saveAddress,
  saveOrder,
  saveCoupon,
  addressSchema,
  type SavedAddress,
} from "./browser-store";
import { checkout, getQuote } from "@/lib/client-actions";
import {
  delivery,
  money,
  variantImage,
  type Product,
  type Coupon,
  type Quote,
} from "@/lib/types";
import { ProductCard } from "./product-card";
export function Wishlist({ products }: { products: Product[] }) {
  const store = useStore();
  const saved = products.filter((p) => store.wishlist.includes(p.id));
  return (
    <div className="container section">
      <p className="eyebrow">SAVED FOR YOUR NEXT LOOK</p>
      <h1>Your wishlist</h1>
      <p className="muted mb-8">
        {saved.length} favourites · Choose your size with quick add.
      </p>
      {saved.length ? (
        <div className="product-grid">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Heart size={35} />
          <h2>
            {store.ready
              ? "Your favourites start here."
              : "Loading your favourites…"}
          </h2>
          <p>Save a piece with the heart button to find it here later.</p>
          <Link className="button" href="/shop">
            Explore the collection
          </Link>
        </div>
      )}
    </div>
  );
}
const fields = [
  { name: "name", label: "Full name", auto: "name" },
  { name: "email", label: "Email address", auto: "email", type: "email" },
  {
    name: "phone",
    label: "Mobile number",
    auto: "tel",
    pattern: "[6-9][0-9]{9}",
    max: 10,
  },
  {
    name: "pin",
    label: "PIN code",
    auto: "postal-code",
    pattern: "[1-9][0-9]{5}",
    max: 6,
  },
  {
    name: "address",
    label: "Street address",
    auto: "street-address",
    min: 8,
    max: 300,
  },
  { name: "city", label: "City", auto: "address-level2" },
  { name: "state", label: "State", auto: "address-level1" },
] as const;
export function Cart({
  products,
  coupons = [],
  isCheckout = false,
}: {
  products: Product[];
  coupons?: Coupon[];
  isCheckout?: boolean;
}) {
  const store = useStore();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState<"cod" | "online">("cod");
  const [decline, setDecline] = useState(false);
  const [address, setAddress] = useState<SavedAddress | null>(null);
  const [remember, setRemember] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [reviewSignature, setReviewSignature] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const requestId = useRef("");
  const router = useRouter();
  const entries = store.cart.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return {
      line,
      product,
      variant: product?.variants.find((v) => v.id === line.variantId),
    };
  });
  const lines = entries.map((e) => ({
    ...e.line,
    price: e.product?.price || e.line.price,
  }));
  const signature = JSON.stringify({ lines, coupon: store.coupon });
  const unavailable = entries.some(
    (e) =>
      !e.product ||
      e.product.archived ||
      !e.variant ||
      e.variant.active === false ||
      e.variant.stock < e.line.quantity,
  );
  const subtotal = entries.reduce(
    (sum, e) => sum + (e.product?.price || e.line.price) * e.line.quantity,
    0,
  );
  const shipping = delivery(subtotal);
  const coupon = coupons.find(
    (c) => c.code === store.coupon && c.active && subtotal >= c.minimum,
  );
  const discount = coupon
    ? Math.min(
        subtotal,
        coupon.cap,
        coupon.kind === "percent"
          ? Math.floor((subtotal * coupon.amount) / 100)
          : coupon.amount,
      )
    : 0;
  const preview: Quote = {
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
    couponCode: coupon?.code || null,
  };
  const totals =
    step === 3 && quote && signature === reviewSignature ? quote : preview;
  async function applyCoupon() {
    setPending(true);
    setError("");
    try {
      const result = await getQuote({
        lines,
        couponCode: couponInput.trim().toUpperCase(),
      });
      if (result.ok) {
        const r = saveCoupon(result.value.couponCode || "");
        if (!r.ok) setError(r.error);
        setQuote(null);
      } else setError(result.error);
    } catch {
      setError("Could not check the coupon. Please try again.");
    } finally {
      setPending(false);
    }
  }
  async function review() {
    setPending(true);
    setError("");
    try {
      const result = await getQuote({ lines, couponCode: store.coupon });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setQuote(result.value);
      setReviewSignature(signature);
      setStep(3);
    } catch {
      setError("Could not review your order. Please try again.");
    } finally {
      setPending(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (step === 1) {
      const form = new FormData(event.currentTarget);
      const parsed = addressSchema.safeParse(Object.fromEntries(form));
      if (!parsed.success) {
        setError("Please complete your address.");
        return;
      }
      setAddress(parsed.data);
      setStep(2);
      setError("");
      return;
    }
    if (step === 2) {
      await review();
      return;
    }
    if (!quote || signature !== reviewSignature) {
      setStep(2);
      setError("Your bag changed. Review the updated total.");
      return;
    }
    setPending(true);
    setError("");
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      const result = await checkout({
        ...address,
        requestId: requestId.current,
        payment,
        simulateFailure: decline,
        couponCode: store.coupon,
        reviewedTotal: quote.total,
        lines,
      });
      if (!result.ok) {
        setError(result.error);
        if (!result.error.includes("declined")) {
          setQuote(null);
          setStep(2);
        }
        return;
      }
      saveOrder(result.value.token);
      if (remember && address) saveAddress(address);
      clearCart();
      router.push(`/order/${result.value.token}`);
    } catch {
      setError(
        "We could not connect. Your bag and details are preserved; please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  if (!store.ready || !entries.length)
    return (
      <div className="container section empty">
        <ShoppingBag size={40} />
        <h1>
          {store.ready
            ? "Your bag has room for something lovely."
            : "Opening your bag…"}
        </h1>
        <p>Your next great look is waiting.</p>
        <Link className="button" href="/shop">
          Explore the collection <ArrowRight size={17} />
        </Link>
      </div>
    );
  const summary = (
    <aside className="order-summary">
      <h2>Order summary</h2>
      {isCheckout &&
        entries.map((e) => (
          <div className="checkout-summary-item" key={e.line.variantId}>
            {e.product && (
              <Image
                src={variantImage(e.product, e.variant?.colour || "")}
                alt=""
                width={48}
                height={62}
              />
            )}
            <span>
              {e.product?.name || "Unavailable item"}
              <small>
                {e.variant?.colour} / {e.variant?.size} · Qty {e.line.quantity}
              </small>
            </span>
            <strong>
              {money((e.product?.price || e.line.price) * e.line.quantity)}
            </strong>
          </div>
        ))}
      <dl>
        <div>
          <dt>Merchandise</dt>
          <dd>{money(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="discount-row">
            <dt>Discount ({totals.couponCode})</dt>
            <dd>−{money(totals.discount)}</dd>
          </div>
        )}
        <div>
          <dt>Delivery</dt>
          <dd>{totals.shipping ? money(totals.shipping) : "Free"}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>{money(totals.total)}</dd>
        </div>
      </dl>
      <div className="delivery-progress">
        <div>
          <span
            style={{ width: `${Math.min(100, (subtotal / 199900) * 100)}%` }}
          />
        </div>
        <p>
          {shipping
            ? `${money(Math.max(0, 199900 - subtotal))} away from free delivery`
            : "Free delivery unlocked"}
        </p>
      </div>
      <button className="text-link" onClick={() => setCouponOpen(!couponOpen)}>
        Have a coupon?
      </button>
      {couponOpen && (
        <div className="coupon-entry">
          <input
            aria-label="Coupon code"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="KG10 or STYLE200"
            maxLength={30}
          />
          <button
            disabled={pending || !couponInput.trim()}
            className="button small"
            onClick={applyCoupon}
          >
            Apply
          </button>
        </div>
      )}
      {store.coupon && (
        <p className={coupon ? "success" : "error"}>
          {store.coupon} {coupon ? "applied" : "is no longer eligible"}{" "}
          <button
            className="text-link"
            onClick={() => {
              const r = saveCoupon("");
              if (!r.ok) setError(r.error);
              setQuote(null);
              if (step === 3) setStep(2);
            }}
          >
            Remove coupon
          </button>
        </p>
      )}
      {!isCheckout && (
        <Link
          className={`button full-width ${unavailable ? "disabled" : ""}`}
          aria-disabled={unavailable}
          href="/checkout"
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
      <nav className="breadcrumbs" aria-label="Checkout navigation">
        <Link href="/cart">Shopping bag</Link>
        <span>/</span>
        <span>{isCheckout ? "Guest checkout" : "Your items"}</span>
      </nav>
      <p className="eyebrow">K&G STORE</p>
      <h1>{isCheckout ? "Checkout" : "Your shopping bag"}</h1>
      <p className="muted mb-8">
        {isCheckout
          ? "Guest checkout · No account needed."
          : `${entries.length} styles selected for you.`}
      </p>
      {unavailable && (
        <p className="error" role="alert">
          An item is unavailable or its stock has changed.{" "}
          <Link href="/cart">Review your bag</Link> before checkout.
        </p>
      )}
      <div className="cart-layout">
        {isCheckout ? (
          <div>
            <nav className="checkout-steps" aria-label="Checkout steps">
              {["Address", "Payment", "Review"].map((label, i) => (
                <button
                  key={label}
                  disabled={i + 1 > step}
                  aria-current={step === i + 1 ? "step" : undefined}
                  onClick={() => setStep(i + 1)}
                >
                  <span>{step > i + 1 ? <Check size={15} /> : i + 1}</span>
                  {label}
                </button>
              ))}
            </nav>
            <form onSubmit={submit} className="checkout-form">
              {step === 1 ? (
                <>
                  <h2>Delivery details</h2>
                  <p className="muted">
                    All address fields are required. India delivery
                    demonstration.
                  </p>
                  <div className="form-grid">
                    {fields.map((f) => (
                      <label
                        key={f.name}
                        className={f.name === "address" ? "full-span" : ""}
                      >
                        {f.label}
                        <input
                          name={f.name}
                          required
                          type={"type" in f ? f.type : "text"}
                          inputMode={
                            f.name === "pin" || f.name === "phone"
                              ? "numeric"
                              : undefined
                          }
                          pattern={"pattern" in f ? f.pattern : undefined}
                          minLength={
                            "min" in f
                              ? f.min
                              : f.name === "phone" || f.name === "pin"
                                ? undefined
                                : 2
                          }
                          maxLength={"max" in f ? f.max : 100}
                          autoComplete={f.auto}
                          defaultValue={
                            (address || store.address)?.[f.name] || ""
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />{" "}
                    Remember my details on this browser
                  </label>
                  {store.address && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        const r = saveAddress(null);
                        if (!r.ok) setError(r.error);
                      }}
                    >
                      Remove remembered details
                    </button>
                  )}
                </>
              ) : step === 2 ? (
                <>
                  <h2>Choose payment</h2>
                  <p>
                    Delivering to <strong>{address?.name}</strong>,{" "}
                    {address?.city} {address?.pin}.{" "}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setStep(1)}
                    >
                      Edit address
                    </button>
                  </p>
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
                        Demo only. No actual collection or delivery.
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
                      <small>
                        No card details collected. No money charged.
                      </small>
                    </span>
                  </label>
                  {payment === "online" && (
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={decline}
                        onChange={(e) => setDecline(e.target.checked)}
                      />{" "}
                      Demonstrate a declined payment
                    </label>
                  )}
                </>
              ) : (
                <>
                  <h2>Review your order</h2>
                  <section className="review-block">
                    <h3>
                      Delivery address{" "}
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setStep(1)}
                      >
                        Edit
                      </button>
                    </h3>
                    <p>
                      {address?.name}
                      <br />
                      {address?.address}
                      <br />
                      {address?.city}, {address?.state} {address?.pin}
                      <br />
                      {address?.phone} · {address?.email}
                    </p>
                  </section>
                  <section className="review-block">
                    <h3>
                      Payment{" "}
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setStep(2)}
                      >
                        Edit
                      </button>
                    </h3>
                    <p>
                      {payment === "cod"
                        ? "Cash on delivery"
                        : "Simulated online payment"}
                      {payment === "online" && decline
                        ? " · Decline simulation selected"
                        : ""}
                    </p>
                  </section>
                  <p>
                    Final demo total: <strong>{money(totals.total)}</strong>
                  </p>
                  <p className="muted">
                    Placing this order records it locally and reserves sample
                    inventory.
                  </p>
                </>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button full-width"
                disabled={pending || unavailable}
              >
                {pending
                  ? "Please wait…"
                  : step === 1
                    ? "Continue to payment"
                    : step === 2
                      ? "Review order"
                      : "Place demo order"}
                <ArrowRight size={17} />
              </button>
              {step > 1 && (
                <button
                  type="button"
                  className="text-link mt-3"
                  onClick={() => setStep(step - 1)}
                >
                  ← Back
                </button>
              )}
            </form>
          </div>
        ) : (
          <div className="cart-items">
            {entries.map(({ line, product, variant }) => (
              <article className="cart-item" key={line.variantId}>
                {product && (
                  <Link href={`/product/${product.slug}`}>
                    <Image
                      src={variantImage(product, variant?.colour || "")}
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
                      "This piece is unavailable"
                    )}
                  </h3>
                  <p className="muted">
                    {variant?.colour} / Size {variant?.size}
                  </p>
                  <p>
                    {money(product?.price || line.price)}
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
                      onClick={() => {
                        const r = setQuantity(
                          line.variantId,
                          line.quantity - 1,
                        );
                        if (!r.ok) setError(r.error);
                      }}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      disabled={
                        !variant ||
                        variant.active === false ||
                        line.quantity >= Math.min(variant.stock, 10)
                      }
                      aria-label={`Increase quantity ${product?.name}`}
                      onClick={() => {
                        const r = setQuantity(
                          line.variantId,
                          line.quantity + 1,
                        );
                        if (!r.ok) setError(r.error);
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => {
                      if (!product) return;
                      const r = store.wishlist.includes(product.id)
                        ? { ok: true as const, value: "Saved" }
                        : toggleWishlist(product.id);
                      if (r.ok) {
                        const removed = setQuantity(line.variantId, 0);
                        if (!removed.ok) setError(removed.error);
                      } else setError(r.error);
                    }}
                  >
                    <Heart size={14} /> Save for later
                  </button>
                  {variant && variant.stock < line.quantity && (
                    <p className="error">Only {variant.stock} in stock.</p>
                  )}
                </div>
                <button
                  className="icon-button remove-button"
                  aria-label={`Remove ${product?.name || "item"} from bag`}
                  onClick={() => {
                    const r = setQuantity(line.variantId, 0);
                    if (!r.ok) setError(r.error);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Link className="text-link" href="/shop">
              ← Continue shopping
            </Link>
          </div>
        )}
        {summary}
      </div>
    </div>
  );
}
