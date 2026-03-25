// ---------------------------------------------------------------------------
// App configuration — edit these to customize your SaaS
// ---------------------------------------------------------------------------

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
// Plan types and static metadata
// ---------------------------------------------------------------------------

export type BillingInterval = "monthly" | "yearly";

/** Shape of each plan entry in PLAN_METADATA */
export interface PlanMetadataEntry {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: readonly string[];
  highlighted: boolean;
  /** Optional free trial length (display only — configure the actual trial in Whop) */
  trialDays?: number;
  /** Which billing intervals to offer. Defaults to ["monthly", "yearly"] if omitted. */
  billingIntervals?: readonly BillingInterval[];
}

/**
 * Static plan metadata — the single source of truth for your tier structure.
 *
 * - Add, remove, or reorder plans here. Everything else adapts automatically.
 * - Key order defines the plan hierarchy (first = lowest, last = highest).
 * - Dynamic Whop plan IDs come from the DB/env via lib/config.ts.
 * - Prices are synced from the Whop API (set to 0 here as defaults).
 *   getPlansConfig() auto-syncs when plan IDs exist but prices are missing.
 * - trialDays is display-only; configure the actual trial in your Whop Dashboard.
 */
export const PLAN_METADATA = {
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
} as const satisfies Record<string, PlanMetadataEntry>;

// ---------------------------------------------------------------------------
// Derived types and helpers — everything below is auto-generated from above
// ---------------------------------------------------------------------------

/** Plan key type — derived from whatever keys are in PLAN_METADATA */
export type PlanKey = keyof typeof PLAN_METADATA;

/** Ordered array of plan keys (insertion order = hierarchy) */
export const PLAN_KEYS = Object.keys(PLAN_METADATA) as PlanKey[];

/** Numeric rank for each plan (used for plan gating comparisons) */
export const PLAN_RANK: Record<string, number> = Object.fromEntries(
  PLAN_KEYS.map((key, index) => [key, index])
);

/** The lowest-tier plan key (first in PLAN_METADATA). Also the Prisma default. */
export const DEFAULT_PLAN: PlanKey = PLAN_KEYS[0];

/** Get the billing intervals a plan supports */
export function getPlanBillingIntervals(key: PlanKey): BillingInterval[] {
  const meta: PlanMetadataEntry = PLAN_METADATA[key];
  return [...(meta.billingIntervals ?? ["monthly", "yearly"])];
}

// Config key naming convention: whop_{planKey}_plan_id / whop_{planKey}_plan_id_yearly
export function planConfigKey(planKey: PlanKey): string {
  return `whop_${planKey}_plan_id`;
}
export function planConfigKeyYearly(planKey: PlanKey): string {
  return `whop_${planKey}_plan_id_yearly`;
}

// Price config key naming: whop_{planKey}_price_monthly / whop_{planKey}_price_yearly
export function planPriceConfigKey(planKey: PlanKey): string {
  return `whop_${planKey}_price_monthly`;
}
export function planPriceConfigKeyYearly(planKey: PlanKey): string {
  return `whop_${planKey}_price_yearly`;
}

// Plan name config key: plan_{planKey}_name (for admin-customized names)
export function planNameConfigKey(planKey: PlanKey): string {
  return `plan_${planKey}_name`;
}

// Env var naming convention: NEXT_PUBLIC_WHOP_{PLAN_KEY}_PLAN_ID
export function planEnvVar(planKey: PlanKey): string {
  return `NEXT_PUBLIC_WHOP_${planKey.toUpperCase()}_PLAN_ID`;
}
export function planEnvVarYearly(planKey: PlanKey): string {
  return `NEXT_PUBLIC_WHOP_${planKey.toUpperCase()}_PLAN_ID_YEARLY`;
}
