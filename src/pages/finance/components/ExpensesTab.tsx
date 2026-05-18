import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ShoppingCart, MoreVertical, AlertTriangle, Info, Search, CalendarDays } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { financeService } from '@/services/finance.service'
import type { Expense, Category, PaymentMethod, MonthlyBudget } from '@/types/finance'
import { cn } from '@/lib/utils'

const schema = z.object({
  description: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  spentDate: z.string().min(1, 'Date is required'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'other']),
  categoryId: z.string().optional(),
  note: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
}

const fmt = (n: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(n))

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function ExpensesTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7))

  const { data: expenseList = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: financeService.getExpenses,
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: financeService.getCategories,
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const { data: budgets = [] } = useQuery<MonthlyBudget[]>({
    queryKey: ['budgets'],
    queryFn: financeService.getBudgets,
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'card', spentDate: new Date().toISOString().split('T')[0] },
  })

  const watchedCategoryId = useWatch({ control, name: 'categoryId' })
  const watchedAmount = useWatch({ control, name: 'amount' })
  const watchedDate = useWatch({ control, name: 'spentDate' })

  const [search, setSearch] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      financeService.createExpense({ ...data, categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : null } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); closeDialog(); toast.success('Expense added') },
    onError: () => toast.error('Failed to save expense'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      financeService.updateExpense(id, { ...data, categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : null } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); closeDialog(); toast.success('Expense updated') },
    onError: () => toast.error('Failed to update expense'),
  })

  const deleteMutation = useMutation({
    mutationFn: financeService.deleteExpense,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setConfirmId(null); toast.success('Expense deleted') },
    onError: () => toast.error('Failed to delete expense'),
  })

  function openCreate() {
    setEditing(null)
    reset({
      description: '', amount: '', spentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'card', categoryId: 'none', note: '',
    })
    setOpen(true)
  }

  function openEdit(item: Expense) {
    setEditing(item)
    reset({
      description: item.description ?? '',
      amount: item.amount,
      spentDate: item.spentDate,
      paymentMethod: item.paymentMethod,
      categoryId: item.categoryId ?? 'none',
      note: item.note ?? '',
    })
    setOpen(true)
  }

  function closeDialog() { setOpen(false); setEditing(null) }

  function onSubmit(data: FormData) {
    if (editing) updateMutation.mutate({ id: editing.id, data })
    else createMutation.mutate(data)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // Budget hint for the selected category + date
  const activeBudgetHint = (() => {
    if (!watchedCategoryId || watchedCategoryId === 'none') return null
    const dateStr = watchedDate || new Date().toISOString().split('T')[0]
    const d = new Date(dateStr + 'T00:00:00')
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const budget = budgets.find(
      (b) => b.categoryId === watchedCategoryId && b.month === month && b.year === year,
    )
    if (!budget) return null
    const planned = parseFloat(budget.plannedBudget)
    const spent = parseFloat(budget.actualSpent)
    // subtract editing item's current amount so we don't double-count it
    const editingAmount = editing ? parseFloat(editing.amount) : 0
    const spentExcludingThis = spent - editingAmount
    const entering = parseFloat(watchedAmount ?? '0') || 0
    const projectedSpent = spentExcludingThis + entering
    const remaining = planned - spentExcludingThis
    const projectedRemaining = planned - projectedSpent
    return { planned, spent: spentExcludingThis, remaining, projectedSpent, projectedRemaining, entering }
  })()

  const getCategoryName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : '—'

  const filtered = [...expenseList]
    .sort((a, b) => b.spentDate.localeCompare(a.spentDate))
    .filter((item) => {
      if (monthFilter && !item.spentDate.startsWith(monthFilter)) return false
      if (!search) return true
      return (
        (item.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.categoryId ? getCategoryName(item.categoryId).toLowerCase().includes(search.toLowerCase()) : false)
      )
    })

  const periodTotal = filtered.reduce((s, e) => s + parseFloat(e.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-2.5">
          <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">
            {monthFilter ? 'This Period' : 'All Time'}
          </p>
          <p className="text-xl font-black text-red-700">{fmt(periodTotal.toFixed(2))}</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
      </div>

      {expenseList.length > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <Input
              placeholder="Search by description or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative flex items-center">
            <CalendarDays className="absolute left-3 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {monthFilter && (
            <Button variant="ghost" size="sm" onClick={() => setMonthFilter('')} className="text-zinc-400 text-xs px-2">
              All time
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12 text-zinc-400 text-sm">Loading…</div>
      ) : expenseList.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No expenses yet"
          description="Start logging your expenses to track where your money goes."
          action={{ label: 'Add Expense', onClick: openCreate }}
        />
      ) : filtered.length === 0 ? (
        <div className="flex justify-center py-12 text-zinc-400 text-sm">
          {search ? `No results for "${search}"` : 'No expenses for this period.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-zinc-200 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 shrink-0">
                  <ShoppingCart className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-800">{item.description || 'Expense'}</p>
                  <p className="text-xs text-zinc-400">
                    {fmtDate(item.spentDate)}
                    {item.categoryId && ` · ${getCategoryName(item.categoryId)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{PAYMENT_LABELS[item.paymentMethod]}</Badge>
                <span className="font-bold text-red-600">{fmt(item.amount)}</span>
                <DropdownMenuPrimitive.Root>
                  <DropdownMenuPrimitive.Trigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuPrimitive.Trigger>
                  <DropdownMenuPrimitive.Portal>
                    <DropdownMenuPrimitive.Content
                      align="end"
                      sideOffset={4}
                      className="z-50 min-w-32 rounded-md border bg-popover text-popover-foreground shadow-md p-1 outline-none"
                      style={{ animationDuration: '0ms' }}
                    >
                      <DropdownMenuPrimitive.Item
                        onSelect={() => openEdit(item)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        onSelect={() => setConfirmId(item.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-destructive/10 text-destructive outline-none select-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuPrimitive.Item>
                    </DropdownMenuPrimitive.Content>
                  </DropdownMenuPrimitive.Portal>
                </DropdownMenuPrimitive.Root>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input {...register('description')} placeholder="e.g. Grocery shopping" />
            </div>

            {/* Row 1: Category | Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date Spent</Label>
                <Input type="date" {...register('spentDate')} />
                {errors.spentDate && <p className="text-xs text-destructive">{errors.spentDate.message}</p>}
              </div>
            </div>

            {/* Row 2: Amount | Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input {...register('amount')} placeholder="0.00" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Budget hint */}
            {activeBudgetHint && (
              <div className={cn(
                'rounded-xl border px-3 py-2.5 flex items-start gap-2.5 text-xs',
                activeBudgetHint.projectedRemaining < 0
                  ? 'bg-red-50 border-red-200'
                  : activeBudgetHint.remaining <= 0
                  ? 'bg-red-50 border-red-200'
                  : activeBudgetHint.projectedRemaining < activeBudgetHint.planned * 0.1
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200',
              )}>
                {activeBudgetHint.remaining <= 0 || activeBudgetHint.projectedRemaining < 0 ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
                ) : (
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
                )}
                <div className="space-y-0.5">
                  {activeBudgetHint.remaining <= 0 ? (
                    <p className="font-semibold text-red-700">
                      Already {fmt((Math.abs(activeBudgetHint.remaining)).toFixed(2))} over budget for this category
                    </p>
                  ) : activeBudgetHint.projectedRemaining < 0 ? (
                    <p className="font-semibold text-red-700">
                      This expense will put you {fmt(Math.abs(activeBudgetHint.projectedRemaining).toFixed(2))} over budget
                    </p>
                  ) : activeBudgetHint.projectedRemaining < activeBudgetHint.planned * 0.1 ? (
                    <p className="font-semibold text-amber-700">
                      Only {fmt(activeBudgetHint.projectedRemaining.toFixed(2))} left after this expense
                    </p>
                  ) : (
                    <p className="font-medium text-blue-700">
                      {fmt(activeBudgetHint.projectedRemaining.toFixed(2))} remaining after this expense
                    </p>
                  )}
                  <p className={cn(
                    activeBudgetHint.remaining <= 0 || activeBudgetHint.projectedRemaining < 0 ? 'text-red-500' :
                    activeBudgetHint.projectedRemaining < activeBudgetHint.planned * 0.1 ? 'text-amber-500' : 'text-blue-400'
                  )}>
                    {fmt(activeBudgetHint.spent.toFixed(2))} of {fmt(activeBudgetHint.planned.toFixed(2))} budget used this month
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea {...register('note')} placeholder="Any additional notes…" rows={2} />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete expense?"
        description="This will permanently remove this expense record."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
