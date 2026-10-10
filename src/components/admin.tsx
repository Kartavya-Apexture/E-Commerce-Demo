"use client";
import { useActionState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ExternalLink,
  LogOut,
  LockKeyhole,
  Tag,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { login, logout, updateStatus, updateReturn } from "@/app/actions";
import type { Order, Result, ReturnRequest } from "@/lib/types";
export { ProductEditor as ProductForm } from "./product-editor";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link href="/admin" className="wordmark">
          K&G<span>STORE MANAGEMENT</span>
        </Link>
        <span className="admin-demo-label">LOCAL DEMO</span>
        <nav aria-label="Admin navigation">
          {[
            { href: "/admin", text: "Overview", Icon: LayoutDashboard },
            { href: "/admin/products", text: "Products", Icon: Package },
            { href: "/admin/orders", text: "Orders", Icon: ShoppingBag },
            { href: "/admin/offers", text: "Offers", Icon: Tag },
            { href: "/admin/returns", text: "Returns", Icon: RotateCcw },
            { href: "/admin/support", text: "Support", Icon: MessageSquare },
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
            King and Queen Store
            <br />
            Retail workspace
          </p>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span>K&G Store / Retail workspace</span>
          <span className="admin-user">
            <span>KG</span> Admin demo
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
          K&G<span>KING AND QUEEN STORE</span>
        </Link>
        <LockKeyhole size={28} />
        <h1>Welcome to your store.</h1>
        <p className="muted">
          Manage products, orders, returns, and customer care.
        </p>
        <form action={action} className="form-stack">
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              defaultValue="admin@kgstore.demo"
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
          Local demo password: <code>KGStoreDemo2026!</code>
        </p>
        <Link href="/" className="text-link">
          ← Back to the storefront
        </Link>
      </div>
    </div>
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
        <p className="muted">No further fulfilment changes available.</p>
      )}
      {state && (
        <p
          className={state.ok ? "success" : "error"}
          role={state.ok ? "status" : "alert"}
        >
          {state.ok ? "Order status updated." : state.error}
        </p>
      )}
    </form>
  );
}
export function ReturnForm({ request }: { request: ReturnRequest }) {
  const [state, action, pending] = useActionState(
    updateReturn,
    null as Result<string> | null,
  );
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={request.id} />
      {["Requested", "Approved"].includes(request.status) ? (
        <>
          <label>
            Return status
            <select name="status" key={request.status}>
              {request.status === "Requested" ? (
                <>
                  <option>Approved</option>
                  <option>Rejected</option>
                </>
              ) : (
                <option value="Received">Received (restore stock)</option>
              )}
            </select>
          </label>
          <button className="button small" disabled={pending}>
            Update return
          </button>
        </>
      ) : (
        <p>Return complete: {request.status}</p>
      )}
      {state && (
        <p
          className={state.ok ? "success" : "error"}
          role={state.ok ? "status" : "alert"}
        >
          {state.ok ? "Return updated." : state.error}
        </p>
      )}
    </form>
  );
}
