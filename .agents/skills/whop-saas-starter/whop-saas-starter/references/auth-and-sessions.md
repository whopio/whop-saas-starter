# Authentication & Sessions

## OAuth Flow

This template uses Whop OAuth 2.1 + PKCE (public client mode — no client_secret needed).

```
User clicks "Sign in"
  → GET /api/auth/login (generates PKCE challenge, stores in cookie, redirects to Whop)
  → Whop authorization page
  → GET /api/auth/callback (exchanges code, creates session, first-user-is-admin)
  → Redirect to /dashboard (or ?next= param)
```

PKCE state is stored in an httpOnly cookie (not URL state param).

## Session

Sessions are JWT tokens stored in httpOnly cookies with 7-day TTL, signed with SESSION_SECRET.

**Critical pattern:** The JWT carries identity, but the **plan is always read fresh from DB** in `getSession()`. This ensures webhooks updating the plan are reflected immediately, with no stale JWT data.

```tsx
interface Session {
  userId: string;
  whopUserId: string;
  email: string | null;
  name: string | null;
  profileImageUrl: string | null;
  plan: PlanKey;              // Always fresh from DB
  cancelAtPeriodEnd: boolean; // Always fresh from DB
  isAdmin: boolean;
}
```

## Session Helpers

```tsx
import { getSession, requireSession, requirePlan } from "@/lib/auth";

// Returns session or null
const session = await getSession();

// Returns session or redirects to /login
const session = await requireSession();

// Returns session or redirects to /pricing if plan insufficient
const session = await requirePlan("starter");
```

All are wrapped in `React.cache()` — safe to call multiple times per request.

## Proxy (Middleware)

`proxy.ts` does a fast cookie existence check on `/dashboard/*` routes. It does NOT verify the JWT — that happens in `getSession()`. This is intentional: the proxy only prevents unauthenticated users from hitting dashboard server components at all.

## Login Detection in Client Components

Client components detect login state via the `logged_in` cookie (non-httpOnly, separate from the session JWT). This avoids exposing the JWT to JavaScript.

## Whop Docs

| Topic | Link |
|-------|------|
| OAuth 2.1 + PKCE guide | https://docs.whop.com/developer/guides/oauth |
| Authentication overview | https://docs.whop.com/developer/guides/authentication |
| API getting started (tokens) | https://docs.whop.com/developer/api/getting-started |

Key setup steps:
1. Enable "Public client" mode in your Whop app settings
2. Add callback URI: `https://yourdomain.com/api/auth/callback`
3. No client_secret needed (PKCE handles security)
