import Link from "next/link";
import Image from "next/image";
import { Check, Package } from "lucide-react";
import { notFound } from "next/navigation";
import { orderByToken, returns } from "@/lib/db";
import { OrderTools } from "@/components/customer";
import { returnEligible } from "@/lib/commerce";
import { money } from "@/lib/types";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", referrer: "no-referrer" };
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = orderByToken(token);
  if (!order) notFound();
  const steps = ["Placed", "Processing", "Shipped", "Delivered"];
  return (
    <div className="container section order-page">
      <span className="confirmation-icon">
        <Check size={30} />
      </span>
      <p className="eyebrow">KING AND QUEEN STORE / ORDER CONFIRMATION</p>
      <h1>
        {order.status === "Cancelled"
          ? "Your demo order was cancelled."
          : "Lovely choices. All yours."}
      </h1>
      <p>
        Thank you, {order.name.split(" ")[0]}. Your demo order{" "}
        <strong>{order.id}</strong> is saved.
      </p>
      <p className="demo-note">
        This is a demonstration. No money was collected and no parcel will be
        sent.
      </p>
      <div className="order-progress">
        {steps.map((step, index) => (
          <div
            key={step}
            className={steps.indexOf(order.status) >= index ? "complete" : ""}
          >
            <span>
              {steps.indexOf(order.status) >= index ? (
                <Check size={17} />
              ) : (
                index + 1
              )}
            </span>
            {step}
          </div>
        ))}
      </div>
      {order.status === "Cancelled" && (
        <p className="error">Cancelled · Reserved stock has been restored.</p>
      )}
      <div className="cart-layout">
        <section className="panel">
          <h2>
            <Package size={21} /> Your pieces
          </h2>
          {order.items.map((item) => (
            <div key={item.variantId} className="order-line">
              <Image src={item.image} alt={item.name} width={65} height={85} />
              <div>
                <strong>{item.name}</strong>
                <p className="muted">
                  {item.colour} / {item.size} · Qty {item.quantity}
                </p>
              </div>
              <span>{money(item.price * item.quantity)}</span>
            </div>
          ))}
          <dl className="order-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Discount {order.couponCode || ""}</dt>
              <dd>−{money(order.discount || 0)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {order.shipping ? money(order.shipping) : "Complimentary"}
              </dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
        </section>
        <aside className="panel">
          <h2>The details</h2>
          <h3>Delivery address</h3>
          <p>
            {order.name}
            <br />
            {order.address}
            <br />
            {order.city}, {order.state} {order.pin}
            <br />
            {order.phone}
          </p>
          <h3>Payment</h3>
          <p>
            {order.payment === "cod"
              ? "Cash on delivery · Pending"
              : "Online payment · Demo paid"}
          </p>
          <p className="muted">
            Keep this private page link to revisit your order. Refresh to see
            admin status updates.
          </p>
          <Link href="/shop" className="button outline">
            Continue exploring
          </Link>
        </aside>
      </div>
      <section className="panel order-history">
        <h2>Order updates</h2>
        {order.history?.map((event, i) => (
          <p key={i}>
            <strong>{event.status}</strong>
            <span>
              {event.at
                ? new Date(event.at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })
                : "Historical date unavailable"}
            </span>
          </p>
        ))}
      </section>
      <OrderTools
        eligible={returnEligible(order)}
        order={order}
        request={returns().find((r) => r.orderId === order.id)}
      />
    </div>
  );
}
