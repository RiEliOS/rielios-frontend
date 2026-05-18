import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, PiggyBank, Target, MoreVertical } from 'lucide-react'
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
  savedAmount: z.string().regex(amountRegex, 'Enter a valid amount'),
  deadline: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']),
})

type FormData = z.infer<typeof schema>

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-500',
}

const fmt = (n: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(n))

export default function SavingsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SavingGoal | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: goals = [], isLoading } = useQuery<SavingGoal[]>({
    queryKey: ['savings'],
    queryFn: () => api.get('/savings').then((r) => r.data),
  })

  const { data: personalGoals = [] } = useQuery<PersonalGoal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', savedAmount: '0' },
  })

  function toPayload(data: FormData) {
    return {
      ...data,
      personalGoalId: (data.personalGoalId && data.personalGoalId !== 'none') ? data.personalGoalId : null,
      deadline: data.deadline || undefined,
      description: data.description || undefined,
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/savings', toPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings'] }); closeDialog(); toast.success('Saving goal created') },
    onError: () => toast.error('Failed to create saving goal'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.patch(`/savings/${id}`, toPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings'] }); closeDialog(); toast.success('Saving goal updated') },
    onError: () => toast.error('Failed to update saving goal'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/savings/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings'] }); setConfirmId(null); toast.success('Saving goal deleted') },
    onError: () => toast.error('Failed to delete saving goal'),
  })

  function openCreate() {
    setEditing(null)
    reset({ personalGoalId: 'none', name: '', description: '', targetAmount: '', savedAmount: '0', deadline: '', status: 'active' })
    setOpen(true)
  }

  function openEdit(goal: SavingGoal) {
    setEditing(goal)
    reset({
      personalGoalId: goal.personalGoalId ?? 'none',
      name: goal.name,
      description: goal.description ?? '',
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Savings</h1>
          <p className="text-sm text-zinc-500 mt-1">Build your financial safety net</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Goal</Button>
      </div>

      {goals.length > 0 && (
        <div className="flex gap-4">
          <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-2.5">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Total Saved</p>
            <p className="text-xl font-black text-blue-700">{fmt(totalSaved.toFixed(2))}</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 border border-zinc-200 px-4 py-2.5">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Total Target</p>
            <p className="text-xl font-black text-zinc-700">{fmt(totalTarget.toFixed(2))}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200 h-36 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create your first savings goal to start building wealth."
          action={{ label: 'New Goal', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = Math.min((parseFloat(goal.savedAmount) / parseFloat(goal.targetAmount)) * 100, 100)
            const linkedGoal = getGoalTitle(goal.personalGoalId)
            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[goal.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {goal.status}
                  </span>
                  <p className="font-semibold text-sm text-zinc-800 flex-1 min-w-0 truncate">{goal.name}</p>
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
                  <p className="text-sm text-zinc-500">{goal.description}</p>
                )}
                {linkedGoal && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Target className="h-3 w-3" />
                    <span>{linkedGoal}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-800">{fmt(goal.savedAmount)}</span>
                  <span className="text-zinc-400">of {fmt(goal.targetAmount)}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-zinc-400">
                  {pct.toFixed(0)}% complete
                  {goal.deadline && ` · Due ${new Date(goal.deadline).toLocaleDateString()}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Delete saving goal?"
        description="This will permanently remove this saving goal."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Saving Goal' : 'New Saving Goal'}</DialogTitle>
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
              <Label>Linked Goal <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
                <Label>Target Amount ($)</Label>
                <Input {...register('targetAmount')} placeholder="5000.00" />
                {errors.targetAmount && <p className="text-xs text-destructive">{errors.targetAmount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Already Saved ($)</Label>
                <Input {...register('savedAmount')} placeholder="0.00" />
                {errors.savedAmount && <p className="text-xs text-destructive">{errors.savedAmount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Deadline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="date" {...register('deadline')} />
              </div>
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
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
