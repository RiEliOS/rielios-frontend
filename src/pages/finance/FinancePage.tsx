import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Tag } from 'lucide-react'
import IncomeTab from './components/IncomeTab'
import ExpensesTab from './components/ExpensesTab'
import BudgetsTab from './components/BudgetsTab'
import CategoriesTab from './components/CategoriesTab'
import { cn } from '@/lib/utils'
import financeIcon from '@/assets/finance.png'
import expensesIcon from '@/assets/expenses.png'
import cashIcon from '@/assets/cash.png'

const TABS = [
  { id: 'income',     label: 'Income',     icon: financeIcon,  accent: 'text-green-600 dark:text-green-400',  activeBg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40',  iconBg: 'bg-green-100 dark:bg-green-900/40' },
  { id: 'expenses',   label: 'Expenses',   icon: expensesIcon, accent: 'text-red-600 dark:text-red-400',    activeBg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40',      iconBg: 'bg-red-100 dark:bg-red-900/40' },
  { id: 'budgets',    label: 'Budgets',    icon: cashIcon,     accent: 'text-blue-600 dark:text-blue-400',   activeBg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40',    iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  { id: 'categories', label: 'Categories', icon: Tag as unknown as LucideIcon, accent: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/40', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
] as const

type TabId = typeof TABS[number]['id']

export default function FinancePage() {
  const [active, setActive] = useState<TabId>('income')

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Page header with nav inline */}
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Finance</h1>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          {TABS.map(({ id, label, icon, accent, activeBg, iconBg }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'flex items-center justify-center gap-2.5 px-2.5 py-2.5 sm:px-4 rounded-2xl border text-sm font-semibold transition-all',
                  isActive
                    ? cn(activeBg, accent)
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200',
                )}
              >
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg shrink-0', isActive ? iconBg : 'bg-zinc-100 dark:bg-zinc-700')}>
                  {typeof icon === 'string'
                    ? <img src={icon} alt={label} className="h-4 w-4 object-contain mix-blend-multiply dark:mix-blend-normal" />
                    : (() => { const Icon = icon as LucideIcon; return <Icon className={cn('h-3.5 w-3.5', isActive ? accent : 'text-zinc-400')} /> })()
                  }
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
