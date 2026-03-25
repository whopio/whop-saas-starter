import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getConfig, getSetupStatus, setConfigs } from "@/lib/config";
import { PLAN_KEYS, getPlanBillingIntervals, planConfigKey, planConfigKeyYearly } from "@/lib/constants";

const ALLOWED_KEYS = new Set([
  "whop_app_id",
  "whop_api_key",
  "whop_webhook_secret",
  ...PLAN_KEYS.flatMap((key) => {
    const keys = [planConfigKey(key)];
    if (getPlanBillingIntervals(key).includes("yearly")) {
      keys.push(planConfigKeyYearly(key));
    }
    return keys;
  }),
  "accent_color",
]);

/**
 * GET /api/setup — Returns current setup status.
 * Open during setup wizard; admin-only after explicit completion.
 *
 * Uses setup_complete flag directly (not isSetupComplete()) so that
 * saving whop_app_id mid-wizard doesn't lock out subsequent steps.
 */
export async function GET() {
  const setupDone = (await getConfig("setup_complete")) === "true";

  if (setupDone) {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const status = await getSetupStatus();
  return NextResponse.json(status);
}

/**
 * POST /api/setup — Save config values.
 * Body: { configs: Record<string, string> }
 * Open before setup is complete; admin-only after.
 */
export async function POST(request: Request) {
  // CSRF check: verify the request originated from our own site
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const setupDone = (await getConfig("setup_complete")) === "true";

  if (setupDone) {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: { configs?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.configs || typeof body.configs !== "object") {
    return NextResponse.json(
      { error: 'Expected { configs: Record<string, string> }' },
      { status: 400 }
    );
  }

  // Filter to only allowed keys with sane length limits
  const MAX_VALUE_LENGTH = 500;
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.configs)) {
    if (ALLOWED_KEYS.has(key) && typeof value === "string" && value.length <= MAX_VALUE_LENGTH) {
      filtered[key] = value;
    }
  }

  await setConfigs(filtered);

  // Revalidate static pricing pages when plan-affecting config changes
  const planKeys = new Set(
    PLAN_KEYS.flatMap((key) => {
      const keys = [planConfigKey(key)];
      if (getPlanBillingIntervals(key).includes("yearly")) {
        keys.push(planConfigKeyYearly(key));
      }
      return keys;
    })
  );
  const affectsPricing = Object.keys(filtered).some((k) => planKeys.has(k));
  if (affectsPricing) {
    after(() => {
      revalidatePath("/");
      revalidatePath("/pricing");
    });
  }

  return NextResponse.json({ saved: true });
}
