import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import NavigationBar from "@/components/NavigationBar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "AgriSense — Agricultural Intelligence & Farmer Advisory",
  description: "AI-powered crop advisory, real-time APMC Mandi rates, dynamic subsidies, and crop insurance for Indian farmers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgriSense",
  },
};

export const viewport = {
  themeColor: "#2D4A22",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} antialiased`}
      >
        <Providers>
          <ServiceWorkerRegister />
          <NavigationBar />
          <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12 pb-24 min-h-[calc(100vh-64px)] overflow-x-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
