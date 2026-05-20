import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinScroll — Turn Doomscrolling Into Wealth",
  description:
    "Replace your doomscrolling habit with science-backed financial literacy. Powered by Google Gemini & grounded in SEC research.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="bg-zinc-950 text-zinc-50 antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
