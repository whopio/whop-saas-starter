import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isSetupComplete, getPlansConfig } from "@/lib/config";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { PricingCards } from "@/components/landing/pricing-cards";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} | ${APP_DESCRIPTION}`,
  description: APP_DESCRIPTION,
  openGraph: {
    title: `${APP_NAME} | ${APP_DESCRIPTION}`,
    description: APP_DESCRIPTION,
  },
};

export default async function HomePage() {
  const setupDone = await isSetupComplete();
  if (!setupDone) {
    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <Hero />
        <Features />
        <Testimonials />

        {/* Pricing streams in while Hero + Features paint immediately */}
        <section>
          <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Start free. Upgrade when you&apos;re ready.
              </p>
            </div>
            <Suspense fallback={<PricingCardsSkeleton />}>
              <PricingSection />
            </Suspense>
          </div>
        </section>

        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

async function PricingSection() {
  const plans = await getPlansConfig();
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
