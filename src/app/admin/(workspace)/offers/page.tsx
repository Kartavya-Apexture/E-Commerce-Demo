import { coupons } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toggleCoupon } from "@/app/actions";
import { money } from "@/lib/types";
export default async function Page() {
  await requireAdmin();
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">PROMOTIONS</p>
          <h1>Offers</h1>
          <p>One coupon per order. Totals are rechecked at checkout.</p>
        </div>
      </div>
      <div className="history-grid">
        {coupons().map((c) => (
          <section key={c.code} className="panel">
            <h2>{c.code}</h2>
            <p>
              {c.kind === "percent"
                ? `${c.amount}% off, capped at ${money(c.cap)}`
                : `${money(c.amount)} off`}
            </p>
            <p>Minimum merchandise: {money(c.minimum)}</p>
            <p>
              Status: <strong>{c.active ? "Enabled" : "Disabled"}</strong>
            </p>
            <form action={toggleCoupon}>
              <input type="hidden" name="code" value={c.code} />
              <button className="button outline">
                {c.active ? "Disable" : "Enable"} {c.code}
              </button>
            </form>
          </section>
        ))}
      </div>
    </>
  );
}
