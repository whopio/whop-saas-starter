// ---------------------------------------------------------------------------
// DB-backed configuration system
// ---------------------------------------------------------------------------
// Uses whop-kit's createConfigManager for core read/write with caching.
// Template-specific logic (env map, plan config, setup status) lives here.
// ---------------------------------------------------------------------------

import { cache as reactCache } from "react";
import { createConfigManager } from "whop-kit/config";
import { prisma } from "@/db";
import { prismaConfigStore } from "./adapters/prisma";
import {
  PLAN_METADATA,
  PLAN_KEYS,
  DEFAULT_PLAN,
  getPlanBillingIntervals,
  planConfigKey,
  planConfigKeyYearly,
  planPriceConfigKey,
  planPriceConfigKeyYearly,
  planNameConfigKey,
  planEnvVar,
  planEnvVarYearly,
  type PlanKey,
  type BillingInterval,
} from "./constants";

// ---------------------------------------------------------------------------
// Dynamic plan config key → env var mappings
// ---------------------------------------------------------------------------

const planEnvEntries: Record<string, string> = {};
for (const key of PLAN_KEYS) {
  planEnvEntries[planConfigKey(key)] = planEnvVar(key);
  if (getPlanBillingIntervals(key).includes("yearly")) {
    planEnvEntries[planConfigKeyYearly(key)] = planEnvVarYearly(key);
  }
}

/** Map of our config keys to their env var fallbacks */
const ENV_MAP: Record<string, string> = {
  whop_app_id: "NEXT_PUBLIC_WHOP_APP_ID",
  whop_api_key: "WHOP_API_KEY",
  whop_webhook_secret: "WHOP_WEBHOOK_SECRET",
  ...planEnvEntries,
  whop_starter_product_id: "WHOP_STARTER_PRODUCT_ID",
  whop_pro_product_id: "WHOP_PRO_PRODUCT_ID",
  app_name: "NEXT_PUBLIC_APP_NAME",
  app_url: "NEXT_PUBLIC_APP_URL",
  accent_color: "NEXT_PUBLIC_ACCENT_COLOR",
  analytics_provider: "ANALYTICS_PROVIDER",
  analytics_id: "ANALYTICS_ID",
  email_provider: "EMAIL_PROVIDER",
  email_api_key: "EMAIL_API_KEY",
  email_from_address: "EMAIL_FROM_ADDRESS",
};

/** Non-sensitive keys that can be returned to the client */
const PUBLIC_KEYS = new Set([
  "whop_app_id",
  ...PLAN_KEYS.flatMap((key) => {
    const keys = [planConfigKey(key)];
    if (getPlanBillingIntervals(key).includes("yearly")) {
      keys.push(planConfigKeyYearly(key));
    }
    return keys;
  }),
  ...PLAN_KEYS.flatMap((key) => [planPriceConfigKey(key), planPriceConfigKeyYearly(key), planNameConfigKey(key)]),
  "app_name",
  "app_url",
  "accent_color",
  "setup_complete",
]);

/** All valid config keys */
const VALID_KEYS = new Set([...Object.keys(ENV_MAP), "setup_complete"]);

// Register price and name config keys (DB-only, no env var fallback)
for (const key of PLAN_KEYS) {
  VALID_KEYS.add(planPriceConfigKey(key));
  VALID_KEYS.add(planPriceConfigKeyYearly(key));
  VALID_KEYS.add(planNameConfigKey(key));
}

// ---------------------------------------------------------------------------
// Config manager instance (powered by whop-kit)
// ---------------------------------------------------------------------------

const configManager = createConfigManager({
  store: prismaConfigStore(prisma),
  envMap: ENV_MAP,
});

// ---------------------------------------------------------------------------
// Core read/write (delegates to whop-kit config manager)
// ---------------------------------------------------------------------------

export async function getConfig(key: string): Promise<string | null> {
  return configManager.get(key);
}

export async function setConfig(key: string, value: string): Promise<void> {
  if (!VALID_KEYS.has(key)) throw new Error(`Invalid config key: ${key}`);
  return configManager.set(key, value);
}

/** Bulk set config values */
export async function setConfigs(configs: Record<string, string>): Promise<void> {
  const filtered = Object.fromEntries(
    Object.entries(configs).filter(([key, value]) => !!value && VALID_KEYS.has(key)),
  );
  return configManager.setMany(filtered);
}

/** Get setup status for each config key (true = configured, false = missing) */
export async function getSetupStatus(): Promise<{
  setupComplete: boolean;
  configured: Record<string, boolean>;
  values: Record<string, string>;
}> {
  const keys = Array.from(VALID_KEYS);
  const results = await Promise.all(keys.map((key) => getConfig(key)));

  const configured: Record<string, boolean> = {};
  const values: Record<string, string> = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const val = results[i];
    configured[key] = !!val;
    if (val && PUBLIC_KEYS.has(key)) {
      values[key] = val;
    }
  }

  return {
    setupComplete: configured["setup_complete"] ?? false,
    configured,
    values,
  };
}

// ---------------------------------------------------------------------------
// Setup detection
// ---------------------------------------------------------------------------

export const isSetupComplete = reactCache(async (): Promise<boolean> => {
  const val = await getConfig("setup_complete");
  if (val === "true") return true;

  // Also consider setup complete if whop_app_id is configured via env var
  // (power user who set everything via env vars, no wizard needed)
  const appId = await getConfig("whop_app_id");
  return !!appId;
});

// ---------------------------------------------------------------------------
// Plan config
// ---------------------------------------------------------------------------

export interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  whopPlanId: string;
  whopPlanIdYearly: string;
  features: readonly string[];
  highlighted: boolean;
  trialDays?: number;
  billingIntervals: BillingInterval[];
}

export type PlansConfig = Record<PlanKey, PlanConfig>;

/** Build full plan config by merging static metadata with dynamic plan IDs from DB/env.
 *  Wrapped in React.cache() for per-request deduplication across the component tree.
 *
 *  Auto-sync: if plan IDs are configured but prices have never been synced from the
 *  Whop API, fetches them inline so the current render already has correct prices.
 *  This covers the env-var configuration path where onboarding sync never runs. */
export const getPlansConfig = reactCache(async (): Promise<PlansConfig> => {
  const configs = await Promise.all(
    PLAN_KEYS.map(async (key) => {
      const intervals = getPlanBillingIntervals(key);
      const [monthlyId, yearlyId, dbPriceMonthly, dbPriceYearly, dbName] = await Promise.all([
        getConfig(planConfigKey(key)),
        intervals.includes("yearly")
          ? getConfig(planConfigKeyYearly(key))
          : Promise.resolve(null),
        getConfig(planPriceConfigKey(key)),
        getConfig(planPriceConfigKeyYearly(key)),
        getConfig(planNameConfigKey(key)),
      ]);
      const meta = PLAN_METADATA[key];
      return {
        key,
        monthlyId,
        yearlyId,
        dbPriceMonthly,
        dbPriceYearly,
        config: {
          ...meta,
          // DB values (from onboarding/settings) override PLAN_METADATA defaults
          name: dbName || meta.name,
          priceMonthly: dbPriceMonthly ? parseFloat(dbPriceMonthly) : meta.priceMonthly,
          priceYearly: dbPriceYearly ? parseFloat(dbPriceYearly) : meta.priceYearly,
          billingIntervals: intervals,
          whopPlanId: monthlyId ?? "",
          whopPlanIdYearly: yearlyId ?? monthlyId ?? "",
        } satisfies PlanConfig,
      };
    })
  );

  // Auto-sync: plan IDs exist but prices were never fetched from Whop API
  const needsSync = configs.some(
    ({ monthlyId, dbPriceMonthly }) => monthlyId && dbPriceMonthly === null,
  );
  if (needsSync) {
    try {
      const { syncWhopPlanPrice } = await import("./whop");
      for (const entry of configs) {
        const { monthlyId, yearlyId, dbPriceMonthly, dbPriceYearly, config } = entry;
        if (monthlyId && dbPriceMonthly === null) {
          const price = await syncWhopPlanPrice(entry.key, "monthly", monthlyId);
          if (price !== null) config.priceMonthly = price;
        }
        if (yearlyId && yearlyId !== monthlyId && dbPriceYearly === null) {
          const price = await syncWhopPlanPrice(entry.key, "yearly", yearlyId);
          if (price !== null) config.priceYearly = price;
        }
      }
    } catch {
      // Sync failed (no API key, network error) — prices stay at 0,
      // pricing cards will show "—" for unsynced paid plans.
    }
  }

  const plans = {} as PlansConfig;
  for (const { key, config } of configs) {
    plans[key] = config;
  }
  return plans;
});

/** Get the Whop plan ID for a given plan and billing interval */
export async function getWhopPlanIdFromConfig(
  key: PlanKey,
  interval: BillingInterval
): Promise<string> {
  const plans = await getPlansConfig();
  const plan = plans[key];
  return interval === "yearly" ? plan.whopPlanIdYearly : plan.whopPlanId;
}

/** Map a Whop plan ID back to a plan key */
export async function getPlanKeyFromWhopId(whopPlanId: string): Promise<PlanKey> {
  const plans = await getPlansConfig();
  for (const [key, plan] of Object.entries(plans)) {
    if (plan.whopPlanId === whopPlanId || plan.whopPlanIdYearly === whopPlanId) {
      return key as PlanKey;
    }
  }
  return DEFAULT_PLAN;
}
