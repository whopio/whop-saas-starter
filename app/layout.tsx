import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { preconnect, prefetchDNS } from "react-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { getConfig } from "@/lib/config";
import { getAnalyticsScript } from "@/lib/analytics";
import { getWhopUrls, resolveWhopEnvironment } from "whop-kit/whop";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// For OG metadata URLs. Set NEXT_PUBLIC_APP_URL in production.
// Vercel auto-provides VERCEL_PROJECT_PRODUCTION_URL as a fallback.
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

/**
 * Compute a lighter variant for dark mode from a hex color.
 * Blends the color 30% toward white to keep it readable on dark backgrounds.
 */
function lightenHex(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.3);
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // React DOM resource hints — emitted early in the HTML stream.
  // Environment is resolved synchronously from the env var so the hints
  // don't wait on a DB read; DB-configured sandbox falls back to the
  // (harmless) production preconnect.
  const { apiBase } = getWhopUrls(
    resolveWhopEnvironment(process.env.NEXT_PUBLIC_WHOP_ENVIRONMENT),
  );
  prefetchDNS(apiBase);
  preconnect(apiBase, { crossOrigin: "anonymous" });

  // Read accent color and analytics config from DB/env
  let accentCss: string | undefined;
  let analyticsHtml: string | null = null;
  try {
    const [accent, analytics] = await Promise.all([
      getConfig("accent_color"),
      getAnalyticsScript(),
    ]);
    if (accent && /^#[0-9a-fA-F]{6}$/.test(accent)) {
      const lightVariant = lightenHex(accent);
      accentCss = `:root{--accent:${accent} !important;--accent-dark:${lightVariant} !important}.dark{--accent:${lightVariant} !important}`;
    }
    analyticsHtml = analytics;
  } catch {
    // Config/DB not ready yet (first build) — use CSS defaults
  }

  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#090909" media="(prefers-color-scheme: dark)" />
        {/* Inline script to prevent flash of wrong theme */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=document.documentElement;d.classList.remove("light","dark");if(t==="dark"||t==="light"){d.classList.add(t)}else{d.classList.add(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}}catch(e){}})()`,
          }}
        />
        {accentCss && (
          <style
            id="accent-override"
            dangerouslySetInnerHTML={{ __html: accentCss }}
          />
        )}
      </head>
      <body className="antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--accent-foreground)]">
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
        {analyticsHtml && (
          <Script
            id="analytics"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{ __html: analyticsHtml }}
          />
        )}
      </body>
    </html>
  );
}
