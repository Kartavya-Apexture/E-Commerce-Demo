import type { Metadata } from "next";
import { Header, Footer } from "@/components/store-shell";
import "./globals.css";
import localFont from "next/font/local";
import { BrowserDemo } from "@/components/browser-demo";
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
  referrer: "no-referrer",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const browser =
    process.env.VERCEL === "1" || process.env.BROWSER_DEMO === "1";
  const catalogue = browser ? [] : (await import("@/lib/db")).products();
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        {browser ? (
          <BrowserDemo />
        ) : (
          <>
            <Header products={catalogue} />
            <main id="main">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
