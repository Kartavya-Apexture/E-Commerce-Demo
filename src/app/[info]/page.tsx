import { notFound } from "next/navigation";
import Link from "next/link";
import { ContactForm } from "@/components/customer";
const content: Record<string, { title: string; paragraphs: string[] }> = {
  about: {
    title: "Your everyday. Your kind of style.",
    paragraphs: [
      "King and Queen Store brings women’s western wear into one thoughtful wardrobe: everyday tops, standout dresses, effortless co-ords, versatile bottoms, and layers for your next outing.",
      "This working retail demonstration shows how a wholesale clothing business can offer a direct shopping experience. Photography, fabric details, prices, and policies are illustrative.",
    ],
  },
  contact: {
    title: "We’re here to help.",
    paragraphs: [
      "Sample support hours: Monday–Saturday, 10 AM–6 PM IST. Submit a message below to demonstrate customer care in the admin panel.",
      "Real store email, phone, and address have not yet been supplied. This form saves your message locally and sends no email.",
    ],
  },
  shipping: {
    title: "Delivery, made clear.",
    paragraphs: [
      "Demo delivery within India is estimated at 3–7 business days. Delivery costs ₹99, or is free on merchandise subtotals of ₹1,999 or more before coupon discounts.",
      "No courier is contacted and no parcel is shipped. Your private order page shows the fulfilment status selected by admin.",
    ],
  },
  returns: {
    title: "A little room to change your mind.",
    paragraphs: [
      "Sample policy: request a whole-order return within seven days of recorded delivery for unworn items with tags intact. Open your private order page to submit a reason.",
      "Admin can approve or reject a request, then confirm receipt. Sample inventory is restored only when receipt is confirmed. No pickup, exchange, or refund is processed.",
      "You can cancel Placed or Processing orders before shipping. Cancellation restores inventory once.",
    ],
  },
  faq: {
    title: "Good questions. Clear answers.",
    paragraphs: [
      "Do I need an account? No. Checkout is available to guests. Orders placed on this browser are saved under Your orders.",
      "How do I track an order? Open your private confirmation link or paste its access code on Track an order. Keep this link private.",
      "Are payments real? No. Cash on delivery and online payment are demonstrations. No card details are collected.",
      "Can I use a coupon? Yes: KG10 gives 10% off up to ₹300 on merchandise of ₹999+. STYLE200 gives ₹200 off on ₹2,499+. One enabled coupon per order.",
      "Why did my price or stock change? Admin may update the catalogue. Checkout checks current prices and stock and asks you to review changes.",
    ],
  },
  privacy: {
    title: "Your demo data.",
    paragraphs: [
      "Cart, wishlist, recently viewed products, private order links, and optional remembered checkout details are saved in this browser. Anyone using this browser may be able to access them. Use the footer control to clear them.",
      "Orders, support messages, return requests, and admin sessions are stored in the local SQLite database. Browser clearing does not delete these records. The documented demo reset restores sample database content.",
      "No marketing messages, external analytics, or real payment collection are enabled. This sample policy must be replaced with the business’s confirmed policy before public launch.",
    ],
  },
  terms: {
    title: "Demo terms.",
    paragraphs: [
      "King and Queen Store is a local working prototype. Orders reserve sample inventory only and create no real sales, payments, shipments, or refunds.",
      "Prices, materials, size measurements, offers, delivery estimates, and return conditions are sample content. They do not represent a confirmed business commitment.",
      "The client must supply actual product data and business policies before a real store launch.",
    ],
  },
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ info: string }>;
}) {
  const { info } = await params;
  return { title: content[info]?.title || "Page not found" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ info: string }>;
}) {
  const { info } = await params;
  const page = content[info];
  if (!page) notFound();
  return (
    <article className="container section info-page">
      <p className="eyebrow">KING AND QUEEN STORE / {info}</p>
      <h1>{page.title}</h1>
      {page.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {info === "contact" && <ContactForm />}
      {info === "returns" && (
        <Link className="button outline" href="/orders">
          Open your orders
        </Link>
      )}
      <Link className="button" href="/shop">
        Explore the collection →
      </Link>
    </article>
  );
}
