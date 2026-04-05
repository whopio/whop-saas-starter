# API Route Patterns

## Authentication

Every mutation endpoint must verify auth. Do not rely on proxy/middleware alone.

```tsx
// app/api/your-route/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Admin-only:
  // if (!session.isAdmin) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  const body = await request.json();
  // ... your logic
  return NextResponse.json({ success: true });
}
```

## GET Routes

```tsx
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch data...
  return NextResponse.json({ data });
}
```

## Plan-Gated Routes

```tsx
import { getSession, hasMinimumPlan } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasMinimumPlan(session.plan, "starter")) {
    return NextResponse.json({ error: "Upgrade to Starter required" }, { status: 403 });
  }
  // ...
}
```

## Config Routes (Admin)

Follow the pattern in `app/api/config/accent/route.ts`:

```tsx
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // ... setConfig(key, value)
}
```

## Error Handling

- Parse body safely: `await request.json().catch(() => ({}))`
- Return structured errors: `{ error: "message" }` with appropriate status
- Log server errors, return generic message to client

## Whop API Calls

For direct Whop API integration:

```tsx
const res = await fetch(`https://api.whop.com/api/v1/...`, {
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
});
```

Key endpoints used by this template:
- `POST /oauth/token` — token exchange
- `GET /oauth/userinfo` — user profile (OIDC)
- `GET /api/v1/users/{id}/access/{resource_id}` — check access
- `POST /api/v1/memberships/{id}/uncancel` — reverse cancellation

### Whop API Docs

| Topic | Link |
|-------|------|
| API getting started | https://docs.whop.com/developer/api/getting-started |
| Memberships API | https://docs.whop.com/api-reference/memberships/list-memberships |
| Uncancel membership | https://docs.whop.com/api-reference/memberships/uncancel-membership |
| Plans API | https://docs.whop.com/api-reference/plans/create-plan |
| Products API | https://docs.whop.com/api-reference/products/create-product |
