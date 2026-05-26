import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { PWARegister } from "@/components/PWARegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import "./globals.css";

/**
 * Global Clerk appearance. Applies to inline `<UserProfile />` and
 * Clerk-opened modals (`openUserProfile`, `openSignIn`, etc.) so the
 * Account screen and Modal share the same dark theme.
 */
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#10b981",
    colorBackground: "#0a0a0a",
    colorText: "#ffffff",
    colorTextSecondary: "#e4e4e7",
    colorInputBackground: "#27272a",
    colorInputText: "#ffffff",
    colorNeutral: "#e4e4e7",
    colorDanger: "#f43f5e",
    colorSuccess: "#10b981",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-zinc-900 border border-zinc-800 !shadow-2xl",
    modalContent: "!bg-zinc-900 !border-zinc-800",
    modalBackdrop: "!bg-zinc-950/80 backdrop-blur-sm",
    headerTitle: "!text-white !font-extrabold",
    headerSubtitle: "!text-zinc-300",
    navbar: "!bg-zinc-900 !border-zinc-800",
    navbarButton: "!text-zinc-300 hover:!text-white",
    navbarButton__active: "!bg-zinc-800 !text-white",
    pageScrollBox: "!bg-zinc-900",
    profileSection: "!border-zinc-800",
    profileSectionTitleText: "!text-white !font-bold",
    profileSectionContent: "!text-zinc-100",
    profileSectionItem: "!text-zinc-100",
    profileSectionPrimaryButton: "!text-emerald-400 hover:!text-emerald-300",
    accordionTriggerButton: "!text-zinc-100",
    badge: "!bg-emerald-500/15 !text-emerald-300",
    formFieldLabel: "!text-zinc-100 !font-semibold",
    formFieldInput:
      "!bg-zinc-800 !border !border-zinc-700 !text-white !placeholder-zinc-400 !rounded-xl",
    formButtonPrimary:
      "!bg-emerald-500 hover:!bg-emerald-400 !text-zinc-950 !font-bold !rounded-xl",
    formButtonReset: "!text-zinc-300",
    userPreviewMainIdentifier: "!text-white",
    userPreviewSecondaryIdentifier: "!text-zinc-300",
    formFieldDisplay: "!text-white",
    footer: "!bg-transparent",
  },
};

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
  // Don't restrict user zoom — Lighthouse penalizes maximumScale <5
  // because it blocks pinch-to-zoom which is an accessibility need.
  // Web doesn't have a real "lock zoom" requirement the way native
  // mobile apps do; users can still scroll/snap the FinScroll feed.
  viewportFit: "cover",
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      {/* suppressHydrationWarning on <html> silences hydration mismatches
          caused by browser extensions (QuickBooks Beam, password managers,
          ad blockers, etc.) that inject attributes like `data-qb-installed`
          onto the root element before React hydrates. We can't control
          third-party extensions, and this only suppresses one level of
          mismatch — real React tree mismatches still surface as errors. */}
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="bg-zinc-950 text-zinc-50 antialiased" suppressHydrationWarning>
          <PWARegister />
          {children}
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
