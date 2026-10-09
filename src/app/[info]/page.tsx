import { notFound } from "next/navigation";
import Link from "next/link";
const content: Record<
  string,
  { title: string; eyebrow: string; paragraphs: string[] }
> = {
  about: {
    title: "For every version of you.",
    eyebrow: "THE AURELLE STORY",
    paragraphs: [
      "Your wardrobe should feel like you. Aurelle brings together easy silhouettes, a little personality, and pieces that move effortlessly through your day.",
      "From the occasion dress to your favourite relaxed co-ord, this sample collection shows how a wholesale clothing business can create its own inviting retail experience.",
      "Aurelle is a replaceable sample brand created for this client presentation. Products, prices, materials, and policies are demonstration content.",
    ],
  },
  contact: {
    title: "Let’s keep it simple.",
    eyebrow: "HERE TO HELP",
    paragraphs: [
      "For this local demo, contact details are placeholders: hello@aurelle.example and +91 90000 00000. These are not active support channels.",
      "Sample opening hours: Monday to Saturday, 10:00 AM–6:00 PM IST. Replace these details with the client’s real support information before launch.",
      "For your presentation, place a demo order and use the admin panel to see how customer details and order management work. No message is sent from this prototype.",
    ],
  },
  shipping: {
    title: "Good things, on their way.",
    eyebrow: "SHIPPING & RETURNS · DEMO POLICY",
    paragraphs: [
      "Sample delivery within India takes 3–7 business days. Delivery costs ₹99 and is complimentary on merchandise subtotals of ₹1,999 or more.",
      "Sample returns are accepted within 7 days of delivery for unworn items with tags intact. This prototype does not process return requests, refunds, or shipments.",
      "Cash on delivery and online payments are simulations. Confirm actual delivery coverage, return conditions, tax treatment, and customer support policies before launching a real store.",
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
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.title}</h1>
      {page.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <Link href="/shop" className="button">
        Explore the collection →
      </Link>
    </article>
  );
}
