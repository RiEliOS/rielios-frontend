import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  'Income & expense tracking',
  'Budget management by category',
  'Unlimited savings goals',
  'Investment portfolio monitoring',
  'Personal goal tracking',
  'Life area organisation',
  'Financial reports & insights',
  'Secure account with JWT auth',
  'All future features included',
]

export default function PricingPage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="border-b bg-muted/30 py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Simple pricing</h1>
          <p className="text-lg text-muted-foreground">
            One plan. Everything included. Free forever.
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="py-20 lg:py-28">
        <div className="max-w-sm mx-auto px-6">
          <Card className="border-2 border-primary shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
            <CardHeader className="text-center pb-2 pt-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full mx-auto mb-3">
                ✦ Most popular
              </div>
              <CardTitle className="text-xl">Free Plan</CardTitle>
              <div className="pt-3">
                <span className="text-5xl font-extrabold">$0</span>
                <span className="text-muted-foreground text-sm ml-1">/ forever</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">No credit card. No catch. No expiry.</p>
            </CardHeader>
            <CardContent className="space-y-5 pb-8">
              <ul className="space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" size="lg" asChild>
                <Link to="/register">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/30 py-20 lg:py-24">
        <div className="max-w-2xl mx-auto px-6 space-y-10">
          <h2 className="text-2xl font-bold text-center">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is RiEliOS really free?',
                a: 'Yes, completely. All features are available at no cost and we have no plans to charge for core functionality.',
              },
              {
                q: 'Will my data be private?',
                a: 'Absolutely. Your financial data is stored securely and is never sold or shared with third parties.',
              },
              {
                q: 'Can I export my data?',
                a: 'Data export is on our roadmap. Your data always belongs to you.',
              },
              {
                q: 'What happens if I delete my account?',
                a: 'All your data is permanently deleted from our servers — no backups retained.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b pb-6 last:border-0 space-y-2">
                <h3 className="font-semibold">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
