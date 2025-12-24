'use client';

import { useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ExternalLink } from 'lucide-react';

// Import tier config directly to avoid Stripe SDK loading at build time
const SUBSCRIPTION_TIERS = {
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

type PriceType = 'pro_monthly' | 'pro_yearly' | 'premium_monthly' | 'premium_yearly';

const PRICING = {
  pro: {
    monthly: { price: 8, priceType: 'pro_monthly' as PriceType },
    yearly: { price: 72, priceType: 'pro_yearly' as PriceType, savings: 24 },
  },
  premium: {
    monthly: { price: 15, priceType: 'premium_monthly' as PriceType },
    yearly: { price: 144, priceType: 'premium_yearly' as PriceType, savings: 36 },
  },
};

// Separate component that uses useSearchParams
function BillingMessages() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  return (
    <>
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Thank you for subscribing! Your account has been upgraded.
        </div>
      )}
      {canceled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          Checkout was canceled. No charges were made.
        </div>
      )}
    </>
  );
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const currentTier = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'free';

  const handleCheckout = async (priceType: PriceType) => {
    setIsLoading(priceType);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading('portal');

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No portal URL returned');
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Success/Cancel Messages - wrapped in Suspense */}
      <Suspense fallback={null}>
        <BillingMessages />
      </Suspense>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            <Badge variant={currentTier === 'free' ? 'secondary' : 'default'}>
              {SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS]?.name || 'Free'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {currentTier === 'free'
              ? 'You are on the free plan. Upgrade to unlock more features.'
              : 'You have access to all features in your current plan.'}
          </CardDescription>
        </CardHeader>
        {currentTier !== 'free' && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isLoading === 'portal'}
            >
              {isLoading === 'portal' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
          <Button
            variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 25%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Tier */}
        <Card className={currentTier === 'free' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Get started with basic features</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {SUBSCRIPTION_TIERS.free.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">1 panel, 20 breakers max</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              {currentTier === 'free' ? 'Current Plan' : 'Downgrade'}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Tier */}
        <Card className={`${currentTier === 'pro' ? 'border-primary' : ''} relative`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge>Most Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For serious homeowners</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">
                ${billingInterval === 'monthly' ? PRICING.pro.monthly.price : Math.round(PRICING.pro.yearly.price / 12)}
              </span>
              <span className="text-muted-foreground">/month</span>
              {billingInterval === 'yearly' && (
                <p className="text-sm text-green-600 mt-1">
                  Save ${PRICING.pro.yearly.savings}/year
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {SUBSCRIPTION_TIERS.pro.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentTier === 'pro' ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleCheckout(PRICING.pro[billingInterval].priceType)}
                disabled={isLoading !== null}
              >
                {isLoading === PRICING.pro[billingInterval].priceType ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {currentTier === 'premium' ? 'Downgrade to Pro' : 'Upgrade to Pro'}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Premium Tier */}
        <Card className={currentTier === 'premium' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle>Premium</CardTitle>
            <CardDescription>For professionals & contractors</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">
                ${billingInterval === 'monthly' ? PRICING.premium.monthly.price : Math.round(PRICING.premium.yearly.price / 12)}
              </span>
              <span className="text-muted-foreground">/month</span>
              {billingInterval === 'yearly' && (
                <p className="text-sm text-green-600 mt-1">
                  Save ${PRICING.premium.yearly.savings}/year
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {SUBSCRIPTION_TIERS.premium.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentTier === 'premium' ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleCheckout(PRICING.premium[billingInterval].priceType)}
                disabled={isLoading !== null}
              >
                {isLoading === PRICING.premium[billingInterval].priceType ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Upgrade to Premium
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All plans include a 14-day money-back guarantee.</p>
        <p className="mt-1">
          Questions? Contact us at{' '}
          <a href="mailto:support@circuitmap.com" className="underline">
            support@circuitmap.com
          </a>
        </p>
      </div>
    </div>
  );
}
