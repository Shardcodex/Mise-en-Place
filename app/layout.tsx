import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display, Petit_Formal_Script } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const petitFormalScript = Petit_Formal_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-petit-formal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Rouxtine",
    default: "Rouxtine",
  },
  description:
    "The foundation of every great meal — plan your week, save your recipes, and build a kitchen routine that actually sticks.",
  applicationName: "Rouxtine",
  keywords: ["meal planning", "recipe manager", "shopping list", "meal prep", "rouxtine"],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#E8200F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${petitFormalScript.variable}`}>
      <body className="font-sans">
        {children}
        <Script
          src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
