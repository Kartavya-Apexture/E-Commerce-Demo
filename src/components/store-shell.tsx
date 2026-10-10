"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  ShoppingBag,
  Search,
  Menu,
  X,
  ArrowRight,
  Package,
  Truck,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import {
  categories,
  money,
  delivery,
  variantImage,
  type Product,
} from "@/lib/types";
import { matchesSearch } from "@/lib/filter";
import { useStore, setQuantity, clearBrowserData } from "./browser-store";
export function Header({ products }: { products: Product[] }) {
  const pathname = usePathname();
  const state = useStore();
  const menu = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const list = q.trim()
    ? products.filter((p) => matchesSearch(p, q)).slice(0, 6)
    : [];
  if (pathname.startsWith("/admin")) return null;
  const count = state.cart.reduce((s, l) => s + l.quantity, 0);
  const checkout = pathname === "/checkout";
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {!checkout && (
        <div className="announcement">
          <span>STYLE THAT FEELS LIKE YOU</span>
          <Link href="/shipping">
            Free delivery on ₹1,999+ <ArrowRight size={13} />
          </Link>
        </div>
      )}
      <header className="store-header">
        <div className="header-top">
          <button
            className="icon-button mobile-menu"
            aria-label="Open menu"
            onClick={() => menu.current?.showModal()}
          >
            <Menu size={22} />
          </button>
          <Link
            href="/"
            className="wordmark"
            aria-label="King and Queen Store home"
          >
            K&G<span>KING AND QUEEN STORE</span>
          </Link>
          {!checkout && (
            <button
              className="header-search"
              onClick={() => search.current?.showModal()}
            >
              <Search size={18} />
              <span>Find your next favourite</span>
            </button>
          )}
          <div className="header-icons">
            {!checkout && (
              <>
                <button
                  className="icon-button"
                  aria-label="Search products"
                  onClick={() => search.current?.showModal()}
                >
                  <Search size={21} />
                </button>
                <Link
                  className="icon-button orders-icon"
                  href="/orders"
                  aria-label="Your orders"
                >
                  <Package size={21} />
                </Link>
                <Link
                  href="/wishlist"
                  className="icon-button"
                  aria-label={`Wishlist, ${state.wishlist.length} items`}
                >
                  <Heart size={21} />
                  {state.wishlist.length > 0 && (
                    <small>{state.wishlist.length}</small>
                  )}
                </Link>
              </>
            )}
            <Link
              href="/cart"
              className="icon-button"
              aria-label={`Shopping bag, ${count} items`}
            >
              <ShoppingBag size={21} />
              {count > 0 && <small>{count}</small>}
            </Link>
          </div>
        </div>
        {!checkout && (
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/shop">Shop all</Link>
            <Link href="/collections/new-arrivals">New arrivals</Link>
            {categories.map((c) => (
              <Link key={c} href={`/shop?category=${encodeURIComponent(c)}`}>
                {c}
              </Link>
            ))}
            <Link href="/collections/sale" className="sale-link">
              Sale
            </Link>
          </nav>
        )}
      </header>
      <dialog ref={menu} className="menu-dialog" aria-label="Store navigation">
        <div className="dialog-heading">
          <span className="wordmark">K&G</span>
          <button
            className="icon-button"
            aria-label="Close menu"
            onClick={() => menu.current?.close()}
          >
            <X />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {["Shop all", ...categories].map((c) => (
            <Link
              onClick={() => menu.current?.close()}
              key={c}
              href={
                c === "Shop all"
                  ? "/shop"
                  : `/shop?category=${encodeURIComponent(c)}`
              }
            >
              {c}
              <ArrowUpRight size={18} />
            </Link>
          ))}
          {[
            ["/collections/new-arrivals", "New arrivals"],
            ["/collections/sale", "Sale"],
            ["/orders", "Your orders"],
            ["/track-order", "Track an order"],
          ].map(([url, label]) => (
            <Link key={url} href={url} onClick={() => menu.current?.close()}>
              {label}
            </Link>
          ))}
        </nav>
      </dialog>
      <dialog
        ref={search}
        className="search-dialog"
        aria-label="Search products"
      >
        <div className="dialog-heading">
          <h2>Find your style</h2>
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => search.current?.close()}
          >
            <X />
          </button>
        </div>
        <form
          action="/shop"
          onSubmit={() => search.current?.close()}
          className="shop-toolbar"
        >
          <input
            autoFocus
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try dresses, blue or denim"
            aria-label="Search store"
          />
          <button className="button">Search</button>
        </form>
        {list.map((p) => (
          <Link
            key={p.id}
            className="search-result"
            href={`/product/${p.slug}`}
            onClick={() => search.current?.close()}
          >
            <Image src={p.image} alt="" width={45} height={60} />
            <span>
              {p.name}
              <small>{p.category}</small>
            </span>
            <strong>{money(p.price)}</strong>
          </Link>
        ))}
        {q.trim() ? (
          <>
            <Link
              className="text-link"
              href={`/shop?q=${encodeURIComponent(q)}`}
              onClick={() => search.current?.close()}
            >
              View all results →
            </Link>
            {!list.length && (
              <p>No matches yet. Try a category or another colour.</p>
            )}
          </>
        ) : (
          <p className="muted">Popular: dresses · co-ords · everyday tops</p>
        )}
      </dialog>
      <CartDrawer products={products} />
    </>
  );
}
export function CartDrawer({ products }: { products: Product[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const state = useStore();
  const [error, setError] = useState("");
  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener("kgstore-open-bag", open);
    return () => window.removeEventListener("kgstore-open-bag", open);
  }, []);
  const entries = state.cart.map((line) => ({
    line,
    p: products.find((p) => p.id === line.productId),
  }));
  const subtotal = entries.reduce(
    (s, e) => s + (e.p?.price || e.line.price) * e.line.quantity,
    0,
  );
  return (
    <dialog ref={dialog} className="bag-dialog" aria-label="Shopping bag">
      <div className="dialog-heading">
        <h2>
          Your bag{" "}
          <small>({state.cart.reduce((s, l) => s + l.quantity, 0)})</small>
        </h2>
        <button
          className="icon-button"
          aria-label="Close bag"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
      </div>
      <p className="success">Added to your bag.</p>
      {entries.map(({ line, p }) => {
        const v = p?.variants.find((v) => v.id === line.variantId);
        return (
          <div className="drawer-item" key={line.variantId}>
            {p && (
              <Image
                src={variantImage(p, v?.colour || "")}
                alt={p.name}
                width={70}
                height={90}
              />
            )}
            <div>
              <strong>{p?.name || "Unavailable item"}</strong>
              <p>
                {v?.colour} / {v?.size}
              </p>
              <p>{money(p?.price || line.price)}</p>
              <div className="quantity-control">
                <button
                  aria-label={`Decrease quantity ${p?.name}`}
                  onClick={() => {
                    const r = setQuantity(line.variantId, line.quantity - 1);
                    setError(r.ok ? "" : r.error);
                  }}
                >
                  −
                </button>
                <span>{line.quantity}</span>
                <button
                  aria-label={`Increase quantity ${p?.name}`}
                  disabled={
                    !v ||
                    v.active === false ||
                    line.quantity >= Math.min(v.stock, 10)
                  }
                  onClick={() => {
                    const r = setQuantity(line.variantId, line.quantity + 1);
                    setError(r.ok ? "" : r.error);
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <button
              className="icon-button"
              aria-label={`Remove ${p?.name || "item"} from bag`}
              onClick={() => {
                const r = setQuantity(line.variantId, 0);
                setError(r.ok ? "" : r.error);
              }}
            >
              <Trash2 size={17} />
            </button>
          </div>
        );
      })}
      {!entries.length && (
        <div className="empty">
          <ShoppingBag />
          <p>Your bag is empty.</p>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="drawer-summary">
        <p className="flex justify-between">
          <strong>Subtotal</strong>
          <strong>{money(subtotal)}</strong>
        </p>
        <p>
          <Truck size={16} />{" "}
          {delivery(subtotal)
            ? `${money(Math.max(0, 199900 - subtotal))} away from free delivery`
            : "Free delivery unlocked"}
        </p>
        <Link
          href="/cart"
          className="button full-width"
          onClick={() => dialog.current?.close()}
        >
          View bag & checkout <ArrowRight size={17} />
        </Link>
        <button className="text-link" onClick={() => dialog.current?.close()}>
          Continue shopping
        </button>
      </div>
    </dialog>
  );
}
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer>
      <div className="footer-main">
        <div>
          <Link href="/" className="wordmark">
            K&G<span>KING AND QUEEN STORE</span>
          </Link>
          <p>
            Your everyday. Your occasion.
            <br />
            Your kind of style.
          </p>
          <span className="footer-tag">INDIA · INR ₹</span>
        </div>
        <div>
          <h3>Shop</h3>
          <Link href="/shop">All clothing</Link>
          <Link href="/collections/new-arrivals">New arrivals</Link>
          <Link href="/collections/featured">The K&G edit</Link>
          <Link href="/collections/sale">Sale</Link>
          <Link href="/wishlist">Wishlist</Link>
        </div>
        <div>
          <h3>Customer care</h3>
          <Link href="/orders">Your orders</Link>
          <Link href="/track-order">Track an order</Link>
          <Link href="/shipping">Shipping</Link>
          <Link href="/returns">Returns</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact us</Link>
        </div>
        <div>
          <h3>King and Queen Store</h3>
          <Link href="/about">Our story</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/admin">Admin demo ↗</Link>
          <p>
            Demo checkout. No real payments
            <br />
            or deliveries.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} King and Queen Store.</span>
        <span>Client demonstration · Sample policies</span>
        <button
          onClick={() => {
            if (
              window.confirm(
                "Clear saved bag, wishlist, address and private order links from this browser?",
              )
            ) {
              const r = clearBrowserData();
              if (!r.ok) window.alert(r.error);
            }
          }}
        >
          Clear my demo data
        </button>
      </div>
    </footer>
  );
}
