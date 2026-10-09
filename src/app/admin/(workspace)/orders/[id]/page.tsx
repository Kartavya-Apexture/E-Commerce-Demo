import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { orders } from "@/lib/db";
import { StatusForm } from "@/components/admin";
import { money } from "@/lib/types";
export const metadata = { title: "Order details" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = orders().find((o) => o.id === id);
  if (!order) notFound();
  return (
    <>
      <Link className="text-link mb-6" href="/admin/orders">
        ← All orders
      </Link>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">THE ORDER DETAILS</p>
          <h1>{order.id}</h1>
          <p className="muted">
            {new Date(order.createdAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST · {order.paymentStatus}
          </p>
        </div>
        <Link className="button outline" href={`/order/${order.token}`}>
          View customer page ↗
        </Link>
      </div>
      <div className="cart-layout">
        <section className="panel">
          <h2>The pieces</h2>
          {order.items.map((item) => (
            <div className="order-line" key={item.variantId}>
              <Image src={item.image} alt={item.name} width={65} height={85} />
              <div>
                <strong>{item.name}</strong>
                <p className="muted">
                  {item.colour} / {item.size} · Qty {item.quantity}
                </p>
              </div>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
          <dl className="order-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{money(order.shipping)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
          <h2 className="mt-8">Customer & delivery</h2>
          <p>
            {order.name}
            <br />
            {order.email}
            <br />
            {order.phone}
            <br />
            {order.address}, {order.city}, {order.state} {order.pin}
          </p>
        </section>
        <aside className="panel">
          <h2>Manage fulfilment</h2>
          <StatusForm order={order} />
          <p className="demo-note">
            Demo status only. No courier or payment provider is contacted.
          </p>
        </aside>
      </div>
    </>
  );
}
