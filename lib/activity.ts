// ---------------------------------------------------------------------------
// Activity logging — records user events for the dashboard feed
// ---------------------------------------------------------------------------

import { prisma } from "@/db";

export type ActivityType = "sign_in" | "plan_change" | "setting" | "account";

/** Only keep the most recent N events per user */
const MAX_EVENTS = 5;

/**
 * Log an activity event for a user (by internal user ID).
 * Automatically prunes old events beyond MAX_EVENTS.
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

    // Prune old events — keep only the most recent MAX_EVENTS
    const cutoff = await prisma.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: MAX_EVENTS,
      take: 1,
      select: { createdAt: true },
    });
    if (cutoff.length > 0) {
      await prisma.activityEvent.deleteMany({
        where: { userId, createdAt: { lte: cutoff[0].createdAt } },
      });
    }
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
export async function getRecentActivity(userId: string, limit = MAX_EVENTS) {
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
