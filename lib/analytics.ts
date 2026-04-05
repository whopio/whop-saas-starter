// ---------------------------------------------------------------------------
// Analytics — app-specific wrapper around whop-kit/analytics
// ---------------------------------------------------------------------------

import {
  getAnalyticsScript as _getAnalyticsScript,
} from "whop-kit/analytics";
import type { AnalyticsProvider, AnalyticsConfig } from "whop-kit/analytics";
import { getConfig } from "./config";

export type { AnalyticsProvider, AnalyticsConfig };

/**
 * Get the configured analytics provider and tracking ID.
 * Returns null if no analytics is configured.
 */
export async function getAnalyticsConfig(): Promise<AnalyticsConfig | null> {
  const [provider, id] = await Promise.all([
    getConfig("analytics_provider"),
    getConfig("analytics_id"),
  ]);

  if (!provider || !id) return null;
  return { provider: provider as AnalyticsProvider, id };
}

/**
 * Generate the analytics script HTML for the configured provider.
 * Reads config from DB/env automatically.
 */
export async function getAnalyticsScript(): Promise<string | null> {
  const config = await getAnalyticsConfig();
  if (!config) return null;
  return _getAnalyticsScript(config);
}
