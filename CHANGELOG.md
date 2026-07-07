# Changelog

Notable template changes, so projects that have already been scaffolded can
cherry-pick fixes. Once you've cloned this template your copy is yours — there
is no automatic upgrade path, but each entry links the files involved.

## 2026-07-07 (webhook reliability)

- **Webhook handlers now match Whop's current event naming.** Handler keys use
  the dotted names from the Whop docs (`membership.activated`); whop-kit 0.3.2
  normalizes separators so older webhooks that deliver underscore names still
  route. Previously an exact-match miss meant events were silently
  acknowledged with a 200 and plans never synced.
  (`app/api/webhooks/whop/route.ts`)
- **Payload parsing is shape-defensive.** User/plan IDs are read from both the
  flat (`user_id`) and nested (`user.id`) forms — the shape depends on the
  webhook's payload api_version — and refund/dispute payloads resolve the user
  through the originating payment. (`app/api/webhooks/whop/route.ts`)
- If your webhook was created by create-whop-kit <= 1.9.0, it is not
  subscribed to `membership.activated` / `membership.deactivated` — add them
  in your Whop dashboard (Developer → your app → Webhooks) or recreate the
  webhook with CLI 1.9.1+.

## 2026-07-07

### Plan visibility — pricing adapts to your real tier structure

- Pricing pages now hide paid tiers that have no Whop plan ID once setup is
  complete, instead of rendering dead "Configure plan ID" cards. Before setup
  completes they stay visible as placeholders. (`lib/config.ts`
  `getVisiblePlans()`, used by `app/page.tsx` and
  `app/(marketing)/pricing/page.tsx`)
- The pricing grid adapts to the number of visible tiers (1–4 columns) instead
  of assuming exactly three. The billing toggle disappears when no visible paid
  tier offers yearly billing. (`components/landing/pricing-cards.tsx`)
- Plans support `hidden: true` in `definePlans()` (whop-kit >= 0.3.1): the plan
  keeps its rank for gating and stays the downgrade target, but never appears
  on pricing pages.
- The free tier no longer requires a Whop plan ID — without one its card links
  to sign-in instead of showing a configuration placeholder.

### Fixes

- OAuth callback idempotency keys (`oauth_cb_*` rows in `SystemConfig`) are now
  pruned after 24 hours instead of accumulating forever.
  (`app/api/auth/callback/route.ts`)
- Product-ID config keys for `hasWhopAccess()` are derived from plan keys
  (`WHOP_{PLAN_KEY}_PRODUCT_ID`) instead of being hardcoded for starter/pro.
  (`lib/config.ts`)

## Earlier

See git history: https://github.com/whopio/whop-saas-starter/commits/main
