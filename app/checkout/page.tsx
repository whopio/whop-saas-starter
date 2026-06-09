import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPlansConfig, getWhopEnvironment } from "@/lib/config";
import { PLAN_KEYS, type PlanKey, type BillingInterval } from "@/lib/constants";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; interval?: string }>;
}) {
  const { plan: planParam, interval: intervalParam } = await searchParams;

  const planKey: PlanKey | null =
    planParam && PLAN_KEYS.includes(planParam as PlanKey)
      ? (planParam as PlanKey)
      : null;
  const interval: BillingInterval =
    intervalParam === "monthly" ? "monthly" : "yearly";

  // Fetch plans + session + environment in parallel (server-side, no client round-trips)
  const [plans, session, environment] = await Promise.all([
    getPlansConfig(),
    getSession(),
    getWhopEnvironment(),
  ]);

  const plan = planKey ? (plans[planKey] ?? null) : null;
  const whopPlanId = plan
    ? interval === "yearly"
      ? plan.whopPlanIdYearly
      : plan.whopPlanId
    : "";

  // Invalid or missing plan
  if (!plan || !whopPlanId || !planKey) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-sm font-semibold">Invalid Plan</h1>
          <p className="mt-2 text-xs text-[var(--muted)]">
            The plan you selected doesn&apos;t exist or hasn&apos;t been
            configured.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-block rounded-lg border border-[var(--border)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CheckoutForm
      planKey={planKey}
      plan={plan}
      whopPlanId={whopPlanId}
      interval={interval}
      userEmail={session?.email ?? null}
      userName={session?.name ?? null}
      environment={environment}
    />
  );
}
