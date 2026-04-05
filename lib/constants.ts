// ---------------------------------------------------------------------------
// App configuration — edit these to customize your SaaS
// ---------------------------------------------------------------------------

import { definePlans } from "whop-kit/core";
export type { BillingInterval, PlanMetadataEntry } from "whop-kit/core";

/** Your app's name — shown in the header, sidebar, login page, and metadata */
export const APP_NAME = "Whop SaaS Starter";

/** Your app's description — used in metadata and the landing page */
export const APP_DESCRIPTION =
  "A modern SaaS starter built with Next.js and Whop";

/** External links — update these before launching */
export const LINKS = {
  github: "https://github.com/whopio/whop-saas-starter",
  terms: "/terms",
  privacy: "/privacy",
} as const;

// ---------------------------------------------------------------------------
// Plan definitions — the single source of truth for your tier structure
// ---------------------------------------------------------------------------

/**
 * Static plan metadata — powered by whop-kit's definePlans().
 *
 * - Add, remove, or reorder plans here. Everything else adapts automatically.
 * - Key order defines the plan hierarchy (first = lowest, last = highest).
 * - Dynamic Whop plan IDs come from the DB/env via lib/config.ts.
 * - Prices are synced from the Whop API (set to 0 here as defaults).
 * - trialDays is display-only; configure the actual trial in your Whop Dashboard.
 */
export const plans = definePlans({
  free: {
    name: "Free",
    description: "Get started with the basics",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1 GB storage",
    ],
    highlighted: false,
  },
  starter: {
    name: "Starter",
    description: "For growing teams and businesses",
    priceMonthly: 0, // Real price synced from Whop API
    priceYearly: 0,
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "100 GB storage",
      "Custom integrations",
      "Team collaboration",
    ],
    highlighted: true,
  },
  pro: {
    name: "Pro",
    description: "For power users and larger teams",
    priceMonthly: 0, // Real price synced from Whop API
    priceYearly: 0,
    features: [
      "Everything in Starter",
      "Unlimited storage",
      "Dedicated support",
      "Custom SLA",
      "SSO & advanced security",
      "Audit logs",
      "API access",
    ],
    highlighted: false,
  },
});

// ---------------------------------------------------------------------------
// Backwards-compatible exports — derived from the plan system
// Everything below is auto-derived so existing imports keep working.
// ---------------------------------------------------------------------------

export const PLAN_METADATA = plans.metadata;
export type PlanKey = keyof typeof PLAN_METADATA;
export const PLAN_KEYS = plans.keys;
export const PLAN_RANK = plans.ranks as Record<string, number>;
export const DEFAULT_PLAN = plans.defaultPlan;

export const getPlanBillingIntervals = plans.getBillingIntervals;
export const planConfigKey = plans.configKey;
export const planConfigKeyYearly = plans.configKeyYearly;
export const planPriceConfigKey = plans.priceConfigKey;
export const planPriceConfigKeyYearly = plans.priceConfigKeyYearly;
export const planNameConfigKey = plans.nameConfigKey;

// Env var naming convention: NEXT_PUBLIC_WHOP_{PLAN_KEY}_PLAN_ID
export function planEnvVar(planKey: PlanKey): string {
  return `NEXT_PUBLIC_WHOP_${planKey.toUpperCase()}_PLAN_ID`;
}
export function planEnvVarYearly(planKey: PlanKey): string {
  return `NEXT_PUBLIC_WHOP_${planKey.toUpperCase()}_PLAN_ID_YEARLY`;
}
