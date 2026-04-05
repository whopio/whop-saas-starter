# Plan System

The plan system is **data-driven** from a single source of truth: `PLAN_METADATA` in `lib/constants.ts`.

## How It Works

```
PLAN_METADATA (constants.ts)
  ↓ derives
PlanKey type, PLAN_KEYS array, PLAN_RANK map, DEFAULT_PLAN
  ↓ drives
Pricing page, setup wizard, plan gating, config keys, env var names
```

Key order in `PLAN_METADATA` defines the hierarchy. First key = lowest tier, last = highest.

## Adding a New Tier

Edit `lib/constants.ts`:

```tsx
export const PLAN_METADATA = {
  free: { name: "Free", description: "...", priceMonthly: 0, priceYearly: 0, features: [...] },
  starter: { name: "Starter", description: "...", priceMonthly: 0, priceYearly: 0, features: [...], highlighted: true },
  // ↓ Add here — position determines rank
  business: { name: "Business", description: "...", priceMonthly: 0, priceYearly: 0, features: [...] },
  pro: { name: "Pro", description: "...", priceMonthly: 0, priceYearly: 0, features: [...] },
};
```

Everything adapts automatically:
- `PlanKey` type includes `"business"`
- Pricing page shows the new tier
- Setup wizard has input fields for its Whop plan IDs
- `requirePlan("business")` works
- Config keys: `whop_business_plan_id`, `whop_business_plan_id_yearly`
- Env vars: `NEXT_PUBLIC_WHOP_BUSINESS_PLAN_ID`, `_YEARLY`

## Connecting to Whop

Each paid tier needs a Whop plan ID (from your Whop dashboard) for each billing interval:
- Monthly: `NEXT_PUBLIC_WHOP_{KEY}_PLAN_ID`
- Yearly: `NEXT_PUBLIC_WHOP_{KEY}_PLAN_ID_YEARLY`

Set via the setup wizard at `/setup` or environment variables.

## Plan Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name |
| `description` | Yes | Short description for pricing cards |
| `priceMonthly` | Yes | Default 0 — real prices are synced from the Whop API |
| `priceYearly` | Yes | Default 0 — real prices are synced from the Whop API |
| `features` | Yes | Array of feature strings for pricing cards |
| `highlighted` | No | Show "Most Popular" badge, accent border |
| `trialDays` | No | Display only — configure actual trial in Whop |
| `billingIntervals` | No | Defaults to `["monthly", "yearly"]`; set `["monthly"]` to disable yearly |

## Plan Gating Patterns

### Server Components (pages)
```tsx
// Redirect if plan insufficient
const session = await requirePlan("starter");

// Check without redirect
const session = await requireSession();
if (hasMinimumPlan(session.plan, "starter")) { ... }
```

### API Routes
```tsx
const session = await getSession();
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
if (!hasMinimumPlan(session.plan, "starter")) {
  return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
}
```

### Client Components
```tsx
// Pass plan from server parent — never fetch in client
<PlanGate plan={session.plan} minimum="starter">
  <StarterFeature />
</PlanGate>
```

## Common Recipes

### Remove yearly billing
Set `billingIntervals: ["monthly"]` on each plan. The toggle hides.

### Remove the free plan
Delete the `free` key. Update `@default("starter")` in `db/schema.prisma` to match the new lowest tier. Run `pnpm db:push`.

### Add a free trial
Set `trialDays: 7` on the plan (display only). Configure the actual trial in Whop Dashboard → Product → Plan → Edit → Free trial.

### Two plans only
Delete the unwanted key. Pricing page adapts layout automatically.

### Add a tier
Insert the key at the right position in `PLAN_METADATA` — key order = hierarchy. Connect Whop plan IDs via setup wizard or env vars.

### Monthly-only (no toggle)
Set `billingIntervals: ["monthly"]` on all plans.

See the [Payments docs](/docs/guides/payments#common-pricing-recipes) for full code examples of each recipe.

## Whop Dashboard Setup

1. Create plans in your Whop dashboard (whop.com/dash)
2. Copy the plan IDs
3. Enter them in the setup wizard or set as env vars

### Whop Docs

| Topic | Link |
|-------|------|
| Set up pricing | https://docs.whop.com/manage-your-business/payment-processing/set-up-pricing |
| Create a plan (API) | https://docs.whop.com/api-reference/plans/create-plan |
| Create a product | https://docs.whop.com/manage-your-business/products/create-product |
| Manage products | https://docs.whop.com/manage-your-business/products/manage-products |
