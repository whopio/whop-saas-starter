# Landing Page Sections

## Current Section Order

```
Header
Hero         → components/landing/hero.tsx
Features     → components/landing/features.tsx
Testimonials → components/landing/testimonials.tsx
Pricing      → components/landing/pricing-cards.tsx (in app/page.tsx)
CTA          → components/landing/cta.tsx
Footer
```

## Adding a New Section

### 1. Create the component

```tsx
// components/landing/your-section.tsx
export function YourSection() {
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Section Title
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Section subtitle.
          </p>
        </div>
        {/* Your content — grid, cards, etc. */}
      </div>
    </section>
  );
}
```

### 2. Add to homepage

In `app/page.tsx`, import and place in the desired position:

```tsx
import { YourSection } from "@/components/landing/your-section";

// Inside <main>:
<Hero />
<Features />
<YourSection />  {/* ← insert here */}
<Testimonials />
```

## Section Patterns

### Card grid (like Features)
```tsx
<div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <div key={item.title} className="bg-[var(--card)] p-6 transition-colors hover:bg-[var(--surface)]">
      {/* content */}
    </div>
  ))}
</div>
```

### Testimonial cards (like Testimonials)
```tsx
<div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <figure key={item.name} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <blockquote>...</blockquote>
      <figcaption>...</figcaption>
    </figure>
  ))}
</div>
```

### CTA banner (like CTA)
```tsx
<div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center sm:px-16">
  {/* accent glow background */}
  <h2>...</h2>
  <p>...</p>
  <div className="mt-8 flex justify-center gap-3">
    <Link href="/pricing" className="...">CTA Button</Link>
  </div>
</div>
```

## Customizing Existing Sections

### Testimonials
Edit the `testimonials` array in `components/landing/testimonials.tsx`. Add or remove entries — the grid adapts automatically.

### Features
Edit the `features` array in `components/landing/features.tsx`. Each entry has `icon`, `title`, `description`.

### Pricing
Plans are driven by `PLAN_METADATA` in `lib/constants.ts`. Edit there — pricing cards adapt automatically.

### Hero
Edit `components/landing/hero.tsx`. Replace the screenshot placeholder `<div>` with a real product image or demo.

## Standalone Pricing Page

The pricing page at `app/(marketing)/pricing/page.tsx` has its own FAQ section. Edit the `FAQ` array to customize questions and answers.
