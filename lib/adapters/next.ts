// ---------------------------------------------------------------------------
// Next.js cookie adapter for whop-kit
// ---------------------------------------------------------------------------

import { cookies } from "next/headers";
import type { CookieAdapter, CookieOptions } from "whop-kit/auth";

/**
 * Create a CookieAdapter using Next.js `cookies()` from `next/headers`.
 */
export function nextCookieAdapter(): CookieAdapter {
  return {
    async get(name: string) {
      const store = await cookies();
      return store.get(name)?.value;
    },
    async set(name: string, value: string, options: CookieOptions) {
      const store = await cookies();
      store.set(name, value, options);
    },
    async delete(name: string) {
      const store = await cookies();
      store.set(name, "", { maxAge: 0, path: "/" } as CookieOptions);
    },
  };
}
