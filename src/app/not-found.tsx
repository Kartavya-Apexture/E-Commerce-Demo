import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container section empty">
      <p className="eyebrow">LET’S FIND SOMETHING ELSE</p>
      <h1>This page is no longer here.</h1>
      <p>The piece or private order you’re looking for could not be found.</p>
      <Link href="/shop" className="button">
        Explore the collection
      </Link>
    </div>
  );
}
