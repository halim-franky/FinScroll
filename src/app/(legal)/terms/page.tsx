import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — FinScroll",
  description:
    "What you agree to by using FinScroll, and the limits of what this portfolio project promises.",
};

const LAST_UPDATED = "May 24, 2026";

export default function TermsPage() {
  return (
    <article className="space-y-8 leading-relaxed text-[15px] text-zinc-200">
      <header className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
          Terms of Service
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          The rules of using FinScroll
        </h1>
        <p className="text-xs text-zinc-400">Last updated: {LAST_UPDATED}</p>
      </header>

      <aside className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-[13px] text-amber-100 leading-relaxed">
          <span className="font-bold">Portfolio project:</span>
          {" "}
          FinScroll is a personal portfolio project built by a solo developer.
          It has no commercial backing, no paid users, no SLA, and no support
          team. These Terms haven&apos;t been reviewed by a lawyer — treat
          them as a good-faith description of what we ask in exchange for
          letting you use the service for free.
        </p>
      </aside>

      <section className="space-y-3">
        <H2>1. About FinScroll</H2>
        <p>
          FinScroll is an experimental web app exploring whether the
          doomscrolling habit can be redirected into financial-literacy
          learning. It&apos;s a portfolio project — free to use, with no
          paying customers and no business behind it. By using it you accept
          that this is a demo of an idea, not a polished consumer product.
        </p>
      </section>

      <section className="space-y-3">
        <H2>2. Acceptance</H2>
        <p>
          By creating an account or using the service at{" "}
          <strong>finscroll.app</strong>, you agree to these Terms and our{" "}
          <a
            href="/privacy"
            className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
          >
            Privacy Policy
          </a>
          . If you don&apos;t agree, please don&apos;t use the service.
        </p>
      </section>

      <section className="space-y-3">
        <H2>3. Eligibility</H2>
        <p>
          You must be at least <strong>13 years old</strong>
          {" "}
          to use FinScroll. If you&apos;re under the age of majority in your
          jurisdiction, please review these Terms with a parent or guardian
          before signing up.
        </p>
      </section>

      <section className="space-y-3">
        <H2>4. Your account</H2>
        <p>
          You&apos;re responsible for keeping your sign-in credentials secure
          and for activity under your account. Don&apos;t share your account
          or use someone else&apos;s.
        </p>
        <p>
          You can delete your account at any time from{" "}
          <strong>Account → Delete account</strong>. Deletion is permanent.
        </p>
      </section>

      <section className="space-y-3">
        <H2>5. Educational content — NOT financial advice</H2>
        <p>
          FinScroll is an <strong>educational service</strong>. The concept
          cards, AI Coach responses, personalized impact numbers, and any
          videos surfaced inside the app are for general financial-literacy
          purposes only. They are not:
        </p>
        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-400">
          <li>Personalized investment, tax, or legal advice</li>
          <li>An offer or solicitation to buy or sell any security</li>
          <li>A recommendation to follow any specific financial strategy</li>
        </ul>
        <p>
          The 30-year future-value calculations are simplified models based on
          assumed annual returns (8%) and opportunity-cost estimates (~$3/hr).
          Real-world returns vary and are never guaranteed. Always consult a
          licensed financial advisor before making real money decisions.
        </p>
      </section>

      <section className="space-y-3">
        <H2>6. AI-generated content</H2>
        <p>
          The AI Coach uses Google&apos;s Gemini model with retrieval-augmented
          generation grounded in SEC publications and curated peer-reviewed
          economic research. Despite the grounding, AI can be wrong. Verify
          any AI-generated answer before acting on it.
        </p>
      </section>

      <section className="space-y-3">
        <H2>7. Third-party content</H2>
        <p>
          Some cards embed videos from YouTube and link to publications hosted
          by third parties (SEC.gov, NBER, the Federal Reserve, academic
          journals, etc.). FinScroll doesn&apos;t control that content and
          isn&apos;t responsible for it. Each third party&apos;s terms apply
          when you click through.
        </p>
      </section>

      <section className="space-y-3">
        <H2>8. Your notes</H2>
        <p>
          Notes you write inside the app stay yours. You grant FinScroll a
          limited, non-exclusive licence to store and display them back to
          you so the feature works. You can delete notes individually or by
          deleting your account.
        </p>
      </section>

      <section className="space-y-3">
        <H2>9. Acceptable use</H2>
        <p>Please don&apos;t:</p>
        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-400">
          <li>Use FinScroll for any illegal purpose</li>
          <li>
            Try to access, scrape, or interfere with other users&apos;
            accounts or data
          </li>
          <li>
            Reverse-engineer, decompile, or attempt to extract the source
            code or models
          </li>
          <li>
            Send abusive, harassing, or unlawful content through the AI Coach
            or notes
          </li>
          <li>
            Impersonate FinScroll or claim affiliation without permission
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <H2>10. Service availability</H2>
        <p>
          As a portfolio project, FinScroll is provided{" "}
          <strong>&ldquo;as is&rdquo;</strong> and may go offline, lose data,
          change features, or shut down at any time without notice. We
          don&apos;t guarantee uptime or that any specific feature will
          continue to exist.
        </p>
      </section>

      <section className="space-y-3">
        <H2>11. No warranty</H2>
        <p>
          To the fullest extent permitted by law, FinScroll is provided
          without warranties of any kind — express or implied — including
          warranties of merchantability, fitness for a particular purpose,
          and non-infringement. We don&apos;t promise the service will be
          error-free, accurate, or secure.
        </p>
      </section>

      <section className="space-y-3">
        <H2>12. Liability</H2>
        <p>
          This is a free portfolio project with no commercial relationship
          between us. To the fullest extent permitted by law, FinScroll and
          its operator are not liable for any damages — including loss of
          profits, data, or investment value — arising from your use of the
          service.{" "}
          <strong>You use the service at your own risk.</strong>
        </p>
      </section>

      <section className="space-y-3">
        <H2>13. Termination</H2>
        <p>
          You may stop using FinScroll at any time by deleting your account.
          We may suspend or remove access if you breach these Terms, abuse
          the service, or use it in a way that creates legal or operational
          risk for us or other users.
        </p>
      </section>

      <section className="space-y-3">
        <H2>14. Changes</H2>
        <p>
          We may update these Terms occasionally. Material changes will
          update the &ldquo;Last updated&rdquo; date above. Continued use
          after the change means you accept the new Terms.
        </p>
      </section>

      <section className="space-y-3">
        <H2>15. Contact</H2>
        <p>
          Questions about these Terms? Use our{" "}
          <Link
            href="/contact"
            className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
          >
            contact form
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-black tracking-tight text-white">{children}</h2>
  );
}
