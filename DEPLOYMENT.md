# CircuitMap Deployment Guide

## Prerequisites

- GitHub account with repo pushed
- Supabase account
- Stripe account
- Vercel account

---

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Choose a region close to your users
3. Set a strong database password (save it!)
4. Wait for project to be ready (~2 min)

### Get Database URL

1. Go to **Settings → Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

**Format:**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Step 2: Stripe Setup

### API Keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navigate to **Developers → API Keys**
3. Copy:
   - **Publishable key** (`pk_test_...` or `pk_live_...`)
   - **Secret key** (`sk_test_...` or `sk_live_...`)

### Create Products

Go to **Products → + Add product** and create these 4:

| Product Name | Price | Billing Period |
|-------------|-------|----------------|
| CircuitMap Pro (Monthly) | $8.00 | Monthly |
| CircuitMap Pro (Yearly) | $72.00 | Yearly |
| CircuitMap Premium (Monthly) | $15.00 | Monthly |
| CircuitMap Premium (Yearly) | $144.00 | Yearly |

For each:
1. Enter product name
2. Click **Add pricing**
3. Select **Recurring**
4. Enter price amount
5. Select billing period
6. Save

After creating, copy each **Price ID** (looks like `price_1ABC123...`)

---

## Step 3: Vercel Deployment

### Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository
4. **Before deploying**, add environment variables

### Environment Variables

Add these in Vercel's project settings → Environment Variables:

```bash
# Database (from Supabase Step 1)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth (generate secret with: openssl rand -base64 32)
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-generated-secret-here"

# App URL
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Stripe Keys (from Step 2)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Stripe Price IDs (from Step 2)
STRIPE_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_YEARLY_PRICE_ID="price_..."
STRIPE_PREMIUM_MONTHLY_PRICE_ID="price_..."
STRIPE_PREMIUM_YEARLY_PRICE_ID="price_..."

# Webhook (placeholder - update after Step 4)
STRIPE_WEBHOOK_SECRET="whsec_placeholder"
```

### Deploy

Click **Deploy** and wait for build to complete.

**Copy your production URL** (e.g., `https://circuitmap.vercel.app`)

---

## Step 4: Stripe Webhook

Now that you have your Vercel URL:

1. Go to Stripe → **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://your-app.vercel.app/api/webhooks/stripe
   ```
4. Click **Select events** and choose:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`)

---

## Step 5: Update Webhook Secret in Vercel

1. Go to Vercel → Your Project → **Settings → Environment Variables**
2. Find `STRIPE_WEBHOOK_SECRET`
3. Update value to the real `whsec_...` from Step 4
4. Go to **Deployments** → Click the three dots on latest → **Redeploy**

---

## Step 6: Run Database Migration

Option A: Via Vercel CLI
```bash
vercel env pull .env.local
npx prisma db push
```

Option B: Add to build command in `package.json`:
```json
"build": "prisma generate && prisma db push && next build"
```

---

## Local Development

### Setup

```bash
# Copy example env file
cp .env.example .env.local

# Fill in your values (can use same Supabase DB or local Docker)

# Install dependencies
pnpm install

# Generate Prisma client
pnpm exec prisma generate

# Push schema to database
pnpm exec prisma db push

# Run dev server
pnpm dev
```

### Local Stripe Webhooks

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the CLI's webhook secret for local `STRIPE_WEBHOOK_SECRET`.

---

## Going Live (Production Stripe)

When ready for real payments:

1. Complete Stripe account activation
2. Switch API keys from `sk_test_` / `pk_test_` to `sk_live_` / `pk_live_`
3. Create live products (or copy from test mode)
4. Update Price IDs to live ones
5. Create new webhook endpoint for live mode
6. Update all environment variables in Vercel
7. Redeploy

---

## Troubleshooting

### Build fails on Vercel
- Ensure all environment variables are set
- Check that `DATABASE_URL` is correct
- Prisma needs `DATABASE_URL` at build time

### Webhook not working
- Verify endpoint URL is correct
- Check webhook signing secret matches
- View webhook logs in Stripe Dashboard

### Auth not working
- Ensure `NEXTAUTH_URL` matches your domain exactly
- `NEXTAUTH_SECRET` must be set in production

### Database connection issues
- Use connection pooling URL from Supabase (port 6543)
- Ensure password has no special URL characters (or URL-encode them)
