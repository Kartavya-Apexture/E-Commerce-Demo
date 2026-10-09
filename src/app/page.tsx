import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Truck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { products } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
export const dynamic = "force-dynamic";
export default function Home() {
  const catalogue = products();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="small-line" /> THE NEW SEASON EDIT · 2026
          </div>
          <h1>
            A little effortless.
            <br />A lot <em>you.</em>
          </h1>
          <p>
            Fresh silhouettes for wherever the day takes you.
            <br />
            Meet the pieces you’ll reach for, again and again.
          </p>
          <Link href="/shop" className="button">
            Discover the collection <ArrowUpRight size={18} />
          </Link>
          <div className="hero-caption">
            <span>01 —</span> Your everyday, beautifully reimagined.
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="/images/fashion-0.jpg"
            alt="Powder blue longline coat styled for an everyday city escape"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 53vw"
          />
          <div className="image-note">
            <span>THE CITY EDIT</span>
            <Link href="/product/powder-blue-longline-coat">
              Made for a change of scenery <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-sticker">
            a new
            <br />
            <em>perspective.</em>
          </div>
        </div>
      </section>
      <div className="benefit-strip">
        <span>
          <Truck size={19} /> Free shipping above ₹1,999
        </span>
        <span>
          <RotateCcw size={18} /> Easy 7-day returns <small>DEMO POLICY</small>
        </span>
        <span>
          <Sparkles size={18} /> Thoughtfully chosen. Beautifully worn.
        </span>
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A WARDROBE, YOUR WAY</p>
            <h2>What’s your mood?</h2>
          </div>
          <Link href="/shop" className="text-link">
            Explore all styles <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {[
            { name: "Dresses", image: 2, text: "A moment of your own" },
            { name: "Co-ords", image: 1, text: "Perfectly in sync" },
            { name: "Bottoms", image: 5, text: "Start with the essentials" },
          ].map((c) => (
            <Link
              key={c.name}
              className="category-card"
              href={`/shop?category=${c.name}`}
            >
              <Image
                src={`/images/fashion-${c.image}.jpg`}
                alt={`${c.name} collection`}
                fill
                sizes="(max-width: 640px) 85vw, 32vw"
              />
              <div>
                <span>{c.text}</span>
                <h3>
                  {c.name} <ArrowUpRight size={24} />
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="container section arrivals">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FRESH FINDS, FOREVER FAVOURITES</p>
            <h2>Just landed. Already loved.</h2>
          </div>
          <Link href="/shop?sort=newest" className="text-link">
            Shop new arrivals <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {catalogue.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="editorial">
        <div className="editorial-photo">
          <Image
            src="/images/fashion-5.jpg"
            alt="Blush pocket joggers with an effortless relaxed fit"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        </div>
        <div>
          <p className="eyebrow">LESS OVERTHINKING. MORE YOU.</p>
          <h2>
            Great style starts
            <br />
            with feeling <em>good.</em>
          </h2>
          <p>
            For coffee runs that turn into catch-ups. For plans that change. For
            every version of your everyday. A wardrobe that keeps up,
            beautifully.
          </p>
          <Link href="/about" className="text-link">
            Get to know Aurelle <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="closing-note">
        <span className="eyebrow">THE AURELLE WAY</span>
        <h2>Wear what feels like you.</h2>
        <Link href="/shop" className="button outline">
          Find your next favourite <ArrowUpRight size={17} />
        </Link>
      </section>
    </>
  );
}
