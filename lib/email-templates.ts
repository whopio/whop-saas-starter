// ---------------------------------------------------------------------------
// Email templates — app-specific content using whop-kit helpers
// ---------------------------------------------------------------------------

import { escapeHtml, emailWrapper } from "whop-kit/email";
import { APP_NAME } from "./constants";

function greeting(name: string | null): string {
  return name ? `Hi ${escapeHtml(name)},` : "Hi there,";
}

function wrapper(body: string): string {
  return emailWrapper(body, APP_NAME);
}

// ---------------------------------------------------------------------------
// Welcome email — sent on first sign-up via OAuth
// ---------------------------------------------------------------------------

export function welcomeEmail(name: string | null) {
  return {
    subject: `Welcome to ${APP_NAME}!`,
    html: wrapper(`
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b">${greeting(name)}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46">
        Thanks for signing up for ${escapeHtml(APP_NAME)}. Your account is ready to go.
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#3f3f46">
        Head to your dashboard to get started.
      </p>
      <p style="margin:0;font-size:13px;color:#71717a">
        If you didn&rsquo;t create this account, you can safely ignore this email.
      </p>
    `),
  };
}

// ---------------------------------------------------------------------------
// Payment failed — sent when a Whop payment_failed webhook fires
// ---------------------------------------------------------------------------

export function paymentFailedEmail(name: string | null) {
  return {
    subject: `Action needed: Payment failed — ${APP_NAME}`,
    html: wrapper(`
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b">${greeting(name)}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46">
        We were unable to process your latest payment for ${escapeHtml(APP_NAME)}.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46">
        Please update your billing information to keep your subscription active.
        If the payment continues to fail, your plan may be downgraded.
      </p>
      <p style="margin:0;font-size:13px;color:#71717a">
        If you believe this is an error, please contact support.
      </p>
    `),
  };
}
