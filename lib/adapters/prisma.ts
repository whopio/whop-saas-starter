// ---------------------------------------------------------------------------
// Prisma adapters for whop-kit interfaces
// ---------------------------------------------------------------------------

import type { PrismaClient } from "@prisma/client";
import type { ConfigStore } from "whop-kit/config";
import type { DbAdapter } from "whop-kit/subscriptions";

/**
 * Create a ConfigStore backed by Prisma's SystemConfig table.
 */
export function prismaConfigStore(prisma: PrismaClient): ConfigStore {
  return {
    async get(key: string) {
      const row = await prisma.systemConfig.findUnique({ where: { key } });
      return row?.value ?? null;
    },
    async set(key: string, value: string) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    },
  };
}

/**
 * Create a DbAdapter backed by Prisma's User model.
 */
export function prismaDbAdapter(prisma: PrismaClient): DbAdapter {
  return {
    async findUserById(id: string) {
      return prisma.user.findUnique({
        where: { id },
        select: { plan: true, whopMembershipId: true, cancelAtPeriodEnd: true },
      });
    },

    async findUserByWhopId(whopUserId: string) {
      return prisma.user.findUnique({
        where: { whopUserId },
        select: { email: true, name: true },
      });
    },

    async getUserCreatedAt(id: string) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { createdAt: true },
      });
      return user?.createdAt ?? null;
    },

    async upsertMembership(whopUserId, plan, membershipId) {
      await prisma.user.upsert({
        where: { whopUserId },
        update: {
          plan,
          whopMembershipId: membershipId,
          cancelAtPeriodEnd: false,
        },
        create: {
          whopUserId,
          plan,
          whopMembershipId: membershipId,
        },
      });
    },

    async deactivateMembership(whopUserId, defaultPlan) {
      await prisma.user.updateMany({
        where: { whopUserId },
        data: {
          plan: defaultPlan,
          whopMembershipId: null,
          cancelAtPeriodEnd: false,
        },
      });
    },

    async updateCancelAtPeriodEnd(whopUserId, cancelAtPeriodEnd) {
      await prisma.user.updateMany({
        where: { whopUserId },
        data: { cancelAtPeriodEnd },
      });
    },

    async uncancelSubscription(userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { cancelAtPeriodEnd: false },
      });
    },
  };
}
