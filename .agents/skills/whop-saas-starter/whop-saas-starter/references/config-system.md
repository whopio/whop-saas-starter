# Config System

All dynamic configuration is stored in the `SystemConfig` database table via `lib/config.ts`, with environment variables as fallback.

## Priority Order

```
1. In-memory cache (per-process, instant)
2. Environment variable (checked via ENV_MAP)
3. Database (SystemConfig table)
```

## Reading Config

```tsx
import { getConfig } from "@/lib/config";

const value = await getConfig("whop_app_id");
// Returns string | null
```

## Writing Config

```tsx
import { setConfig, setConfigs } from "@/lib/config";

await setConfig("accent_color", "#5b4cff");

// Bulk set:
await setConfigs({
  analytics_provider: "posthog",
  analytics_id: "phc_xxx",
});
```

## Plan Config

```tsx
import { getPlansConfig } from "@/lib/config";

const plans = await getPlansConfig();
// Returns PlansConfig — merges PLAN_METADATA with dynamic Whop plan IDs from DB/env
// Wrapped in React.cache() for per-request deduplication
```

## Setup Status

```tsx
import { isSetupComplete } from "@/lib/config";

const done = await isSetupComplete();
// true if setup_complete flag is set OR whop_app_id exists (env-only config)
```

## Config Keys

Config keys for plans are auto-derived from `PLAN_METADATA`:
- `whop_{planKey}_plan_id` → monthly plan ID
- `whop_{planKey}_plan_id_yearly` → yearly plan ID

Other keys:
- `whop_app_id`, `whop_api_key`, `whop_webhook_secret`
- `session_secret` (auto-generated if not set)
- `accent_color`
- `analytics_provider`, `analytics_id`
- `email_provider`, `email_api_key`, `email_from_address`
- `setup_complete`

## Adding a New Config Key

1. Add the key to `ENV_MAP` in `lib/config.ts` (maps config key → env var name)
2. If it should be readable by client components, add to `PUBLIC_KEYS` set
3. Use `getConfig("your_key")` / `setConfig("your_key", value)`
