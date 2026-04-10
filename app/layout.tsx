import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
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
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44' fill='none'><circle cx='16' cy='14' r='9' stroke='%230F0F0F' stroke-width='2'/><line x1='22' y1='20' x2='38' y2='38' stroke='%23E8200F' stroke-width='2.5' stroke-linecap='round'/><circle cx='16' cy='14' r='4' fill='%23E8200F' opacity='0.25'/></svg>",
        type: "image/svg+xml",
      },
    ],
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
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
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
