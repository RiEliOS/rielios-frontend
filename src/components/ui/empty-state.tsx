import type { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-zinc-400" />
      </div>
      <p className="text-base font-bold text-zinc-800 mb-1">{title}</p>
      <p className="text-sm text-zinc-400 max-w-xs mb-5">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
