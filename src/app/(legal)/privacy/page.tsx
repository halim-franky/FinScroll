import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — FinScroll",
  description:
    "How FinScroll collects, uses, shares, and protects your information.",
};

const LAST_UPDATED = "May 24, 2026";

// No CONTACT_EMAIL constant — the destination inbox lives ONLY in the server
// env var CONTACT_TO_EMAIL (read in src/app/api/contact/route.ts) so it never
// ships in the client bundle. The policy links to /contact instead, which
// posts to that server route.

export default function PrivacyPage() {
  return (
    <article className="space-y-8 leading-relaxed text-[15px] text-zinc-200">
      {/* Title block */}
      <header className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
          Privacy Policy
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          How FinScroll handles your data
        </h1>
        <p className="text-xs text-zinc-400">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      {/* Portfolio-status disclaimer — mirrors the Terms aside */}
      <aside className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-[13px] text-amber-100 leading-relaxed">
          <span className="font-bold">Portfolio project:</span>
          {" "}
          FinScroll is a personal portfolio project built by a solo developer,
          not a commercial product. This Policy hasn&apos;t been reviewed by
          a lawyer — it&apos;s a good-faith, plain-English description of
          what the app actually does with your data based on the current
          stack.
        </p>
      </aside>

      {/* 1. Introduction */}
      <section className="space-y-3">
        <H2>1. Who we are</H2>
        <p>
          FinScroll (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          is a personal portfolio project — a free, experimental web app that
          explores whether the doomscrolling habit can be redirected into
          financial-literacy learning. There&apos;s no company, no paying
          customers, and no team behind it; just a solo developer building in
          public.
        </p>
        <p>
          This Privacy Policy explains what information the app collects when
          you use it at <strong>finscroll.app</strong>, why it collects it,
          who else handles it on our behalf, and the choices you have. By
          using FinScroll, you confirm you&apos;ve read and understood this
          Policy. If you don&apos;t agree, please don&apos;t use the service.
        </p>
      </section>

      {/* 2. What we collect */}
      <section className="space-y-3">
        <H2>2. What information we collect</H2>

        <H3>2.1 Account information</H3>
        <p>
          When you sign up we collect (via our authentication provider Clerk):
        </p>
        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-400">
          <li>Email address</li>
          <li>Display name and profile picture (if provided)</li>
          <li>
            OAuth tokens and provider identifiers when you sign in with Google
            or another connected account
          </li>
          <li>IP address and basic device information (for security)</li>
        </ul>

        <H3>2.2 Onboarding & learning data</H3>
        <p>
          To personalize your experience, we ask three onboarding questions
          and store your answers:
        </p>
        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-400">
          <li>
            Your biggest money struggle (saving, debt, investing, or
            &ldquo;all of it&rdquo;)
          </li>
          <li>Your average daily scroll-time bucket</li>
          <li>Your primary first-money goal</li>
        </ul>
        <p>
          As you use the app we also store: streak count, the concept cards
          you&apos;ve mastered, your quiz answers, and a weekly activity log.
        </p>

        <H3>2.3 Notes you write</H3>
        <p>
          When you save a note on a card, the text is stored on your device
          and, if cloud sync is enabled, on our database. Voice notes you
          dictate are transcribed locally by your browser&apos;s speech engine;
          we only store the transcribed text.
        </p>

        <H3>2.4 Chat messages with the AI Coach</H3>
        <p>
          When you send a message to the AI Coach, your message text is sent
          to Google&apos;s Gemini API to generate a response. We do not retain
          your chat history on our servers; messages live only in your
          browser&apos;s memory during the session.
        </p>

        <H3>2.5 Device, browser, and crash data</H3>
        <p>
          We use <strong>localStorage</strong>
          {" "}
          and a service worker to remember your progress, settings (audio
          on/off, tutorial completed), and to cache static assets for offline
          use. If the app encounters an error, our error-monitoring provider
          (Sentry) records the error context, your account ID, and a short
          trail of your recent actions (&ldquo;breadcrumbs&rdquo;) to help us
          fix bugs.
        </p>

        <H3>2.6 Video views</H3>
        <p>
          Concept cards embed short educational videos from YouTube via
          YouTube&apos;s official iframe player. When a video loads, YouTube
          may set cookies and collect viewing data per its own privacy policy.
          We don&apos;t receive that data directly.
        </p>
      </section>

      {/* 3. How we use it */}
      <section className="space-y-3">
        <H2>3. How we use your information</H2>
        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-400">
          <li>To create and manage your account</li>
          <li>
            To personalize the cards you see, the AI Coach&apos;s suggestions,
            and the compound-wealth impact numbers we show you
          </li>
          <li>
            To save your streak, completed cards, and notes so they persist
            across devices
          </li>
          <li>To fix bugs and monitor reliability</li>
          <li>
            To comply with legal obligations and protect against abuse or fraud
          </li>
        </ul>
        <p>
          We <strong>do not</strong>
          {" "}
          sell your personal information, and we don&apos;t use your data to
          train models or for behavioural advertising.
        </p>
      </section>

      {/* 4. Subprocessors */}
      <section className="space-y-3">
        <H2>4. Who handles your data on our behalf</H2>
        <p>
          To run FinScroll we use the following service providers
          (&ldquo;subprocessors&rdquo;). Each is bound by their own privacy
          terms, which we link below.
        </p>
        <div className="rounded-2xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <SubprocessorRow
            name="Clerk Inc."
            purpose="User authentication, sessions, OAuth"
            region="United States"
            link="https://clerk.com/privacy"
          />
          <SubprocessorRow
            name="Google LLC"
            purpose="Gemini API for AI Coach, YouTube embeds"
            region="United States + global"
            link="https://policies.google.com/privacy"
          />
          <SubprocessorRow
            name="Supabase Inc."
            purpose="Database for cloud-synced onboarding + progress"
            region="United States"
            link="https://supabase.com/privacy"
          />
          <SubprocessorRow
            name="Pinecone Systems Inc."
            purpose="Vector database for SEC content (no personal data stored)"
            region="United States"
            link="https://www.pinecone.io/privacy/"
          />
          <SubprocessorRow
            name="Functional Software, Inc. (Sentry)"
            purpose="Crash reports + performance monitoring"
            region="United States"
            link="https://sentry.io/privacy/"
          />
          <SubprocessorRow
            name="Resend (Resend, Inc.)"
            purpose="Delivers contact-form messages to our private inbox"
            region="United States"
            link="https://resend.com/legal/privacy-policy"
          />
        </div>
      </section>

      {/* 5. International transfers */}
      <section className="space-y-3">
        <H2>5. International data transfers</H2>
        <p>
          Most of our subprocessors are based in the United States. If you use
          FinScroll from the European Economic Area, the UK, or another region
          with data-protection laws, your information will be transferred to,
          stored, and processed in the United States and other countries. We
          rely on the relevant Standard Contractual Clauses or each
          provider&apos;s certification for these transfers.
        </p>
      </section>

      {/* 6. Retention */}
      <section className="space-y-3">
        <H2>6. How long we keep your data</H2>
        <p>
          We retain your account and learning data for as long as your account
          is active. When you delete your account (Account → Delete account)
          we wipe your Supabase rows and Clerk profile immediately. Local
          device data is cleared at the same time. Sentry breadcrumbs roll off
          on Sentry&apos;s own retention schedule (typically 30–90 days).
        </p>
      </section>

      {/* 7. Your rights */}
      <section className="space-y-3">
        <H2>7. Your rights</H2>
        <p>
          Depending on where you live, you may have the right to:
        </p>
        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-400">
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Delete your account and personal data</li>
          <li>Export your data in a portable format</li>
          <li>Object to or restrict certain processing</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p>
          You can delete your account at any time from <strong>Account →
          Delete account</strong>. For any other request, use our{" "}
          <Link
            href="/contact"
            className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
          >
            contact form
          </Link>{" "}
          and we&apos;ll respond within 30 days.
        </p>
      </section>

      {/* 8. Cookies / local storage */}
      <section className="space-y-3">
        <H2>8. Cookies & local storage</H2>
        <p>
          We use <strong>localStorage</strong>
          {" "}
          in your browser to remember your streak, progress, audio preference,
          completed tutorial state, and onboarding answers (so the app works
          offline and loads fast). We also register a{" "}
          <strong>service worker</strong>
          {" "}
          that caches static assets. We do not use third-party advertising
          cookies. Clerk sets a session cookie that&apos;s required to keep
          you signed in.
        </p>
      </section>

      {/* 9. Children's privacy */}
      <section className="space-y-3">
        <H2>9. Children&apos;s privacy</H2>
        <p>
          FinScroll is intended for users <strong>13 years and older</strong>.
          We do not knowingly collect personal information from children under
          13. If you believe a child under 13 has signed up, please use our{" "}
          <Link
            href="/contact"
            className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
          >
            contact form
          </Link>{" "}
          (subject: Privacy / data request) and we&apos;ll delete the account.
        </p>
      </section>

      {/* 10. Changes */}
      <section className="space-y-3">
        <H2>10. Changes to this policy</H2>
        <p>
          We may update this Policy from time to time. When we make material
          changes we&apos;ll update the &ldquo;Last updated&rdquo; date above
          and, for significant changes, notify you in the app or by email
          before the change takes effect.
        </p>
      </section>

      {/* 11. Contact */}
      <section className="space-y-3">
        <H2>11. Contact</H2>
        <p>
          Questions about this Policy or how we handle your data? Use our{" "}
          <Link
            href="/contact"
            className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
          >
            contact form
          </Link>{" "}
          and pick the &ldquo;Privacy / data request&rdquo; subject. We
          don&apos;t publish a direct mailing address — all messages route
          through our private team inbox.
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

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-zinc-100 pt-1">{children}</h3>
  );
}

function SubprocessorRow({
  name,
  purpose,
  region,
  link,
}: {
  name: string;
  purpose: string;
  region: string;
  link: string;
}) {
  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-zinc-900/50">
      <div className="min-w-0">
        <div className="font-bold text-white">{name}</div>
        <div className="text-xs text-zinc-300">{purpose}</div>
      </div>
      <div className="text-[11px] text-zinc-400 flex items-center gap-3 sm:text-right shrink-0">
        <span>{region}</span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-300 hover:text-sky-200 underline underline-offset-2 whitespace-nowrap"
        >
          Privacy notice ↗
        </a>
      </div>
    </div>
  );
}
