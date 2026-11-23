import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/Chrome";

export const metadata: Metadata = {
  title: { default: "ملهم للاستشارات والتطوير", template: "%s | ملهم" },
  description: "استشارات وكوتشينج مع الأستاذ عبدالعزيز دلول — احجز طلب استشارة بسرّية واحترام.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};
export const viewport: Viewport = { themeColor: "#0B1B3A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
