import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, TrendingUp, Target, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

function MockDashboard() {
  return (
    <div className="bg-white rounded-b-xl text-zinc-900 text-[11px] p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 font-medium">Good morning, Alex</p>
          <p className="font-semibold text-sm">Monday, May 18</p>
        </div>
        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
          +$2,400 net
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Income', val: '$5,200', cls: 'bg-green-50 text-green-700' },
          { label: 'Expenses', val: '$2,800', cls: 'bg-red-50 text-red-700' },
          { label: 'Invested', val: '$600', cls: 'bg-purple-50 text-purple-700' },
          { label: 'Cash left', val: '$1,800', cls: 'bg-blue-50 text-blue-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg p-2.5 ${s.cls.split(' ')[0]}`}>
            <p className={`text-[9px] font-semibold ${s.cls.split(' ')[1]}`}>{s.label}</p>
            <p className={`text-base font-bold leading-tight ${s.cls.split(' ')[1]}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {[
          { name: 'Emergency Fund', pct: 72 },
          { name: 'Vacation · Bali', pct: 45 },
        ].map((g) => (
          <div key={g.name}>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-zinc-700">{g.name}</span>
              <span className="text-zinc-400">{g.pct}%</span>
            </div>
            <Progress value={g.pct} className="h-1.5" />
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t pt-2.5">
        {[
          { label: 'Salary', amt: '+$3,000', color: 'text-green-600' },
          { label: 'Groceries', amt: '-$85', color: 'text-red-500' },
          { label: 'Netflix', amt: '-$15', color: 'text-red-500' },
        ].map((t) => (
          <div key={t.label} className="flex justify-between items-center py-0.5">
            <span className="text-zinc-500">{t.label}</span>
            <span className={`font-semibold ${t.color}`}>{t.amt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-56 rounded-[2.5rem] border-[6px] border-zinc-800 bg-zinc-800 shadow-2xl shadow-zinc-300">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-800 rounded-b-xl z-10" />
      {/* Screen */}
      <div className="rounded-4xl overflow-hidden bg-white">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-6 pb-1 bg-white">
          <span className="text-[9px] font-bold text-zinc-900">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 items-end h-3">
              {[3, 5, 7, 9].map((h, i) => (
                <div key={i} className="w-1 bg-zinc-900 rounded-sm" style={{ height: h }} />
              ))}
            </div>
            <div className="w-4 h-2 border border-zinc-900 rounded-sm relative">
              <div className="absolute left-0.5 top-0.5 bottom-0.5 w-2.5 bg-zinc-900 rounded-sm" />
            </div>
          </div>
        </div>
        {children}
      </div>
      {/* Home indicator */}
      <div className="flex justify-center py-2">
        <div className="w-20 h-1 bg-zinc-600 rounded-full" />
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* ── 1. HERO ── */}
      <section className="bg-white border-b overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <div className="space-y-8">
            <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/8 px-3 py-1.5 rounded-full">
              Personal Finance &amp; Life OS
            </span>

            <h1 className="text-5xl lg:text-6xl font-black leading-none tracking-tighter text-zinc-900">
              One app.<br />
              <span className="text-primary">Every number</span><br />
              that matters.
            </h1>

            <p className="text-zinc-500 text-lg leading-relaxed">
              Income, expenses, savings goals, investments, personal goals, life areas —
              stop juggling five apps and three spreadsheets.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Log in <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6">
              {['Free forever', 'No credit card', 'All features included'].map((t) => (
                <span key={t} className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — phone */}
          <div className="flex justify-center lg:justify-end">
            <PhoneFrame>
              <MockDashboard />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* ── 2. STATS STRIP ── */}
      <section className="bg-zinc-50 border-b">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {[
            { n: '6', label: 'modules in one app' },
            { n: '$0', label: 'cost, forever' },
            { n: '100%', label: 'data ownership' },
            { n: '∞', label: 'goals & entries' },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900">{s.n}</span>
              <span className="text-sm text-zinc-500">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. THE HONEST PROBLEM ── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Sound familiar?</p>
            <h2 className="text-4xl font-black tracking-tight leading-tight text-zinc-900">
              Most people manage money<br />like this.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: '"I track expenses in a spreadsheet I haven\'t opened in two weeks."',
                tag: 'Finance chaos',
                color: 'border-red-200 bg-red-50',
                tag_color: 'bg-red-100 text-red-700',
              },
              {
                quote: '"I have a savings goal in my head. It\'s been there for three years."',
                tag: 'Forgotten goals',
                color: 'border-amber-200 bg-amber-50',
                tag_color: 'bg-amber-100 text-amber-700',
              },
              {
                quote: '"I invest but I genuinely don\'t know if I\'m up or down overall."',
                tag: 'No visibility',
                color: 'border-purple-200 bg-purple-50',
                tag_color: 'bg-purple-100 text-purple-700',
              },
            ].map((p) => (
              <div key={p.tag} className={`rounded-2xl border p-6 space-y-4 ${p.color}`}>
                <p className="text-zinc-700 text-sm leading-relaxed italic">{p.quote}</p>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${p.tag_color}`}>
                  {p.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <p className="text-lg font-bold text-zinc-900 shrink-0">RiEliOS fixes all three.</p>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>
      </section>

      {/* ── 4. MODULE HIGHLIGHTS ── */}
      <section className="border-t bg-zinc-50 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">What's inside</p>
            <h2 className="text-4xl font-black tracking-tight text-zinc-900">Everything in one place.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wallet,
                tag: 'Finance',
                title: 'Know exactly where your money goes.',
                body: 'Log income and expenses, set budget limits per category, and see your net cash flow at a glance.',
                pills: ['Income tracking', 'Expense categories', 'Monthly budgets', 'Net flow'],
                accent: 'bg-green-50 border-green-200',
                iconBg: 'bg-green-100 text-green-700',
              },
              {
                icon: Target,
                tag: 'Goals & Savings',
                title: 'Turn "someday" into a deadline.',
                body: 'Create personal goals tied to life areas, back them with savings pots that track real progress.',
                pills: ['Life area mapping', 'Savings pots', 'Deadline tracking', 'Progress %'],
                accent: 'bg-blue-50 border-blue-200',
                iconBg: 'bg-blue-100 text-blue-700',
              },
              {
                icon: TrendingUp,
                tag: 'Investments',
                title: 'See if your investments are working.',
                body: 'Track every contribution and return. Compare what you planned vs. what actually happened.',
                pills: ['Budget vs contributed', 'Expected vs returned', 'Entry history', 'Stats'],
                accent: 'bg-purple-50 border-purple-200',
                iconBg: 'bg-purple-100 text-purple-700',
              },
            ].map((m) => (
              <div key={m.tag} className={`rounded-2xl border p-7 space-y-5 ${m.accent}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${m.iconBg}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">{m.tag}</p>
                  <h3 className="text-lg font-bold leading-snug text-zinc-900 mb-2">{m.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{m.body}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m.pills.map((p) => (
                    <span key={p} className="text-[10px] px-2.5 py-1 rounded-full bg-white/80 text-zinc-600 font-medium border border-zinc-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">R</span>
            </div>
            <span className="font-semibold text-sm">RiEliOS</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} RiEliOS</p>
        </div>
      </footer>

    </div>
  )
}
