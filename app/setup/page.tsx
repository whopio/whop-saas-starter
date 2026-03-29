import { redirect } from "next/navigation";
import { getConfig } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { prisma } from "@/db";
import { PLAN_KEYS, planConfigKey, planConfigKeyYearly, planNameConfigKey } from "@/lib/constants";
import { SetupWizard, type DbStatus } from "@/components/setup/setup-wizard";

export const dynamic = "force-dynamic";

/** Check database connectivity and schema readiness. */
async function checkDatabase(): Promise<DbStatus> {
  const hasUrl = !!(process.env.DATABASE_URL || process.env.NILEDB_POSTGRES_URL);
  if (!hasUrl) return "no_url";

  try {
    // Check connectivity with a simple query
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    return "connection_failed";
  }

  try {
    // Check that the schema has been pushed (SystemConfig table exists)
    await prisma.systemConfig.findFirst();
  } catch {
    return "schema_missing";
  }

  return "connected";
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  // Check database health first — if it's not ready, the wizard needs to
  // show the database setup step before anything else.
  const dbStatus = await checkDatabase();

  // Only redirect away from setup when it's explicitly marked complete.
  // Don't use isSetupComplete() here — it returns true as soon as whop_app_id
  // exists, which would kick users out mid-wizard (e.g. after the OAuth step).
  const setupComplete = dbStatus === "connected"
    ? await getConfig("setup_complete")
    : null;
  if (setupComplete === "true") {
    redirect("/");
  }

  // Fetch session, search params, and existing config in parallel
  // (only query config if DB is healthy — otherwise these would all be null anyway)
  const [session, params, whopAppId, ...planConfigValues] = await Promise.all([
    getSession(),
    searchParams,
    dbStatus === "connected" ? getConfig("whop_app_id") : Promise.resolve(null),
    ...PLAN_KEYS.flatMap((key) => [
      dbStatus === "connected" ? getConfig(planConfigKey(key)) : Promise.resolve(null),
      dbStatus === "connected" ? getConfig(planConfigKeyYearly(key)) : Promise.resolve(null),
      dbStatus === "connected" ? getConfig(planNameConfigKey(key)) : Promise.resolve(null),
    ]),
  ]);

  // Reconstruct plan IDs and names from flat array
  const initialPlanIds: Record<string, string> = {};
  const initialPlanNames: Record<string, string> = {};
  let idx = 0;
  for (const key of PLAN_KEYS) {
    const monthly = planConfigValues[idx++];
    const yearly = planConfigValues[idx++];
    const name = planConfigValues[idx++];
    if (monthly) initialPlanIds[planConfigKey(key)] = monthly;
    if (yearly) initialPlanIds[planConfigKeyYearly(key)] = yearly;
    if (name) initialPlanNames[planNameConfigKey(key)] = name;
  }

  const initialStep = params.step ? parseInt(params.step, 10) : undefined;

  // Construct repo URL from Vercel's auto-set git env vars (available on Vercel deployments)
  const repoOwner = process.env.VERCEL_GIT_REPO_OWNER;
  const repoSlug = process.env.VERCEL_GIT_REPO_SLUG;
  const repoUrl = repoOwner && repoSlug
    ? `https://github.com/${repoOwner}/${repoSlug}`
    : null;

  return (
    <SetupWizard
      initialStep={initialStep}
      isSignedIn={!!session}
      isAdmin={session?.isAdmin ?? false}
      repoUrl={repoUrl}
      dbStatus={dbStatus}
      isVercel={!!process.env.VERCEL}
      initialConfig={{
        whopAppId: whopAppId ?? "",
        planIds: initialPlanIds,
        planNames: initialPlanNames,
      }}
    />
  );
}
