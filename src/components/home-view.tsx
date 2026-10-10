import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import type { Product, Coupon } from "@/lib/types";
import { categories } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { RecentlyViewed } from "@/components/product-detail";
export function HomeView({
  catalogue,
  offers,
}: {
  catalogue: Product[];
  offers: Coupon[];
}) {
  const hero =
    catalogue.find((p) => p.category === "Outerwear") || catalogue[0];
  const occasion =
    catalogue.find((p) => p.id === "p8") ||
    catalogue.find((p) => p.category === "Dresses");
  const featured = catalogue.filter((p) => p.featured);
  const newest = [...catalogue].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return (
    <>
      <section className="retail-hero">
        <div className="retail-hero-copy">
          <p className="eyebrow">
            <span /> THE K&G NEW SEASON EDIT
          </p>
          <h1>
            Your everyday.
            <br />A little more
            <br />
            <em>extraordinary.</em>
          </h1>
          <p>
            From effortless mornings to unforgettable evenings.
            <br />
            Discover pieces that feel like you.
          </p>
          <Link href="/shop" className="button">
            Shop the collection <ArrowUpRight size={19} />
          </Link>
          <div className="hero-bottom-note">
            <span>01 / THE EVERYDAY EDIT</span>
            <Link href="/collections/new-arrivals">
              Discover what’s new <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        {hero && (
          <Link className="retail-hero-photo" href={`/product/${hero.slug}`}>
            <Image
              src={hero.image}
              alt={hero.name}
              fill
              sizes="(max-width:768px) 100vw,45vw"
              preload
            />
            <div className="campaign-caption">
              <span>STYLE WITHOUT THE OVERTHINKING</span>
              <strong>
                The city collection <ArrowUpRight />
              </strong>
            </div>
          </Link>
        )}
      </section>
      <div className="benefit-strip">
        <span>
          <Truck size={21} /> Free delivery on ₹1,999+
        </span>
        <span>
          <RotateCcw size={21} /> 7-day demo returns
        </span>
        <span>
          <ShieldCheck size={21} /> Guest checkout, made simple
        </span>
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR NEXT FAVOURITE</p>
            <h2>Shop by category</h2>
          </div>
          <Link className="text-link" href="/shop">
            Explore all <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="retail-categories">
          {categories.map((c) => {
            const p = catalogue.find((p) => p.category === c);
            return p ? (
              <Link href={`/shop?category=${encodeURIComponent(c)}`} key={c}>
                <div className="category-photo">
                  <Image
                    src={p.image}
                    alt={`${c} collection`}
                    fill
                    sizes="(max-width:640px) 45vw,18vw"
                  />
                </div>
                <h3>
                  {c}
                  <ArrowUpRight size={17} />
                </h3>
              </Link>
            ) : null;
          })}
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CURATED FOR YOUR WARDROBE</p>
            <h2>The K&G edit</h2>
          </div>
          <Link href="/collections/featured" className="text-link">
            Shop the edit <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {(featured.length ? featured : catalogue).slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="campaign-banner">
        {occasion && (
          <div className="campaign-photo">
            <Image
              src={occasion.image}
              alt={occasion.name}
              fill
              sizes="(max-width:768px) 100vw,45vw"
            />
          </div>
        )}
        <div className="campaign-copy">
          <p className="eyebrow">FOR THE MOMENTS THAT MATTER</p>
          <h2>
            A good outfit.
            <br />A great feeling.
          </h2>
          <p>
            Dress for your plans. Or make plans for the dress.
            <br />
            Your next standout moment starts here.
          </p>
          <Link href="/shop?category=Dresses" className="button">
            Find your occasion look <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FRESH FINDS</p>
            <h2>Just landed</h2>
          </div>
          <Link href="/collections/new-arrivals" className="text-link">
            All new arrivals <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {newest.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <RecentlyViewed products={catalogue} />
      <section className="offers-strip">
        <div>
          <p className="eyebrow">A LITTLE EXTRA, FOR YOU</p>
          <h2>Good style. Better value.</h2>
        </div>
        <div>
          {offers
            .filter((c) => c.active)
            .map((c) => (
              <div className="offer" key={c.code}>
                <strong>{c.code}</strong>
                <span>
                  {c.kind === "percent"
                    ? `${c.amount}% off · up to ₹${c.cap / 100}`
                    : `₹${c.amount / 100} off`}
                  <br />
                  Orders ₹{c.minimum / 100}+ · Demo offer
                </span>
              </div>
            ))}
        </div>
        <Link className="text-link" href="/collections/sale">
          Explore the sale <ArrowUpRight size={17} />
        </Link>
      </section>
    </>
  );
}
