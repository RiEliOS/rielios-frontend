import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Pencil, MoreVertical, TrendingUp } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { financeService } from '@/services/finance.service'
import { useCurrencyFormat, useCurrencyCode, stripAmountZeros } from '@/hooks/useCurrencyFormat'
import { useMonthStore } from '@/store/month.store'
import type { Category } from '@/types/finance'
import { cn } from '@/lib/utils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const schema = z.object({
  categoryId: z.string(),
  plannedBudget: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
})
type FormData = z.infer<typeof schema>

export default function BudgetsTab() {
  const qc = useQueryClient()
  const fmt = useCurrencyFormat()
  const currency = useCurrencyCode()
  const { selectedMonth, selectedYear } = useMonthStore()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: allBudgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: financeService.getBudgets,
  })

  const budgets = allBudgets.filter(
    (b) => b.month === selectedMonth && b.year === selectedYear,
  )

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: financeService.getCategories,
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const { register, handleSubmit, control, reset, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { month: selectedMonth, year: selectedYear },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const monthRecord = await financeService.getOrCreateMonth(data.month, data.year)
      return financeService.createBudget({
        monthId: monthRecord.id,
        categoryId: data.categoryId,
        plannedBudget: data.plannedBudget,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); closeDialog(); toast.success('Budget created') },
    onError: () => toast.error('Failed to create budget'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, plannedBudget }: { id: string; plannedBudget: string }) =>
      financeService.updateBudget(id, { plannedBudget }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); closeDialog(); toast.success('Budget updated') },
    onError: () => toast.error('Failed to update budget'),
  })

  const deleteMutation = useMutation({
    mutationFn: financeService.deleteBudget,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setConfirmId(null); toast.success('Budget deleted') },
    onError: () => toast.error('Failed to delete budget'),
  })

  function openCreate() {
    setEditingId(null)
    reset({ categoryId: '', plannedBudget: '', month: selectedMonth, year: selectedYear })
    setOpen(true)
  }

  function openEdit(b: { id: string; plannedBudget: string }) {
    setEditingId(b.id)
    reset({ plannedBudget: stripAmountZeros(b.plannedBudget), categoryId: '', month: selectedMonth, year: selectedYear })
    setOpen(true)
  }

  function closeDialog() { setOpen(false); setEditingId(null) }

  function onSubmit(data: FormData) {
    if (editingId) {
      updateMutation.mutate({ id: editingId, plannedBudget: data.plannedBudget })
    } else {
      if (!data.categoryId) { setError('categoryId', { message: 'Select a category' }); return }
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'

  return (
    <div className="space-y-4">

      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Budget</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState message="No budgets set for this month. Create one to track spending limits." />
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const planned = parseFloat(b.plannedBudget)
            const spent = parseFloat(b.actualSpent)
            const rawPct = planned > 0 ? (spent / planned) * 100 : 0
            const barPct = Math.min(rawPct, 100)
            const over = spent > planned
            const overage = spent - planned
            const remaining = planned - spent

            return (
              <div
                key={b.id}
                className={cn(
                  'rounded-2xl border p-4 space-y-3 transition-colors',
                  over
                    ? 'bg-red-50 border-red-200'
                    : rawPct >= 80
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-zinc-200',
                )}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                      over ? 'bg-red-100' : rawPct >= 80 ? 'bg-amber-100' : 'bg-zinc-100',
                    )}>
                      <TrendingUp className={cn(
                        'h-4 w-4',
                        over ? 'text-red-600' : rawPct >= 80 ? 'text-amber-600' : 'text-zinc-500',
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('font-bold text-sm truncate', over ? 'text-red-900' : 'text-zinc-900')}>
                        {getCategoryName(b.categoryId)}
                      </p>
                      <p className={cn('text-xs', over ? 'text-red-600' : 'text-zinc-500')}>
                        {fmt(spent)} <span className="opacity-60">of</span> {fmt(planned)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status badge */}
                    {over ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        +{fmt(overage)} over
                      </span>
                    ) : rawPct >= 80 ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                        {fmt(remaining)} left
                      </span>
                    ) : (
                      <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-semibold">
                        {fmt(remaining)} left
                      </span>
                    )}

                    <DropdownMenuPrimitive.Root>
                      <DropdownMenuPrimitive.Trigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuPrimitive.Trigger>
                      <DropdownMenuPrimitive.Portal>
                        <DropdownMenuPrimitive.Content
                          align="end"
                          sideOffset={4}
                          className="z-50 min-w-36 rounded-xl border bg-popover text-popover-foreground shadow-lg p-1 outline-none"
                          style={{ animationDuration: '0ms' }}
                        >
                          <DropdownMenuPrimitive.Item
                            onSelect={() => openEdit(b)}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {over ? 'Adjust budget' : 'Edit'}
                          </DropdownMenuPrimitive.Item>
                          <DropdownMenuPrimitive.Item
                            onSelect={() => setConfirmId(b.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-destructive/10 text-destructive outline-none select-none"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuPrimitive.Item>
                        </DropdownMenuPrimitive.Content>
                      </DropdownMenuPrimitive.Portal>
                    </DropdownMenuPrimitive.Root>
                  </div>
                </div>

                {/* Progress bar + percentage */}
                <div className="space-y-1">
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-black/5">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        over ? 'bg-red-500' : rawPct >= 80 ? 'bg-amber-400' : 'bg-primary',
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      'text-[10px] font-semibold',
                      over ? 'text-red-600' : rawPct >= 80 ? 'text-amber-600' : 'text-zinc-400',
                    )}>
                      {rawPct.toFixed(0)}% used
                    </span>
                    {over && (
                      <span className="text-[10px] text-red-500 font-medium">
                        Exceeds limit by {((rawPct - 100).toFixed(0))}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Adjust Budget' : 'New Budget'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {!editingId && (
              <>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Month</Label>
                    <Controller
                      name="month"
                      control={control}
                      render={({ field }) => (
                        <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Input type="number" {...register('year')} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Planned Budget ({currency})</Label>
              <Input {...register('plannedBudget')} placeholder="0" />
              {errors.plannedBudget && <p className="text-xs text-destructive">{errors.plannedBudget.message}</p>}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editingId ? 'Save Changes' : 'Create Budget'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete budget?"
        description="This will permanently remove this budget entry."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  )
}
