import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Target, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const VALUES = [
  {
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    title: 'Built for real people',
    desc: 'Not for Wall Street, not for accountants — RiEliOS is designed for everyday people who want clarity over their money and life.',
  },
  {
    icon: Target,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    title: 'Goal-first philosophy',
    desc: 'Your finances should serve your goals, not the other way around. Every feature is built with your ambitions in mind.',
  },
  {
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    title: 'Private by design',
    desc: 'Your data belongs to you. We never sell your information and you remain in full control of everything you share.',
  },
  {
    icon: Zap,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    title: 'Simple & fast',
    desc: 'We obsess over removing friction. Logging an expense should take seconds, not minutes.',
  },
]

export default function AboutPage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="border-b bg-muted/30 py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            About RiEliOS
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            RiEliOS was born from a simple frustration: personal finance apps track numbers,
            but they don't help you build the life you actually want. We set out to change that.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold tracking-tight">The story</h2>
            <p className="text-muted-foreground leading-relaxed">
              We noticed that most finance apps treat money in isolation — they show you a balance,
              maybe a chart, and call it a day. But money is a tool, not a destination. The real
              destination is the life you want to build.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              RiEliOS connects your income, expenses, budgets, savings, investments, and personal
              goals into a single coherent picture. So instead of wondering where your money went,
              you can see where it's going — and why.
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-8 space-y-4">
            {[
              { label: 'Modules built', value: '6' },
              { label: 'Free forever', value: '100%' },
              { label: 'Data ownership', value: 'Yours' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="text-2xl font-bold text-primary">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t bg-muted/30 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight">What we believe in</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, color, bg, title, desc }) => (
              <Card key={title}>
                <CardContent className="p-6 space-y-3">
                  <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t">
        <div className="max-w-xl mx-auto px-6 text-center space-y-5">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="text-muted-foreground">RiEliOS is free. No cards. No limits. Just you and your goals.</p>
          <Button size="lg" asChild>
            <Link to="/register">
              Create your account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  )
}
