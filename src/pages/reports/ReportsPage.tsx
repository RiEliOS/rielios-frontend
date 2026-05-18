import { useQuery } from '@tanstack/react-query'
import { FileText, Target, BarChart3, Layers, ArrowRight, Wallet, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface FinanceReport {
  income: { total: number; count: number }
  expenses: { total: number; count: number }
  invested: number
  netBalance: number
  availableCash: number
  expensesByCategory: { categoryId: string | null; categoryName: string | null; total: string }[]
}

interface GoalsReport {
  total: number
  byStatus: Record<string, number>
}

interface InvestmentsReport {
  total: number
  totalBudget: number
  totalInvested: number
  totalReturned: number
  totalExpectedReturn: number
}

interface LifeAreasReport {
  total: number
}

interface BudgetReportItem {
  id: string; categoryName: string; plannedBudget: string; actualSpent: string
  variance: string; overage: string; usedPct: number; isOver: boolean; month: number; year: number
}
interface BudgetReport {
  total: number; overCount: number; totalPlanned: number; totalSpent: number; totalVariance: number
  items: BudgetReportItem[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${color ?? 'text-zinc-800'}`}>{value}</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 mt-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-6 animate-pulse bg-zinc-100 rounded-lg" />
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const { data: finance, isLoading: loadingFinance } = useQuery<FinanceReport>({
    queryKey: ['reports-finance'],
    queryFn: () => api.get('/reports/finance').then((r) => r.data),
  })

  const { data: goals, isLoading: loadingGoals } = useQuery<GoalsReport>({
    queryKey: ['reports-goals'],
    queryFn: () => api.get('/reports/goals').then((r) => r.data),
  })

  const { data: inv, isLoading: loadingInv } = useQuery<InvestmentsReport>({
    queryKey: ['reports-investments'],
    queryFn: () => api.get('/reports/investments').then((r) => r.data),
  })

  const { data: areas, isLoading: loadingAreas } = useQuery<LifeAreasReport>({
    queryKey: ['reports-life-areas'],
    queryFn: () => api.get('/reports/life-areas').then((r) => r.data),
  })

  const { data: budgetReport, isLoading: loadingBudgets } = useQuery<BudgetReport>({
    queryKey: ['reports-budgets'],
    queryFn: () => api.get('/reports/budgets').then((r) => r.data),
  })

  const topCategories = finance?.expensesByCategory
    .filter((c) => parseFloat(c.total) > 0)
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
    .slice(0, 5) ?? []

  const goalStatuses = ['active', 'completed', 'paused', 'cancelled']

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-500 mt-1">Analytics and insights across your life OS</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Finance */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-primary" />
            <p className="font-bold text-zinc-800">Finance Summary</p>
          </div>
          <p className="text-xs text-zinc-400 mb-4">All-time financial overview</p>
          {loadingFinance ? <LoadingSkeleton /> : (
            <div>
              <div className="divide-y divide-zinc-100">
                <StatRow label="Total Income" value={fmt(finance?.income.total ?? 0)} color="text-green-600" />
                <StatRow label="Total Expenses" value={fmt(finance?.expenses.total ?? 0)} color="text-red-600" />
                <StatRow label="Total Invested" value={fmt(finance?.invested ?? 0)} color="text-blue-600" />
                <StatRow
                  label="Net Balance"
                  value={fmt(finance?.netBalance ?? 0)}
                  color={(finance?.netBalance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
                />
                <StatRow
                  label="Available Cash"
                  value={fmt(finance?.availableCash ?? 0)}
                  color={(finance?.availableCash ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}
                />
              </div>
              {topCategories.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-zinc-400 mb-2">Top Expense Categories</p>
                  <div className="space-y-2">
                    {topCategories.map((c, i) => {
                      const pct = finance ? (parseFloat(c.total) / finance.expenses.total) * 100 : 0
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-zinc-700">{c.categoryName ?? 'Uncategorized'}</span>
                            <span className="text-zinc-500">{fmt(parseFloat(c.total))}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-5 w-5 text-primary" />
            <p className="font-bold text-zinc-800">Goals Summary</p>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Personal goal progress</p>
          {loadingGoals ? <LoadingSkeleton /> : (
            <div>
              <p className="text-2xl font-black text-zinc-800 mb-3">{goals?.total ?? 0} <span className="text-base font-normal text-zinc-400">goals</span></p>
              <div className="space-y-2">
                {goalStatuses.map((s) => {
                  const count = goals?.byStatus[s] ?? 0
                  const total = goals?.total || 1
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="capitalize text-zinc-700">{s}</span>
                        <span className="text-zinc-500">{count}</span>
                      </div>
                      <Progress value={(count / total) * 100} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Investments */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-primary" />
            <p className="font-bold text-zinc-800">Investments Summary</p>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Portfolio overview · {inv?.total ?? 0} investments</p>
          {loadingInv ? <LoadingSkeleton /> : (() => {
              const contributed = inv?.totalInvested ?? 0
              const returned    = inv?.totalReturned ?? 0
              const budget      = inv?.totalBudget ?? 0
              const target      = inv?.totalExpectedReturn ?? 0

              const pnl         = returned - contributed
              const pnlPct      = contributed > 0 ? (pnl / contributed) * 100 : null
              const isProfit    = pnl > 0
              const isLoss      = pnl < 0

              const expGain     = target - budget
              const expGainPct  = budget > 0 ? (expGain / budget) * 100 : null
              const isExpGain   = expGain > 0
              const isExpLoss   = expGain < 0

              const deviation    = contributed - budget
              const deviationPct = budget > 0 ? (deviation / budget) * 100 : null
              const overBudget   = deviation > 0
              const underBudget  = deviation < 0

              const budgetBarPct = budget > 0 ? Math.min((contributed / budget) * 100, 100) : 0

              const outcomeLabel = (() => {
                if (!budget) return null
                if (overBudget  && isProfit) return { text: 'Over budget · Profit',     cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
                if (overBudget  && isLoss)   return { text: 'Over budget · Loss',        cls: 'bg-red-100 text-red-600 border-red-200' }
                if (overBudget)              return { text: 'Over budget · Even',        cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
                if (underBudget && isProfit) return { text: 'Under budget · Profit',    cls: 'bg-green-100 text-green-700 border-green-200' }
                if (underBudget && isLoss)   return { text: 'Under budget · Loss',      cls: 'bg-orange-100 text-orange-700 border-orange-200' }
                if (underBudget)             return { text: 'Under budget · Even',      cls: 'bg-blue-100 text-blue-700 border-blue-200' }
                if (isProfit)                return { text: 'On budget · Profit',        cls: 'bg-green-100 text-green-700 border-green-200' }
                if (isLoss)                  return { text: 'On budget · Loss',          cls: 'bg-red-100 text-red-600 border-red-200' }
                return                              { text: 'On budget · Even',          cls: 'bg-muted text-muted-foreground border-border' }
              })()

              return (
                <div className="space-y-5">

                  {/* Key metrics — Budget→Target, Contributed→Returned */}
                  <div className="space-y-2">
                    {/* Row 1: planned → target */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Planned Budget</p>
                        <p className="text-base font-bold tabular-nums">{budget > 0 ? fmt(budget) : '—'}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Target Return</p>
                        <p className="text-base font-bold tabular-nums">{target > 0 ? fmt(target) : '—'}</p>
                      </div>
                    </div>
                    {/* Row 2: contributed → returned */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Contributed</p>
                        <p className="text-base font-bold tabular-nums">{fmt(contributed)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Returned</p>
                        <p className={`text-base font-bold tabular-nums ${returned > 0 ? 'text-green-600' : ''}`}>{fmt(returned)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Budget usage bar */}
                  {budget > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Budget Usage</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${overBudget ? 'text-red-500' : 'text-foreground'}`}>
                            {Math.round((contributed / budget) * 100)}%
                          </span>
                          {deviationPct !== null && deviation !== 0 && (
                            <span className={`px-1.5 py-0.5 rounded font-medium border text-xs ${overBudget ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                              {deviation > 0 ? '+' : ''}{deviationPct.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${budgetBarPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{fmt(contributed)} used</span>
                        <span>{fmt(budget)} planned</span>
                      </div>
                      {outcomeLabel && (
                        <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium border ${outcomeLabel.cls}`}>
                          {outcomeLabel.text}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Performance comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Actual */}
                    <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Actual</p>
                      <p className={`text-lg font-bold tabular-nums ${isProfit ? 'text-green-600' : isLoss ? 'text-red-500' : 'text-foreground'}`}>
                        {pnl > 0 ? '+' : ''}{fmt(pnl)}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-medium ${isProfit ? 'text-green-600' : isLoss ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {isProfit ? 'Profit' : isLoss ? 'Loss' : 'Even'}
                        </span>
                        {pnlPct !== null && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${isProfit ? 'bg-green-100 text-green-700 border-green-200' : isLoss ? 'bg-red-100 text-red-600 border-red-200' : 'bg-muted text-muted-foreground border-border'}`}>
                            {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expected */}
                    <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Expected</p>
                      {target > 0 ? (
                        <>
                          <p className={`text-lg font-bold tabular-nums ${isExpGain ? 'text-green-600' : isExpLoss ? 'text-red-500' : 'text-foreground'}`}>
                            {expGain > 0 ? '+' : ''}{fmt(expGain)}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-medium ${isExpGain ? 'text-green-600' : isExpLoss ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {isExpGain ? 'Gain' : isExpLoss ? 'Loss' : 'Even'}
                            </span>
                            {expGainPct !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${isExpGain ? 'bg-green-100 text-green-700 border-green-200' : isExpLoss ? 'bg-red-100 text-red-600 border-red-200' : 'bg-muted text-muted-foreground border-border'}`}>
                                {expGainPct > 0 ? '+' : ''}{expGainPct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">No target set</p>
                      )}
                    </div>
                  </div>

                </div>
              )
            })()}
        </div>

        {/* Life Areas */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-5 w-5 text-primary" />
            <p className="font-bold text-zinc-800">Life Areas</p>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Your life pillars at a glance</p>
          {loadingAreas ? <LoadingSkeleton /> : (
            <div>
              <p className="text-2xl font-black text-zinc-800">{areas?.total ?? 0} <span className="text-base font-normal text-zinc-400">life areas defined</span></p>
              <p className="text-sm text-zinc-400 mt-2">
                {(areas?.total ?? 0) === 0
                  ? 'Define life areas to organize goals and investments by domain.'
                  : 'Use life areas to connect goals and investments to what matters most.'}
              </p>
            </div>
          )}
        </div>

        {/* Budget Performance */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-5 w-5 text-primary" />
            <p className="font-bold text-zinc-800">Budget Performance</p>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Planned vs actual spend across all budget periods</p>
          {loadingBudgets ? <LoadingSkeleton /> : !budgetReport || budgetReport.total === 0 ? (
            <p className="text-sm text-zinc-400 py-2">No budgets set yet.</p>
          ) : (
              <div className="space-y-5">
                {/* Summary bar */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Planned', val: fmt(budgetReport.totalPlanned), color: 'text-zinc-900' },
                    { label: 'Total Spent', val: fmt(budgetReport.totalSpent), color: budgetReport.totalSpent > budgetReport.totalPlanned ? 'text-red-600' : 'text-zinc-900' },
                    {
                      label: budgetReport.totalVariance >= 0 ? 'Under budget' : 'Over budget',
                      val: fmt(Math.abs(budgetReport.totalVariance)),
                      color: budgetReport.totalVariance >= 0 ? 'text-green-600' : 'text-red-600',
                    },
                  ].map((s) => (
                    <div key={s.label} className="bg-zinc-50 rounded-xl p-3">
                      <p className="text-xs text-zinc-500 mb-0.5">{s.label}</p>
                      <p className={cn('text-base font-bold', s.color)}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Status badge */}
                {budgetReport.overCount > 0 ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <p className="text-xs text-red-700 font-medium">
                      {budgetReport.overCount} budget{budgetReport.overCount > 1 ? 's' : ''} exceeded across all periods
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">All budgets are within planned limits</p>
                  </div>
                )}

                {/* Per-category table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide px-1 pb-1 border-b">
                    <span className="col-span-2">Category</span>
                    <span className="text-right">Planned</span>
                    <span className="text-right">Spent</span>
                    <span className="text-right">Status</span>
                  </div>
                  {budgetReport.items.map((b) => (
                    <div key={b.id} className={cn(
                      'grid grid-cols-5 items-center px-1 py-1.5 rounded-lg text-sm',
                      b.isOver ? 'bg-red-50' : b.usedPct >= 80 ? 'bg-amber-50' : '',
                    )}>
                      <span className="col-span-2 font-medium text-zinc-700 truncate text-xs">
                        {b.categoryName}
                        <span className="text-zinc-400 font-normal ml-1 text-[10px]">
                          {b.month}/{b.year}
                        </span>
                      </span>
                      <span className="text-right text-xs text-zinc-500">{fmt(parseFloat(b.plannedBudget))}</span>
                      <span className={cn('text-right text-xs font-semibold', b.isOver ? 'text-red-600' : 'text-zinc-700')}>
                        {fmt(parseFloat(b.actualSpent))}
                      </span>
                      <span className="text-right">
                        {b.isOver ? (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                            +{fmt(parseFloat(b.overage))}
                          </span>
                        ) : (
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                            b.usedPct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700',
                          )}>
                            {b.usedPct}%
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
