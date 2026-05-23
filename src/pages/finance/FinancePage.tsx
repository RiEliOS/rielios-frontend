import { useState } from 'react'
import { TrendingUp, ShoppingCart, Wallet, Tag } from 'lucide-react'
import IncomeTab from './components/IncomeTab'
import ExpensesTab from './components/ExpensesTab'
import BudgetsTab from './components/BudgetsTab'
import CategoriesTab from './components/CategoriesTab'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'income',     label: 'Income',     Icon: TrendingUp,   accent: 'text-green-600',  activeBg: 'bg-green-50 border-green-200',  iconBg: 'bg-green-100' },
  { id: 'expenses',   label: 'Expenses',   Icon: ShoppingCart, accent: 'text-red-600',    activeBg: 'bg-red-50 border-red-200',      iconBg: 'bg-red-100' },
  { id: 'budgets',    label: 'Budgets',    Icon: Wallet,       accent: 'text-blue-600',   activeBg: 'bg-blue-50 border-blue-200',    iconBg: 'bg-blue-100' },
  { id: 'categories', label: 'Categories', Icon: Tag,          accent: 'text-purple-600', activeBg: 'bg-purple-50 border-purple-200',iconBg: 'bg-purple-100' },
] as const

type TabId = typeof TABS[number]['id']

export default function FinancePage() {
  const [active, setActive] = useState<TabId>('income')

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Page header with nav inline */}
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Finance</h1>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          {TABS.map(({ id, label, Icon, accent, activeBg, iconBg }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'flex items-center justify-center gap-2.5 px-2.5 py-2.5 sm:px-4 rounded-2xl border text-sm font-semibold transition-all',
                  isActive
                    ? cn(activeBg, accent)
                    : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700',
                )}
              >
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg shrink-0', isActive ? iconBg : 'bg-zinc-100')}>
                  <Icon className={cn('h-3.5 w-3.5', isActive ? accent : 'text-zinc-400')} />
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {active === 'income'     && <IncomeTab />}
      {active === 'expenses'   && <ExpensesTab />}
      {active === 'budgets'    && <BudgetsTab />}
      {active === 'categories' && <CategoriesTab />}
    </div>
  )
}
