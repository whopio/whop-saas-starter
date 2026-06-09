import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getWhopPlanDetails } from "@/lib/whop";
import { getConfig } from "@/lib/config";
import { getSession } from "@/lib/auth";

/**
 * GET /api/config/plan-details?planId=plan_xxxxx
 *
 * Fetches plan pricing from Whop API. Used by the setup wizard
 * to preview prices when a plan ID is entered.
 * Open during initial setup; admin-only after (same policy as /api/setup) —
 * it drives Whop API calls with the server's API key.
 */
export async function GET(request: NextRequest) {
  const setupDone = (await getConfig("setup_complete")) === "true";
  if (setupDone) {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const planId = request.nextUrl.searchParams.get("planId");
  if (!planId || !planId.startsWith("plan_")) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const details = await getWhopPlanDetails(planId);
  if (!details) {
    return NextResponse.json({ error: "Could not fetch plan" }, { status: 502 });
  }

  const price = details.plan_type === "renewal"
    ? (details.renewal_price ?? 0)
    : (details.initial_price ?? 0);

  return NextResponse.json({
    price,
    currency: details.currency ?? "usd",
    billingPeriod: details.billing_period,
    planType: details.plan_type,
    trialDays: details.trial_period_days,
  });
}
