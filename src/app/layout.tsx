import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { PWARegister } from "@/components/PWARegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import "./globals.css";

const SITE_NAME = "FinScroll";
const SITE_TITLE = "FinScroll — Turn Doomscrolling Into Wealth";
const SITE_DESCRIPTION =
  "Replace your doomscrolling habit with science-backed financial literacy. TikTok-style cards grounded in SEC research, powered by Google Gemini.";

export const metadata: Metadata = {
  metadataBase: new URL("https://finscroll.app"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  keywords: [
    "financial literacy",
    "Gen Z finance",
    "doomscrolling",
    "TikTok finance",
    "compound interest",
    "SEC investor education",
    "finfluencer myths",
    "passive investing",
  ],
  authors: [{ name: "FinScroll Team" }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "FinScroll — Stop Doomscrolling. Start Wealth-Building.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.svg"],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="bg-zinc-950 text-zinc-50 antialiased" suppressHydrationWarning>
          <PWARegister />
          {children}
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
