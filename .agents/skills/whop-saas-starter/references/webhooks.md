# Webhook Handling

## How Webhooks Work

Whop sends webhook events to `POST /api/webhooks/whop` using the standardwebhooks format (HMAC-SHA256).

This template uses `createWebhookHandler()` from **whop-kit/webhooks** which handles:
- **Signature verification** — HMAC-SHA256 with constant-time comparison
- **Replay attack prevention** — 5-minute timestamp tolerance
- **JSON parsing** — with proper error handling
- **Payload size guard** — rejects oversized payloads
- **Event routing** — declarative `on: { event_type: handler }` mapping
- **Error handling** — returns 500 on handler errors (triggers Whop retry)

## Currently Handled Events

| Event | Effect |
|-------|--------|
| `membership_activated` | Sets user plan + membership ID |
| `membership_deactivated` | Resets to free plan |
| `membership_cancel_at_period_end_changed` | Updates cancellation flag |
| `payment_succeeded` | Logged |
| `payment_failed` | Logged + sends email notification |
| `refund_created` | Resets to free plan |
| `dispute_created` | Resets to free plan |

## Adding a New Webhook Event

Edit `app/api/webhooks/whop/route.ts` — add a handler to the `on` object inside `createWebhookHandler()`:

```typescript
const handle = createWebhookHandler({
  secret: webhookSecret,
  on: {
    // existing handlers...

    your_new_event: async (data) => {
      const userId = data.user_id as string;
      if (!userId) return;
      // Your handler logic
      console.log(`[Webhook] Handled your_new_event for ${userId}`);
    },
  },
});
```

### Best practices:
- Handlers receive `(data, event)` — `data` is the payload, `event` includes the `type`
- Cast data fields: `data.user_id as string` (whop-kit uses `Record<string, unknown>`)
- Return early if required fields are missing (don't throw)
- Unhandled events automatically return 200 (no retry)
- Handler errors automatically return 500 (triggers Whop retry)

## Subscription Helpers

The webhook handlers use `createSubscriptionHelpers()` from whop-kit/subscriptions, bound to the Prisma DB adapter in `lib/subscription.ts`:

- `activateMembership(whopUserId, plan, membershipId)` — upserts user with plan
- `deactivateMembership(whopUserId)` — resets to DEFAULT_PLAN
- `updateCancelAtPeriodEnd(whopUserId, boolean)` — updates cancellation state
- `getUserForNotification(whopUserId)` — gets email + name for notifications

## Setting Up Webhooks

1. In your Whop app dashboard, add webhook endpoint: `https://yourdomain.com/api/webhooks/whop`
2. Copy the webhook secret
3. Enter in setup wizard or set `WHOP_WEBHOOK_SECRET` env var

## Whop Docs

| Topic | Link |
|-------|------|
| Webhooks guide | https://docs.whop.com/developer/guides/webhooks |
| `membership_activated` event | https://docs.whop.com/api-reference/memberships/membership-activated |
| `membership_deactivated` event | https://docs.whop.com/api-reference/memberships/membership-deactivated |
| `membership_cancel_at_period_end_changed` | https://docs.whop.com/api-reference/memberships/membership-cancel-at-period-end-changed |
| Cancel membership API | https://docs.whop.com/api-reference/memberships/cancel-membership |
| Uncancel membership API | https://docs.whop.com/api-reference/memberships/uncancel-membership |
