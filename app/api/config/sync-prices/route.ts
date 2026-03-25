import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getPlansConfig } from "@/lib/config";
import { syncWhopPlanPrice } from "@/lib/whop";
import { PLAN_KEYS } from "@/lib/constants";

/**
 * POST /api/config/sync-prices
 *
 * Fetches all configured Whop plan IDs and stores their prices
 * in SystemConfig. Requires admin authentication.
 */
export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plans = await getPlansConfig();
  const synced: Record<string, { monthly?: number; yearly?: number }> = {};

  for (const key of PLAN_KEYS) {
    const plan = plans[key];
    const result: { monthly?: number; yearly?: number } = {};

    if (plan.whopPlanId) {
      const price = await syncWhopPlanPrice(key, "monthly", plan.whopPlanId);
      if (price !== null) result.monthly = price;
    }
    if (plan.whopPlanIdYearly && plan.whopPlanIdYearly !== plan.whopPlanId) {
      const price = await syncWhopPlanPrice(key, "yearly", plan.whopPlanIdYearly);
      if (price !== null) result.yearly = price;
    }

    if (Object.keys(result).length > 0) {
      synced[key] = result;
    }
  }

  // Revalidate static pricing pages if any prices changed
  if (Object.keys(synced).length > 0) {
    after(() => {
      revalidatePath("/");
      revalidatePath("/pricing");
    });
  }

  return NextResponse.json({ synced });
}
