import type { Metadata } from "next";
import { Header, Footer } from "@/components/store-shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Aurelle — Everyday, Extraordinary",
    template: "%s | Aurelle",
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
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
