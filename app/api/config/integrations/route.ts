import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { setConfig, getConfig } from "@/lib/config";
import { logActivity } from "@/lib/activity";

/** Valid integration config keys that can be set via this endpoint */
const INTEGRATION_KEYS = new Set([
  "analytics_provider",
  "analytics_id",
  "email_provider",
  "email_api_key",
  "email_from_address",
]);

/** Keys that are safe to return in full (not secrets) */
const SAFE_KEYS = new Set(["analytics_provider", "email_provider", "email_from_address"]);

/** Mask a secret value — fixed mask to avoid leaking length or suffix */
function maskSecret(value: string): string {
  return value ? "••••••••" : "";
}

/** GET /api/config/integrations — Get integration status (admin only) */
export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = Array.from(INTEGRATION_KEYS);
  const values = await Promise.all(keys.map((key) => getConfig(key)));

  const result: Record<string, string | null> = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = values[i];
    if (!value) {
      result[key] = null;
    } else if (SAFE_KEYS.has(key)) {
      result[key] = value;
    } else {
      result[key] = maskSecret(value);
    }
  }

  return NextResponse.json(result);
}

/** POST /api/config/integrations — Save integration config (admin only) */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only save allowed keys with sane length limits (parallel writes)
  const MAX_VALUE_LENGTH = 500;
  await Promise.all(
    Object.entries(body)
      .filter(([key, value]) =>
        INTEGRATION_KEYS.has(key) &&
        typeof value === "string" &&
        value.length <= MAX_VALUE_LENGTH &&
        !value.startsWith("••")
      )
      .map(([key, value]) => setConfig(key, value))
  );

  revalidatePath("/", "layout");
  after(() => logActivity(session.userId, "setting", "Updated integrations"));
  return NextResponse.json({ saved: true });
}
