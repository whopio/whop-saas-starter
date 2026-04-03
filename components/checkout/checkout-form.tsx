"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  WhopCheckoutEmbed,
  useCheckoutEmbedControls,
} from "@whop/checkout/react";
import { type PlanKey, type BillingInterval } from "@/lib/constants";
import { monthlyEquivalent } from "@/lib/utils";
import { AppLogo } from "@/components/app-logo";
import { useTheme } from "@/components/theme-provider";
import type { PlanConfig } from "@/lib/config";
import { COUNTRIES } from "@/lib/countries";

// ── Icons ────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[var(--foreground)] shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

// ── Shared input classes ─────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)]";

const inputErrorClass =
  "w-full rounded-lg border border-red-400 dark:border-red-500 bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:border-red-400";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Props ────────────────────────────────────────────────────────────────────

interface CheckoutFormProps {
  planKey: PlanKey;
  plan: PlanConfig;
  whopPlanId: string;
  interval: BillingInterval;
  userEmail: string | null;
  userName: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CheckoutForm({
  planKey,
  plan,
  whopPlanId,
  interval,
  userEmail,
  userName,
}: CheckoutFormProps) {
  const router = useRouter();
  const checkoutControlsRef = useCheckoutEmbedControls();
  const paymentRef = useRef<HTMLDivElement>(null);

  const { resolvedTheme } = useTheme();
  const isLoggedIn = !!userEmail;
  const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const isFree = price === 0;

  // Billing form state (pre-filled from server data)
  const [email, setEmail] = useState(userEmail ?? "");
  const [name, setName] = useState(userName ?? "");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Payment state — embed only mounts after "Continue to Payment"
  const [showPayment, setShowPayment] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Auto-submit free plans as soon as the embed is ready — there's no payment
  // to collect, so don't show the empty embed UI to the user.
  useEffect(() => {
    if (isFree && showPayment && checkoutReady && !isProcessing) {
      handleSubmitPayment();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFree, showPayment, checkoutReady]);

  // Pre-set email and address on the embed as soon as it's ready, so the
  // iframe has time to process before the user clicks Pay.
  useEffect(() => {
    if (!showPayment || !checkoutReady || isFree) return;
    const presetEmbed = async () => {
      try {
        await checkoutControlsRef.current?.setEmail(email);
        await checkoutControlsRef.current?.setAddress({
          name,
          line1: address,
          line2: apartment || undefined,
          city,
          state: state || "",
          postalCode,
          country,
        });
      } catch {
        // Will retry on submit
      }
    };
    presetEmbed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPayment, checkoutReady]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearFieldError(field: string) {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!email.trim()) errors.email = "Email is required";
    else if (!EMAIL_RE.test(email))
      errors.email = "Enter a valid email address";

    // Billing address only required for paid plans
    if (!isFree) {
      if (!name.trim()) errors.name = "Name is required";
      if (!address.trim()) errors.address = "Address is required";
      if (!city.trim()) errors.city = "City is required";
      if (!postalCode.trim()) errors.postalCode = "Postal code is required";
      if (!country) errors.country = "Country is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinueToPayment() {
    if (!validateForm()) return;
    setShowPayment(true);
    if (!isFree) {
      setTimeout(() => {
        paymentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    }
  }

  async function handleSubmitPayment() {
    setIsProcessing(true);
    setPaymentError(null);
    setFormErrors({});

    try {
      await checkoutControlsRef.current?.setEmail(email);
      if (!isFree) {
        await checkoutControlsRef.current?.setAddress({
          name,
          line1: address,
          line2: apartment || undefined,
          city,
          state: state || "",
          postalCode,
          country,
        });
        // Brief delay so the embed iframe can process the address
        await new Promise((r) => setTimeout(r, 100));
      }
      await checkoutControlsRef.current?.submit();
    } catch (err) {
      console.error("Payment submission failed:", err);
      setPaymentError(isFree ? "Something went wrong. Please try again." : "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  }

  function handleComplete(_planId: string, receiptId?: string) {
    router.push(
      `/checkout/success?plan=${planKey}&receipt=${receiptId ?? ""}`
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <Link href="/">
          <AppLogo />
        </Link>
        <Link
          href="/pricing"
          className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          Back to Pricing
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-[960px] flex flex-col lg:flex-row lg:gap-12">
          {/* ── Left column: Form + Payment ───────────────────────────── */}
          <div className="flex-1 max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">
            <div className="animate-slide-up space-y-6">
              {/* ── Contact ────────────────────────────────────────────── */}
              <div>
                <h2 className="text-sm font-semibold mb-3">Contact</h2>
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder="Email address"
                    aria-label="Email address"
                    aria-invalid={!!formErrors.email}
                    aria-describedby={formErrors.email ? "checkout-email-error" : undefined}
                    disabled={isLoggedIn}
                    autoComplete="email"
                    spellCheck={false}
                    className={`${formErrors.email ? inputErrorClass : inputClass} ${isLoggedIn ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                  {formErrors.email && (
                    <p id="checkout-email-error" className="mt-1.5 text-xs text-red-500" role="alert">
                      {formErrors.email}
                    </p>
                  )}
                  {isLoggedIn && (
                    <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                      Signed in as {userName ?? email}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Billing address (paid plans only) ───────────────── */}
              {!isFree && (
                <div>
                  <h2 className="text-sm font-semibold mb-3">Billing address</h2>
                  <div className="space-y-3">
                    {/* Country */}
                    <div>
                      <select
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          clearFieldError("country");
                        }}
                        aria-label="Country"
                        aria-invalid={!!formErrors.country}
                        aria-describedby={formErrors.country ? "checkout-country-error" : undefined}
                        className={
                          formErrors.country ? inputErrorClass : inputClass
                        }
                      >
                        <option value="" disabled>
                          Select country
                        </option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.country && (
                        <p id="checkout-country-error" className="mt-1 text-xs text-red-500" role="alert">
                          {formErrors.country}
                        </p>
                      )}
                    </div>

                    {/* Full name */}
                    <div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearFieldError("name");
                        }}
                        placeholder="Full name"
                        aria-label="Full name"
                        aria-invalid={!!formErrors.name}
                        aria-describedby={formErrors.name ? "checkout-name-error" : undefined}
                        autoComplete="name"
                        className={
                          formErrors.name ? inputErrorClass : inputClass
                        }
                      />
                      {formErrors.name && (
                        <p id="checkout-name-error" className="mt-1 text-xs text-red-500" role="alert">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          clearFieldError("address");
                        }}
                        placeholder="Address"
                        aria-label="Address"
                        aria-invalid={!!formErrors.address}
                        aria-describedby={formErrors.address ? "checkout-address-error" : undefined}
                        autoComplete="address-line1"
                        className={
                          formErrors.address ? inputErrorClass : inputClass
                        }
                      />
                      {formErrors.address && (
                        <p id="checkout-address-error" className="mt-1 text-xs text-red-500" role="alert">
                          {formErrors.address}
                        </p>
                      )}
                    </div>

                    {/* Apartment (optional) */}
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="Apartment, suite, etc. (optional)"
                      aria-label="Apartment, suite, etc."
                      autoComplete="address-line2"
                      className={inputClass}
                    />

                    {/* City / State / Postal code */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            clearFieldError("city");
                          }}
                          placeholder="City"
                          aria-label="City"
                          aria-invalid={!!formErrors.city}
                          aria-describedby={formErrors.city ? "checkout-city-error" : undefined}
                          autoComplete="address-level2"
                          className={
                            formErrors.city ? inputErrorClass : inputClass
                          }
                        />
                        {formErrors.city && (
                          <p id="checkout-city-error" className="mt-1 text-xs text-red-500" role="alert">
                            {formErrors.city}
                          </p>
                        )}
                      </div>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        aria-label="State"
                        autoComplete="address-level1"
                        className={inputClass}
                      />
                      <div>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(e.target.value);
                            clearFieldError("postalCode");
                          }}
                          placeholder="Postal code"
                          aria-label="Postal code"
                          aria-invalid={!!formErrors.postalCode}
                          aria-describedby={formErrors.postalCode ? "checkout-postalcode-error" : undefined}
                          autoComplete="postal-code"
                          className={
                            formErrors.postalCode ? inputErrorClass : inputClass
                          }
                        />
                        {formErrors.postalCode && (
                          <p id="checkout-postalcode-error" className="mt-1 text-xs text-red-500" role="alert">
                            {formErrors.postalCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Payment / Confirmation section ─────────────────────── */}
              <div ref={paymentRef}>
                {!isFree && <h2 className="text-sm font-semibold mb-3">Payment</h2>}

                {!showPayment ? (
                  <>
                    <div className={isFree ? "" : "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"}>
                      <button
                        type="button"
                        onClick={handleContinueToPayment}
                        className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
                      >
                        {isFree ? "Get Started Free" : "Continue to Payment"}
                      </button>
                    </div>
                    {!isFree && (
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-[var(--muted)]">
                        <LockIcon />
                        <span className="text-[11px]">
                          Secure checkout powered by Whop
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* For free plans, the embed auto-submits once ready (see useEffect).
                        The embed is still visible because Whop may show a 2FA/verification
                        step for existing users that requires interaction. */}
                    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <WhopCheckoutEmbed
                        ref={checkoutControlsRef}
                        planId={whopPlanId}
                        hideEmail
                        hideAddressForm
                        hideSubmitButton
                        hidePrice
                        skipRedirect
                        onStateChange={(s) =>
                          setCheckoutReady(s === "ready")
                        }
                        onComplete={handleComplete}
                        onAddressValidationError={(error) => {
                          const msg = error.error_message?.toLowerCase() ?? "";
                          if (msg.includes("name")) {
                            setFormErrors((prev) => ({ ...prev, name: error.error_message }));
                          } else if (msg.includes("address") || msg.includes("line")) {
                            setFormErrors((prev) => ({ ...prev, address: error.error_message }));
                          } else if (msg.includes("city")) {
                            setFormErrors((prev) => ({ ...prev, city: error.error_message }));
                          } else if (msg.includes("postal") || msg.includes("zip")) {
                            setFormErrors((prev) => ({ ...prev, postalCode: error.error_message }));
                          } else {
                            setPaymentError(error.error_message);
                          }
                          setIsProcessing(false);
                        }}
                        prefill={{ email }}
                        theme={resolvedTheme}
                        styles={{
                          container: {
                            paddingTop: 0,
                            paddingBottom: 0,
                          },
                        }}
                        fallback={
                          <div className="flex h-32 items-center justify-center">
                            <p className="text-xs text-[var(--muted)]">
                              Loading payment form\u2026
                            </p>
                          </div>
                        }
                      />
                    </div>

                    {isFree ? (
                      /* Free plans: auto-submit handles it, just show errors if any */
                      <>
                        {paymentError && (
                          <div className="mt-3 text-center">
                            <p className="text-xs text-red-500">{paymentError}</p>
                            <button
                              type="button"
                              onClick={handleSubmitPayment}
                              className="mt-3 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
                            >
                              Try Again
                            </button>
                          </div>
                        )}
                        {!paymentError && isProcessing && (
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                            <p className="text-xs text-[var(--muted)]">
                              Setting up your account\u2026
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Standard payment flow for paid plans */
                      <>
                        {paymentError && (
                          <p className="mt-3 text-xs text-red-500">
                            {paymentError}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={handleSubmitPayment}
                          disabled={isProcessing || !checkoutReady}
                          className="mt-4 w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? "Processing\u2026" : `Pay $${price}`}
                        </button>

                        <div className="mt-3 flex items-center justify-center gap-1.5 text-[var(--muted)]">
                          <LockIcon />
                          <span className="text-[11px]">
                            Secure checkout powered by Whop
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column: Order summary (desktop) ─────────────────── */}
          <div className="hidden lg:block lg:w-[320px] lg:shrink-0 order-3 lg:order-2">
            <div className="sticky top-10 animate-slide-up delay-100">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h2 className="text-sm font-semibold mb-4">Order summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Plan</span>
                    <span className="font-medium">{plan.name}</span>
                  </div>
                  {!isFree && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Billing</span>
                      <span className="font-medium capitalize">{interval}</span>
                    </div>
                  )}
                  <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-semibold">
                      {isFree ? (
                        "Free"
                      ) : (
                        <>
                          ${price}
                          <span className="text-xs font-normal text-[var(--muted)] ml-0.5">
                            /{interval === "yearly" ? "yr" : "mo"}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  {interval === "yearly" && price > 0 && (
                    <p className="text-[11px] text-[var(--muted)] text-right">
                      ${monthlyEquivalent(price)}/mo billed yearly
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
                    What&apos;s included
                  </p>
                  <ul className="space-y-1.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-[var(--muted)]"
                      >
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile order summary ───────────────────────────────────── */}
          <div className="mb-6 lg:hidden order-1">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{plan.name} Plan</h2>
                  <p className="text-xs text-[var(--muted)] capitalize">
                    {isFree ? "No credit card required" : `${interval} billing`}
                  </p>
                </div>
                <div className="text-right">
                  {isFree ? (
                    <span className="text-lg font-semibold">Free</span>
                  ) : (
                    <>
                      <span className="text-lg font-semibold">${price}</span>
                      <span className="text-xs text-[var(--muted)]">
                        /{interval === "yearly" ? "yr" : "mo"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
