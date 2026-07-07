import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/landing/header";
import { PricingCards } from "@/components/landing/pricing-cards";
import { Footer } from "@/components/landing/footer";
import { getVisiblePlans } from "@/lib/config";

const FAQ = [
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel anytime. Your access continues until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards and PayPal through Whop.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan gives you access to core features. Upgrade when you need more.",
  },
  {
    q: "Can I change plans?",
    a: "Yes, upgrade or downgrade at any time. Changes take effect immediately.",
  },
];

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for every stage of your business.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-24">
          <div className="text-center mb-12">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Pricing
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </div>
          <Suspense fallback={<PricingCardsSkeleton />}>
            <PricingSection />
          </Suspense>
        </section>

        {/* FAQ */}
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
            <h2 className="text-lg font-semibold text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {FAQ.map((faq) => (
                <div key={faq.q}>
                  <h3 className="text-sm font-semibold">{faq.q}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

async function PricingSection() {
  const plans = await getVisiblePlans();
  return <PricingCards plans={plans} />;
}

function PricingCardsSkeleton() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
        >
          <div className="h-4 w-16 rounded bg-[var(--surface)] animate-pulse" />
          <div className="mt-2 h-3 w-32 rounded bg-[var(--surface)] animate-pulse" />
          <div className="mt-6 h-8 w-20 rounded bg-[var(--surface)] animate-pulse" />
          <div className="mt-6 h-10 w-full rounded-lg bg-[var(--surface)] animate-pulse" />
          <div className="mt-6 space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-3 w-full rounded bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
