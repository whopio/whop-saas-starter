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
    question: "What do I need to get started?",
    answer:
      "Just a Whop account. Run npx create-whop-kit and the CLI handles everything — it scaffolds your project, provisions a database, creates your Whop app, sets up pricing plans, deploys to Vercel, and pushes to GitHub. The whole process takes a few minutes.",
  },
  {
    question: "Do I need to set up a database manually?",
    answer:
      "No. The CLI auto-provisions a PostgreSQL database for you via Neon, Supabase, or Prisma Postgres. If you prefer, you can also bring your own PostgreSQL connection string — any provider works.",
  },
  {
    question: "How do I create pricing plans?",
    answer:
      "The CLI walks you through creating plans on Whop during setup. You define your tiers in a single file — the pricing page, plan gating, checkout, and webhooks all adapt automatically. Prices are synced from Whop so you manage billing in one place.",
  },
  {
    question: "How does authentication work?",
    answer:
      "Users sign in via Whop using OAuth 2.1 with PKCE — no passwords to store, no auth library to configure. The first user to sign in becomes the admin. Sessions are secure httpOnly cookies with 7-day expiry.",
  },
  {
    question: "Can I deploy this anywhere?",
    answer:
      "Yes. The CLI can deploy to Vercel automatically with GitHub integration, but it's a standard Next.js app — Railway, Fly.io, Render, or any platform that supports Node.js and SSR will work.",
  },
  {
    question: "Is this a Whop app or a standalone site?",
    answer:
      "It's a standalone Next.js app on your own domain. Whop handles auth and payments behind the scenes, but there are no iframes or proxies — you own and control the full stack.",
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
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[var(--foreground)]"
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
