# CLAUDE.md - Whop SaaS Starter

## Overview

A production-ready Next.js SaaS starter template using Whop for authentication (OAuth 2.1 + PKCE) and subscription payments. This is a **standalone** Next.js app — NOT a Whop app (no iframe, no Whop proxy).

## Quick Reference

```bash
pnpm dev          # Dev server with Turbopack
pnpm build        # Production build (ALWAYS run before commits)
pnpm lint         # ESLint
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
```

## Architecture

### Setup & Configuration
- Zero-config deploy: only `DATABASE_URL` needed (auto-set by Neon via Vercel Marketplace)
- In-app setup wizard (`/setup`) guides through Whop config on first visit
- Setup wizard checks DB health first (step 0): detects no URL, connection failure, or missing schema and shows targeted fix instructions for Vercel vs local environments
- All config stored in `SystemConfig` DB table via `lib/config.ts`
- Env vars work as fallback for power users (checked before DB)
- First user to sign in via OAuth becomes admin (`isAdmin` on User model)

### Config System (`lib/config.ts`)
- `getConfig(key)` / `setConfig(key, value)` — DB-backed with env var fallback and in-memory cache
- `getPlansConfig()` — merges static plan metadata from `constants.ts` with dynamic plan IDs from DB/env
- `isSetupComplete()` — checks if app is configured (setup_complete flag or whop_app_id exists)
- Config keys for plans are **auto-derived** from `PLAN_METADATA` keys (e.g. `whop_starter_plan_id`, `whop_starter_plan_id_yearly`)
- Env var names follow pattern: `NEXT_PUBLIC_WHOP_{PLAN_KEY}_PLAN_ID` / `_YEARLY`

### Auth Flow
- OAuth 2.1 + PKCE — Public client mode (no client_secret needed)
- PKCE state stored in httpOnly cookie (not in URL state param like whop-ecom)
- Session = JWT in httpOnly cookie, 7-day TTL, signed with SESSION_SECRET (auto-generated)
- JWT carries identity; **plan is always read fresh from DB** (kept current by Whop webhooks)
- Session includes `isAdmin` flag for admin-only features and `profileImageUrl` for avatar display
- Proxy (`proxy.ts`) checks cookie existence on `/dashboard/*`; full JWT verification in `getSession()`

### Plan System (data-driven)
- `PLAN_METADATA` in `lib/constants.ts` is the **single source of truth** for plan tiers (names, descriptions, features, hierarchy)
- **Prices are synced from the Whop API** — `priceMonthly`/`priceYearly` default to 0 in constants; `getPlansConfig()` auto-syncs from Whop when plan IDs exist but prices haven't been fetched yet
- `PlanKey` type is derived from `keyof typeof PLAN_METADATA` (not hardcoded)
- Key order in `PLAN_METADATA` defines the plan hierarchy (first = lowest, last = highest)
- `PLAN_RANK`, `PLAN_KEYS`, `DEFAULT_PLAN` are all auto-derived from `PLAN_METADATA`
- Free plan detection uses `key === DEFAULT_PLAN` (not `priceMonthly === 0`, since all defaults are 0)
- To add/remove/modify a tier: edit `PLAN_METADATA` — config keys, env vars, setup wizard, pricing page, plan gating all adapt automatically
- Optional per-plan fields: `trialDays` (display only — configure actual trial in Whop), `billingIntervals` (defaults to `["monthly", "yearly"]`)

### Payments
- Whop embedded checkout via `@whop/checkout` React component (`WhopCheckoutEmbed`)
- Two-step checkout: native billing form (email, name, address) → Whop embedded payment
- Pricing buttons link to `/checkout?plan={key}&interval={monthly|yearly}`
- Billing intervals: monthly/yearly toggle on pricing page; each paid tier has Whop plan IDs per interval
- Checkout pre-fills email for logged-in users
- Plans fetched from `/api/config/plans` for client components
- Webhooks (`membership_activated` / `membership_deactivated` / `membership_cancel_at_period_end_changed`) update user plan and cancellation state in DB
- Billing portal: `/api/billing/portal` redirects paid users to Whop's self-service billing portal
- Uncancel: `/api/billing/uncancel` reverses pending cancellations via Whop API; `cancelAtPeriodEnd` on User model tracks state

### Key Endpoints
- `GET /api/auth/login?next=/dashboard` — initiate OAuth
- `GET /api/auth/callback` — OAuth callback, creates session, first-user-is-admin
- `GET /api/auth/logout` — clear session
- `GET /api/auth/me` — current user (for client-side checks)
- `POST /api/auth/delete-account` — delete user account (requires confirmation)
- `POST /api/webhooks/whop` — Whop webhook handler
- `GET /api/billing/portal` — redirect to Whop billing portal (or /pricing for free users)
- `POST /api/billing/uncancel` — reactivate a pending-cancellation subscription
- `GET/POST /api/setup` — read/write config during setup (open pre-setup, admin-only after)
- `POST /api/setup/complete` — mark setup as done (admin-only)
- `GET /api/config/plans` — plan config for client components
- `GET/POST /api/config/accent` — read/save accent color (admin-only POST)
- `GET/POST /api/config/integrations` — read/save integration settings (admin-only)
- `GET /api/search` — Fumadocs full-text search

## Database
- **Prisma 7** + PostgreSQL via `@prisma/adapter-pg` (native `pg` driver)
- Compatible with **Neon**, **Supabase**, **Prisma Postgres**, **Nile**, and any PostgreSQL provider
- Auto-detects `NILEDB_POSTGRES_URL` for zero-config Nile via Vercel Marketplace
- SSL is derived from the connection string automatically (no hardcoded `ssl: true`)
- Pool size defaults to 5 (serverless-friendly); override with `DATABASE_POOL_SIZE`
- Force SSL on/off with `DATABASE_SSL=true|false` if needed
- Schema auto-pushed on `pnpm build` if `DATABASE_URL` is set (via `scripts/db-push.mjs`)
- Indexes: `whopUserId` (unique), `email`, `plan`

## Tech Stack
- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS v4**
- **Prisma 7** + PostgreSQL (pg driver adapter via `@prisma/adapter-pg`)
- **jose** for JWT signing/verification
- **@whop/checkout** for embedded checkout; direct fetch to `https://api.whop.com` for auth/API
- **Fumadocs** + MDX for documentation site at `/docs`

## Important Patterns
- `getSession()` — get current session or null; plan is always fresh from DB (never stale JWT). Deduped per-request via `React.cache()`.
- `requireSession()` — get session or redirect to `/login` (protected pages)
- `requirePlan("starter")` — get session or redirect to `/pricing` if plan insufficient. Hierarchy is auto-derived from key order in `PLAN_METADATA`.
- `hasMinimumPlan(userPlan, minimumPlan)` — pure function for plan level comparison in API routes
- `<PlanGate plan={session.plan} minimum="starter">` — client component for conditional rendering (pass plan from server parent)
- `checkWhopAccess(whopUserId, productId, apiKey)` / `hasWhopAccess(whopUserId, productId)` — real-time Whop API access checks (for authoritative gating)
- `getSubscriptionDetails(userId)` — typed subscription lookup; returns `{ hasSubscription, subscription?, error? }`
- `isUserSubscribed(userId)` — boolean check for active paid subscription
- `getUserSubscriptionStatus(userId)` — returns `"active" | "canceling" | "free"`
- `activateMembership()` / `deactivateMembership()` / `updateCancelAtPeriodEnd()` — webhook write helpers
- `getConfig(key)` — read config value (cache → env → DB)
- `getPlansConfig()` — server-side plan config (use in server components, pass to client as props)
- `sendEmail({ to, subject, html })` — sends via configured provider (Resend/SendGrid), returns `{ success, error? }`. Used for welcome emails and payment failure notifications.
- `welcomeEmail(name)` / `paymentFailedEmail(name)` — HTML email templates in `lib/email-templates.ts`
- Plan system is data-driven: edit `PLAN_METADATA` in `lib/constants.ts` to add/remove/modify tiers; everything else adapts
- Client components get plan config as props from server parents, or fetch `/api/config/plans`
- Admin-configurable accent color applied via CSS custom properties (`--accent`, `--accent-foreground`)
- Admin-configurable integrations (analytics, error tracking, email) via Settings → Integrations

## Whop API Endpoints Used
- `https://api.whop.com/oauth/authorize` — OAuth authorization
- `https://api.whop.com/oauth/token` — token exchange
- `https://api.whop.com/oauth/userinfo` — user profile (OIDC)
- `https://api.whop.com/api/v1/users/{id}/access/{resource_id}` — check user access to product/experience
- `https://api.whop.com/api/v1/memberships/{id}/uncancel` — reverse pending cancellation

## Webhook Verification
- Whop uses standardwebhooks format (HMAC-SHA256)
- Headers: `webhook-id`, `webhook-signature`, `webhook-timestamp`
- Secret is used raw as HMAC key (no base64 decoding needed)

## File Structure
```
app/                        # Pages and API routes
├── (auth)/                 # Login, auth error (unprotected)
├── (marketing)/            # Pricing (unprotected)
├── setup/                  # Setup wizard (shown on first visit)
├── dashboard/              # Protected area (layout calls requireSession)
├── checkout/               # Embedded Whop checkout (two-step billing form)
├── checkout/success/       # Post-payment redirect
├── docs/                   # Documentation site (Fumadocs)
├── not-found.tsx           # Global 404 page
├── error.tsx               # Global error boundary
└── api/
    ├── auth/               # login, callback, logout, me, delete-account
    ├── billing/            # portal (redirect to Whop), uncancel
    ├── setup/              # Config read/write + completion
    ├── config/             # plans, accent color, integrations
    ├── search/             # Fumadocs full-text search
    └── webhooks/whop/      # Whop webhook handler
components/
├── landing/                # Hero, features, testimonials, pricing cards, CTA, header, footer
├── dashboard/              # Sidebar, header, activity feed, upgrade/reactivate banners, delete account, integrations
├── checkout/               # Two-step checkout form
└── setup/                  # Setup wizard
content/docs/               # Documentation MDX files
db/
├── index.ts                # Prisma client singleton
└── schema.prisma           # User (with isAdmin, cancelAtPeriodEnd) + SystemConfig models
lib/
├── auth.ts                 # JWT session + plan gating (requirePlan, hasMinimumPlan)
├── subscription.ts         # Typed subscription/membership query helpers
├── config.ts               # DB-backed config system (getConfig, getPlansConfig)
├── whop.ts                 # Whop OAuth, webhook, access check helpers
├── constants.ts            # Plan metadata (single source of truth), APP_NAME, derived types/helpers
├── analytics.ts            # Analytics script generation (PostHog, GA, Plausible)
├── email.ts                # Email sending (Resend, SendGrid)
├── email-templates.ts      # HTML email templates (welcome, payment failed)
├── source.ts               # Fumadocs content source loader
└── utils.ts                # cn(), formatDate()
proxy.ts                   # Protects /dashboard/* routes (Next.js 16 proxy)
source.config.ts            # Fumadocs MDX content config
mdx-components.tsx          # MDX component overrides
prisma.config.ts            # Prisma 7 configuration (points to db/schema.prisma)
```

## Pre-Commit Checklist
1. Run `pnpm build` — must pass cleanly
2. Check for TypeScript errors
3. No hardcoded secrets or API keys
