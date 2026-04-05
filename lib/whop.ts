// ---------------------------------------------------------------------------
// Whop API helpers — re-exports from whop-kit + app-specific wrappers
// ---------------------------------------------------------------------------

// Re-export pure functions from whop-kit
export {
  randomString,
  sha256,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getWhopUser,
  checkWhopAccess,
  fetchWhopPlanDetails,
  getEffectivePrice,
  uncancelMembership,
  verifyWebhookSignature,
} from "whop-kit/whop";

export type {
  AuthorizationUrlResult,
  TokenResponse,
  WhopUser,
  AccessCheckResult,
  WhopPlanDetails,
  WebhookHeaders,
} from "whop-kit/whop";

// ---------------------------------------------------------------------------
// App-specific convenience wrappers (read config from DB/env)
// ---------------------------------------------------------------------------

import {
  checkWhopAccess as _checkWhopAccess,
  fetchWhopPlanDetails as _fetchWhopPlanDetails,
  getEffectivePrice,
} from "whop-kit/whop";
import { getConfig, setConfig } from "./config";
import {
  type PlanKey,
  planPriceConfigKey,
  planPriceConfigKeyYearly,
} from "./constants";

/**
 * Convenience wrapper that reads the API key from config.
 * Returns false if API key is not configured.
 */
export async function hasWhopAccess(
  whopUserId: string,
  resourceId: string,
): Promise<{ hasAccess: boolean; accessLevel: string }> {
  const apiKey = await getConfig("whop_api_key");
  if (!apiKey) {
    console.warn("[Whop] API key not configured; cannot verify access");
    return { hasAccess: false, accessLevel: "no_access" };
  }
  return _checkWhopAccess(whopUserId, resourceId, apiKey);
}

/**
 * Convenience wrapper that reads the API key from config.
 */
export async function getWhopPlanDetails(
  planId: string,
): Promise<import("whop-kit/whop").WhopPlanDetails | null> {
  const apiKey = await getConfig("whop_api_key");
  if (!apiKey) return null;
  return _fetchWhopPlanDetails(planId, apiKey);
}

/**
 * Fetch a Whop plan's price and store it in SystemConfig.
 * Returns the fetched price or null if fetch failed.
 */
export async function syncWhopPlanPrice(
  planKey: PlanKey,
  interval: "monthly" | "yearly",
  whopPlanId: string,
): Promise<number | null> {
  const details = await getWhopPlanDetails(whopPlanId);
  if (!details) return null;

  const price = getEffectivePrice(details);

  const configKey = interval === "yearly"
    ? planPriceConfigKeyYearly(planKey)
    : planPriceConfigKey(planKey);

  await setConfig(configKey, String(price));
  return price;
}
