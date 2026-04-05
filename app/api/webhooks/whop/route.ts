import { after, NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createWebhookHandler } from "whop-kit/webhooks";
import { getPlanKeyFromWhopId, getConfig } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { paymentFailedEmail } from "@/lib/email-templates";
import {
  activateMembership,
  deactivateMembership,
  updateCancelAtPeriodEnd,
  getUserForNotification,
} from "@/lib/subscription";

/**
 * POST /api/webhooks/whop
 *
 * Handles Whop webhook events for subscription management.
 * Uses createWebhookHandler from whop-kit for signature verification
 * and declarative event routing.
 *
 * Events handled:
 * - membership_activated                     → Activate subscription (upgrade user plan)
 * - membership_deactivated                   → Deactivate subscription (downgrade to free)
 * - membership_cancel_at_period_end_changed  → Track pending cancellation
 * - payment_succeeded                        → Log successful payment
 * - payment_failed                           → Log failed payment, send email
 * - refund_created                           → Downgrade user on refund
 * - dispute_created                          → Downgrade user on chargeback
 */
export async function POST(request: NextRequest) {
  const webhookSecret = await getConfig("whop_webhook_secret");
  if (!webhookSecret) {
    console.error("[Webhook] Webhook secret not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const handle = createWebhookHandler({
    secret: webhookSecret,
    on: {
      membership_activated: async (data) => {
        const userId = data.user_id as string | undefined;
        const planId = data.plan_id as string | undefined;
        const id = data.id as string | undefined;
        if (!userId || !planId) return;
        const plan = await getPlanKeyFromWhopId(planId);
        await activateMembership(userId, plan, id ?? null);
        console.log(`[Webhook] User ${userId} upgraded to ${plan}`);
      },

      membership_deactivated: async (data) => {
        const userId = data.user_id as string | undefined;
        if (!userId) return;
        await deactivateMembership(userId);
        console.log(`[Webhook] User ${userId} downgraded to free`);
      },

      membership_cancel_at_period_end_changed: async (data) => {
        const userId = data.user_id as string | undefined;
        if (!userId) return;
        const value = (data.cancel_at_period_end as boolean) ?? false;
        await updateCancelAtPeriodEnd(userId, value);
        console.log(`[Webhook] User ${userId} cancel_at_period_end → ${value}`);
      },

      payment_succeeded: async (data) => {
        console.log("[Webhook] Payment succeeded:", data);
      },

      payment_failed: async (data) => {
        console.log("[Webhook] Payment failed:", data);
        const failedUserId = data.user_id as string | undefined;
        if (failedUserId) {
          after(async () => {
            const user = await getUserForNotification(failedUserId);
            if (user) {
              const email = paymentFailedEmail(user.name);
              await sendEmail({ to: user.email, ...email }).catch((err) =>
                console.error("[Email] Payment failed email error:", err)
              );
            }
          });
        }
      },

      refund_created: async (data) => {
        const userId = data.user_id as string | undefined;
        if (!userId) return;
        await deactivateMembership(userId);
        console.log(`[Webhook] User ${userId} downgraded to free (refund)`);
      },

      dispute_created: async (data) => {
        const userId = data.user_id as string | undefined;
        if (!userId) return;
        await deactivateMembership(userId);
        console.log(`[Webhook] User ${userId} downgraded to free (dispute)`);
      },
    },
  });

  const body = await request.text();
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);

  const result = await handle(
    body,
    {
      "webhook-id": request.headers.get("webhook-id"),
      "webhook-signature": request.headers.get("webhook-signature"),
      "webhook-timestamp": request.headers.get("webhook-timestamp"),
    },
    contentLength,
  );

  return NextResponse.json(result.body, { status: result.status });
}
