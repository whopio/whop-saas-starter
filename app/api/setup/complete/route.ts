import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { setConfig, getConfig } from "@/lib/config";

/**
 * POST /api/setup/complete — Mark setup as done.
 * Requires an authenticated admin session.
 */
export async function POST() {
  // Must be signed in (the OAuth test step ensures this)
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json(
      { error: "You must be signed in as admin to complete setup" },
      { status: 403 }
    );
  }

  const already = await getConfig("setup_complete");
  if (already === "true") {
    return NextResponse.json({ already: true });
  }

  await setConfig("setup_complete", "true");

  // Revalidate statically-rendered pages after the response is sent (non-blocking).
  // The build-time render had no config data, so the static cache needs to be
  // regenerated now that setup is complete.
  after(() => {
    revalidatePath("/");
    revalidatePath("/pricing");
  });

  return NextResponse.json({ complete: true });
}
