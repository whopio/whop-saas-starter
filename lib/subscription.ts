// ---------------------------------------------------------------------------
// Subscription query helpers — powered by whop-kit
// ---------------------------------------------------------------------------
// Creates subscription helpers bound to the Prisma DB adapter.
// Re-exports everything so existing imports keep working.
// ---------------------------------------------------------------------------

import { createSubscriptionHelpers } from "whop-kit/subscriptions";
import { prisma } from "@/db";
import { prismaDbAdapter } from "./adapters/prisma";
import { DEFAULT_PLAN, PLAN_KEYS } from "./constants";

// Re-export types from whop-kit
export type {
  SubscriptionStatus,
  SubscriptionDetails,
  SubscriptionDetailsResult,
} from "whop-kit/subscriptions";

// Create helpers bound to our Prisma adapter and plan config
const helpers = createSubscriptionHelpers(
  prismaDbAdapter(prisma),
  DEFAULT_PLAN,
  PLAN_KEYS,
);

// Re-export all helpers as named functions (same API as before)
export const getSubscriptionDetails = helpers.getSubscriptionDetails;
export const isUserSubscribed = helpers.isUserSubscribed;
export const getUserSubscriptionStatus = helpers.getUserSubscriptionStatus;
export const getUserCreatedAt = helpers.getUserCreatedAt;
export const getUserForNotification = helpers.getUserForNotification;
export const activateMembership = helpers.activateMembership;
export const deactivateMembership = helpers.deactivateMembership;
export const updateCancelAtPeriodEnd = helpers.updateCancelAtPeriodEnd;
export const uncancelSubscription = helpers.uncancelSubscription;
