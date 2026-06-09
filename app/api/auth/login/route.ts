import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildAuthorizationUrl } from "@/lib/whop";
import { getConfig, getWhopEnvironment, isSetupComplete } from "@/lib/config";

/**
 * GET /api/auth/login?next=/dashboard
 *
 * Initiates the Whop OAuth 2.1 + PKCE flow.
 * Stores the PKCE code_verifier and redirect path in a secure cookie.
 */
export async function GET(request: NextRequest) {
  // Check if setup is complete
  const setupDone = await isSetupComplete();
  if (!setupDone) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // Get Whop App ID from config (DB or env)
  const whopAppId = await getConfig("whop_app_id");
  if (!whopAppId) {
    const url = new URL("/auth-error", request.url);
    url.searchParams.set("error", "missing_config");
    return NextResponse.redirect(url);
  }

  // Where to redirect after login
  let next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/dashboard";
  }

  // Build the callback URL from the request origin
  const proto =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  // Generate PKCE values and build the authorization URL
  const environment = await getWhopEnvironment();
  const { url, codeVerifier, state, nonce } = await buildAuthorizationUrl(redirectUri, whopAppId, {
    environment,
  });

  // Store PKCE verifier, nonce, and redirect path in a cookie (httpOnly, short-lived)
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", JSON.stringify({ codeVerifier, state, nonce, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes — enough time to complete OAuth
    path: "/",
  });

  return NextResponse.redirect(url);
}
