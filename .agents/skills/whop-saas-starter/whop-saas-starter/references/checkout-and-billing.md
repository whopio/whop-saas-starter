# Checkout & Billing

## Checkout Flow

Two-step embedded checkout:

```
/pricing → click plan → /checkout?plan={key}&interval={monthly|yearly}
  → Step 1: Billing form (email, name, address)
  → Step 2: Whop embedded payment (via @whop/checkout)
  → /checkout/success?plan={key}
```

The `CheckoutForm` component (`components/checkout/checkout-form.tsx`) handles both steps.

### Key implementation details:
- Pre-fills email/name for logged-in users
- Billing address passed to Whop via `checkoutControlsRef.current?.setAddress()`
- Theme-aware: detects dark mode via `MutationObserver` on html class
- `skipRedirect: true` — handles redirect manually to show success page

## Billing Portal

`GET /api/billing/portal` redirects paid users to Whop's self-service billing portal. Free users are redirected to `/pricing`.

## Subscription Cancellation

Users cancel through Whop's billing portal. The webhook `membership_cancel_at_period_end_changed` updates `cancelAtPeriodEnd` on the User model.

### Reactivation:
- `POST /api/billing/uncancel` calls Whop's uncancel API
- `ReactivateBanner` and `ReactivateButton` components handle the UI

## Subscription Helpers

Located in `lib/subscription.ts`:

```tsx
// Typed subscription lookup
const details = await getSubscriptionDetails(userId);
// { hasSubscription: true, subscription: { plan, whopMembershipId, cancelAtPeriodEnd, status } }

// Boolean checks
const subscribed = await isUserSubscribed(userId);
const status = await getUserSubscriptionStatus(userId); // "active" | "canceling" | "free"
```

## Real-Time Access Checks

For authoritative gating (beyond JWT-based plan checks):

```tsx
import { hasWhopAccess } from "@/lib/whop";

const hasAccess = await hasWhopAccess(whopUserId, productId);
// Calls Whop API directly — use for sensitive operations
```

## Whop Docs

| Topic | Link |
|-------|------|
| Embedded checkout (`@whop/checkout`) | https://docs.whop.com/payments/checkout-embed |
| Pre-filled embedded checkout | https://docs.whop.com/third-party-integrations/embedded-checkouts/prefill-embedded-checkouts |
| Billing portal | https://docs.whop.com/payments-and-billing/manage-billing/billing-portal |
| Uncancel membership API | https://docs.whop.com/api-reference/memberships/uncancel-membership |
| Cancel membership API | https://docs.whop.com/api-reference/memberships/cancel-membership |
| Set up pricing | https://docs.whop.com/manage-your-business/payment-processing/set-up-pricing |
| Create a plan (API) | https://docs.whop.com/api-reference/plans/create-plan |

This template uses `WhopCheckoutEmbed` and `useCheckoutEmbedControls` from `@whop/checkout/react` for the embedded payment step.
