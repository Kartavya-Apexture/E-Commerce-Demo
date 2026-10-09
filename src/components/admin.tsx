"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ExternalLink,
  LogOut,
  ArrowLeft,
  LockKeyhole,
  Check,
} from "lucide-react";
import { login, logout, saveProduct, updateStatus } from "@/app/actions";
import {
  categories,
  sizes,
  imageLibrary,
  type Product,
  type Order,
  type Result,
} from "@/lib/types";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link href="/admin" className="wordmark">
          AURELLE<span>THE BUSINESS SIDE</span>
        </Link>
        <span className="admin-demo-label">LOCAL DEMO</span>
        <nav aria-label="Admin navigation">
          {[
            { href: "/admin", text: "Overview", Icon: LayoutDashboard },
            { href: "/admin/products", text: "Products", Icon: Package },
            { href: "/admin/orders", text: "Orders", Icon: ShoppingBag },
          ].map(({ href, text, Icon }) => (
            <Link
              key={href}
              className={
                (href === "/admin" ? path === href : path.startsWith(href))
                  ? "active"
                  : ""
              }
              href={href}
            >
              <Icon size={18} />
              {text}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" className="text-link">
            <ExternalLink size={16} /> View storefront
          </Link>
          <form action={logout}>
            <button className="text-link">
              <LogOut size={16} /> Sign out
            </button>
          </form>
          <p>
            One collection.
            <br />
            Everything in one place.
          </p>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span>Aurelle / Retail workspace</span>
          <span className="admin-user">
            <span>AS</span> Admin demo
          </span>
        </header>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
export function LoginForm() {
  const [error, action, pending] = useActionState(login, "");
  return (
    <div className="login-page">
      <div className="login-card">
        <Link href="/" className="wordmark">
          AURELLE<span>THE BUSINESS SIDE</span>
        </Link>
        <LockKeyhole size={26} />
        <h1>A little behind the scenes.</h1>
        <p className="muted">
          Sign in to manage your collection and demo orders.
        </p>
        <form action={action} className="form-stack">
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              defaultValue="admin@aurelle.demo"
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              maxLength={200}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={pending}>
            {pending ? "Signing in…" : "Sign in to admin"}
          </button>
        </form>
        <p className="demo-credentials">
          Local demo password: <code>AurelleDemo2026!</code>
        </p>
        <Link href="/" className="text-link">
          <ArrowLeft size={15} /> Back to the storefront
        </Link>
      </div>
    </div>
  );
}
export function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(
    saveProduct,
    null as Result<string> | null,
  );
  const [image, setImage] = useState(product?.image || imageLibrary[0]);
  return (
    <form action={action} className="product-edit">
      <section className="panel form-stack">
        <input type="hidden" name="id" value={product?.id || ""} />
        <h2>The product details</h2>
        <label>
          Product name
          <input
            name="name"
            required
            minLength={3}
            maxLength={120}
            defaultValue={product?.name}
          />
        </label>
        <div className="form-grid">
          <label>
            Category
            <select
              name="category"
              defaultValue={product?.category || "Dresses"}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Colour
            <input
              name="colour"
              required
              defaultValue={product?.variants[0]?.colour || "Blue"}
              maxLength={40}
            />
          </label>
          <label>
            Selling price (₹)
            <input
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={product ? product.price / 100 : ""}
            />
          </label>
          <label>
            Original price (₹, 0 = no sale)
            <input
              name="originalPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                product?.originalPrice ? product.originalPrice / 100 : 0
              }
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            name="description"
            rows={4}
            required
            minLength={10}
            maxLength={2000}
            defaultValue={product?.description}
          />
        </label>
        <label>
          Fabric & care
          <input
            name="fabric"
            required
            minLength={3}
            maxLength={200}
            defaultValue={product?.fabric}
          />
        </label>
        <h2>Stock by size</h2>
        <p className="muted">
          Enter the number available for each size. Zero marks a size as sold
          out.
        </p>
        <div className="stock-inputs">
          {sizes.map((size) => (
            <label key={size}>
              {size}
              <input
                name={`stock-${size}`}
                type="number"
                min="0"
                max="10000"
                required
                defaultValue={
                  product?.variants.find((v) => v.size === size)?.stock ?? 5
                }
              />
            </label>
          ))}
        </div>
        <div aria-live="polite">
          {state && !state.ok && (
            <p className="error" role="alert">
              {state.error}
            </p>
          )}
        </div>
        <button className="button" disabled={pending}>
          {pending ? "Saving…" : "Save product"} <Check size={17} />
        </button>
      </section>
      <aside className="panel">
        <h2>Collection photography</h2>
        <p className="muted">
          Choose a supplied demo photo. Keep the product name and colour
          consistent with the selected garment.
        </p>
        <div className="edit-image">
          <Image
            src={image}
            alt="Selected product photograph"
            fill
            sizes="350px"
          />
        </div>
        <label>
          Image library
          <select
            name="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          >
            {imageLibrary.map((src, i) => (
              <option key={src} value={src}>
                {
                  [
                    "Blue coat",
                    "Yellow co-ord",
                    "Scarlet dress",
                    "Red sweatshirt",
                    "Blush joggers",
                  ][i]
                }
              </option>
            ))}
          </select>
        </label>
      </aside>
    </form>
  );
}
export function StatusForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState(
    updateStatus,
    null as Result<string> | null,
  );
  const next = (
    {
      Placed: "Processing",
      Processing: "Shipped",
      Shipped: "Delivered",
    } as Record<string, string>
  )[order.status];
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={order.id} />
      <p>
        Current status: <strong>{order.status}</strong>
      </p>
      {next ? (
        <>
          <label>
            Next status
            <select name="status" key={order.status} defaultValue={next}>
              <option value={next}>{next}</option>
              {["Placed", "Processing"].includes(order.status) && (
                <option value="Cancelled">Cancelled (restore stock)</option>
              )}
            </select>
          </label>
          <button className="button" disabled={pending}>
            {pending ? "Updating…" : "Update order"}
          </button>
        </>
      ) : (
        <p className="muted">
          This order is complete. No further status changes are available.
        </p>
      )}
      <div aria-live="polite">
        {state && (
          <p className={state.ok ? "success" : "error"}>
            {state.ok ? "Order status updated." : state.error}
          </p>
        )}
      </div>
    </form>
  );
}
