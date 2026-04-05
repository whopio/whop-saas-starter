---
name: whop-saas-starter
description: "Guide for extending the Whop SaaS Starter template. TRIGGER when: adding dashboard pages, plan tiers, landing page sections, API routes, webhook handlers, or customizing auth/checkout/billing flows. Covers architecture conventions, file placement, plan system, config system, and component patterns specific to this codebase."
---

# Whop SaaS Starter — Extension Guide

Use this skill when building on top of the Whop SaaS Starter template. It explains *how to extend* the codebase — adding features, pages, plan tiers, and integrations — while following established patterns.

## Architecture at a Glance

```
Server Components fetch data → pass props to Client Components
Layout protects routes → pages consume session via requireSession()
Plans are data-driven → edit PLAN_METADATA, everything adapts
Config is DB-backed → getConfig(key) with env var fallback
Webhooks update state → session reads fresh plan from DB
```

## Quick Reference: Common Tasks

### Add a new dashboard page

1. Create `app/dashboard/your-page/page.tsx` (server component)
2. Call `requireSession()` for auth (deduplicated by `React.cache`)
3. Use `requirePlan("starter")` if the page needs a minimum plan
4. Add a nav item to `navItems` in `components/dashboard/sidebar.tsx`
5. Add a `loading.tsx` skeleton in the same folder

See [adding-pages.md](./references/adding-pages.md) for full details.

### Add a new plan tier

1. Add the key to `PLAN_METADATA` in `lib/constants.ts`
2. Key order = hierarchy (first = lowest, last = highest)
3. Run the setup wizard or set env vars: `NEXT_PUBLIC_WHOP_{KEY}_PLAN_ID`

Everything adapts automatically: pricing page, plan gating, setup wizard, config keys.

See [plan-system.md](./references/plan-system.md) for full details.

### Add a new landing page section

1. Create `components/landing/your-section.tsx` (server component preferred)
2. Follow the existing pattern: `<section>` with `border-t`, `max-w-5xl`, `py-24`
3. Import and place in `app/page.tsx` in the desired order
4. Current order: Hero → Features → Testimonials → Pricing → CTA

See [landing-page.md](./references/landing-page.md) for full details.

### Add an API route

1. Create `app/api/your-route/route.ts`
2. Always verify auth: `const session = await getSession()` + check `!session`
3. Admin-only routes: check `!session?.isAdmin`
4. Return `NextResponse.json(...)` with appropriate status codes

See [api-patterns.md](./references/api-patterns.md) for full details.

### Handle a new webhook event

1. Add the event type to the switch in `app/api/webhooks/whop/route.ts`
2. Use `prisma.user.updateMany({ where: { whopUserId } })` for updates
3. Webhook verification is automatic (HMAC-SHA256 via `verifyWebhookSignature`)

See [webhooks.md](./references/webhooks.md) for full details.

## Key Conventions

### Server vs Client Components
- **Server by default** — only add `"use client"` when you need hooks, event handlers, or browser APIs
- **Pass data down** — server components fetch, client components receive via props
- **No fetching in client components** — use route handlers if client needs dynamic data

### Styling
- Use CSS custom properties: `var(--background)`, `var(--foreground)`, `var(--accent)`, `var(--muted)`, `var(--border)`, `var(--card)`, `var(--surface)`
- Use Tailwind with the bracket syntax: `bg-[var(--card)]`, `text-[var(--muted)]`
- Animations: `animate-slide-up`, `animate-fade-in`, `animate-scale-in` with `delay-100` through `delay-500`
- Respect `prefers-reduced-motion` (already configured in globals.css)

### Database
- Always use `select` to fetch only needed fields
- Use `Promise.all` for independent queries
- Use Prisma `upsert` for create-or-update patterns
- Timestamps use `@db.Timestamptz(3)` for timezone safety
- Pool size is 5 by default (serverless-friendly)

### Session & Auth
- `getSession()` — returns session or null, plan always fresh from DB
- `requireSession()` — redirects to /login if not authenticated
- `requirePlan("starter")` — redirects to /pricing if plan insufficient
- Session is deduplicated per-request via `React.cache()`
- API routes must always check auth themselves (don't rely on middleware)

### Plan Gating
- Server: `requirePlan("starter")` or `hasMinimumPlan(session.plan, "starter")`
- Client: `<PlanGate plan={session.plan} minimum="starter">` (pass plan from server parent)
- Plan hierarchy is auto-derived from key order in `PLAN_METADATA`

## File Placement Rules

| What you're adding | Where it goes |
|---------------------|--------------|
| Public marketing page | `app/(marketing)/` |
| Protected dashboard page | `app/dashboard/` |
| API endpoint | `app/api/` |
| Landing section | `components/landing/` |
| Dashboard component | `components/dashboard/` |
| Shared utility | `lib/` |
| Database schema change | `db/schema.prisma` |
| Documentation | `content/docs/` |
