import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, MoreVertical, ListPlus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import savingsIcon from '@/assets/savings.png'
import targetsIcon from '@/assets/targets.png'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
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
import { useDateFormat } from '@/hooks/useDateFormat'

interface SavingGoal {
  id: string
  personalGoalId: string | null
  name: string
  description: string | null
  targetAmount: string
  savedAmount: string
  deadline: string | null
  status: string
}

interface Deposit {
  id: string
  savingGoalId: string
  type: 'deposit' | 'withdrawal'
  amount: string
  description: string | null
  depositDate: string
}

interface PersonalGoal {
  id: string
  title: string
  status: string
}

const amountRegex = /^\d+(\.\d{1,2})?$/

const schema = z.object({
  personalGoalId: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  targetAmount: z.string().regex(amountRegex, 'Enter a valid amount'),
  deadline: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']),
})
type FormData = z.infer<typeof schema>

const depositSchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.string().regex(amountRegex, 'Enter a valid amount'),
  description: z.string().optional(),
  depositDate: z.string().optional(),
})
type DepositForm = z.infer<typeof depositSchema>

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  completed: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  paused: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400',
}

const today = new Date().toISOString().split('T')[0]

export default function SavingsPage() {
  const qc = useQueryClient()
  const fmt = useCurrencyFormat()
  const currency = useCurrencyCode()
  const { fmtDate } = useDateFormat()
  const { selectedMonth, selectedYear, monthStr } = useMonthStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SavingGoal | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [depositsGoal, setDepositsGoal] = useState<SavingGoal | null>(null)

  const { data: allGoals = [], isLoading } = useQuery<SavingGoal[]>({
    queryKey: ['savings'],
    queryFn: () => api.get('/savings').then((r) => r.data),
  })

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
  const goals = allGoals.filter((g) => {
    if (!g.deadline) return true
    return new Date(g.deadline) >= startOfMonth
  })

  const { data: personalGoals = [] } = useQuery<PersonalGoal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  })

  const { data: deposits = [] } = useQuery<Deposit[]>({
    queryKey: ['saving-deposits', depositsGoal?.id],
    queryFn: () => api.get(`/savings/${depositsGoal!.id}/deposits`).then((r) => r.data),
    enabled: !!depositsGoal,
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  })

  const {
    register: regDep,
    handleSubmit: handleDepSubmit,
    control: controlDep,
    reset: resetDep,
    formState: { errors: depErrors },
  } = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: { type: 'deposit', depositDate: today },
  })

  function toPayload(data: FormData) {
    return {
      name: data.name,
      description: data.description || undefined,
      targetAmount: data.targetAmount,
      deadline: data.deadline || undefined,
      status: data.status,
      personalGoalId: (data.personalGoalId && data.personalGoalId !== 'none') ? data.personalGoalId : null,
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/savings', toPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings'] }); closeDialog(); toast.success('Saving created') },
    onError: () => toast.error('Failed to create saving'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.patch(`/savings/${id}`, toPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings'] }); closeDialog(); toast.success('Saving updated') },
    onError: () => toast.error('Failed to update saving'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/savings/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings'] }); setConfirmId(null); toast.success('Saving deleted') },
    onError: () => toast.error('Failed to delete saving'),
  })

  const addDepositMutation = useMutation({
    mutationFn: (data: DepositForm) => api.post(`/savings/${depositsGoal!.id}/deposits`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saving-deposits', depositsGoal?.id] })
      qc.invalidateQueries({ queryKey: ['savings'] })
      resetDep({ type: 'deposit', amount: '', description: '', depositDate: today })
      toast.success('Deposit added')
    },
    onError: () => toast.error('Failed to add deposit'),
  })

  const deleteDepositMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/savings/deposits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saving-deposits', depositsGoal?.id] })
      qc.invalidateQueries({ queryKey: ['savings'] })
      toast.success('Deposit deleted')
    },
    onError: () => toast.error('Failed to delete deposit'),
  })

  function openCreate() {
    setEditing(null)
    reset({ personalGoalId: 'none', name: '', description: '', targetAmount: '', deadline: '', status: 'active' })
    setOpen(true)
  }

  function openEdit(goal: SavingGoal) {
    setEditing(goal)
    reset({
      personalGoalId: goal.personalGoalId ?? 'none',
      name: goal.name,
      description: goal.description ?? '',
      targetAmount: stripAmountZeros(goal.targetAmount),
      deadline: goal.deadline ?? '',
      status: (goal.status as any) || 'active',
    })
    setOpen(true)
  }

  function closeDialog() { setOpen(false); setEditing(null) }

  function onSubmit(data: FormData) {
    if (editing) updateMutation.mutate({ id: editing.id, data })
    else createMutation.mutate(data)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.targetAmount), 0)
  const totalSaved = goals.reduce((s, g) => s + parseFloat(g.savedAmount), 0)
  const getGoalTitle = (id: string | null) =>
    id ? personalGoals.find((g) => g.id === id)?.title ?? null : null

  const monthDeposits = deposits.filter((d) => d.depositDate.startsWith(monthStr()))
  const totalDeposited = monthDeposits.filter((d) => d.type === 'deposit').reduce((s, d) => s + parseFloat(d.amount), 0)
  const totalWithdrawn = monthDeposits.filter((d) => d.type === 'withdrawal').reduce((s, d) => s + parseFloat(d.amount), 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Savings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Build your financial safety net</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Saving</Button>
      </div>

      {goals.length > 0 && (
        <div className="flex gap-4">
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 px-4 py-2.5">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">Total Saved</p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-400">{fmt(totalSaved.toFixed(2))}</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wide">Total Target</p>
            <p className="text-xl font-black text-zinc-700 dark:text-zinc-300">{fmt(totalTarget.toFixed(2))}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-36 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={savingsIcon}
          title="No savings yet"
          description="Create your first saving to start building wealth."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = Math.min((parseFloat(goal.savedAmount) / parseFloat(goal.targetAmount)) * 100, 100)
            const linkedGoal = getGoalTitle(goal.personalGoalId)
            return (
              <div key={goal.id} className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[goal.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {goal.status}
                  </span>
                  <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 flex-1 min-w-0 truncate">{goal.name}</p>
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
                          onSelect={() => setDepositsGoal(goal)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                        >
                          <ListPlus className="h-3.5 w-3.5" />
                          Deposits
                        </DropdownMenuPrimitive.Item>
                        <DropdownMenuPrimitive.Item
                          onSelect={() => openEdit(goal)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuPrimitive.Item>
                        <DropdownMenuPrimitive.Item
                          onSelect={() => setConfirmId(goal.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-destructive/10 text-destructive outline-none select-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuPrimitive.Item>
                      </DropdownMenuPrimitive.Content>
                    </DropdownMenuPrimitive.Portal>
                  </DropdownMenuPrimitive.Root>
                </div>
                {goal.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{goal.description}</p>
                )}
                {linkedGoal && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <img src={targetsIcon} alt="" className="h-3.5 w-3.5 object-contain mix-blend-multiply dark:mix-blend-normal" />
                    <span>{linkedGoal}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{fmt(goal.savedAmount)}</span>
                  <span className="text-zinc-400 dark:text-zinc-500">of {fmt(goal.targetAmount)}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {pct.toFixed(0)}% complete
                  {goal.deadline && ` · Due ${fmtDate(goal.deadline)}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Delete saving?"
        description="This will permanently remove this saving and all its deposits."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />

      {/* Goal create/edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Saving' : 'New Saving'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. Emergency Fund" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea {...register('description')} placeholder="What are you saving for?" rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Target <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Controller
                name="personalGoalId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {personalGoals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target Amount ({currency})</Label>
                <Input {...register('targetAmount')} placeholder="5000.00" />
                {errors.targetAmount && <p className="text-xs text-destructive">{errors.targetAmount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Deadline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="date" {...register('deadline')} />
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
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deposits dialog */}
      <Dialog open={!!depositsGoal} onOpenChange={(v) => { if (!v) setDepositsGoal(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{depositsGoal?.name}</DialogTitle>
          </DialogHeader>

          {/* Add deposit form */}
          <form onSubmit={handleDepSubmit((d) => addDepositMutation.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Controller
                  name="type"
                  control={controlDep}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount ({currency})</Label>
                <Input {...regDep('amount')} placeholder="0" />
                {depErrors.amount && <p className="text-xs text-destructive">{depErrors.amount.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input {...regDep('description')} placeholder="e.g. Monthly transfer" />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" {...regDep('depositDate')} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={addDepositMutation.isPending}>
                {addDepositMutation.isPending ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </form>

          {/* Summary + history */}
          <div className="border-t pt-4 space-y-3">
            {monthDeposits.length > 0 && (
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-blue-600 font-medium">
                  Deposited: {fmt(totalDeposited.toFixed(2))}
                </span>
                {totalWithdrawn > 0 && (
                  <span className="text-orange-500 font-medium">
                    Withdrawn: {fmt(totalWithdrawn.toFixed(2))}
                  </span>
                )}
                <span className="text-zinc-600 dark:text-zinc-300 font-semibold">
                  Net saved: {fmt((totalDeposited - totalWithdrawn).toFixed(2))}
                  {depositsGoal && (
                    <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-1">
                      / {fmt(depositsGoal.targetAmount)}
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {monthDeposits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No deposits for this month.</p>
              ) : (
                monthDeposits.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {d.type === 'deposit'
                        ? <ArrowUpCircle className="h-4 w-4 text-blue-500 shrink-0" />
                        : <ArrowDownCircle className="h-4 w-4 text-orange-500 shrink-0" />}
                      <div className="min-w-0">
                        <span className={`font-medium capitalize ${d.type === 'deposit' ? 'text-blue-600' : 'text-orange-500'}`}>
                          {d.type}
                        </span>
                        {d.description && (
                          <span className="text-muted-foreground text-xs ml-2 truncate">{d.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">{fmtDate(d.depositDate)}</span>
                      <span className="font-medium tabular-nums">{fmt(d.amount)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteDepositMutation.mutate(d.id)}
                        disabled={deleteDepositMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
