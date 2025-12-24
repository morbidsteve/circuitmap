import Stripe from 'stripe';

// Lazy-load stripe to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// For backward compatibility - but prefer getStripe() in new code
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    maxPanels: 1,
    maxBreakersPerPanel: 20,
    features: ['Basic floor plan', 'PDF export', 'Community support'],
  },
  pro: {
    name: 'Pro',
    maxPanels: Infinity,
    maxBreakersPerPanel: Infinity,
    features: [
      'Unlimited panels',
      'Unlimited breakers',
      'Custom floor plan shapes',
      'Photo attachments',
      'Load calculator',
      'Priority support',
      'Share read-only links',
    ],
  },
  premium: {
    name: 'Premium',
    maxPanels: Infinity,
    maxBreakersPerPanel: Infinity,
    features: [
      'Everything in Pro',
      'Multi-user access',
      'Historical tracking',
      'NEC code warnings',
      'API access',
      'White-label PDF exports',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Price IDs from Stripe (set in environment variables)
export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
} as const;

// Map Stripe price IDs to subscription tiers
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === STRIPE_PRICES.pro_monthly || priceId === STRIPE_PRICES.pro_yearly) {
    return 'pro';
  }
  if (priceId === STRIPE_PRICES.premium_monthly || priceId === STRIPE_PRICES.premium_yearly) {
    return 'premium';
  }
  return 'free';
}

// Check if a user can perform an action based on their tier
export function canUserPerformAction(
  tier: SubscriptionTier,
  action: 'createPanel' | 'createBreaker',
  currentCount: number
): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  switch (action) {
    case 'createPanel':
      return currentCount < tierConfig.maxPanels;
    case 'createBreaker':
      return currentCount < tierConfig.maxBreakersPerPanel;
    default:
      return false;
  }
}
