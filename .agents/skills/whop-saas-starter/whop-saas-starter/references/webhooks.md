# Webhook Handling

## How Webhooks Work

Whop sends webhook events to `POST /api/webhooks/whop` using the standardwebhooks format (HMAC-SHA256).

**Verification** is automatic via `verifyWebhookSignature()` in `lib/whop.ts`. Headers checked:
- `webhook-id` — unique event ID
- `webhook-signature` — HMAC signature
- `webhook-timestamp` — event timestamp (5-minute tolerance)

## Currently Handled Events

| Event | Handler | Effect |
|-------|---------|--------|
| `membership_activated` | `activateMembership()` | Sets user plan + membership ID |
| `membership_deactivated` | `deactivateMembership()` | Resets to free plan |
| `membership_cancel_at_period_end_changed` | `updateCancelAtPeriodEnd()` | Updates cancellation flag |

## Adding a New Webhook Event

Edit `app/api/webhooks/whop/route.ts`:

```tsx
switch (event) {
  case "membership_activated":
    // existing...
    break;

  case "your_new_event":
    // Your handler
    const { relevant_field } = body.data;
    await prisma.user.updateMany({
      where: { whopUserId },
      data: { /* ... */ },
    });
    break;
}
```

### Best practices:
- Use `updateMany` (not `update`) to handle edge cases with whopUserId
- Always return 200 even if you don't handle the event (prevents retries)
- Log unknown events for debugging but don't error

## Webhook Write Helpers

Located in `lib/subscription.ts`:

- `activateMembership(whopUserId, plan, membershipId)` — upserts user with plan
- `deactivateMembership(whopUserId)` — resets to DEFAULT_PLAN
- `updateCancelAtPeriodEnd(whopUserId, boolean)` — updates cancellation state

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
