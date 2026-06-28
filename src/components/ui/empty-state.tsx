import type { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon | string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-16 px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mb-4">
        {typeof icon === 'string'
          ? <img src={icon} alt={title} className="h-9 w-9 object-contain mix-blend-multiply dark:mix-blend-normal" />
          : (() => { const Icon = icon; return <Icon className="h-7 w-7 text-zinc-400 dark:text-zinc-500" /> })()
        }
      </div>
      <p className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">{title}</p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mb-5">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
