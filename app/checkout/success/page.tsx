import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPlansConfig } from "@/lib/config";
import { PLAN_KEYS, type PlanKey } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [{ plan: planParam }, session] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  const planKey =
    planParam && PLAN_KEYS.includes(planParam as PlanKey)
      ? (planParam as PlanKey)
      : null;

  let planName: string | null = null;
  if (planKey) {
    const plans = await getPlansConfig();
    const config = plans[planKey];
    if (config) planName = config.name;
  }

  const isSignedIn = !!session;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <svg
            className="h-6 w-6 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-lg font-semibold tracking-tight">
          You&apos;re all set!
        </h1>

        {planName ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            You&apos;re now on the <span className="font-medium text-[var(--foreground)]">{planName}</span> plan.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Your account is ready to go.
          </p>
        )}

        {isSignedIn ? (
          <Link
            href="/dashboard"
            className="mt-7 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <p className="mt-5 text-xs text-[var(--muted)]">
              Sign in to access your dashboard and manage your subscription.
            </p>
            <Link
              href="/api/auth/login?next=/dashboard"
              className="mt-3 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
