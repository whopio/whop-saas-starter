import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[var(--accent)]/[0.04] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] mb-8">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Built with Next.js + Whop
        </div>

        <h1 className="animate-slide-up text-3xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl leading-[1.1]">
          Build your SaaS{" "}
          <span className="text-[var(--muted)]">
            in minutes, not months
          </span>
        </h1>

        <p className="animate-slide-up delay-100 mx-auto mt-5 max-w-lg text-base text-[var(--muted)] leading-relaxed">
          Authentication, payments, and subscriptions — all wired up. Just add your product.
        </p>

        <div className="animate-slide-up delay-200 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/pricing"
            prefetch={false}
            className="group w-full rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 sm:w-auto"
          >
            Start Building
            <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </Link>
          <Link
            href="/docs"
            prefetch={false}
            className="w-full rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hover:border-[var(--muted)]/40 sm:w-auto"
          >
            View Docs
          </Link>
        </div>
      </div>

      {/* Product demo video */}
      <div className="animate-scale-in delay-400 mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20 lg:pb-24">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl shadow-black/[0.03] dark:shadow-none">
          <div className="border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--border)]" />
          </div>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full"
            aria-label="Product demo"
          >
            <source src="https://whopvideo.app/videos/1774392074690-at3jhcz8.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
