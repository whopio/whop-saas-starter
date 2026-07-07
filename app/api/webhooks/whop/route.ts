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
import { logActivityByWhopId } from "@/lib/activity";

/**
 * POST /api/webhooks/whop
 *
 * Handles Whop webhook events for subscription management.
 * Uses createWebhookHandler from whop-kit for signature verification
 * and declarative event routing. Handler keys use the dotted event names
 * from the current Whop docs; whop-kit normalizes separators, so older
 * webhooks whose payload api_version sends "membership_activated" still
 * route correctly.
 *
 * Events handled:
 * - membership.activated                     → Activate subscription (upgrade user plan)
 * - membership.deactivated                   → Deactivate subscription (downgrade to free)
 * - membership.cancel_at_period_end_changed  → Track pending cancellation
 * - payment.succeeded                        → Log successful payment
 * - payment.failed                           → Log failed payment, send email
 * - refund.created                           → Downgrade user on refund
 * - dispute.created                          → Downgrade user on chargeback
 */

type Payload = Record<string, unknown>;

/** Extract an ID that may be a flat string or a nested { id } object. */
function idOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return undefined;
}

/** Whop user ID from a webhook payload. Field shapes vary with the webhook's
 *  payload api_version: older versions send flat ids (user_id), newer ones
 *  nest objects (user.id). Refund/dispute payloads nest the user inside the
 *  originating payment. */
function whopUserIdFrom(data: Payload): string | undefined {
  const payment = data.payment as Payload | undefined;
  const membership = data.membership as Payload | undefined;
  return (
    idOf(data.user_id) ??
    idOf(data.user) ??
    (payment && (idOf(payment.user_id) ?? idOf(payment.user))) ??
    (membership && (idOf(membership.user_id) ?? idOf(membership.user))) ??
    undefined
  );
}

/** Whop plan ID from a webhook payload (flat plan_id or nested plan.id). */
function planIdFrom(data: Payload): string | undefined {
  return idOf(data.plan_id) ?? idOf(data.plan);
}
export async function POST(request: NextRequest) {
  const webhookSecret = await getConfig("whop_webhook_secret");
  if (!webhookSecret) {
    console.error("[Webhook] Webhook secret not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const handle = createWebhookHandler({
    secret: webhookSecret,
    on: {
      "membership.activated": async (data) => {
        const userId = whopUserIdFrom(data);
        const planId = planIdFrom(data);
        const id = idOf(data.id);
        if (!userId || !planId) return;
        const plan = await getPlanKeyFromWhopId(planId);
        await activateMembership(userId, plan, id ?? null);
        await logActivityByWhopId(userId, "plan_change", `Upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`);
        console.log(`[Webhook] User ${userId} upgraded to ${plan}`);
      },

      "membership.deactivated": async (data) => {
        const userId = whopUserIdFrom(data);
        if (!userId) return;
        await deactivateMembership(userId);
        await logActivityByWhopId(userId, "plan_change", "Subscription ended");
        console.log(`[Webhook] User ${userId} downgraded to free`);
      },

      "membership.cancel_at_period_end_changed": async (data) => {
        const userId = whopUserIdFrom(data);
        if (!userId) return;
        const value = (data.cancel_at_period_end as boolean) ?? false;
        await updateCancelAtPeriodEnd(userId, value);
        await logActivityByWhopId(
          userId,
          "plan_change",
          value ? "Scheduled subscription cancellation" : "Reactivated subscription",
        );
        console.log(`[Webhook] User ${userId} cancel_at_period_end → ${value}`);
      },

      "payment.succeeded": async (data) => {
        console.log("[Webhook] Payment succeeded:", data);
      },

      "payment.failed": async (data) => {
        console.log("[Webhook] Payment failed:", data);
        const failedUserId = whopUserIdFrom(data);
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

      "refund.created": async (data) => {
        const userId = whopUserIdFrom(data);
        if (!userId) return;
        await deactivateMembership(userId);
        console.log(`[Webhook] User ${userId} downgraded to free (refund)`);
      },

      "dispute.created": async (data) => {
        const userId = whopUserIdFrom(data);
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
