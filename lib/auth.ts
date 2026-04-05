// ---------------------------------------------------------------------------
// Auth — Next.js session management, powered by whop-kit
// ---------------------------------------------------------------------------
// Uses whop-kit/auth for JWT creation/verification and cookie management.
// Next.js-specific wrappers (React.cache, redirect) live here.
// ---------------------------------------------------------------------------

import { cache } from "react";
import { redirect } from "next/navigation";
import {
  createSessionToken as _createSessionToken,
  verifySessionToken as _verifySessionToken,
  setSessionCookie as _setSessionCookie,
  clearSessionCookie as _clearSessionCookie,
  getSessionFromCookie,
  generateSecret,
  encodeSecret,
} from "whop-kit/auth";
import type { Session as BaseSession } from "whop-kit/auth";
import { nextCookieAdapter } from "./adapters/next";
import { prisma } from "@/db";
import { PLAN_KEYS, PLAN_RANK, DEFAULT_PLAN, type PlanKey } from "./constants";

// App-specific Session type that narrows `plan` to our PlanKey union
export interface Session extends Omit<BaseSession, "plan"> {
  plan: PlanKey;
}

// ---------------------------------------------------------------------------
// Secret management
// ---------------------------------------------------------------------------

let cachedSecret: Uint8Array | null = null;

async function getSecret(): Promise<Uint8Array> {
  if (cachedSecret) return cachedSecret;

  // 1. Prefer explicit env var
  const envSecret = process.env.SESSION_SECRET;
  if (envSecret) {
    cachedSecret = encodeSecret(envSecret);
    return cachedSecret;
  }

  // 2. Read or create a persistent secret in the database
  const existing = await prisma.systemConfig.findUnique({
    where: { key: "session_secret" },
  });

  if (existing) {
    cachedSecret = encodeSecret(existing.value);
    return cachedSecret;
  }

  // Generate a cryptographically secure secret
  const generated = generateSecret();

  try {
    await prisma.systemConfig.create({
      data: { key: "session_secret", value: generated },
    });
  } catch {
    // Race condition: another instance created it first — read theirs
    const raced = await prisma.systemConfig.findUnique({
      where: { key: "session_secret" },
    });
    if (raced) {
      cachedSecret = encodeSecret(raced.value);
      return cachedSecret;
    }
  }

  cachedSecret = encodeSecret(generated);
  return cachedSecret;
}

// ---------------------------------------------------------------------------
// JWT helpers (thin wrappers that resolve the secret)
// ---------------------------------------------------------------------------

export async function createSessionToken(session: Session): Promise<string> {
  const secret = await getSecret();
  return _createSessionToken(session, secret);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  const secret = await getSecret();
  // Safe cast: _verifySessionToken validates plan against PLAN_KEYS
  return _verifySessionToken(token, secret, PLAN_KEYS, DEFAULT_PLAN) as Promise<Session | null>;
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const isProduction = process.env.NODE_ENV === "production";

export async function setSessionCookie(session: Session): Promise<void> {
  const secret = await getSecret();
  return _setSessionCookie(session, secret, nextCookieAdapter(), isProduction);
}

export async function clearSessionCookie(): Promise<void> {
  return _clearSessionCookie(nextCookieAdapter(), isProduction);
}

// ---------------------------------------------------------------------------
// Session retrieval
// ---------------------------------------------------------------------------

/**
 * Get the current session, or null if not authenticated.
 * The JWT carries identity; the plan is always read fresh from the DB.
 * Wrapped with React.cache() so multiple calls per request hit the DB once.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const secret = await getSecret();
  const base = await getSessionFromCookie(
    nextCookieAdapter(),
    secret,
    PLAN_KEYS,
    DEFAULT_PLAN,
    async (userId) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, cancelAtPeriodEnd: true },
      });
      if (!user) return null;
      return { plan: user.plan, cancelAtPeriodEnd: user.cancelAtPeriodEnd };
    },
  );
  // Safe cast: getSessionFromCookie validates plan against PLAN_KEYS
  return base as Session | null;
});

/**
 * Require an authenticated session. Redirects to login if not authenticated.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Plan gating
// ---------------------------------------------------------------------------

/**
 * Check if a user's plan meets or exceeds a minimum plan level.
 * Pure function — no DB or async needed.
 */
export function hasMinimumPlan(userPlan: PlanKey, minimumPlan: PlanKey): boolean {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[minimumPlan] ?? 0);
}

/**
 * Require a minimum plan level. Redirects to /pricing if insufficient.
 */
export async function requirePlan(
  minimumPlan: PlanKey,
  redirectTo = "/pricing"
): Promise<Session> {
  const session = await requireSession();
  if (!hasMinimumPlan(session.plan, minimumPlan)) {
    redirect(redirectTo);
  }
  return session;
}
