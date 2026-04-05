# Whop Resources & Documentation

## Whop Docs

### Authentication & OAuth
| Topic | Link |
|-------|------|
| OAuth 2.1 + PKCE | https://docs.whop.com/developer/guides/oauth |
| Authentication overview | https://docs.whop.com/developer/guides/authentication |
| API getting started | https://docs.whop.com/developer/api/getting-started |

### Payments & Checkout
| Topic | Link |
|-------|------|
| Embedded checkout (`@whop/checkout`) | https://docs.whop.com/payments/checkout-embed |
| Pre-filled embedded checkout | https://docs.whop.com/third-party-integrations/embedded-checkouts/prefill-embedded-checkouts |
| Set up pricing | https://docs.whop.com/manage-your-business/payment-processing/set-up-pricing |
| SaaS business model guide | https://docs.whop.com/supported-business-models/saas |

### Billing & Subscriptions
| Topic | Link |
|-------|------|
| Billing portal | https://docs.whop.com/payments-and-billing/manage-billing/billing-portal |
| Cancel a subscription | https://docs.whop.com/memberships-and-access/cancellations-and-refunds/cancel-a-subscription |
| Failed payment troubleshooting | https://docs.whop.com/payments-and-billing/payment-issues/troubleshoot-failed-payments |

### Webhooks
| Topic | Link |
|-------|------|
| Webhooks guide | https://docs.whop.com/developer/guides/webhooks |
| `membership_activated` | https://docs.whop.com/api-reference/memberships/membership-activated |
| `membership_deactivated` | https://docs.whop.com/api-reference/memberships/membership-deactivated |
| `membership_cancel_at_period_end_changed` | https://docs.whop.com/api-reference/memberships/membership-cancel-at-period-end-changed |

### API Reference
| Topic | Link |
|-------|------|
| Memberships API | https://docs.whop.com/api-reference/memberships/list-memberships |
| Uncancel membership | https://docs.whop.com/api-reference/memberships/uncancel-membership |
| Cancel membership | https://docs.whop.com/api-reference/memberships/cancel-membership |
| Plans API | https://docs.whop.com/api-reference/plans/create-plan |
| Products API | https://docs.whop.com/api-reference/products/create-product |

### Products & Management
| Topic | Link |
|-------|------|
| Create a product | https://docs.whop.com/manage-your-business/products/create-product |
| Manage products | https://docs.whop.com/manage-your-business/products/manage-products |
| Manage users | https://docs.whop.com/manage-your-business/manage-payments/manage-users |

### AI & MCP
| Topic | Link |
|-------|------|
| Whop MCP setup guide | https://docs.whop.com/developer/guides/ai_and_mcp |

The Whop MCP server enables AI tools (Claude Code, Cursor, etc.) to search Whop docs in real-time via the `mcp__claude_ai_Whop__search_whop_docs` tool.

## Whop Developer Dashboard

- Create and manage apps: https://whop.com/dash
- Configure OAuth, webhooks, plans, and products

## API Endpoints Used by This Template

Base URL: `https://api.whop.com`

| Endpoint | Purpose |
|----------|---------|
| `POST /oauth/token` | Exchange auth code for tokens |
| `GET /oauth/userinfo` | Get user profile (OIDC) |
| `GET /api/v1/users/{id}/access/{resource_id}` | Check user access to product |
| `POST /api/v1/memberships/{id}/uncancel` | Reverse pending cancellation |

## Key Concepts

- **App** — Your application registered with Whop (has an App ID)
- **Plan** — A pricing tier within your app (has a Plan ID)
- **Product** — A purchasable offering (has a Product ID)
- **Membership** — A user's active subscription to a plan
- **Experience** — The user-facing view of your app within Whop (not used in this standalone template)

## This Template vs Whop Apps

This is a **standalone** Next.js app — NOT a Whop iframe app:
- Runs on your own domain, not inside Whop
- Uses OAuth for auth, not Whop's iframe SDK
- Uses `@whop/checkout` embedded checkout component
- Has its own dashboard, not Whop's experience view

For building Whop iframe apps, install the `whop-dev` skill: `npx skills add anthropics/skills@whop-dev -y`
