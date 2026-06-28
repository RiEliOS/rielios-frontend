import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ListPlus, Target, MapPin, Eye, EyeOff, MoreVertical, ArrowRight, CheckCircle2 } from 'lucide-react'
import investmentIcon from '@/assets/investment.png'
import targetsIcon from '@/assets/targets.png'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/services/api'
import { useMonthStore } from '@/store/month.store'
import { useCurrencyFormat, useCurrencyCode, stripAmountZeros } from '@/hooks/useCurrencyFormat'

interface Investment {
  id: string
  name: string
  description: string | null
  plannedBudget: string | null
  amountSpent: string
  amountReturned: string
  amountExpenses: string
  expectedReturn: string | null
  status: string
  progress: number
  startDate: string | null
  targetDate: string | null
  personalGoalId: string | null
  lifeAreaId: string | null
}

interface InvestmentEntry {
  id: string
  investmentId: string
  entryType: string
  amount: string | null
  description: string | null
  entryDate: string
}

interface Goal {
  id: string
  title: string
}

interface LifeArea {
  id: string
  name: string
  color: string | null
}

const amountRegex = /^\d+(\.\d{1,2})?$/

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().optional(),
  plannedBudget: z.string().regex(amountRegex, 'Enter a valid amount').optional().or(z.literal('')),
  expectedReturn: z.string().regex(amountRegex, 'Enter a valid amount').optional().or(z.literal('')),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  personalGoalId: z.string().optional(),
  lifeAreaId: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const entrySchema = z.object({
  entryType: z.enum(['contribution', 'expense', 'return', 'note']),
  amount: z.string().regex(amountRegex, 'Enter a valid amount').optional().or(z.literal('')),
  description: z.string().optional(),
})
type EntryForm = z.infer<typeof entrySchema>

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  completed: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  paused: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400',
}

const ENTRY_COLORS: Record<string, string> = {
  contribution: 'text-blue-600',
  expense: 'text-orange-500',
  return: 'text-green-600',
  note: 'text-gray-500',
}

function computeTimeStatus(inv: Investment): { label: string; cls: string } | null {
  if (!inv.targetDate || inv.status === 'completed' || inv.status === 'cancelled') return null
  const now = Date.now()
  const target = new Date(inv.targetDate).getTime()
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: `Overdue · ${Math.abs(diffDays)}d past target`, cls: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' }
  if (diffDays === 0) return { label: 'Due today', cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' }
  if (diffDays <= 7) return { label: `${diffDays}d left — urgent`, cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' }
  return { label: `${diffDays}d left`, cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' }
}

function computeProgress(inv: Investment): number {
  if (!inv.plannedBudget || parseFloat(inv.plannedBudget) === 0) return inv.progress
  const totalOut = parseFloat(inv.amountSpent) + parseFloat(inv.amountExpenses)
  return Math.min((totalOut / parseFloat(inv.plannedBudget)) * 100, 100)
}

export default function InvestmentsPage() {
  const qc = useQueryClient()
  const fmt = useCurrencyFormat()
  const currency = useCurrencyCode()
  const { selectedMonth, selectedYear, monthStr } = useMonthStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Investment | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [entriesInv, setEntriesInv] = useState<Investment | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [closeTarget, setCloseTarget] = useState<Investment | null>(null)

  const { data: allInvestments = [], isLoading } = useQuery<Investment[]>({
    queryKey: ['investments'],
    queryFn: () => api.get('/investments').then((r) => r.data),
  })

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
  const investments = allInvestments.filter((inv) => {
    if (inv.startDate && new Date(inv.startDate) > new Date(selectedYear, selectedMonth, 0)) return false
    if (inv.targetDate && new Date(inv.targetDate) < startOfMonth) return false
    return true
  })

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  })

  const { data: lifeAreas = [] } = useQuery<LifeArea[]>({
    queryKey: ['life-areas'],
    queryFn: () => api.get('/life-areas').then((r) => r.data),
  })

  const { data: entries = [] } = useQuery<InvestmentEntry[]>({
    queryKey: ['investment-entries', entriesInv?.id],
    queryFn: () => api.get(`/investments/${entriesInv!.id}/entries`).then((r) => r.data),
    enabled: !!entriesInv,
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', personalGoalId: 'none', lifeAreaId: 'none' },
  })

  const {
    register: regEntry,
    handleSubmit: handleEntrySubmit,
    control: controlEntry,
    reset: resetEntry,
    formState: { errors: entryErrors },
  } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: { entryType: 'contribution' },
  })

  function toPayload(data: FormData) {
    return {
      name: data.name,
      description: data.description || undefined,
      plannedBudget: data.plannedBudget || undefined,
      expectedReturn: data.expectedReturn || undefined,
      startDate: data.startDate || undefined,
      targetDate: data.targetDate || undefined,
      personalGoalId: data.personalGoalId === 'none' ? null : data.personalGoalId || undefined,
      lifeAreaId: data.lifeAreaId === 'none' ? null : data.lifeAreaId || undefined,
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/investments', toPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investments'] }); closeDialog(); toast.success('Investment created') },
    onError: () => toast.error('Failed to create investment'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      api.patch(`/investments/${id}`, { ...toPayload(data), status: data.status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investments'] }); closeDialog(); toast.success('Investment updated') },
    onError: () => toast.error('Failed to update investment'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/investments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investments'] }); setConfirmId(null); toast.success('Investment deleted') },
    onError: () => toast.error('Failed to delete investment'),
  })

  const addEntryMutation = useMutation({
    mutationFn: (data: EntryForm) => api.post(`/investments/${entriesInv!.id}/entries`, {
      entryType: data.entryType,
      amount: data.amount || undefined,
      description: data.description || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investment-entries', entriesInv?.id] })
      qc.invalidateQueries({ queryKey: ['investments'] })
      resetEntry({ entryType: 'contribution', amount: '', description: '' })
      toast.success('Entry added')
    },
    onError: () => toast.error('Failed to add entry'),
  })

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/investments/entries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investment-entries', entriesInv?.id] })
      qc.invalidateQueries({ queryKey: ['investments'] })
      toast.success('Entry deleted')
    },
    onError: () => toast.error('Failed to delete entry'),
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/investments/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setCloseTarget(null)
      toast.success('Investment closed — P&L recorded')
    },
    onError: () => toast.error('Failed to close investment'),
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '', plannedBudget: '', expectedReturn: '', startDate: '', targetDate: '', status: 'active', personalGoalId: 'none', lifeAreaId: 'none' })
    setOpen(true)
  }

  function openEdit(inv: Investment) {
    setEditing(inv)
    reset({
      name: inv.name,
      description: inv.description ?? '',
      plannedBudget: stripAmountZeros(inv.plannedBudget),
      expectedReturn: stripAmountZeros(inv.expectedReturn),
      startDate: inv.startDate ? inv.startDate.slice(0, 10) : '',
      targetDate: inv.targetDate ? inv.targetDate.slice(0, 10) : '',
      status: (inv.status as any) || 'active',
      personalGoalId: inv.personalGoalId ?? 'none',
      lifeAreaId: inv.lifeAreaId ?? 'none',
    })
    setOpen(true)
  }

  function closeDialog() { setOpen(false); setEditing(null) }

  function onSubmit(data: FormData) {
    if (editing) updateMutation.mutate({ id: editing.id, data })
    else createMutation.mutate(data)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const monthEntries = entries.filter((e) => {
    const d = typeof e.entryDate === 'string' ? e.entryDate : new Date(e.entryDate).toISOString()
    return d.startsWith(monthStr())
  })

  const totalContributed = monthEntries
    .filter((e) => e.entryType === 'contribution')
    .reduce((s, e) => s + parseFloat(e.amount ?? '0'), 0)
  const totalExpenses = monthEntries
    .filter((e) => e.entryType === 'expense')
    .reduce((s, e) => s + parseFloat(e.amount ?? '0'), 0)
  const totalReturned = monthEntries
    .filter((e) => e.entryType === 'return')
    .reduce((s, e) => s + parseFloat(e.amount ?? '0'), 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Investments</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track and grow your investments</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Investment</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-36 animate-pulse" />
          ))}
        </div>
      ) : investments.length === 0 ? (
        <EmptyState
          icon={investmentIcon}
          title="No investments yet"
          description="Start tracking your investment portfolio and see your returns grow."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {investments.map((inv) => {
            const progress = computeProgress(inv)
            const timeStatus = computeTimeStatus(inv)
            const hasBudget = inv.plannedBudget && parseFloat(inv.plannedBudget) > 0
            const totalOut = parseFloat(inv.amountSpent) + parseFloat(inv.amountExpenses)
            const isOverBudget = hasBudget && totalOut > parseFloat(inv.plannedBudget!)
            const linkedGoal = goals.find((g) => g.id === inv.personalGoalId)
            const lifeArea = lifeAreas.find((la) => la.id === inv.lifeAreaId)
            return (
              <div key={inv.id} className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {inv.status}
                  </span>
                  <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 flex-1 min-w-0 truncate">{inv.name}</p>
                  <DropdownMenuPrimitive.Root>
                    <DropdownMenuPrimitive.Trigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
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
                          onSelect={() => setEntriesInv(inv)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                        >
                          <ListPlus className="h-3.5 w-3.5" />
                          Entries
                        </DropdownMenuPrimitive.Item>
                        <DropdownMenuPrimitive.Item
                          onSelect={() => openEdit(inv)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuPrimitive.Item>
                        {inv.status === 'active' && (
                          <DropdownMenuPrimitive.Item
                            onSelect={() => setCloseTarget(inv)}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-green-50 text-green-700 outline-none select-none"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Close Investment
                          </DropdownMenuPrimitive.Item>
                        )}
                        <DropdownMenuPrimitive.Item
                          onSelect={() => setConfirmId(inv.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-destructive/10 text-destructive outline-none select-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuPrimitive.Item>
                      </DropdownMenuPrimitive.Content>
                    </DropdownMenuPrimitive.Portal>
                  </DropdownMenuPrimitive.Root>
                </div>
                {inv.description && <p className="text-sm text-zinc-500 dark:text-zinc-400">{inv.description}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {linkedGoal && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <img src={targetsIcon} alt="" className="h-3.5 w-3.5 object-contain mix-blend-multiply dark:mix-blend-normal" />
                      {linkedGoal.title}
                    </p>
                  )}
                  {lifeArea && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {lifeArea.name}
                    </p>
                  )}
                </div>
                {timeStatus && (
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${timeStatus.cls}`}>
                    {timeStatus.label}
                  </span>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 px-2.5 py-1.5">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Budget</p>
                    <p className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{fmt(inv.plannedBudget)}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                  <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 px-2.5 py-1.5">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Contributed</p>
                    <p className={`font-semibold tabular-nums ${isOverBudget ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {fmt(inv.amountSpent)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {parseFloat(inv.amountExpenses) > 0 && (
                    <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 px-2.5 py-1.5">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Expenses</p>
                      <p className="font-semibold tabular-nums text-orange-500">{fmt(inv.amountExpenses)}</p>
                    </div>
                  )}
                  <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 px-2.5 py-1.5">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Total Deployed</p>
                    <p className={`font-semibold tabular-nums ${isOverBudget ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {fmt(totalOut.toFixed(2))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 px-2.5 py-1.5">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Exp. Return</p>
                    <p className="font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">{fmt(inv.expectedReturn)}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                  <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 px-2.5 py-1.5">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Returned</p>
                    {inv.expectedReturn && parseFloat(inv.expectedReturn) > 0 ? (
                      (() => {
                        const ret = parseFloat(inv.amountReturned)
                        const exp = parseFloat(inv.expectedReturn)
                        return (
                          <p className={`font-semibold tabular-nums ${ret > exp ? 'text-green-600' : ret < exp ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {fmt(inv.amountReturned)}{ret > exp ? '+' : ret < exp ? '-' : ''}
                          </p>
                        )
                      })()
                    ) : (
                      <p className={`font-semibold tabular-nums ${parseFloat(inv.amountReturned) > 0 ? 'text-green-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {fmt(inv.amountReturned)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-zinc-400 dark:text-zinc-500'}>
                      {isOverBudget ? 'Over budget' : hasBudget ? 'Budget used' : 'Progress'}
                    </span>
                    <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-zinc-500 dark:text-zinc-400'}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className={`h-1.5 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Delete investment?"
        description="This will permanently remove this investment and all its entries."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />

      {/* Close investment dialog */}
      <Dialog open={!!closeTarget} onOpenChange={(v) => { if (!v) setCloseTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close Investment</DialogTitle>
          </DialogHeader>
          {closeTarget && (() => {
            const contributed = parseFloat(closeTarget.amountSpent)
            const expenses = parseFloat(closeTarget.amountExpenses)
            const returned = parseFloat(closeTarget.amountReturned)
            const pnl = returned - contributed - expenses
            const isGain = pnl >= 0
            return (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Closing <span className="font-semibold">{closeTarget.name}</span> will record the realized P&amp;L and mark it as completed.
                </p>
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Contributed</span>
                    <span className="font-medium tabular-nums text-blue-600">{fmt(closeTarget.amountSpent)}</span>
                  </div>
                  {expenses > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">Expenses (costs)</span>
                      <span className="font-medium tabular-nums text-orange-500">{fmt(closeTarget.amountExpenses)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Returned</span>
                    <span className="font-medium tabular-nums text-green-600">{fmt(closeTarget.amountReturned)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-600 pt-2 mt-2">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Realized P&amp;L</span>
                    <span className={`font-bold tabular-nums ${isGain ? 'text-green-600' : 'text-red-500'}`}>
                      {isGain ? '+' : ''}{fmt(pnl.toFixed(2))}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {isGain
                    ? 'This gain will be added to your Net Flow for this month.'
                    : 'This loss will be deducted from your Net Flow for this month.'}
                </p>
                <div className="flex gap-3 justify-end pt-1">
                  <Button variant="outline" onClick={() => setCloseTarget(null)}>Cancel</Button>
                  <Button
                    onClick={() => closeMutation.mutate(closeTarget.id)}
                    disabled={closeMutation.isPending}
                    className={isGain ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {closeMutation.isPending ? 'Closing…' : isGain ? 'Confirm Gain' : 'Confirm Loss'}
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Investment add/edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Investment' : 'New Investment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. S&P 500 ETF" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea {...register('description')} placeholder="Investment details…" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Planned Budget ({currency}) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input {...register('plannedBudget')} placeholder="0" />
                {errors.plannedBudget && <p className="text-xs text-destructive">{errors.plannedBudget.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Expected Return ($) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input {...register('expectedReturn')} placeholder="0" />
                {errors.expectedReturn && <p className="text-xs text-destructive">{errors.expectedReturn.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="date" {...register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Target Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="date" {...register('targetDate')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Controller
                  name="personalGoalId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="No target" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No target</SelectItem>
                        {goals.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Life Aspect <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Controller
                  name="lifeAreaId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="No area" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No area</SelectItem>
                        {lifeAreas.map((la) => (
                          <SelectItem key={la.id} value={la.id}>{la.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {editing && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Investment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Entries dialog */}
      <Dialog open={!!entriesInv} onOpenChange={(v) => { if (!v) setEntriesInv(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{entriesInv?.name}</DialogTitle>
          </DialogHeader>

          {/* Add entry form */}
          <form onSubmit={handleEntrySubmit((d) => addEntryMutation.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Controller
                  name="entryType"
                  control={controlEntry}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contribution">Contribution</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount ({currency}) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input {...regEntry('amount')} placeholder="0" />
                {entryErrors.amount && <p className="text-xs text-destructive">{entryErrors.amount.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input {...regEntry('description')} placeholder="e.g. Monthly contribution" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={addEntryMutation.isPending}>
                {addEntryMutation.isPending ? 'Adding…' : 'Add Entry'}
              </Button>
            </div>
          </form>

          {/* Divider + history */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">History</span>
                {monthEntries.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {monthEntries.length}
                  </span>
                )}
              </div>
              <TooltipPrimitive.Provider delayDuration={300}>
                <TooltipPrimitive.Root>
                  <TooltipPrimitive.Trigger asChild>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((v) => !v)}
                      className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent transition-colors"
                    >
                      {historyOpen ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TooltipPrimitive.Trigger>
                  <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                      side="top"
                      sideOffset={6}
                      className="z-50 rounded-md bg-popover border px-2.5 py-1 text-xs text-popover-foreground shadow-md"
                    >
                      {historyOpen ? 'Hide history' : 'Show history'}
                      <TooltipPrimitive.Arrow className="fill-popover" />
                    </TooltipPrimitive.Content>
                  </TooltipPrimitive.Portal>
                </TooltipPrimitive.Root>
              </TooltipPrimitive.Provider>
            </div>

            {historyOpen && (
              <>
                {/* Summary stats */}
                {monthEntries.length > 0 && (
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-blue-600 font-medium">
                      Contributed: {fmt(totalContributed.toFixed(2))}
                      {entriesInv?.plannedBudget && parseFloat(entriesInv.plannedBudget) > 0 && (
                        <span className={`ml-1 ${totalContributed > parseFloat(entriesInv.plannedBudget) ? 'text-red-500' : 'text-muted-foreground'}`}>
                          / {fmt(entriesInv.plannedBudget)}
                          {totalContributed > parseFloat(entriesInv.plannedBudget) && ' — over budget'}
                        </span>
                      )}
                    </span>
                    {totalExpenses > 0 && (
                      <span className="text-orange-500 font-medium">
                        Expenses: {fmt(totalExpenses.toFixed(2))}
                      </span>
                    )}
                    <span className="text-green-600 font-medium">
                      Returned: {fmt(totalReturned.toFixed(2))}
                      {entriesInv?.expectedReturn && parseFloat(entriesInv.expectedReturn) > 0 && (
                        <span className={`ml-1 ${totalReturned >= parseFloat(entriesInv.expectedReturn) ? 'text-green-700 font-semibold' : 'text-muted-foreground'}`}>
                          / {fmt(entriesInv.expectedReturn)}
                          {totalReturned >= parseFloat(entriesInv.expectedReturn) && ' ✓'}
                        </span>
                      )}
                    </span>
                    {totalReturned > 0 && (
                      <span className={`font-medium ${totalReturned - totalContributed - totalExpenses >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        Net: {fmt((totalReturned - totalContributed - totalExpenses).toFixed(2))}
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {monthEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No entries for this month.</p>
                  ) : (
                    monthEntries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-medium capitalize shrink-0 ${ENTRY_COLORS[e.entryType]}`}>{e.entryType}</span>
                          {e.description && (
                            <span className="text-muted-foreground text-xs truncate">{e.description}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {e.amount && <span className="font-medium tabular-nums">{fmt(e.amount)}</span>}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteEntryMutation.mutate(e.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
