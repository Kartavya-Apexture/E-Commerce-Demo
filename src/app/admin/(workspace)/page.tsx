import Link from "next/link";
import {
  ArrowUpRight,
  ShoppingBag,
  IndianRupee,
  Package,
  AlertCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { products, orders, returns, supportMessages } from "@/lib/db";
import { money } from "@/lib/types";
export const metadata = { title: "Admin overview" };
export default async function Page() {
  await requireAdmin();
  const catalogue = products();
  const allOrders = orders();
  const revenue = allOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const low = catalogue.filter((p) =>
    p.variants.some((v) => v.active !== false && v.stock <= 2),
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">YOUR STORE, AT A GLANCE</p>
          <h1>Your store at a glance.</h1>
          <p className="muted">
            King and Queen Store · Products, orders, and customer care.
          </p>
        </div>
        <Link className="button outline" href="/">
          View storefront <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="admin-work-queue">
        <Link className="panel" href="/admin/orders?status=Placed">
          <strong>
            {
              allOrders.filter((o) =>
                ["Placed", "Processing"].includes(o.status),
              ).length
            }
          </strong>
          <span>Awaiting fulfilment →</span>
        </Link>
        <Link className="panel" href="/admin/returns">
          <strong>
            {
              returns().filter((r) =>
                ["Requested", "Approved"].includes(r.status),
              ).length
            }
          </strong>
          <span>Open returns →</span>
        </Link>
        <Link className="panel" href="/admin/support?status=New">
          <strong>
            {supportMessages().filter((m) => m.status === "New").length}
          </strong>
          <span>New messages →</span>
        </Link>
      </div>
      <div className="stat-grid">
        {[
          {
            title: "Demo sales",
            value: money(revenue),
            Icon: IndianRupee,
            detail: "Excludes cancelled orders · includes delivery",
          },
          {
            title: "Orders",
            value: allOrders.length,
            Icon: ShoppingBag,
            detail: "Sample and customer demo orders",
          },
          {
            title: "Active products",
            value: catalogue.length,
            Icon: Package,
            detail: "Pieces visible in your storefront",
          },
          {
            title: "Low-stock products",
            value: low.length,
            Icon: AlertCircle,
            detail: "At least one size has 2 or fewer left",
          },
        ].map((s) => (
          <div className="stat-card" key={s.title}>
            <div>
              <p>{s.title}</p>
              <s.Icon size={20} />
            </div>
            <strong>{s.value}</strong>
            <small>{s.detail}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Recent orders</h2>
            <Link href="/admin/orders" className="text-link">
              View all →
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/admin/orders/${o.id}`}
                      >
                        {o.id}
                      </Link>
                    </td>
                    <td>{o.name}</td>
                    <td>
                      <span
                        className={`status status-${o.status.toLowerCase()}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h2>A little stock check</h2>
          <p className="muted">Keep your favourite pieces available.</p>
          {low.slice(0, 5).map((p) => (
            <Link
              key={p.id}
              className="stock-row"
              href={`/admin/products/${p.id}`}
            >
              <span>
                {p.name}
                <small>
                  {p.variants
                    .filter((v) => v.active !== false && v.stock <= 2)
                    .map((v) => `${v.size}: ${v.stock}`)
                    .join(" · ")}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </section>
      </div>
      <div className="admin-tip">
        <SparkleMark />
        <div>
          <h3>Try the whole story.</h3>
          <p>
            Place an order in the storefront, find it here, and move it through
            Processing, Shipped, and Delivered.
          </p>
        </div>
        <Link href="/shop" className="text-link">
          Start shopping →
        </Link>
      </div>
    </>
  );
}
function SparkleMark() {
  return <span className="sparkle-mark">✧</span>;
}
