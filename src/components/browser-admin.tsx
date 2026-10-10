"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AdminShell,
  LoginForm,
  StatusForm,
  ReturnForm,
  ProductForm,
} from "./admin";
import {
  archiveProduct,
  toggleCoupon,
  resolveMessage,
} from "@/lib/client-actions";
import { demoAdmin } from "@/lib/browser-demo-store";
import { money, statuses, categories, type Order } from "@/lib/types";
import type { DemoState } from "@/lib/demo-state";
function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="panel table-scroll">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link className="text-link" href={`/admin/orders/${o.id}`}>
                  {o.id}
                </Link>
              </td>
              <td>{o.name}</td>
              <td>{o.status}</td>
              <td>{o.paymentStatus}</td>
              <td>{money(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && (
        <p className="empty">
          No demo orders yet. Place an order from this browser.
        </p>
      )}
    </div>
  );
}
export function BrowserAdmin({
  state,
  path,
  values,
}: {
  state: DemoState;
  path: string;
  values: Record<string, string>;
}) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const check = () => setAllowed(demoAdmin());
    check();
    const timer = window.setInterval(check, 30000);
    window.addEventListener("kg-demo-auth", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("kg-demo-auth", check);
    };
  }, []);
  if (path === "/admin/login" || !allowed) return <LoginForm />;
  const q = (values.q || "").toLowerCase();
  let content: React.ReactNode;
  if (path === "/admin/products") {
    const products = state.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) &&
        (!values.category || p.category === values.category) &&
        (!values.visibility ||
          (values.visibility === "archived" ? p.archived : !p.archived)) &&
        (!values.stock ||
          (values.stock === "low"
            ? p.variants.some((v) => v.active !== false && v.stock <= 2)
            : p.variants
                .filter((v) => v.active !== false)
                .every((v) => v.stock === 0))),
    );
    content = (
      <>
        <div className="admin-heading">
          <h1>Products & inventory</h1>
          <Link className="button" href="/admin/products/new">
            Add product
          </Link>
        </div>
        <form className="admin-search">
          <input
            name="q"
            aria-label="Search products"
            defaultValue={values.q}
            placeholder="Find a product…"
          />
          <select
            name="category"
            aria-label="Filter category"
            defaultValue={values.category}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            name="visibility"
            aria-label="Filter visibility"
            defaultValue={values.visibility}
          >
            <option value="">All visibility</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <select
            name="stock"
            aria-label="Filter stock"
            defaultValue={values.stock}
          >
            <option value="">All inventory</option>
            <option value="low">Low stock</option>
            <option value="out">Sold out</option>
          </select>
          <button className="button">Search</button>
          <Link className="text-link" href="/admin/products">
            Clear
          </Link>
        </form>
        <div className="panel table-scroll">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                    <p className="muted">{p.category}</p>
                  </td>
                  <td>{money(p.price)}</td>
                  <td>
                    {p.variants
                      .filter((v) => v.active !== false)
                      .map((v) => `${v.colour} ${v.size}: ${v.stock}`)
                      .join(" / ")}
                  </td>
                  <td>{p.archived ? "Archived" : "Active"}</td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/admin/products/${p.id}`}
                    >
                      Edit
                    </Link>
                    <form action={archiveProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-link">
                        {p.archived ? "Restore" : "Archive"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (path.startsWith("/admin/products/")) {
    const id = path.split("/").pop(),
      p = state.products.find((p) => p.id === id);
    content =
      id === "new" || p ? (
        <>
          <h1>{p ? "Edit product" : "Add product"}</h1>
          <ProductForm key={id} product={p} />
        </>
      ) : (
        <h1>Product not found</h1>
      );
  } else if (path === "/admin/orders") {
    content = (
      <>
        <h1>Orders</h1>
        <form className="admin-search">
          <input
            name="q"
            aria-label="Search orders"
            defaultValue={values.q}
            placeholder="Order or customer"
          />
          <select
            name="status"
            aria-label="Order status"
            defaultValue={values.status}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            name="payment"
            aria-label="Payment status"
            defaultValue={values.payment}
          >
            <option value="">All payments</option>
            <option>Pending</option>
            <option>Demo paid</option>
          </select>
          <button className="button">Search</button>
        </form>
        <OrdersTable
          orders={state.orders.filter(
            (o) =>
              `${o.id} ${o.name} ${o.email}`.toLowerCase().includes(q) &&
              (!values.status || o.status === values.status) &&
              (!values.payment || o.paymentStatus === values.payment),
          )}
        />
      </>
    );
  } else if (path.startsWith("/admin/orders/")) {
    const o = state.orders.find((o) => o.id === path.split("/").pop());
    content = o ? (
      <>
        <h1>{o.id}</h1>
        <div className="cart-layout">
          <section className="panel">
            <h2>Customer & items</h2>
            <p>
              {o.name} · {o.email} · {o.phone}
            </p>
            <p>
              {o.address}, {o.city}, {o.state} {o.pin}
            </p>
            {o.items.map((i) => (
              <p key={i.variantId}>
                {i.name} · {i.colour} / {i.size} · Qty {i.quantity} ·{" "}
                {money(i.price * i.quantity)}
              </p>
            ))}
            <p>
              Coupon {o.couponCode || "None"} · Savings {money(o.discount || 0)}
            </p>
            <strong>Total {money(o.total)}</strong>
            <p>Payment: {o.paymentStatus}</p>
            <h3>Status history</h3>
            {o.history?.map((h, i) => (
              <p key={i}>
                {h.status} ·{" "}
                {h.at ? new Date(h.at).toLocaleString() : "Date unavailable"}
              </p>
            ))}
            <Link className="text-link" href={`/order/${o.token}`}>
              View customer order
            </Link>
          </section>
          <section className="panel">
            <h2>Fulfilment</h2>
            <StatusForm order={o} />
          </section>
        </div>
      </>
    ) : (
      <h1>Order not found in this browser</h1>
    );
  } else if (path === "/admin/offers") {
    content = (
      <>
        <h1>Offers</h1>
        <div className="history-grid">
          {state.coupons.map((c) => (
            <section className="panel" key={c.code}>
              <h2>{c.code}</h2>
              <p>
                {c.kind === "percent" ? `${c.amount}% off` : money(c.amount)} ·
                Minimum {money(c.minimum)} · Cap {money(c.cap)}
              </p>
              <p>{c.active ? "Enabled" : "Disabled"}</p>
              <form action={toggleCoupon}>
                <input type="hidden" name="code" value={c.code} />
                <button className="button outline">
                  {c.active ? "Disable" : "Enable"}
                </button>
              </form>
            </section>
          ))}
        </div>
      </>
    );
  } else if (path === "/admin/returns") {
    content = (
      <>
        <h1>Returns</h1>
        {!state.returns.length && (
          <p className="panel">No return requests yet.</p>
        )}
        <div className="history-grid">
          {state.returns.map((r) => (
            <section className="panel" key={r.id}>
              <h2>{r.id}</h2>
              <Link href={`/admin/orders/${r.orderId}`}>{r.orderId}</Link>
              <p>{r.reason}</p>
              <ReturnForm request={r} />
            </section>
          ))}
        </div>
      </>
    );
  } else if (path === "/admin/support") {
    content = (
      <>
        <h1>Support messages</h1>
        {!state.messages.length && <p className="panel">No messages yet.</p>}
        <div className="history-grid">
          {state.messages.map((m) => (
            <section className="panel" key={m.id}>
              <h2>{m.subject}</h2>
              <p>
                {m.id} · {m.name} · {m.email}
              </p>
              <p>{m.message}</p>
              <p>{m.status}</p>
              {m.status === "New" && (
                <form action={resolveMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="button outline">Mark resolved</button>
                </form>
              )}
            </section>
          ))}
        </div>
      </>
    );
  } else {
    const sales = state.orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + o.total, 0);
    content = (
      <>
        <p className="eyebrow">YOUR STORE AT A GLANCE</p>
        <h1>Welcome back.</h1>
        <div className="history-grid">
          <section className="panel">
            <h2>{money(sales)}</h2>
            <p>Demo sales</p>
          </section>
          <section className="panel">
            <h2>{state.orders.length}</h2>
            <p>
              Orders ·{" "}
              {
                state.orders.filter((o) =>
                  ["Placed", "Processing"].includes(o.status),
                ).length
              }{" "}
              pending fulfilment
            </p>
          </section>
          <section className="panel">
            <h2>
              {
                state.returns.filter((r) =>
                  ["Requested", "Approved"].includes(r.status),
                ).length
              }
            </h2>
            <p>Open returns</p>
          </section>
          <section className="panel">
            <h2>{state.messages.filter((m) => m.status === "New").length}</h2>
            <p>Unread support messages</p>
          </section>
        </div>
        <h2>Recent orders</h2>
        <OrdersTable orders={state.orders.slice(0, 6)} />
        <h2>Low stock</h2>
        <section className="panel">
          {state.products
            .filter((p) => !p.archived)
            .flatMap((p) =>
              p.variants
                .filter((v) => v.active !== false && v.stock <= 2)
                .map((v) => (
                  <p key={v.id}>
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link> ·{" "}
                    {v.colour} {v.size}: {v.stock}
                  </p>
                )),
            )}
        </section>
      </>
    );
  }
  return <AdminShell>{content}</AdminShell>;
}
