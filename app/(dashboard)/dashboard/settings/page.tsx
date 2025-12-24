'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Crown, Loader2, ExternalLink } from 'lucide-react'

const TIER_NAMES: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [isManaging, setIsManaging] = useState(false)

  const currentTier = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'free'

  const handleManageSubscription = async () => {
    setIsManaging(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No portal URL returned')
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsManaging(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-medium text-primary">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-lg">{session?.user?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Your current plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <Badge variant={currentTier === 'free' ? 'secondary' : 'default'} className="mt-1">
                  {TIER_NAMES[currentTier] || 'Free'}
                </Badge>
              </div>
              {currentTier !== 'free' && (
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isManaging}
                >
                  {isManaging ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Manage
                </Button>
              )}
            </div>
            {currentTier === 'free' ? (
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro or Premium for more features. Visit the{' '}
                <a href="/dashboard/billing" className="underline hover:text-foreground">
                  billing page
                </a>{' '}
                to upgrade.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click Manage to update payment methods, view invoices, or cancel your subscription.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Account Actions Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" disabled>
                Change Password
              </Button>
              <Button variant="outline" disabled>
                Export Data
              </Button>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              These features are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
