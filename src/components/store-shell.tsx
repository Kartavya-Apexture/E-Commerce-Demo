"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  Heart,
  ShoppingBag,
  Search,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { categories } from "@/lib/types";
import { useStore, clearBrowserData } from "./browser-store";

export function Header() {
  const pathname = usePathname();
  const state = useStore();
  const menu = useRef<HTMLDialogElement>(null);
  if (pathname.startsWith("/admin")) return null;
  const count = state.cart.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="announcement">
        A little wardrobe refresh? Free shipping on orders ₹1,999+{" "}
        <span>MADE FOR YOUR EVERYDAY</span>
      </div>
      <header className="store-header">
        <div className="header-top">
          <button
            className="icon-button mobile-menu"
            aria-label="Open menu"
            onClick={() => menu.current?.showModal()}
          >
            <Menu size={21} />
          </button>
          <Link href="/" className="wordmark" aria-label="Aurelle home">
            AURELLE<span>EVERYDAY, EXTRAORDINARY</span>
          </Link>
          <div className="header-icons">
            <Link
              href="/shop"
              aria-label="Search products"
              className="icon-button"
            >
              <Search size={20} />
            </Link>
            <Link
              href="/wishlist"
              aria-label={`Wishlist, ${state.wishlist.length} items`}
              className="icon-button"
            >
              <Heart size={20} />
              {state.wishlist.length > 0 && (
                <small>{state.wishlist.length}</small>
              )}
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping bag, ${count} items`}
              className="icon-button"
            >
              <ShoppingBag size={20} />
              {count > 0 && <small>{count}</small>}
            </Link>
          </div>
          <p className="header-note">Good clothes. Great days.</p>
        </div>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/shop?sort=newest">
            New arrivals <span className="tiny-dot" />
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/shop?category=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))}
          <Link href="/shop?sale=1" className="sale-link">
            The sale edit
          </Link>
        </nav>
      </header>
      <dialog ref={menu} className="menu-dialog" aria-label="Store navigation">
        <div className="flex justify-between items-center">
          <span className="wordmark">AURELLE</span>
          <button
            className="icon-button"
            aria-label="Close menu"
            onClick={() => menu.current?.close()}
          >
            <X />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {["Shop all", ...categories].map((category) => (
            <Link
              onClick={() => menu.current?.close()}
              key={category}
              href={
                category === "Shop all"
                  ? "/shop"
                  : `/shop?category=${encodeURIComponent(category)}`
              }
            >
              {category}
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </nav>
        <Link href="/about" onClick={() => menu.current?.close()}>
          Our story
        </Link>
      </dialog>
    </>
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
            AURELLE
          </Link>
          <p>
            For the days you dress up.
            <br />
            And the days you just feel like you.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/shop">Shop the collection</Link>
          <Link href="/about">Our story</Link>
          <Link href="/wishlist">Your wishlist</Link>
        </div>
        <div>
          <h3>Here to help</h3>
          <Link href="/shipping">Shipping & returns</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/admin">
            Admin demo <ArrowUpRight size={13} />
          </Link>
        </div>
        <div>
          <h3>A thoughtful little wardrobe.</h3>
          <p>
            Easy silhouettes. Fresh perspectives.
            <br />
            Something for every version of you.
          </p>
          <span className="footer-tag">INDIA · INR ₹</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Aurelle. Client demonstration.
        </span>
        <span>Sample catalogue · No real payments or deliveries</span>
        <button
          onClick={() => {
            if (
              window.confirm("Clear this browser’s shopping bag and wishlist?")
            )
              clearBrowserData();
          }}
        >
          Clear my demo data
        </button>
      </div>
    </footer>
  );
}
