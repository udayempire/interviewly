# Dodo Payments and Interviewlyy Credits

This document describes how Dodo Payments is connected to Interviewlyy and how a successful payment becomes credits in a user account.

## The ownership boundary

Dodo Payments is responsible for:

- Hosted checkout and payment collection
- Product pricing
- Tax and Merchant of Record responsibilities
- Sending payment webhooks

Interviewlyy is responsible for:

- Mapping a checkout selection to a Dodo product
- Deciding how many credits the purchase grants
- Storing the user balance in PostgreSQL
- Recording credit transactions
- Preventing duplicate webhook grants

Dodo products do not need to contain the number of Interviewlyy credits they grant. The credit entitlement is carried in checkout metadata and is applied by the verified Interviewlyy webhook.

## Current purchase flow

```text
Pricing UI
  -> user selects a credit pack
  -> POST /api/v1/payments/checkout { credits }
  -> backend selects DODO_PRODUCT_ID_<credits>
  -> backend creates a Dodo hosted checkout session
  -> checkout metadata includes userId, credits, and creditReason
  -> user pays on Dodo
  -> Dodo sends payment.succeeded
  -> Interviewlyy verifies the webhook signature
  -> Interviewlyy deduplicates webhook-id
  -> Interviewlyy converts credits to minutes
  -> UserCredit balance is incremented
  -> CreditTransaction is recorded as PURCHASED
  -> user is returned to /home
```

The browser redirect is not proof of payment. Credits are granted only after the verified `payment.succeeded` webhook is processed.

## Where the code lives

### Pricing definitions

The practice packs shown in the UI are defined in:

```text
apps/web/components/landing/pricing-data.ts
```

The current packs are:

```ts
{ name: "One Shot", credits: 1, price: "1", ... }
{ name: "Interview Ready", credits: 10, price: "8", ... }
{ name: "Offer Ready", credits: 20, price: "15", ... }
```

The `price` field is display text. It does not charge the customer by itself. The actual amount charged comes from the Dodo product selected by the backend.

### Checkout endpoint

The frontend calls:

```http
POST /api/v1/payments/checkout
```

with:

```json
{
  "credits": 10
}
```

The backend implementation is:

```text
apps/backend/src/routes/payments.route.ts
```

It performs these actions:

1. Requires an authenticated user.
2. Reads the requested credit amount.
3. Looks up `DODO_PRODUCT_ID_<credits>`.
4. Creates a Dodo hosted checkout session against the configured test/live API.
5. Adds this metadata:

```json
{
  "userId": "...",
  "credits": "10",
  "creditReason": "PURCHASE_INTERVIEW_READY"
}
```

6. Returns Dodo’s `checkout_url` to the frontend.

### Webhook verification and forwarding

There are two supported webhook paths in the repository.

#### Next.js forwarding path

```http
POST /api/webhooks/dodo
```

Implementation:

```text
apps/web/app/api/webhooks/dodo/route.ts
```

This route:

1. Reads the raw request body.
2. Verifies `webhook-id`, `webhook-signature`, and `webhook-timestamp`.
3. Forwards the verified raw event to the backend.

The backend forwarding endpoint is:

```http
POST /api/webhooks/dodo/forward
```

It is protected by `DODO_PAYMENTS_FORWARD_SECRET`.

#### Direct backend path

```http
POST /api/webhooks/dodo
```

Implementation:

```text
apps/backend/src/routes/dodo-webhook.route.ts
```

This path verifies the Dodo signature directly in Express using the raw body. Use one deliberate production path and configure Dodo to send to that path. Do not accidentally configure both paths for the same events unless the webhook ID deduplication is intentionally relied upon.

The backend mounts webhook routes before `express.json()` so the raw body remains available for signature verification.

### Webhook processing

Implementation:

```text
apps/backend/src/services/dodo-webhook.service.ts
```

For `payment.succeeded`, Interviewlyy:

1. Resolves the user using checkout metadata `userId`, Dodo customer ID, or email.
2. Reads `metadata.credits` or `metadata.minutes`.
3. Converts credits to internal minutes using `MINUTES_PER_CREDIT`.
4. In one database transaction:
   - increments `UserCredit.balance`;
   - creates a `CreditTransaction` with type `PURCHASED`.

The Dodo webhook ID is stored in `DodoWebhookEvent` as a unique key. If Dodo retries the same event, the duplicate is ignored and the user is not granted credits twice.

Payment failures, processing events, cancellations, refunds, and disputes are currently recorded for auditability, but they do not automatically reverse purchased credits. Refund/dispute credit reversal must follow a defined product policy before being enabled.

## Credit units

Interviewlyy stores balances internally as minutes:

```env
MINUTES_PER_CREDIT=15
```

Therefore:

```text
1 credit = 15 stored minutes
10 credits = 150 stored minutes
20 credits = 300 stored minutes
```

The current interview start path charges `INTERVIEW_COST_CREDITS` converted to minutes. By default:

```env
INTERVIEW_COST_CREDITS=1
```

The displayed balance endpoint is:

```http
GET /api/v1/credits/balance
```

It returns both `balanceMinutes` and display `balanceCredits`.

## How to change the free signup bonus

Change the backend environment variable:

```env
SIGNUP_BONUS_CREDITS=3
```

Then restart or redeploy the backend. This applies only to new users. It does not modify existing balances.

## How to change how many credits a paid pack gives

You do not need to write the credit amount into the Dodo product.

For example, to change the 10-credit pack to 15 credits:

### 1. Update the frontend pack

```ts
// apps/web/components/landing/pricing-data.ts
{ name: "Interview Ready", credits: 15, price: "8", ... }
```

### 2. Configure the matching product lookup

```env
DODO_PRODUCT_ID_15=<the Dodo product ID to charge>
```

This can point to the existing Dodo product if the price remains the same. If the price changes, update the actual Dodo product price too.

### 3. Deploy/restart the backend

The backend must receive the new environment variable before checkout is attempted.

### 4. Keep the displayed price synchronized

If Dodo charges a new price, update the `price` display value in `pricing-data.ts` as well. The frontend display and Dodo’s actual product price are separate sources and can drift if only one is changed.

The webhook will grant the amount sent in checkout metadata. Existing user balances and previously purchased packs are not changed.

## Environment variables

Keep these values server-side and out of `NEXT_PUBLIC_*` variables:

```env
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_KEY=dodo_test_...
DODO_PAYMENTS_WEBHOOK_KEY=...
DODO_PAYMENTS_RETURN_URL=https://your-frontend.example/home
DODO_WEBHOOK_FORWARD_URL=https://your-backend.example/api/webhooks/dodo/forward
DODO_PAYMENTS_FORWARD_SECRET=...

DODO_PRODUCT_ID_1=...
DODO_PRODUCT_ID_10=...
DODO_PRODUCT_ID_20=...
```

Use separate API keys, webhook secrets, product IDs, and webhook configurations for test and live mode. Never use a test product ID with a live API key or the reverse.

## Safe change checklist

Before changing a pack:

- Decide whether the change is to credits, price, or both.
- Update `pricing-data.ts`.
- Add or update `DODO_PRODUCT_ID_<credits>` in the backend environment.
- Update the actual Dodo product price if required.
- Check the checkout metadata contains the intended credit amount.
- Test a successful payment in Dodo test mode.
- Confirm exactly one `CreditTransaction` is created.
- Confirm the user’s `/credits/balance` response increases correctly.
- Confirm a duplicate webhook does not grant credits twice.
- Deploy test and live configuration separately.

## Important rules

- Never grant credits from the browser redirect alone.
- Never process an unverified webhook.
- Never parse a webhook after `express.json()` has consumed the raw body.
- Keep Dodo product pricing and Interviewlyy credit grants conceptually separate.
- Do not change `MINUTES_PER_CREDIT` casually; it changes the meaning of stored balances globally.
- If changing the allowed credit amounts, consider updating the backend’s `creditReason` mapping so analytics continue to classify purchases correctly.
