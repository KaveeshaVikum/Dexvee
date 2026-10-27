# Dexvee deployment notes

## Required Netlify function configuration

Set these variables in Netlify under **Site configuration → Environment variables**, with the **Functions** scope enabled. Do not place service-account values or provider API keys in committed source files.

| Variable | Value / purpose |
|---|---|
| `ADMIN_EMAILS` | `dexveeshop@gmail.com` (comma-separated allowlist). Admin access fails closed when this is blank. |
| `FIREBASE_PROJECT_ID` | Firebase project ID used by the server functions. |
| `FIREBASE_CLIENT_EMAIL` | Service-account client email for Firebase Admin. |
| `FIREBASE_PRIVATE_KEY` | Service-account private key. Store as a Netlify secret; escaped `\n` sequences are supported. |
| `CJ_API_TOKEN` | Optional server-side CJ Dropshipping token for live shipping quotes. If unavailable, checkout uses the stated estimated shipping fallback. |

After changing the environment, trigger a fresh Netlify deploy so the Functions receive it. Never expose the Firebase service-account key or CJ token as a `VITE_` client variable.

## Firebase checks

1. Ensure `dexveeshop@gmail.com` is an account in the same Firebase Authentication project and its email is verified. The admin dashboard supports Firebase email/password and Google sign-in; the server checks the verified email against `ADMIN_EMAILS`.
2. Publish the updated root `firestore.rules`. Products remain public-read/server-write, orders are readable only by their owner, and product reviews are public-read/server-write.
3. Confirm the Firebase Admin service account has the Firestore permissions required by the Netlify functions.

## Store information required before taking real payments

The customer support email is configured as `dexveeshop@gmail.com`. Phone, WhatsApp, and social channels remain blank until supplied.

The real bank account details are **not yet configured**. In `src/data/siteContent.js`, set `bankName`, `bankAccountName`, `bankAccountNumber`, and `bankBranch` to the exact details customers should use. Until all four values are supplied, checkout intentionally blocks order placement and tells customers not to transfer money. Do not replace those blanks with sample values.

The public Shipping & Returns page clearly states that detailed return eligibility and processing terms are still unconfirmed. Before presenting a complete return policy, configure the store's actual return eligibility, request window, postage responsibility, refund method/timing, and cancellation terms. Customer return/cancellation buttons create requests for review only; they do not automatically cancel, approve a return, or issue a refund.

## Added routes

- `/account?tab=orders` — customer order tracking, request controls, and review links.
- `/faq` — FAQ page.
- `/shipping-returns` and `/returns` — shipping and return information.
- `/contact` — customer contact page.
- `/admin` — Firebase-authenticated store admin, including the Orders tab.

## Dependency audit follow-up

At validation, `npm audit --omit=dev` reported 12 production dependency advisories (5 high, 7 moderate); the full development tree reported 35 total, including 1 critical development-dependency advisory. The reported remediation for the direct Firebase web SDK requires a major-version change, so no automatic dependency upgrade was applied during this feature work. Plan and test a Firebase/Firebase Admin upgrade before production release, then rerun `npm audit` and the storefront/function checks.
