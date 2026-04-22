// ---------------------------------------------------------------------------
// Activity logging — records user events for the dashboard feed
// ---------------------------------------------------------------------------

import { prisma } from "@/db";

export type ActivityType = "sign_in" | "plan_change" | "setting" | "account";

/**
 * Log an activity event for a user (by internal user ID).
 * Silently catches errors so it never breaks the calling flow.
 */
export async function logActivity(
  userId: string,
  type: ActivityType,
  description: string,
): Promise<void> {
  try {
    await prisma.activityEvent.create({
      data: { userId, type, description },
    });
  } catch (err) {
    console.error("[Activity] Failed to log:", err);
  }
}

/**
 * Log an activity event for a user (by Whop user ID).
 * Looks up the internal user first. Used in webhook handlers
 * where only the Whop ID is available.
 */
export async function logActivityByWhopId(
  whopUserId: string,
  type: ActivityType,
  description: string,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { whopUserId },
      select: { id: true },
    });
    if (!user) return;
    await logActivity(user.id, type, description);
  } catch (err) {
    console.error("[Activity] Failed to log:", err);
  }
}

/**
 * Fetch recent activity events for a user.
 * Returns newest-first, limited to `limit` entries.
 */
export async function getRecentActivity(userId: string, limit = 10) {
  return prisma.activityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      type: true,
      description: true,
      createdAt: true,
    },
  });
}
