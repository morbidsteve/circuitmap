import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import {
  Zap,
  MapPin,
  Layers,
  Share2,
  Shield,
  Smartphone,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container py-20 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Map Your Home&apos;s{' '}
                <span className="text-primary">Electrical System</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Know exactly which breaker controls every outlet, light, and
                appliance in your home. Never flip the wrong breaker again.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="mt-16 mx-auto max-w-4xl">
              <div className="relative rounded-xl border bg-card p-4 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {/* Mini Panel Preview */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Electrical Panel
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex gap-2"
                      >
                        <div className="h-6 w-12 rounded bg-gradient-to-b from-gray-200 to-gray-300 border border-gray-400 flex items-center justify-center text-[10px] font-bold">
                          {i * 5}A
                        </div>
                        <div className="h-6 w-12 rounded bg-gradient-to-b from-gray-200 to-gray-300 border border-gray-400 flex items-center justify-center text-[10px] font-bold">
                          {(i * 5) + 5}A
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mini Floor Plan Preview */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Connected Devices
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['Kitchen', 'Living Room', 'Bedroom', 'Bathroom'].map((room) => (
                        <div
                          key={room}
                          className="rounded bg-muted p-2 text-[10px] text-center"
                        >
                          {room}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need to Map Your Circuits
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simple, visual tools to document your electrical system and
                access it from anywhere.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Visual Panel Mapping
                  </h3>
                  <p className="text-muted-foreground">
                    See your electrical panel exactly as it looks in real life.
                    Click any breaker to see what it controls.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Device Tracking
                  </h3>
                  <p className="text-muted-foreground">
                    Map every outlet, light fixture, and appliance to its
                    circuit. Know exactly what&apos;s connected where.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Multi-Property Support
                  </h3>
                  <p className="text-muted-foreground">
                    Manage multiple homes, rental properties, or buildings. Keep
                    all your electrical maps in one place.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Safety Information
                  </h3>
                  <p className="text-muted-foreground">
                    Track GFCI and AFCI protection, circuit loads, and breaker
                    ratings. Stay informed about your electrical safety.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Share & Export
                  </h3>
                  <p className="text-muted-foreground">
                    Share read-only access with family members or electricians.
                    Export to PDF for offline reference.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Access Anywhere
                  </h3>
                  <p className="text-muted-foreground">
                    Works on any device. Pull up your panel map on your phone
                    while standing at the breaker box.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Map Your Circuits?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start for free. No credit card required.
              </p>
              <div className="mt-8">
                <Link href="/auth/signup">
                  <Button size="lg">Create Free Account</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">CircuitMap</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CircuitMap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
