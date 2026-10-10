import type { Metadata } from "next";
import { Header, Footer } from "@/components/store-shell";
import "./globals.css";
import localFont from "next/font/local";
import { products } from "@/lib/db";
const inter = localFont({
  src: "../../public/fonts/inter-variable.ttf",
  variable: "--font-inter",
  display: "swap",
});
const playfair = localFont({
  src: "../../public/fonts/playfairdisplay-variable.ttf",
  variable: "--font-playfair",
  display: "swap",
});
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "King and Queen Store — Your kind of style",
    template: "%s | K&G Store",
  },
  description:
    "Discover your next favourite. A boutique women’s western wear shopping demo.",
  icons: { icon: "/icon.svg" },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        {process.env.VERCEL === "1" && (
          <aside
            className="online-demo-note"
            aria-label="Online demo storage notice"
          >
            Online demo · Use sample details. Orders and edits are temporary and
            may reset or differ between server instances.
          </aside>
        )}
        <Header products={products()} />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
