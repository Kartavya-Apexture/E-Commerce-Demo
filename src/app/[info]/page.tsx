import { notFound } from "next/navigation";
import Link from "next/link";
import { ContactForm } from "@/components/customer";
import { infoContent as content } from "@/lib/info-content";
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
