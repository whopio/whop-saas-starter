// ---------------------------------------------------------------------------
// Email — app-specific wrapper around whop-kit/email
// ---------------------------------------------------------------------------
// Reads provider config from the DB/env, then delegates to whop-kit.
// ---------------------------------------------------------------------------

import { sendEmail as _sendEmail } from "whop-kit/email";
import type { EmailProvider, SendEmailResult } from "whop-kit/email";
import { getConfig } from "./config";

export type { EmailProvider, SendEmailResult };

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email via the configured provider (Resend or SendGrid).
 * Reads config from DB/env automatically.
 * Returns { success: false } if no email provider is configured.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const [provider, apiKey, fromAddress] = await Promise.all([
    getConfig("email_provider"),
    getConfig("email_api_key"),
    getConfig("email_from_address"),
  ]);

  if (!provider || !apiKey) {
    console.warn("[Email] No email provider configured — skipping send");
    return { success: false, error: "Email provider not configured" };
  }

  const from = options.from || fromAddress;
  if (!from) {
    console.warn("[Email] No from address configured — skipping send");
    return { success: false, error: "Email from address not configured" };
  }

  return _sendEmail(
    { provider: provider as EmailProvider, apiKey },
    { ...options, from },
  );
}
