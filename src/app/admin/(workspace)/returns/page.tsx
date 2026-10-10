import Link from "next/link";
import { returns } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ReturnForm } from "@/components/admin";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const list = returns().filter((r) => !status || r.status === status);
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">AFTER THE PURCHASE</p>
          <h1>Returns</h1>
          <p>
            Stock is restored once when receipt is confirmed. No refund is
            initiated.
          </p>
        </div>
      </div>
      <form className="admin-search">
        <label>
          Status
          <select name="status" defaultValue={status || ""}>
            <option value="">All returns</option>
            {["Requested", "Approved", "Received", "Rejected"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button className="button small">Filter</button>
      </form>
      <div className="history-grid">
        {list.map((r) => (
          <section key={r.id} className="panel">
            <h2>{r.id}</h2>
            <Link className="text-link" href={`/admin/orders/${r.orderId}`}>
              {r.orderId} →
            </Link>
            <p>
              Status: <strong>{r.status}</strong>
            </p>
            <p>{r.reason}</p>
            <p className="muted">
              Requested {new Date(r.createdAt).toLocaleString("en-IN")}
            </p>
            <ReturnForm request={r} />
          </section>
        ))}
      </div>
      {!list.length && <p className="panel empty">No return requests match.</p>}
    </>
  );
}
