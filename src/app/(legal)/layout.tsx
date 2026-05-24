import Link from "next/link";
import { FinScrollMark } from "@/components/brand/Mark";

/**
 * Shared chrome for the Privacy + Terms pages.
 *
 * Both routes are PUBLIC (no auth required) so they can be linked from
 * the App Store/Google Play submission forms, the Clerk sign-up footer,
 * GDPR data-request emails, etc. Reading layout is wider than the mobile
 * shell since the content is long-form legal prose, not a mobile feed.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar with brand + back-to-home */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-black tracking-tight"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <FinScrollMark size="sm" glyphOnly title="" />
            </div>
            FinScroll
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold">
            <Link
              href="/privacy"
              className="text-zinc-300 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-zinc-300 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-zinc-300 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">{children}</main>

      <footer className="max-w-3xl mx-auto px-5 py-10 text-[11px] text-zinc-400 border-t border-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} FinScroll.</span>
          <span>Educational use only · Not licensed financial advice.</span>
        </div>
      </footer>
    </div>
  );
}
