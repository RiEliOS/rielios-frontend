import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { LucideIcon } from 'lucide-react'
import {
  TrendingDown,
  ArrowRight, ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, Plus,
} from 'lucide-react'
import financeIcon from '@/assets/finance.png'
import targetsIcon from '@/assets/targets.png'
import investmentIcon from '@/assets/investment.png'
import savingsIcon from '@/assets/savings.png'
import netflowIcon from '@/assets/netflow.png'
import expensesIcon from '@/assets/expenses.png'
import cashIcon from '@/assets/cash.png'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { financeService } from '@/services/finance.service'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import { useMonthStore } from '@/store/month.store'
import { useCurrencyFormat, useCurrencyCode } from '@/hooks/useCurrencyFormat'
import { useDateFormat } from '@/hooks/useDateFormat'
import { cn } from '@/lib/utils'

const incomeSchema = z.object({
  sourceName: z.string().min(1, 'Required'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  receivedDate: z.string().min(1, 'Required'),
})
type IncomeForm = z.infer<typeof incomeSchema>

const expenseSchema = z.object({
  description: z.string().min(1, 'Required'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  spentDate: z.string().min(1, 'Required'),
})
type ExpenseForm = z.infer<typeof expenseSchema>

interface SavingGoalSummary {
  id: string; name: string; savedAmount: string; targetAmount: string; deadline: string | null
}
interface PersonalGoalSummary {
  id: string; title: string; priority: 'low' | 'medium' | 'high'; progress: number; targetDate: string | null
}
interface Transaction {
  id: string; type: 'income' | 'expense'; label: string; amount: string; date: string
}
interface BudgetItem {
  id: string; categoryName: string; plannedBudget: string; actualSpent: string
}
interface DashboardSummary {
  currentMonth: { income: number; expenses: number; invested: number; returned: number; saved: number; availableCash: number; netFlow: number }
  savings: { activeGoals: number; totalSaved: number; totalTarget: number; goals: SavingGoalSummary[] }
  goals: { activeGoals: number; goals: PersonalGoalSummary[] }
  investments: { active: number; totalInvested: number; totalExpenses: number; totalBudget: number; totalReturned: number; totalExpectedReturn: number }
  recentTransactions: Transaction[]
  budgets: { total: number; overCount: number; totalPlanned: number; totalSpent: number; items: BudgetItem[] }
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  low: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const fmt = useCurrencyFormat()
  const currency = useCurrencyCode()
  const { fmtDateShort, timeZone } = useDateFormat()
  const { user } = useAuthStore()
  const [quickIncome, setQuickIncome] = useState(false)
  const [quickExpense, setQuickExpense] = useState(false)

  const { selectedMonth, selectedYear } = useMonthStore()
  const now = new Date()

  const today = new Date().toISOString().split('T')[0]

  const incomeForm = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { sourceName: '', amount: '', receivedDate: today },
  })

  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: '', amount: '', spentDate: today },
  })

  const incomeMutation = useMutation({
    mutationFn: (data: IncomeForm) => financeService.createIncome(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['income'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setQuickIncome(false)
      incomeForm.reset({ sourceName: '', amount: '', receivedDate: today })
      toast.success('Income added')
    },
    onError: () => toast.error('Failed to add income'),
  })

  const expenseMutation = useMutation({
    mutationFn: (data: ExpenseForm) => financeService.createExpense(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setQuickExpense(false)
      expenseForm.reset({ description: '', amount: '', spentDate: today })
      toast.success('Expense added')
    },
    onError: () => toast.error('Failed to add expense'),
  })

  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary', selectedMonth, selectedYear],
    queryFn: () => api.get('/dashboard/summary', { params: { month: selectedMonth, year: selectedYear } }).then((r) => r.data),
  })

  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone })
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.profile?.fullName?.split(' ')[0] ?? 'there'

  if (isLoading || !summary) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="h-14 w-72 rounded-xl bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-zinc-200 dark:bg-zinc-700 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-zinc-200 dark:bg-zinc-700 animate-pulse" />)}
        </div>
        <div className="h-60 rounded-2xl bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      </div>
    )
  }

  const s = summary
  const netFlow = s.currentMonth.netFlow
  const savingsPct = s.savings.totalTarget > 0
    ? Math.min((s.savings.totalSaved / s.savings.totalTarget) * 100, 100) : 0

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{greeting}, {firstName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Button size="sm" variant="outline" className="gap-1.5 border-green-200 text-green-700 hover:bg-green-50" onClick={() => setQuickIncome(true)}>
            <Plus className="h-3.5 w-3.5" />Income
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setQuickExpense(true)}>
            <Plus className="h-3.5 w-3.5" />Expense
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          title="Net Flow"
          value={(netFlow >= 0 ? '+' : '') + fmt(netFlow)}
          sub="Income + realized P&L − expenses − inv. costs"
          Icon={netflowIcon}
          bg={netFlow >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}
          border={netFlow >= 0 ? 'border-green-200 dark:border-green-800/40' : 'border-red-200 dark:border-red-800/40'}
          iconBg={netFlow >= 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}
          accent={netFlow >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}
        />
        <StatCard
          title="Income"
          value={fmt(s.currentMonth.income)}
          sub="Received this month"
          Icon={financeIcon}
          bg="bg-emerald-50 dark:bg-emerald-900/20" border="border-emerald-200 dark:border-emerald-800/40"
          iconBg="bg-emerald-100 dark:bg-emerald-900/40" accent="text-emerald-700 dark:text-emerald-400"
        />
        <StatCard
          title="Expenses"
          value={fmt(s.currentMonth.expenses)}
          sub="Spent this month"
          Icon={expensesIcon}
          bg="bg-red-50 dark:bg-red-900/20" border="border-red-200 dark:border-red-800/40"
          iconBg="bg-red-100 dark:bg-red-900/40" accent="text-red-700 dark:text-red-400"
        />
        <StatCard
          title="Invested"
          value={fmt(s.currentMonth.invested)}
          sub="Deployed this month"
          Icon={investmentIcon}
          bg="bg-indigo-50 dark:bg-indigo-900/20" border="border-indigo-200 dark:border-indigo-800/40"
          iconBg="bg-indigo-100 dark:bg-indigo-900/40" accent="text-indigo-700 dark:text-indigo-400"
        />
        <StatCard
          title="Inv. Returns"
          value={fmt(s.currentMonth.returned)}
          sub="Returned from investments"
          Icon={investmentIcon}
          bg="bg-purple-50 dark:bg-purple-900/20" border="border-purple-200 dark:border-purple-800/40"
          iconBg="bg-purple-100 dark:bg-purple-900/40" accent="text-purple-700 dark:text-purple-400"
        />
        <StatCard
          title="Saved"
          value={fmt(s.currentMonth.saved)}
          sub="Deposited to goals"
          Icon={savingsIcon}
          bg="bg-teal-50 dark:bg-teal-900/20" border="border-teal-200 dark:border-teal-800/40"
          iconBg="bg-teal-100 dark:bg-teal-900/40" accent="text-teal-700 dark:text-teal-400"
        />
        <StatCard
          title="Cash Available"
          value={fmt(s.currentMonth.availableCash)}
          sub={
            s.currentMonth.invested > 0 || s.currentMonth.returned > 0 || s.currentMonth.saved > 0
              ? 'Income + returns − expenses − invested − saved'
              : 'After all expenses'
          }
          Icon={cashIcon}
          bg="bg-blue-50 dark:bg-blue-900/20" border="border-blue-200 dark:border-blue-800/40"
          iconBg="bg-blue-100 dark:bg-blue-900/40" accent="text-blue-700 dark:text-blue-400"
        />
      </div>

      {/* Row 2 — panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Savings Goals */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                <img src={savingsIcon} alt="Savings" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Savings Goals</span>
            </div>
            {s.savings.activeGoals > 0 && (
              <span className="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-semibold">
                {s.savings.activeGoals} active
              </span>
            )}
          </div>

          {s.savings.activeGoals === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No active savings goals.</p>
          ) : (
            <>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">Overall</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {fmt(s.savings.totalSaved)}
                    <span className="text-zinc-400 dark:text-zinc-500"> / {fmt(s.savings.totalTarget)}</span>
                  </span>
                </div>
                <Progress value={savingsPct} className="h-2" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{savingsPct.toFixed(0)}% of total target</p>
              </div>
              {s.savings.goals.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                  {s.savings.goals.map((g) => {
                    const target = parseFloat(g.targetAmount)
                    const saved = parseFloat(g.savedAmount)
                    const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate mr-2">{g.name}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Investments */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <img src={investmentIcon} alt="Investments" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Investments</span>
            </div>
            {s.investments.active > 0 && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                {s.investments.active} active
              </span>
            )}
          </div>

          {s.investments.active === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No active investments.</p>
          ) : (
            <div className="space-y-4">
              {(() => {
                const totalOut = s.investments.totalInvested + s.investments.totalExpenses
                const isOverBudget = s.investments.totalBudget > 0 && totalOut > s.investments.totalBudget
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Budget</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{fmt(s.investments.totalBudget)}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Contributed</p>
                        <p className={cn('text-sm font-bold truncate', isOverBudget ? 'text-red-600' : 'text-zinc-900 dark:text-zinc-100')}>
                          {fmt(s.investments.totalInvested)}
                        </p>
                      </div>
                    </div>
                    {s.investments.totalExpenses > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Expenses (costs)</span>
                        <span className="font-semibold tabular-nums text-orange-500">
                          −{fmt(s.investments.totalExpenses)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-700 pt-2">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">Total Deployed</span>
                      <span className={cn('font-bold tabular-nums', isOverBudget ? 'text-red-600' : 'text-zinc-800 dark:text-zinc-200')}>
                        {fmt(totalOut)}
                      </span>
                    </div>
                    {isOverBudget && (
                      <p className="text-xs text-red-500 font-medium">Over budget by {fmt(totalOut - s.investments.totalBudget)}</p>
                    )}
                  </>
                )
              })()}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Exp. Return</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{fmt(s.investments.totalExpectedReturn)}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Returned</p>
                  <p className={cn('text-sm font-bold truncate',
                    s.investments.totalExpectedReturn > 0 && s.investments.totalReturned >= s.investments.totalExpectedReturn
                      ? 'text-green-600' : 'text-zinc-900'
                  )}>
                    {fmt(s.investments.totalReturned)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personal Goals */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <img src={targetsIcon} alt="Targets" className="h-6 w-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Targets</span>
            </div>
            {s.goals.activeGoals > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                {s.goals.activeGoals} active
              </span>
            )}
          </div>

          {s.goals.activeGoals === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No active targets.</p>
          ) : (
            <div className="space-y-3.5">
              {s.goals.goals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">{g.title}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0', PRIORITY_STYLES[g.priority])}>
                      {g.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={g.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-zinc-400 shrink-0 w-7 text-right">{g.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Health */}
        <div className={cn(
          'rounded-2xl border p-5 space-y-4',
          s.budgets.overCount > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center',
                s.budgets.overCount > 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40',
              )}>
                {s.budgets.overCount > 0
                  ? <AlertTriangle className="h-4 w-4 text-red-600" />
                  : <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Budget Health</span>
            </div>
            {s.budgets.total > 0 && (
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                s.budgets.overCount > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
              )}>
                {s.budgets.overCount > 0 ? `${s.budgets.overCount} over` : 'On track'}
              </span>
            )}
          </div>

          {s.budgets.total === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No budgets set for this month.</p>
          ) : (
            <div className="space-y-3">
              {s.budgets.items.slice(0, 4).map((b) => {
                const planned = parseFloat(b.plannedBudget)
                const spent = parseFloat(b.actualSpent)
                const pct = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0
                const over = spent > planned
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={cn('font-medium truncate mr-2', over ? 'text-red-700 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300')}>
                        {b.categoryName}
                      </span>
                      <span className={cn('shrink-0', over ? 'text-red-600 font-bold' : 'text-zinc-400')}>
                        {over ? `+${fmt(spent - planned)}` : `${pct.toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', over ? 'bg-red-400' : pct >= 80 ? 'bg-amber-400' : 'bg-primary')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Recent Transactions</h2>
        {s.recentTransactions.length === 0 ? (
          <p className="text-xs text-zinc-400 py-2">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {s.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2.5">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                  tx.type === 'income' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40',
                )}>
                  {tx.type === 'income'
                    ? <ArrowUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    : <ArrowDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
                </div>
                <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 truncate">{tx.label}</span>
                <span className={cn('text-sm font-bold shrink-0',
                  tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                )}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(parseFloat(tx.amount))}
                </span>
                <span className="text-xs text-zinc-400 shrink-0 w-14 text-right">{fmtDateShort(tx.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick add income dialog */}
      <Dialog open={quickIncome} onOpenChange={setQuickIncome}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Income</DialogTitle></DialogHeader>
          <form onSubmit={incomeForm.handleSubmit((d) => incomeMutation.mutate(d))} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input {...incomeForm.register('sourceName')} placeholder="e.g. Salary" />
              {incomeForm.formState.errors.sourceName && (
                <p className="text-xs text-destructive">{incomeForm.formState.errors.sourceName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount ({currency})</Label>
                <Input {...incomeForm.register('amount')} placeholder="0" />
                {incomeForm.formState.errors.amount && (
                  <p className="text-xs text-destructive">{incomeForm.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" {...incomeForm.register('receivedDate')} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setQuickIncome(false)}>Cancel</Button>
              <Button type="submit" disabled={incomeMutation.isPending}>
                {incomeMutation.isPending ? 'Saving…' : 'Add Income'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick add expense dialog */}
      <Dialog open={quickExpense} onOpenChange={setQuickExpense}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={expenseForm.handleSubmit((d) => expenseMutation.mutate(d))} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...expenseForm.register('description')} placeholder="e.g. Groceries" />
              {expenseForm.formState.errors.description && (
                <p className="text-xs text-destructive">{expenseForm.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount ({currency})</Label>
                <Input {...expenseForm.register('amount')} placeholder="0" />
                {expenseForm.formState.errors.amount && (
                  <p className="text-xs text-destructive">{expenseForm.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" {...expenseForm.register('spentDate')} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setQuickExpense(false)}>Cancel</Button>
              <Button type="submit" disabled={expenseMutation.isPending}>
                {expenseMutation.isPending ? 'Saving…' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function StatCard({ title, value, sub, Icon, bg, border, iconBg, accent }: {
  title: string; value: string; sub: string
  Icon: LucideIcon | string; bg: string; border: string; iconBg: string; accent: string
}) {
  return (
    <div className={cn('rounded-2xl border p-5 space-y-3', bg, border)}>
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', iconBg)}>
        {typeof Icon === 'string'
          ? <img src={Icon} alt="" className="h-7 w-7 object-contain mix-blend-multiply dark:mix-blend-normal" />
          : <Icon className={cn('h-5 w-5', accent)} />
        }
      </div>
      <div>
        <p className={cn('text-xs font-semibold uppercase tracking-wide', accent)}>{title}</p>
        <p className={cn('text-xs font-black mt-0.5 truncate', accent)}>{value}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
