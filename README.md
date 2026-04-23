# Whop SaaS Starter

A production-ready SaaS starter template built with **Next.js 16**, **Whop** (for auth and payments), **Prisma 7** (PostgreSQL), and **Tailwind CSS v4**.

Authentication, payments, subscription management, and a clean dashboard — wired up and ready to go.

## Get started

### Option 1: CLI (recommended)

The fastest path — scaffolds your project, provisions a database, deploys to Vercel, and creates your Whop app with pricing plans, all from the terminal.

```bash
npx create-whop-kit
```

The CLI supports **Next.js**, **Astro**, and **TanStack Start**. It auto-provisions a database via Neon, Supabase, or Prisma Postgres.

### Option 2: Deploy to Vercel

One-click deploy — no terminal needed.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwhopio%2Fwhop-saas-starter&project-name=whop-saas-starter&repository-name=whop-saas-starter&envDescription=No+env+vars+needed%21+The+in-app+setup+wizard+handles+everything.&demo-title=Whop+SaaS+Starter&demo-description=A+production-ready+SaaS+starter+with+auth%2C+payments%2C+and+a+dashboard+%E2%80%94+powered+by+Whop.&demo-url=https%3A%2F%2Fwhop-saas-starter.vercel.app&demo-image=https%3A%2F%2Fwhop-saas-starter.vercel.app%2Fscreenshot.jpg&products=%5B%7B%22type%22%3A%22integration%22%2C%22group%22%3A%22postgres%22%7D%5D)

> **What happens when you click Deploy:**
> 1. Vercel clones the repo to your GitHub account
> 2. You're prompted to add a **Postgres database** (Neon, Supabase, Prisma Postgres, or Nile)
> 3. Vercel builds and deploys — the database tables are created automatically
> 4. Visit your app — the **setup wizard** walks you through connecting Whop

No environment variables to fill in manually. The setup wizard handles everything.

### Option 3: Clone from GitHub

If you want full control from the start:

```bash
git clone https://github.com/whopio/whop-saas-starter.git
cd whop-saas-starter
pnpm install
cp .env.example .env.local
```

Set your `DATABASE_URL` in `.env.local`, then:

```bash
pnpm db:push   # Create database tables
pnpm dev       # Start dev server
```

Visit `http://localhost:3000` — the setup wizard will guide you through connecting Whop, setting up OAuth, and configuring plans.

---

## Setup wizard

After deploying (via any method), the setup wizard appears automatically on first visit. It walks you through:

1. **Database check** — verifies your connection and schema
2. **Connect Whop** — enter your App ID and API Key (or paste the env block from Whop)
3. **Configure OAuth** — copy-paste your redirect URI
4. **Set up webhooks** — copy-paste your webhook URL and secret
5. **Sign in** — test OAuth and become the admin
6. **Connect plans** — enter your Whop plan IDs (the wizard validates them against the Whop API)

The wizard stores all config in your database — no environment variables needed.

---

## Test the full flow

Once setup is complete, verify everything works:

1. **Sign in** — click "Sign in" on your landing page. You should be redirected to Whop, then back to your dashboard after authenticating. The dashboard should show your name and "Free" as your plan.

2. **Pricing page** — go to `/pricing`. You should see your plan tiers with the correct prices (synced from Whop). The monthly/yearly toggle should work.

3. **Checkout** — click a paid plan. You should see a billing form followed by the embedded Whop checkout. Complete a test payment.

4. **Plan upgrade** — after payment, you should be redirected to the dashboard. Your plan should now show the tier you purchased. Plan-gated features should be unlocked.

5. **Billing portal** — click "Billing" in the sidebar. You should be redirected to Whop's self-service portal where you can manage your subscription.

If something isn't working, check:
- **OAuth fails:** verify the redirect URI in your Whop app matches exactly (including `https://` and no trailing slash)
- **Plans don't show prices:** check that plan IDs are connected (Settings → or re-run the setup wizard)
- **Webhooks not syncing:** verify the webhook URL and secret are configured in your Whop app

---

## Features

- **Authentication** — Sign in with Whop (OAuth 2.1 + PKCE)
- **Payments** — Subscription billing via embedded Whop checkout
- **Webhooks** — Automatic plan upgrades/downgrades on subscription changes
- **Dashboard** — Protected, responsive dashboard with collapsible sidebar
- **Plan gating** — Lock features behind subscription tiers with `requirePlan()`, `hasMinimumPlan()`, or `<PlanGate>`
- **Database** — PostgreSQL with Prisma ORM (auto-provisioned on deploy)
- **Billing portal** — Self-service subscription management via Whop
- **Landing page** — Hero with demo video, features, pricing, FAQ, testimonials, CTA
- **Documentation site** — Built-in docs at `/docs` powered by Fumadocs with search
- **Dark mode** — Automatic light/dark mode with toggle
- **Email** — Transactional emails via Resend or SendGrid (welcome, payment failed)
- **Analytics** — PostHog, Google Analytics, or Plausible (via admin settings or CLI)
- **AI-ready** — Bundled [agent skill](/.agents/skills/whop-saas-starter/) guides Claude Code, Cursor, and other AI tools on how to extend this template

## Project structure

```
app/
├── (marketing)/pricing/     # Pricing page
├── (auth)/login/            # Login page
├── dashboard/               # Protected dashboard (layout enforces auth)
│   ├── projects/            # Example product page
│   └── settings/            # Admin settings (branding, integrations)
├── checkout/                # Embedded Whop checkout
├── docs/                    # Built-in documentation site
└── api/
    ├── auth/                # OAuth login, callback, logout
    ├── billing/             # Billing portal, uncancel
    ├── webhooks/whop/       # Whop webhook handler
    └── config/              # Plan config, accent color, integrations
components/
├── landing/                 # Hero, features, pricing, FAQ, CTA
├── dashboard/               # Sidebar, header, activity feed
└── checkout/                # Two-step checkout form
lib/
├── auth.ts                  # Session management (JWT cookies)
├── constants.ts             # Plan tiers (single source of truth — edit this!)
├── config.ts                # DB-backed config with env var fallback
├── subscription.ts          # Subscription query helpers
├── activity.ts              # Activity event logging
└── whop.ts                  # Whop API wrappers
```

## Customization

### Rename your app

Edit `lib/constants.ts` — change `APP_NAME` and `APP_DESCRIPTION`. Used across the header, sidebar, login page, footer, and metadata.

### Change the plans

Edit `definePlans()` in `lib/constants.ts` to add, remove, or modify plan tiers. The plan system is data-driven — pricing page, setup wizard, config keys, env vars, and plan gating all adapt automatically. Create matching plans on Whop via `whop-kit add plans` or the setup wizard.

### Change the look

Set an accent color from the admin dashboard (Settings → Branding). Edit `app/globals.css` to customize the full color palette. The starter uses Tailwind CSS v4 with CSS custom properties for theming.

### Add new pages

Protected pages go in `app/dashboard/`. Public pages go in `app/(marketing)/`. The proxy automatically protects `/dashboard/*` routes.

## CLI commands

After setup, use the `whop-kit` CLI to manage your project:

```bash
whop-kit status          # Project health check
whop-kit add plans       # Create/reconfigure pricing plans on Whop
whop-kit add email       # Set up Resend or SendGrid
whop-kit add analytics   # Add PostHog, GA, or Plausible
whop-kit open whop       # Open Whop dashboard
whop-kit open vercel     # Open Vercel project
whop-kit env             # List environment variables
whop-kit deploy          # Redeploy with updated config
```

## Development commands

```bash
pnpm dev          # Dev server with Turbopack
pnpm build        # Production build
pnpm lint         # ESLint
pnpm db:push      # Push schema to database
pnpm db:studio    # Visual database browser
```

## Local webhook testing

Use [ngrok](https://ngrok.com) to expose your local server for webhook testing:

```bash
ngrok http 3000
```

Use the ngrok URL as your webhook endpoint in Whop: `https://xxxx.ngrok.io/api/webhooks/whop`

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Whop](https://whop.com) (OAuth 2.1 + PKCE, payments, webhooks)
- [whop-kit](https://www.npmjs.com/package/whop-kit) (framework-agnostic core library)
- [Prisma 7](https://prisma.io) + PostgreSQL
- [Tailwind CSS v4](https://tailwindcss.com)
- [Fumadocs](https://fumadocs.vercel.app) (documentation site)

## Contributing

Pull requests are welcome! If you have ideas, bug fixes, or improvements, feel free to open a PR.

For feedback or questions, reach out to colin@whop.com.

## License

MIT
