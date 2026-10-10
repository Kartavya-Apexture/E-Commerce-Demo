import { notFound } from "next/navigation";
import { orderByToken, returns } from "@/lib/db";
import { returnEligible } from "@/lib/commerce";
import { OrderView } from "@/components/order-view";
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
  return (
    <OrderView
      order={order}
      eligible={returnEligible(order)}
      request={returns().find((r) => r.orderId === order.id)}
    />
  );
}
