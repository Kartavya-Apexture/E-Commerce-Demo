"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useDemo, resetDemo } from "@/lib/browser-demo-store";
import { eligibleReturn } from "@/lib/demo-state";
import { infoContent } from "@/lib/info-content";
import { Header, Footer } from "./store-shell";
import { HomeView } from "./home-view";
import { Shop } from "./shop";
import { ProductDetail } from "./product-detail";
import { ProductCard } from "./product-card";
import { Cart, Wishlist } from "./cart";
import { OrderHistory, TrackOrder, ContactForm } from "./customer";
import { OrderView } from "./order-view";
import { BrowserAdmin } from "./browser-admin";
export function BrowserDemo() {
  const { data, error } = useDemo();
  const path = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    document.title = path.startsWith("/admin")
      ? "Store management | K&G Store"
      : path.startsWith("/order/")
        ? "Your order | K&G Store"
        : "King and Queen Store — Your kind of style";
  }, [path]);
  useEffect(() => {
    const navigate = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        typeof event.detail === "string" &&
        event.detail.startsWith("/admin")
      )
        router.push(event.detail);
    };
    window.addEventListener("kg-demo-navigation", navigate);
    return () => window.removeEventListener("kg-demo-navigation", navigate);
  }, [router]);
  if (!data)
    return (
      <main id="main" className="container section">
        <h1>{error ? "Browser demo storage" : "Loading your demo…"}</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Preparing the sample collection."}
        </p>
        {error && (
          <button
            className="button"
            onClick={() => {
              if (
                confirm(
                  "Reset all K&G demo orders, products and messages in this browser?",
                )
              )
                resetDemo();
            }}
          >
            Reset browser demo
          </button>
        )}
      </main>
    );
  const products = data.products.filter((p) => !p.archived),
    values = Object.fromEntries(params);
  const unavailable = (
    <div className="container section empty">
      <h1>This page is no longer here.</h1>
      <p>
        Demo orders are available only in the browser where they were placed.
      </p>
      <Link className="button" href="/shop">
        Explore the collection
      </Link>
    </div>
  );
  let content: React.ReactNode;
  if (path.startsWith("/admin"))
    content = <BrowserAdmin state={data} path={path} values={values} />;
  else if (path === "/")
    content = <HomeView catalogue={products} offers={data.coupons} />;
  else if (path === "/shop")
    content = (
      <Shop key={params.toString()} products={products} values={values} />
    );
  else if (path.startsWith("/collections/")) {
    const slug = path.split("/").pop();
    const title =
      slug === "sale"
        ? "The sale edit"
        : slug === "featured"
          ? "The K&G edit"
          : "New arrivals";
    const list =
      slug === "sale"
        ? products.filter((p) => p.originalPrice && p.originalPrice > p.price)
        : slug === "featured"
          ? products.filter((p) => p.featured)
          : products;
    content = ["sale", "featured", "new-arrivals"].includes(slug || "") ? (
      <Shop
        key={path + params.toString()}
        products={list}
        values={{ sort: slug === "new-arrivals" ? "newest" : "", ...values }}
        title={title}
        base={path}
      />
    ) : (
      unavailable
    );
  } else if (path.startsWith("/product/")) {
    const p = products.find((p) => p.slug === path.split("/").pop());
    content = p ? (
      <>
        <ProductDetail key={p.id} product={p} />
        <section className="container section">
          <h2>A few more favourites</h2>
          <div className="product-grid">
            {products
              .filter((r) => r.category === p.category && r.id !== p.id)
              .slice(0, 4)
              .map((r) => (
                <ProductCard key={r.id} product={r} />
              ))}
          </div>
        </section>
      </>
    ) : (
      unavailable
    );
  } else if (path === "/cart" || path === "/checkout")
    content = (
      <Cart
        key={path}
        products={data.products}
        coupons={data.coupons}
        isCheckout={path === "/checkout"}
      />
    );
  else if (path === "/wishlist") content = <Wishlist products={products} />;
  else if (path === "/orders")
    content = <OrderHistory key={data.orders.map((o) => o.status).join(",")} />;
  else if (path === "/track-order") content = <TrackOrder />;
  else if (path.startsWith("/order/")) {
    const o = data.orders.find((o) => o.token === path.split("/").pop());
    content = o ? (
      <OrderView
        order={o}
        eligible={eligibleReturn(o)}
        request={data.returns.find((r) => r.orderId === o.id)}
      />
    ) : (
      unavailable
    );
  } else {
    const info = path.slice(1),
      page = infoContent[info];
    content = page ? (
      <article className="container section info-page">
        <p className="eyebrow">KING AND QUEEN STORE / {info}</p>
        <h1>{page.title}</h1>
        {page.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {info === "contact" && <ContactForm />}
        <Link className="button" href="/shop">
          Explore the collection →
        </Link>
      </article>
    ) : (
      unavailable
    );
  }
  return (
    <>
      <aside
        className="online-demo-note"
        aria-label="Online demo storage notice"
      >
        Browser demo · Use sample details. Orders and admin edits stay in this
        browser.{" "}
        <button
          className="text-link"
          onClick={() => {
            if (
              confirm(
                "Reset all K&G demo orders, products and messages in this browser?",
              )
            )
              resetDemo();
          }}
        >
          Reset demo
        </button>
      </aside>
      <Header products={products} />
      <main id="main">{content}</main>
      <Footer />
    </>
  );
}
