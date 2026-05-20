import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { PWARegister } from "@/components/PWARegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinScroll — Turn Doomscrolling Into Wealth",
  description:
    "Replace your doomscrolling habit with science-backed financial literacy. Powered by Google Gemini & grounded in SEC research.",
  applicationName: "FinScroll",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FinScroll",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  formatDetection: {
    telephone: false,
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
