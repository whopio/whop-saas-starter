"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * FAQ items — edit these to match your product.
 *
 * These defaults cover common questions about the SaaS starter template.
 * Replace them with questions your customers actually ask.
 */
const faqs = [
  {
    question: "How does the free plan work?",
    answer:
      "The free plan gives you full access to the core features with usage limits. No credit card required — just sign in and start building. You can upgrade anytime to unlock higher limits and premium features.",
  },
  {
    question: "Can I cancel or change my plan at any time?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel your subscription at any time from the billing portal. If you cancel, you'll keep access until the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards through our payment provider, Whop. All payments are processed securely — we never store your card details.",
  },
  {
    question: "Is there a trial period?",
    answer:
      "The free plan works as an unlimited trial — use it as long as you like. When you're ready for more, paid plans are available with monthly or yearly billing (save with annual plans).",
  },
  {
    question: "How do I get support?",
    answer:
      "Free users get community support. Starter and Pro plans include priority support with faster response times. Pro users also get a dedicated support channel.",
  },
  {
    question: "Can I self-host this?",
    answer:
      "Yes. This is an open-source Next.js app — you can deploy it anywhere that runs Node.js. We recommend Vercel for the easiest setup, but Railway, Fly.io, and others work too.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Everything you need to know to get started.
          </p>
        </div>

        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[var(--foreground)]"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-medium">{faq.question}</span>
                <svg
                  className={cn(
                    "h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200",
                    openIndex === i && "rotate-45"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200",
                  openIndex === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm text-[var(--muted)] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
