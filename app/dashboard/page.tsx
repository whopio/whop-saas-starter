import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getPlansConfig } from "@/lib/config";
import { DEFAULT_PLAN, PLAN_KEYS, type PlanKey } from "@/lib/constants";
import { PlanGate } from "@/components/plan-gate";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { ReactivateBanner } from "@/components/dashboard/reactivate-banner";
import {
  ActivityFeed,
  ActivityFeedSkeleton,
} from "@/components/dashboard/activity-feed";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  // requireSession() is also called in the layout — React.cache() deduplicates
  // the JWT verification, so there is no extra cost. This is the idiomatic
  // App Router pattern since layouts cannot pass props to pages.
  const session = await requireSession();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Welcome — renders immediately (session already available from layout) */}
      <div className="animate-slide-up">
        <h1 className="text-lg font-semibold tracking-tight">
          Welcome back{session.name ? `, ${session.name}` : ""}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Stats stream in while welcome text paints immediately */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection plan={session.plan} />
      </Suspense>

      {/* Reactivate banner for users with pending cancellation */}
      {session.cancelAtPeriodEnd && session.plan !== DEFAULT_PLAN && (
        <div className="animate-slide-up delay-200">
          <ReactivateBanner />
        </div>
      )}

      {/* Upgrade banner for free users */}
      {session.plan === DEFAULT_PLAN && (
        <div className="animate-slide-up delay-200">
          <UpgradeBanner />
        </div>
      )}

      {/* ── Your Plan — shows included features ────────────────────── */}
      <Suspense fallback={<PlanFeaturesSkeleton />}>
        <PlanFeaturesSection plan={session.plan} />
      </Suspense>

      {/* ── Plan-gated content demo ────────────────────────────────── */}
      {/*
       * PlanGate conditionally renders content based on the user's plan.
       * Pass the plan from the server (always fresh from DB) — the component
       * itself is a lightweight client component that compares rank values.
       *
       * Replace these examples with your actual gated features.
       */}
      <div className="animate-slide-up delay-300 space-y-4">
        <PlanGate
          plan={session.plan}
          minimum="starter"
          fallback={
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-[var(--muted)]">Advanced Analytics</h3>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Upgrade to Starter or above to unlock analytics, integrations, and more.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          }
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="text-sm font-semibold">Advanced Analytics</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Replace this with your analytics dashboard, reports, or any Starter+ feature.
            </p>
            <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
              <div className="bg-[var(--card)] p-4">
                <p className="text-xs text-[var(--muted)]">Page Views</p>
                <p className="mt-1 text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>1,234</p>
              </div>
              <div className="bg-[var(--card)] p-4">
                <p className="text-xs text-[var(--muted)]">Conversion</p>
                <p className="mt-1 text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>3.2%</p>
              </div>
              <div className="bg-[var(--card)] p-4">
                <p className="text-xs text-[var(--muted)]">Revenue</p>
                <p className="mt-1 text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>$5,678</p>
              </div>
            </div>
          </div>
        </PlanGate>

        <PlanGate
          plan={session.plan}
          minimum="pro"
          fallback={
            PLAN_KEYS.indexOf(session.plan) >= PLAN_KEYS.indexOf("starter" as PlanKey) ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-[var(--muted)]">API Access</h3>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Upgrade to Pro to unlock API access, SSO, and dedicated support.
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
                  >
                    Upgrade
                  </Link>
                </div>
              </div>
            ) : null
          }
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="text-sm font-semibold">API Access</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Replace this with your API dashboard, key management, or any Pro-only feature.
            </p>
            <div className="mt-4 rounded-lg bg-[var(--surface)] p-3 font-mono text-xs text-[var(--muted)]">
              <span className="text-emerald-500">GET</span> /api/v1/data <span className="text-[var(--muted)]/60">→ 200 OK</span>
            </div>
          </div>
        </PlanGate>
      </div>

      {/* Activity feed — real events from sign-ins, plan changes, settings */}
      <Suspense fallback={<ActivityFeedSkeleton />}>
        <div className="animate-slide-up delay-400">
          <ActivityFeed userId={session.userId} />
        </div>
      </Suspense>

      {/* Replace these onboarding steps with your product's setup flow */}
      <div className="animate-slide-up delay-500 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-sm font-semibold">Get started</h2>
        <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
          Replace this with your product. Auth, payments, and webhooks are ready.
        </p>

        <div className="mt-5 space-y-2.5">
          <Step number={1} title="Customize this dashboard" done={false} />
          <Step number={2} title="Set up your Whop plans" done={false} />
          <Step number={3} title="Configure webhook endpoint" done={false} />
          <Step number={4} title="Deploy to Vercel" done={false} />
        </div>
      </div>
    </div>
  );
}

async function StatsSection({ plan }: { plan: PlanKey }) {
  const plans = await getPlansConfig();
  const planConfig = plans[plan] ?? plans[DEFAULT_PLAN];

  return (
    <div className="animate-slide-up delay-100 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
      <StatCard label="Current Plan" value={planConfig.name} />
      <StatCard label="Projects" value="0 / 3" />
      <StatCard label="Storage" value="0 GB" />
    </div>
  );
}

async function PlanFeaturesSection({ plan }: { plan: PlanKey }) {
  const plans = await getPlansConfig();
  const planConfig = plans[plan] ?? plans[DEFAULT_PLAN];
  const nextPlanKey = PLAN_KEYS[PLAN_KEYS.indexOf(plan) + 1] as PlanKey | undefined;

  return (
    <div className="animate-slide-up delay-200 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">
            {planConfig.name} Plan
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{planConfig.description}</p>
        </div>
        {nextPlanKey && (
          <Link
            href="/pricing"
            className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface)]"
          >
            View Plans
          </Link>
        )}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {planConfig.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-[var(--muted)]">
            <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[var(--card)] p-5">
          <div className="h-3 w-20 rounded bg-[var(--surface)] animate-pulse" />
          <div className="mt-2 h-6 w-12 rounded bg-[var(--surface)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function PlanFeaturesSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="h-4 w-24 rounded bg-[var(--surface)] animate-pulse" />
      <div className="mt-2 h-3 w-40 rounded bg-[var(--surface)] animate-pulse" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 w-32 rounded bg-[var(--surface)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--card)] p-5">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

function Step({
  number,
  title,
  done,
}: {
  number: number;
  title: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-medium ${
          done
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-[var(--surface)] text-[var(--muted)]"
        }`}
      >
        {done ? "\u2713" : number}
      </div>
      <span className={`text-sm ${done ? "line-through text-[var(--muted)]" : ""}`}>
        {title}
      </span>
    </div>
  );
}
