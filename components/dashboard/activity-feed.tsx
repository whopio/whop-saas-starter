/**
 * Activity Feed — shows real user events from the database.
 *
 * Events are logged from auth callbacks (sign_in, account),
 * webhook handlers (plan_change), and settings endpoints (setting).
 */

import { getRecentActivity } from "@/lib/activity";

type ActivityType = "sign_in" | "plan_change" | "setting" | "account";

interface Activity {
  type: ActivityType;
  description: string;
  /** ISO 8601 string — safe to pass across server/client boundary */
  timestamp: string;
}

export async function ActivityFeed({ userId }: { userId: string }) {
  const events = await getRecentActivity(userId);

  const activities: Activity[] = events.map((e) => ({
    type: e.type as ActivityType,
    description: e.description,
    timestamp: e.createdAt.toISOString(),
  }));

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold">Recent Activity</h2>
        <p className="mt-3 text-xs text-[var(--muted)]">
          No activity yet. Events will appear here as you use the app.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-sm font-semibold">Recent Activity</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Your latest account events.
      </p>

      <div className="mt-5 space-y-0">
        {activities.map((activity, i) => (
          <div
            key={`${activity.type}-${i}`}
            className="flex items-start gap-3 py-3 border-t border-[var(--border)] first:border-t-0 first:pt-0 last:pb-0"
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconStyle(activity.type)}`}
            >
              <ActivityIcon type={activity.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{activity.description}</p>
              <RelativeTime iso={activity.timestamp} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="h-4 w-28 rounded bg-[var(--surface)] animate-pulse" />
      <div className="mt-1.5 h-3 w-40 rounded bg-[var(--surface)] animate-pulse" />
      <div className="mt-5 space-y-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 py-3 border-t border-[var(--border)] first:border-t-0 first:pt-0 last:pb-0"
          >
            <div className="h-7 w-7 shrink-0 rounded-lg bg-[var(--surface)] animate-pulse" />
            <div className="flex-1">
              <div className="h-3.5 w-36 rounded bg-[var(--surface)] animate-pulse" />
              <div className="mt-1.5 h-3 w-20 rounded bg-[var(--surface)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Client component for hydration-safe relative timestamps ── */

import { RelativeTime } from "./relative-time";

/* ── Helpers ─────────────────────────────────────────────── */

function iconStyle(type: ActivityType): string {
  switch (type) {
    case "sign_in":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "plan_change":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "setting":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "account":
      return "bg-[var(--accent)]/10 text-[var(--accent)]";
  }
}

function ActivityIcon({ type }: { type: ActivityType }) {
  switch (type) {
    case "sign_in":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      );
    case "plan_change":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case "setting":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "account":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
  }
}

