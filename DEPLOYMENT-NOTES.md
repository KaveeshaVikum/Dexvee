# Dexvee deployment notes

## Netlify function environment

Set these in Netlify under **Site configuration → Environment variables**, with the **Functions** scope enabled. Keep service-account values and supplier API tokens private; never configure them with a `VITE_` prefix.

| Variable | Purpose |
|---|---|
| `ADMIN_EMAILS` | Comma-separated allowlist of verified Firebase admin email addresses. Access fails closed when blank. |
| `FIREBASE_PROJECT_ID` | Firebase project ID used by the server functions. |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service-account client email. |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin service-account private key. Store as a secret; escaped `\\n` sequences are supported. |
| `CJ_API_TOKEN` | Private CJ Dropshipping token used by server functions. Live shipping quotes fall back to estimated shipping when this is unset. |

The configured admin address is also deliberately shown as the customer-support address on the public site. Netlify's scanner therefore reports the `ADMIN_EMAILS` value as a match in public source/docs; it is not a credential. To allow this intentional duplicate without disabling scanning for other keys, add this Netlify environment variable:

```text
SECRETS_SCAN_OMIT_KEYS=ADMIN_EMAILS
```

Do not disable the entire secrets scanner. Keep the actual `ADMIN_EMAILS` allowlist configured, and redeploy after changing the environment. Remove any generated patch files (for example, `Dexvee-improvements.patch`) from the production repository; they are local handoff artifacts, not application files.

The deploy log showed `VITE_CJ_API_TOKEN` set. Remove that variable from Netlify. The server functions now read only `CJ_API_TOKEN`. The repository's frontend does not reference `VITE_CJ_API_TOKEN`, but any `VITE_` variable should be treated as potentially browser-visible; rotate the CJ token if it was ever included in a client bundle or otherwise exposed.

## Firebase checks

1. Ensure each `ADMIN_EMAILS` entry is a verified account in the same Firebase Authentication project. The admin dashboard supports Firebase email/password and Google sign-in; the server checks the verified email against the allowlist.
2. Publish the updated root `firestore.rules`. Products remain public-read/server-write, orders are readable only by their owner, and product reviews are public-read/server-write.
3. Confirm the Firebase Admin service account has the Firestore permissions required by the Netlify functions.

## Store information required before taking real payments

The store support email is configured in `src/data/siteContent.js`. Phone, WhatsApp, and social channels remain blank until supplied.

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
