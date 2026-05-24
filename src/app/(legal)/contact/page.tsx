import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — FinScroll",
  description:
    "Get in touch with the FinScroll team about privacy, bugs, or feedback.",
};

export default function ContactPage() {
  return (
    <article className="space-y-6 text-zinc-200">
      <header className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
          Contact
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Get in touch
        </h1>
        <p className="text-[15px] text-zinc-300 leading-relaxed max-w-prose">
          Privacy requests, bug reports, feature ideas, account-deletion help,
          or anything else — drop a note below and we&apos;ll get back to you
          within 30 days (usually much faster).
        </p>
      </header>

      <ContactForm />

      <p className="text-[12px] text-zinc-400 leading-relaxed max-w-prose pt-2">
        Your message is sent securely to our private team inbox. We don&apos;t
        publish a public mailing address. Submissions are rate-limited to
        protect against spam.
      </p>
    </article>
  );
}
