import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConfig, getWhopEnvironment } from "@/lib/config";
import { getWhopUrls } from "@/lib/whop";
import {
  getSubscriptionDetails,
  uncancelSubscription,
} from "@/lib/subscription";

/**
 * POST /api/billing/uncancel
 *
 * Reverses a pending cancellation for the current user's membership.
 * Calls the Whop API to uncancel, then updates the local DB.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await getSubscriptionDetails(session.userId);

  if (!result.hasSubscription || !result.subscription?.whopMembershipId) {
    return NextResponse.json(
      { error: "No active membership found" },
      { status: 400 },
    );
  }

  if (result.subscription.status !== "canceling") {
    return NextResponse.json(
      { error: "Membership is not pending cancellation" },
      { status: 400 },
    );
  }

  const apiKey = await getConfig("whop_api_key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Whop API key not configured" },
      { status: 500 },
    );
  }

  // Call Whop's uncancel API
  const { apiBase } = getWhopUrls(await getWhopEnvironment());
  const res = await fetch(
    `${apiBase}/api/v1/memberships/${encodeURIComponent(result.subscription.whopMembershipId)}/uncancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const error = await res.text().catch(() => "Unknown error");
    console.error(`[Uncancel] Whop API error (${res.status}): ${error}`);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 502 },
    );
  }

  // Update local DB immediately (webhook will also fire, but this is faster)
  await uncancelSubscription(session.userId);

  return NextResponse.json({ success: true });
}
