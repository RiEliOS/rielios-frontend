import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Target, PiggyBank, BarChart3, MapPin, MoreVertical } from 'lucide-react'
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

interface Goal {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  progress: number
  targetDate: string | null
  lifeAreaId: string | null
}

interface SavingGoal {
  id: string
  personalGoalId: string | null
  name: string
  targetAmount: string
  savedAmount: string
  deadline: string | null
  status: string
}

interface Investment {
  id: string
  personalGoalId: string | null
  name: string
  plannedBudget: string | null
  amountSpent: string
  status: string
}

interface LifeArea {
  id: string
  name: string
  color: string | null
}

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  targetDate: z.string().optional(),
  lifeAreaId: z.string().optional(),
})

const editSchema = createSchema.extend({
  status: z.enum(['active', 'completed', 'paused', 'cancelled']),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-500',
}

const fmt = (n: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(n))

export default function GoalsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  })

  const { data: savings = [] } = useQuery<SavingGoal[]>({
    queryKey: ['savings'],
    queryFn: () => api.get('/savings').then((r) => r.data),
  })

  const { data: investments = [] } = useQuery<Investment[]>({
    queryKey: ['investments'],
    queryFn: () => api.get('/investments').then((r) => r.data),
  })

  const { data: lifeAreas = [] } = useQuery<LifeArea[]>({
    queryKey: ['life-areas'],
    queryFn: () => api.get('/life-areas').then((r) => r.data),
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editing ? editSchema : (createSchema as any)),
    defaultValues: { priority: 'medium', status: 'active' },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/goals', {
      ...data,
      priority: data.priority || undefined,
      targetDate: data.targetDate || undefined,
      description: data.description || undefined,
      lifeAreaId: data.lifeAreaId === 'none' ? undefined : data.lifeAreaId || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); closeDialog(); toast.success('Goal created') },
    onError: () => toast.error('Failed to create goal'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) => api.patch(`/goals/${id}`, {
      ...data,
      targetDate: data.targetDate || undefined,
      description: data.description || undefined,
      lifeAreaId: data.lifeAreaId === 'none' ? null : data.lifeAreaId || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); closeDialog(); toast.success('Goal updated') },
    onError: () => toast.error('Failed to update goal'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setConfirmId(null); toast.success('Goal deleted') },
    onError: () => toast.error('Failed to delete goal'),
  })

  function openCreate() {
    setEditing(null)
    reset({ title: '', description: '', priority: 'medium', targetDate: '', status: 'active', lifeAreaId: 'none' })
    setOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditing(goal)
    reset({
      title: goal.title,
      description: goal.description ?? '',
      priority: (goal.priority as any) || 'medium',
      targetDate: goal.targetDate ?? '',
      status: (goal.status as any) || 'active',
      lifeAreaId: goal.lifeAreaId ?? 'none',
    })
    setOpen(true)
  }

  function closeDialog() { setOpen(false); setEditing(null) }

  function onSubmit(data: EditForm) {
    if (editing) updateMutation.mutate({ id: editing.id, data })
    else createMutation.mutate(data)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Personal Goals</h1>
          <p className="text-sm text-zinc-500 mt-1">Track your milestones and achievements</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Goal</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200 h-32 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first personal goal to start tracking your milestones."
          action={{ label: 'New Goal', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const linkedSavings = savings.filter((s) => s.personalGoalId === goal.id)
            const linkedInvestments = investments.filter((inv) => inv.personalGoalId === goal.id)
            const lifeArea = lifeAreas.find((la) => la.id === goal.lifeAreaId)

            const totalSaved = linkedSavings.reduce((s, g) => s + parseFloat(g.savedAmount), 0)
            const totalTarget = linkedSavings.reduce((s, g) => s + parseFloat(g.targetAmount), 0)
            const savingsProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : null

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_COLORS[goal.priority] ?? 'bg-gray-100 text-gray-700'}`}>
                    {goal.priority}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[goal.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {goal.status}
                  </span>
                  <p className="font-semibold text-sm text-zinc-800 flex-1 min-w-0 truncate">{goal.title}</p>
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
                {lifeArea && (
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {lifeArea.name}
                  </p>
                )}
                {savingsProgress !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Savings progress</span>
                      <span className="font-medium text-zinc-700">{Math.round(savingsProgress)}%</span>
                    </div>
                    <Progress value={savingsProgress} className="h-2" />
                  </div>
                )}
                {linkedSavings.length > 0 && (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2 space-y-1.5">
                    <p className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                      <PiggyBank className="h-3 w-3" />
                      Savings ({linkedSavings.length})
                    </p>
                    {linkedSavings.map((s) => {
                      const pct = Math.min(
                        (parseFloat(s.savedAmount) / parseFloat(s.targetAmount)) * 100,
                        100,
                      )
                      return (
                        <div key={s.id}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-zinc-700">{s.name}</span>
                            <span className="text-zinc-500">{fmt(s.savedAmount)} / {fmt(s.targetAmount)}</span>
                          </div>
                          <Progress value={pct} className="h-1" />
                        </div>
                      )
                    })}
                    {totalTarget > 0 && (
                      <p className="text-xs text-zinc-400 pt-0.5">
                        Total: {fmt(totalSaved.toFixed(2))} of {fmt(totalTarget.toFixed(2))}
                      </p>
                    )}
                  </div>
                )}
                {linkedInvestments.length > 0 && (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2 space-y-1.5">
                    <p className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      Investments ({linkedInvestments.length})
                    </p>
                    {linkedInvestments.map((inv) => {
                      const budget = inv.plannedBudget ? parseFloat(inv.plannedBudget) : 0
                      const spent = parseFloat(inv.amountSpent)
                      const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
                      return (
                        <div key={inv.id}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-zinc-700">{inv.name}</span>
                            <span className="text-zinc-500">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(spent)}
                              {budget > 0 && ` / ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(budget)}`}
                            </span>
                          </div>
                          {budget > 0 && <Progress value={pct} className="h-1" />}
                        </div>
                      )
                    })}
                  </div>
                )}
                {goal.targetDate && (
                  <p className="text-xs text-zinc-400">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Delete goal?"
        description="This will permanently remove this goal."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Goal' : 'New Goal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...register('title')} placeholder="e.g. Buy a Laptop" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea {...register('description')} placeholder="What does achieving this goal look like?" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? 'medium'} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Target Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="date" {...register('targetDate')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Life Area <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Controller
                name="lifeAreaId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="No life area" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No life area</SelectItem>
                      {lifeAreas.map((la) => (
                        <SelectItem key={la.id} value={la.id}>{la.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
    </div>
  )
}
