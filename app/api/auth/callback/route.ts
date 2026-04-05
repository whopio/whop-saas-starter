import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { exchangeCodeForTokens, getWhopUser } from "@/lib/whop";
import { setSessionCookie, type Session } from "@/lib/auth";
import { prisma } from "@/db";
import { getConfig } from "@/lib/config";
import { DEFAULT_PLAN, PLAN_KEYS, type PlanKey, APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";

/**
 * GET /api/auth/callback?code=...&state=...
 *
 * Handles the OAuth callback from Whop:
 * 1. Verifies the state parameter matches what we stored
 * 2. Exchanges the authorization code for tokens using PKCE
 * 3. Fetches the user profile from Whop
 * 4. Creates or updates the user in our database
 * 5. If no admin exists yet, makes this user the admin
 * 6. Sets a session cookie (JWT)
 * 7. Redirects to the original destination
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  // Handle OAuth errors from Whop
  if (error) {
    const description = request.nextUrl.searchParams.get("error_description") ?? "";
    return NextResponse.redirect(
      new URL(`/auth-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(description)}`, request.url)
    );
  }

  if (!code || !returnedState) {
    return NextResponse.redirect(
      new URL("/auth-error?error=missing_params", request.url)
    );
  }

  // Retrieve and validate the stored OAuth state
  const cookieStore = await cookies();
  const storedOAuthState = cookieStore.get("oauth_state")?.value;
  if (!storedOAuthState) {
    return NextResponse.redirect(
      new URL("/auth-error?error=expired_session", request.url)
    );
  }

  let codeVerifier: string;
  let expectedState: string;
  let expectedNonce: string;
  let next: string;
  try {
    const parsed = JSON.parse(storedOAuthState);
    codeVerifier = parsed.codeVerifier;
    expectedState = parsed.state;
    expectedNonce = parsed.nonce;
    next = parsed.next || "/dashboard";
  } catch {
    cookieStore.delete("oauth_state");
    return NextResponse.redirect(
      new URL("/auth-error?error=invalid_state", request.url)
    );
  }

  // Clear the OAuth state cookie (always, regardless of outcome)
  cookieStore.delete("oauth_state");

  // Verify state matches to prevent CSRF
  if (returnedState !== expectedState) {
    return NextResponse.redirect(
      new URL("/auth-error?error=state_mismatch", request.url)
    );
  }

  // Build the redirect URI (must match exactly what was sent to /authorize)
  const proto =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  // Get Whop App ID from config
  const whopAppId = await getConfig("whop_app_id");

  try {
    // Exchange the code for tokens
    if (!whopAppId) {
      return NextResponse.redirect(new URL("/auth-error?error=app_not_configured", request.url));
    }
    const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri, whopAppId);

    // Validate the nonce from the id_token to prevent token substitution
    if (expectedNonce && tokens.id_token) {
      try {
        const [, payload] = tokens.id_token.split(".");
        const claims = JSON.parse(atob(payload));
        if (claims.nonce !== expectedNonce) {
          return NextResponse.redirect(
            new URL("/auth-error?error=nonce_mismatch", request.url),
          );
        }
      } catch (e) {
        // If id_token can't be decoded, skip nonce check — userinfo is the
        // authoritative source for identity, and we already verified state + PKCE.
        console.warn("[OAuth Callback] Failed to validate nonce from id_token:", e);
      }
    }

    // Fetch user profile from Whop
    const whopUser = await getWhopUser(tokens.access_token);

    // Check if this is a new user (for welcome email)
    const existingUser = await prisma.user.findUnique({
      where: { whopUserId: whopUser.sub },
      select: { id: true },
    });

    // Upsert user in our database
    const user = await prisma.user.upsert({
      where: { whopUserId: whopUser.sub },
      update: {
        email: whopUser.email ?? null,
        name: whopUser.name ?? whopUser.preferred_username ?? null,
        profileImageUrl: whopUser.picture ?? null,
      },
      create: {
        whopUserId: whopUser.sub,
        email: whopUser.email ?? null,
        name: whopUser.name ?? whopUser.preferred_username ?? null,
        profileImageUrl: whopUser.picture ?? null,
        plan: DEFAULT_PLAN,
      },
    });

    // First-user-is-admin: if no admin exists, promote this user
    let { isAdmin } = user;
    if (!isAdmin) {
      const adminExists = await prisma.user.findFirst({
        where: { isAdmin: true },
        select: { id: true },
      });
      if (!adminExists) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        });
        isAdmin = true;
      }
    }

    // Create a session
    const session: Session = {
      userId: user.id,
      whopUserId: user.whopUserId,
      email: user.email,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      plan: PLAN_KEYS.includes(user.plan as PlanKey)
        ? (user.plan as PlanKey)
        : DEFAULT_PLAN,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      isAdmin,
    };

    await setSessionCookie(session);

    // Send welcome email for new users (runs after response is sent)
    if (!existingUser && user.email) {
      const { email: userEmail, name: userName } = user;
      after(async () => {
        const emailContent = welcomeEmail(userName);
        await sendEmail({ to: userEmail, ...emailContent }).catch((err) =>
          console.error("[Email] Welcome email failed:", err)
        );
      });
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch (err) {
    console.error("[OAuth Callback] Error:", err);
    return NextResponse.redirect(
      new URL("/auth-error?error=exchange_failed", request.url)
    );
  }
}
