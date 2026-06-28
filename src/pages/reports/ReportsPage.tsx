import { useQuery } from '@tanstack/react-query'
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import cashIcon from '@/assets/cash.png'
import financeIcon from '@/assets/finance.png'
import targetsIcon from '@/assets/targets.png'
import investmentIcon from '@/assets/investment.png'
import savingsIcon from '@/assets/savings.png'
import lifeAspectsIcon from '@/assets/lifeaspects.png'
import { Progress } from '@/components/ui/progress'
import { api } from '@/services/api'
import { useMonthStore } from '@/store/month.store'
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat'
import { cn } from '@/lib/utils'

interface FinanceReport {
  income: { total: number; count: number }
  expenses: { total: number; count: number }
  invested: number
  invExpenses: number
  invReturned: number
  realizedPnl: number
  totalDeposited: number
  totalWithdrawn: number
  netSaved: number
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
  activeCount: number
  completedCount: number
  totalBudget: number
  totalInvested: number
  totalExpenses: number
  totalReturned: number
  totalExpectedReturn: number
  realizedPnl: number
  unrealizedPnl: number
}

interface SavingsGoal {
  id: string; name: string; status: string
  savedAmount: number; targetAmount: number; pct: number; deadline: string | null
}

interface SavingsReport {
  total: number
  byStatus: Record<string, number>
  totalSaved: number
  totalTarget: number
  overallPct: number
  totalDeposited: number
  totalWithdrawn: number
  goals: SavingsGoal[]
}

interface LifeAreaItem {
  id: string
  name: string
  color: string | null
  description: string | null
  goals: { total: number; active: number; completed: number }
  investments: { total: number; active: number; completed: number }
}
interface LifeAreasReport {
  total: number
  lifeAreas: LifeAreaItem[]
  unlinkedGoals: number
  unlinkedInvs: number
}

interface BudgetReportItem {
  id: string; categoryName: string; plannedBudget: string; actualSpent: string
  variance: string; overage: string; usedPct: number; isOver: boolean; month: number; year: number
}
interface BudgetReport {
  total: number; overCount: number; totalPlanned: number; totalSpent: number; totalVariance: number
  items: BudgetReportItem[]
}

function StatRow({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <div>
        <span className="text-zinc-500 dark:text-zinc-400 text-sm">{label}</span>
        {sub && <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{sub}</p>}
      </div>
      <span className={`font-semibold text-sm tabular-nums ${color ?? 'text-zinc-800 dark:text-zinc-200'}`}>{value}</span>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-700/50" />
      <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{label}</span>
      <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-700/50" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 mt-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-6 animate-pulse bg-zinc-100 dark:bg-zinc-700 rounded-lg" />
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const fmt = useCurrencyFormat()
  const { selectedMonth, selectedYear } = useMonthStore()
  const params = { month: selectedMonth, year: selectedYear }

  const { data: finance, isLoading: loadingFinance } = useQuery<FinanceReport>({
    queryKey: ['reports-finance', selectedMonth, selectedYear],
    queryFn: () => api.get('/reports/finance', { params }).then((r) => r.data),
  })

  const { data: goals, isLoading: loadingGoals } = useQuery<GoalsReport>({
    queryKey: ['reports-goals', selectedMonth, selectedYear],
    queryFn: () => api.get('/reports/goals', { params }).then((r) => r.data),
  })

  const { data: inv, isLoading: loadingInv } = useQuery<InvestmentsReport>({
    queryKey: ['reports-investments', selectedMonth, selectedYear],
    queryFn: () => api.get('/reports/investments', { params }).then((r) => r.data),
  })

  const { data: savings, isLoading: loadingSavings } = useQuery<SavingsReport>({
    queryKey: ['reports-savings', selectedMonth, selectedYear],
    queryFn: () => api.get('/reports/savings', { params }).then((r) => r.data),
  })

  const { data: areas, isLoading: loadingAreas } = useQuery<LifeAreasReport>({
    queryKey: ['reports-life-areas'],
    queryFn: () => api.get('/reports/life-areas').then((r) => r.data),
  })

  const { data: budgetReport, isLoading: loadingBudgets } = useQuery<BudgetReport>({
    queryKey: ['reports-budgets', selectedMonth, selectedYear],
    queryFn: () => api.get('/reports/budgets', { params }).then((r) => r.data),
  })

  const topCategories = finance?.expensesByCategory
    .filter((c) => parseFloat(c.total) > 0)
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
    .slice(0, 5) ?? []

  const goalStatuses = ['active', 'completed', 'paused', 'cancelled']

  const { monthLabel } = useMonthStore()

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Reports</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Analytics and insights for <span className="font-semibold text-zinc-700 dark:text-zinc-300">{monthLabel()}</span></p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* Finance Summary */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <img src={financeIcon} alt="Finance" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <p className="font-bold text-zinc-800 dark:text-zinc-200">Finance Summary</p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Financial overview for {monthLabel()}</p>
          {loadingFinance ? <LoadingSkeleton /> : (
            <div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                <SectionDivider label="Income & Expenses" />
                <StatRow label="Total Income" value={fmt(finance?.income.total ?? 0)} color="text-green-600" />
                <StatRow label="Total Expenses" value={fmt(finance?.expenses.total ?? 0)} color="text-red-500" />

                <SectionDivider label="Investments" />
                <StatRow
                  label="Capital Contributed"
                  value={fmt(finance?.invested ?? 0)}
                  color="text-blue-600"
                  sub="Deployed into investments"
                />
                {(finance?.invExpenses ?? 0) > 0 && (
                  <StatRow
                    label="Inv. Expenses (costs)"
                    value={fmt(finance?.invExpenses ?? 0)}
                    color="text-orange-500"
                    sub="Operational costs"
                  />
                )}
                <StatRow
                  label="Cash Returned"
                  value={fmt(finance?.invReturned ?? 0)}
                  color="text-purple-600"
                  sub="Received back from investments"
                />
                {(finance?.realizedPnl ?? 0) !== 0 && (
                  <StatRow
                    label="Realized P&L"
                    value={(finance?.realizedPnl ?? 0) >= 0 ? `+${fmt(finance?.realizedPnl ?? 0)}` : fmt(finance?.realizedPnl ?? 0)}
                    color={(finance?.realizedPnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}
                    sub="From closed investments"
                  />
                )}

                <SectionDivider label="Savings" />
                <StatRow label="Total Deposited" value={fmt(finance?.totalDeposited ?? 0)} color="text-teal-600" />
                {(finance?.totalWithdrawn ?? 0) > 0 && (
                  <StatRow label="Total Withdrawn" value={fmt(finance?.totalWithdrawn ?? 0)} color="text-zinc-500" />
                )}
                <StatRow
                  label="Net Saved"
                  value={fmt(finance?.netSaved ?? 0)}
                  color="text-teal-700"
                  sub="Locked in saving goals"
                />

                <SectionDivider label="Totals" />
                <StatRow
                  label="Net Balance"
                  value={(finance?.netBalance ?? 0) >= 0 ? `+${fmt(finance?.netBalance ?? 0)}` : fmt(finance?.netBalance ?? 0)}
                  color={(finance?.netBalance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
                  sub="Income + realized P&L − expenses − inv. costs"
                />
                <StatRow
                  label="Available Cash"
                  value={fmt(finance?.availableCash ?? 0)}
                  color={(finance?.availableCash ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}
                  sub="Income + returns − expenses − contributed − saved"
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
                            <span className="text-zinc-700 dark:text-zinc-300">{c.categoryName ?? 'Uncategorized'}</span>
                            <span className="text-zinc-500 dark:text-zinc-400">{fmt(parseFloat(c.total))}</span>
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

        {/* Goals Summary */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <img src={targetsIcon} alt="Targets" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <p className="font-bold text-zinc-800 dark:text-zinc-200">Targets Summary</p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Personal target progress</p>
          {loadingGoals ? <LoadingSkeleton /> : (
            <div>
              <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mb-3">{goals?.total ?? 0} <span className="text-base font-normal text-zinc-400 dark:text-zinc-500">targets</span></p>
              <div className="space-y-2">
                {goalStatuses.map((s) => {
                  const count = goals?.byStatus[s] ?? 0
                  const total = goals?.total || 1
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="capitalize text-zinc-700 dark:text-zinc-300">{s}</span>
                        <span className="text-zinc-500 dark:text-zinc-400">{count}</span>
                      </div>
                      <Progress value={(count / total) * 100} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Investments Summary */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <img src={investmentIcon} alt="Investments" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <p className="font-bold text-zinc-800 dark:text-zinc-200">Investments Summary</p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            Portfolio overview · {inv?.total ?? 0} total
            {(inv?.activeCount ?? 0) > 0 && ` · ${inv?.activeCount} active`}
            {(inv?.completedCount ?? 0) > 0 && ` · ${inv?.completedCount} closed`}
          </p>
          {loadingInv ? <LoadingSkeleton /> : (() => {
              const contributed = inv?.totalInvested ?? 0
              const expenses    = inv?.totalExpenses ?? 0
              const returned    = inv?.totalReturned ?? 0
              const budget      = inv?.totalBudget ?? 0
              const target      = inv?.totalExpectedReturn ?? 0
              const realizedPnl = inv?.realizedPnl ?? 0
              const unrealizedPnl = inv?.unrealizedPnl ?? 0

              const totalOut    = contributed + expenses
              const overallPnl  = realizedPnl + unrealizedPnl
              const overallPct  = totalOut > 0 ? (overallPnl / totalOut) * 100 : null

              const expGain     = target - budget
              const expGainPct  = budget > 0 ? (expGain / budget) * 100 : null
              const isExpGain   = expGain > 0
              const isExpLoss   = expGain < 0

              const deviation    = totalOut - budget
              const overBudget   = deviation > 0
              const underBudget  = deviation < 0
              const budgetBarPct = budget > 0 ? Math.min((totalOut / budget) * 100, 100) : 0

              const outcomeLabel = (() => {
                if (!budget) return null
                const isProfit = overallPnl > 0
                const isLoss = overallPnl < 0
                if (overBudget  && isProfit) return { text: 'Over budget · Profit',   cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40' }
                if (overBudget  && isLoss)   return { text: 'Over budget · Loss',      cls: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40' }
                if (overBudget)              return { text: 'Over budget · Even',      cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40' }
                if (underBudget && isProfit) return { text: 'Under budget · Profit',  cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40' }
                if (underBudget && isLoss)   return { text: 'Under budget · Loss',    cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40' }
                if (underBudget)             return { text: 'Under budget · Even',    cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40' }
                if (isProfit)                return { text: 'On budget · Profit',      cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40' }
                if (isLoss)                  return { text: 'On budget · Loss',        cls: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40' }
                return                              { text: 'On budget · Even',        cls: 'bg-muted text-muted-foreground border-border' }
              })()

              return (
                <div className="space-y-5">
                  {/* Capital flows */}
                  <div className="space-y-2">
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
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Contributed</p>
                        <p className="text-base font-bold tabular-nums">{fmt(contributed)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Cash Returned</p>
                        <p className={`text-base font-bold tabular-nums ${returned > 0 ? 'text-green-600' : ''}`}>{fmt(returned)}</p>
                      </div>
                    </div>
                    {expenses > 0 && (
                      <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Expenses (costs)</p>
                        <p className="text-base font-bold tabular-nums text-orange-500">{fmt(expenses)}</p>
                      </div>
                    )}
                  </div>

                  {/* Budget usage bar */}
                  {budget > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Budget Usage</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${overBudget ? 'text-red-500' : 'text-foreground'}`}>
                            {budget > 0 ? Math.round((totalOut / budget) * 100) : 0}%
                          </span>
                          {deviation !== 0 && (
                            <span className={`px-1.5 py-0.5 rounded font-medium border text-xs ${overBudget ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                              {deviation > 0 ? '+' : ''}{fmt(deviation)}
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
                        <span>{fmt(totalOut)} deployed</span>
                        <span>{fmt(budget)} planned</span>
                      </div>
                      {outcomeLabel && (
                        <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium border ${outcomeLabel.cls}`}>
                          {outcomeLabel.text}
                        </span>
                      )}
                    </div>
                  )}

                  {/* P&L breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Realized P&L (closed investments) */}
                    <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Realized P&L</p>
                      {(inv?.completedCount ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground mt-1">No closed investments</p>
                      ) : (
                        <>
                          <p className={`text-lg font-bold tabular-nums ${realizedPnl > 0 ? 'text-green-600' : realizedPnl < 0 ? 'text-red-500' : 'text-foreground'}`}>
                            {realizedPnl > 0 ? '+' : ''}{fmt(realizedPnl)}
                          </p>
                          <p className={`text-xs font-medium ${realizedPnl > 0 ? 'text-green-600' : realizedPnl < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {realizedPnl > 0 ? 'Gain' : realizedPnl < 0 ? 'Loss' : 'Even'} · {inv?.completedCount} closed
                          </p>
                        </>
                      )}
                    </div>

                    {/* Unrealized P&L (open investments) */}
                    <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Unrealized P&L</p>
                      {(inv?.activeCount ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground mt-1">No active investments</p>
                      ) : (
                        <>
                          <p className={`text-lg font-bold tabular-nums ${unrealizedPnl > 0 ? 'text-green-600' : unrealizedPnl < 0 ? 'text-red-500' : 'text-foreground'}`}>
                            {unrealizedPnl > 0 ? '+' : ''}{fmt(unrealizedPnl)}
                          </p>
                          <p className={`text-xs font-medium ${unrealizedPnl > 0 ? 'text-green-600' : unrealizedPnl < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {unrealizedPnl > 0 ? 'Ahead' : unrealizedPnl < 0 ? 'Behind' : 'Even'} · {inv?.activeCount} open
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Overall P&L */}
                  {totalOut > 0 && (
                    <div className={cn(
                      'rounded-lg border px-4 py-3 flex items-center justify-between',
                      overallPnl > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40' : overallPnl < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40' : 'bg-muted/30',
                    )}>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Overall P&L</p>
                        <p className="text-xs text-muted-foreground">Realized + unrealized</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black tabular-nums ${overallPnl > 0 ? 'text-green-600' : overallPnl < 0 ? 'text-red-500' : 'text-foreground'}`}>
                          {overallPnl > 0 ? '+' : ''}{fmt(overallPnl)}
                        </p>
                        {overallPct !== null && (
                          <p className={`text-xs font-semibold ${overallPnl > 0 ? 'text-green-600' : overallPnl < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {overallPct > 0 ? '+' : ''}{overallPct.toFixed(1)}% on capital
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expected comparison */}
                  {target > 0 && (
                    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5">Expected vs Actual</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Expected gain</p>
                          <p className={`text-sm font-bold tabular-nums ${isExpGain ? 'text-green-600' : isExpLoss ? 'text-red-500' : 'text-foreground'}`}>
                            {expGain > 0 ? '+' : ''}{fmt(expGain)}
                            {expGainPct !== null && <span className="text-xs font-normal ml-1">({expGainPct > 0 ? '+' : ''}{expGainPct.toFixed(1)}%)</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Actual gain</p>
                          <p className={`text-sm font-bold tabular-nums ${overallPnl > 0 ? 'text-green-600' : overallPnl < 0 ? 'text-red-500' : 'text-foreground'}`}>
                            {overallPnl > 0 ? '+' : ''}{fmt(overallPnl)}
                            {overallPct !== null && <span className="text-xs font-normal ml-1">({overallPct > 0 ? '+' : ''}{overallPct.toFixed(1)}%)</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
        </div>

        {/* Savings Summary */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <img src={savingsIcon} alt="Savings" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <p className="font-bold text-zinc-800 dark:text-zinc-200">Savings Summary</p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">All saving goals overview</p>
          {loadingSavings ? <LoadingSkeleton /> : savings?.total === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">No saving goals yet.</p>
          ) : (
            <div className="space-y-4">
              {/* Overall progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">Overall Progress</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {fmt(savings?.totalSaved ?? 0)}
                    <span className="text-zinc-400 dark:text-zinc-500"> / {fmt(savings?.totalTarget ?? 0)}</span>
                  </span>
                </div>
                <Progress value={savings?.overallPct ?? 0} className="h-2" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{savings?.overallPct ?? 0}% of total target</p>
              </div>

              {/* Flow stats */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                <StatRow label="Total Deposited" value={fmt(savings?.totalDeposited ?? 0)} color="text-teal-600" />
                {(savings?.totalWithdrawn ?? 0) > 0 && (
                  <StatRow label="Total Withdrawn" value={fmt(savings?.totalWithdrawn ?? 0)} color="text-zinc-500" />
                )}
                <StatRow label="Net Saved" value={fmt(savings?.totalSaved ?? 0)} color="text-teal-700" />
                <StatRow
                  label="Remaining to Target"
                  value={fmt(Math.max(0, (savings?.totalTarget ?? 0) - (savings?.totalSaved ?? 0)))}
                  color="text-zinc-500"
                />
              </div>

              {/* Status breakdown */}
              <div>
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-2">By Status</p>
                <div className="space-y-1.5">
                  {['active', 'completed', 'cancelled'].map((s) => {
                    const count = savings?.byStatus[s] ?? 0
                    const total = savings?.total || 1
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize w-16">{s}</span>
                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', s === 'active' ? 'bg-teal-500' : s === 'completed' ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-500')}
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 w-4 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Per-goal list */}
              {(savings?.goals ?? []).length > 0 && (
                <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-700 pt-3">
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Goals</p>
                  {savings?.goals.map((g) => (
                    <div key={g.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{g.name}</span>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                            g.status === 'active' ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400' :
                            g.status === 'completed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400',
                          )}>
                            {g.status}
                          </span>
                        </div>
                        <span className="text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">{g.pct}%</span>
                      </div>
                      <Progress value={g.pct} className="h-1.5" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Life Aspects */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <img src={lifeAspectsIcon} alt="Life Aspects" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <p className="font-bold text-zinc-800 dark:text-zinc-200">Life Aspects</p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Goals and investments organised by life aspect</p>
          {loadingAreas ? <LoadingSkeleton /> : !areas || areas.total === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">No life aspects defined yet.</p>
          ) : (
            <div className="space-y-3">
              {areas.lifeAreas.map((area) => (
                <div key={area.id} className="flex items-start gap-3 py-2 border-b border-zinc-50 dark:border-zinc-700 last:border-0">
                  <div
                    className="h-3 w-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: area.color ?? '#94a3b8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{area.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{area.goals.total}</span> goal{area.goals.total !== 1 ? 's' : ''}
                        {area.goals.active > 0 && <span className="text-teal-600 dark:text-teal-400"> ({area.goals.active} active)</span>}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{area.investments.total}</span> investment{area.investments.total !== 1 ? 's' : ''}
                        {area.investments.active > 0 && <span className="text-blue-600 dark:text-blue-400"> ({area.investments.active} active)</span>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(areas.unlinkedGoals > 0 || areas.unlinkedInvs > 0) && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
                  {areas.unlinkedGoals > 0 && <span>{areas.unlinkedGoals} goal{areas.unlinkedGoals !== 1 ? 's' : ''} not linked to any area. </span>}
                  {areas.unlinkedInvs > 0 && <span>{areas.unlinkedInvs} investment{areas.unlinkedInvs !== 1 ? 's' : ''} not linked to any area.</span>}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Budget Performance */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <img src={cashIcon} alt="Budget" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <p className="font-bold text-zinc-800 dark:text-zinc-200">Budget Performance</p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Planned vs actual spend across all budget periods</p>
          {loadingBudgets ? <LoadingSkeleton /> : !budgetReport || budgetReport.total === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">No budgets set yet.</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Planned', val: fmt(budgetReport.totalPlanned), color: 'text-zinc-900 dark:text-zinc-100' },
                  { label: 'Total Spent', val: fmt(budgetReport.totalSpent), color: budgetReport.totalSpent > budgetReport.totalPlanned ? 'text-red-600' : 'text-zinc-900 dark:text-zinc-100' },
                  {
                    label: budgetReport.totalVariance >= 0 ? 'Under budget' : 'Over budget',
                    val: fmt(Math.abs(budgetReport.totalVariance)),
                    color: budgetReport.totalVariance >= 0 ? 'text-green-600' : 'text-red-600',
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-50 dark:bg-zinc-700/50 rounded-xl p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{s.label}</p>
                    <p className={cn('text-base font-bold', s.color)}>{s.val}</p>
                  </div>
                ))}
              </div>

              {budgetReport.overCount > 0 ? (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                    {budgetReport.overCount} budget{budgetReport.overCount > 1 ? 's' : ''} exceeded across all periods
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">All budgets are within planned limits</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide px-1 pb-1 border-b dark:border-zinc-700">
                  <span className="col-span-2">Category</span>
                  <span className="text-right">Planned</span>
                  <span className="text-right">Spent</span>
                  <span className="text-right">Status</span>
                </div>
                {budgetReport.items.map((b) => (
                  <div key={b.id} className={cn(
                    'grid grid-cols-5 items-center px-1 py-1.5 rounded-lg text-sm',
                    b.isOver ? 'bg-red-50 dark:bg-red-900/20' : b.usedPct >= 80 ? 'bg-amber-50 dark:bg-amber-900/20' : '',
                  )}>
                    <span className="col-span-2 font-medium text-zinc-700 dark:text-zinc-300 truncate text-xs">
                      {b.categoryName}
                      <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-1 text-[10px]">
                        {b.month}/{b.year}
                      </span>
                    </span>
                    <span className="text-right text-xs text-zinc-500 dark:text-zinc-400">{fmt(parseFloat(b.plannedBudget))}</span>
                    <span className={cn('text-right text-xs font-semibold', b.isOver ? 'text-red-600' : 'text-zinc-700 dark:text-zinc-300')}>
                      {fmt(parseFloat(b.actualSpent))}
                    </span>
                    <span className="text-right">
                      {b.isOver ? (
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                          +{fmt(parseFloat(b.overage))}
                        </span>
                      ) : (
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                          b.usedPct >= 80 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
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
