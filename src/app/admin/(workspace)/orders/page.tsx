import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { orders } from "@/lib/db";
import { money, statuses } from "@/lib/types";
export const metadata = { title: "Manage orders" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = "", status = "" } = await searchParams;
  const list = orders().filter(
    (o) =>
      `${o.id} ${o.name} ${o.email}`.toLowerCase().includes(q.toLowerCase()) &&
      (!status || o.status === status),
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">FROM BAG TO DOORSTEP</p>
          <h1>Every order, a little story.</h1>
          <p className="muted">
            Review demo purchases and manage their fulfilment status.
          </p>
        </div>
      </div>
      <form className="admin-search">
        <input
          name="q"
          aria-label="Search orders"
          placeholder="Order, customer, or email…"
          defaultValue={q}
        />
        <select
          name="status"
          aria-label="Filter order status"
          defaultValue={status}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="button small">Search</button>
        <Link className="text-link" href="/admin/orders">
          Clear
        </Link>
      </form>
      <section className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Placed</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link className="text-link" href={`/admin/orders/${o.id}`}>
                    {o.id} →
                  </Link>
                </td>
                <td>
                  {o.name}
                  <small className="block muted">{o.email}</small>
                </td>
                <td>
                  {new Date(o.createdAt).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td>{o.paymentStatus}</td>
                <td>
                  <span className={`status status-${o.status.toLowerCase()}`}>
                    {o.status}
                  </span>
                </td>
                <td>{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="empty">No orders match your filters.</p>}
      </section>
    </>
  );
}
