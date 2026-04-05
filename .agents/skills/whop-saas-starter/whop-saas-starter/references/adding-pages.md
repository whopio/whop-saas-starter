# Adding Pages

## Dashboard Pages (Protected)

All pages under `app/dashboard/` are automatically protected by the layout's `requireSession()` call.

### Minimal example

```tsx
// app/dashboard/analytics/page.tsx
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  const session = await requireSession();
  // requireSession() is deduplicated by React.cache — no extra DB hit

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Track your usage and performance.
        </p>
      </div>
      {/* Your content here */}
    </div>
  );
}
```

### Plan-gated page

```tsx
import { requirePlan } from "@/lib/auth";

export default async function StarterFeaturePage() {
  const session = await requirePlan("starter");
  // Redirects to /pricing if plan is below "starter"
  // ...
}
```

### Add to sidebar navigation

Edit `components/dashboard/sidebar.tsx`:

```tsx
const navItems = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartIcon }, // ← add
  { href: "/api/billing/portal", label: "Billing", icon: BillingIcon, external: true },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];
```

### Loading skeleton

Create `app/dashboard/analytics/loading.tsx` for instant loading state:

```tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="h-5 w-24 rounded bg-[var(--surface)] animate-pulse" />
        <div className="mt-1.5 h-3 w-48 rounded bg-[var(--surface)] animate-pulse" />
      </div>
      {/* Match your page structure */}
    </div>
  );
}
```

## Public Marketing Pages

Add to `app/(marketing)/` — these share the landing page header and footer.

```tsx
// app/(marketing)/about/page.tsx
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Content */}
      </main>
      <Footer />
    </div>
  );
}
```

## Error and 404 Pages

Each route segment can have its own:
- `error.tsx` — client component, receives `{ error, reset }`
- `not-found.tsx` — displayed when `notFound()` is called
- `loading.tsx` — shown during streaming/suspense
