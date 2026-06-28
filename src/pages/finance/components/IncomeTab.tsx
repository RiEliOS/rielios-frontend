import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, MoreVertical } from 'lucide-react'
import financeIcon from '@/assets/finance.png'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { financeService } from '@/services/finance.service'
import { useMonthStore } from '@/store/month.store'
import { useCurrencyFormat, useCurrencyCode, stripAmountZeros } from '@/hooks/useCurrencyFormat'
import { useDateFormat } from '@/hooks/useDateFormat'
import type { Income, Category } from '@/types/finance'

const schema = z.object({
  sourceName: z.string().min(1, 'Source name is required'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  receivedDate: z.string().min(1, 'Date is required'),
  categoryId: z.string().optional(),
  note: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function IncomeTab() {
  const qc = useQueryClient()
  const fmt = useCurrencyFormat()
  const currency = useCurrencyCode()
  const { fmtDate } = useDateFormat()
  const { monthStr } = useMonthStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: incomeList = [], isLoading } = useQuery({
    queryKey: ['income'],
    queryFn: financeService.getIncome,
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: financeService.getCategories,
  })

  const incomeCategories = categories.filter((c) => c.type === 'income')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { receivedDate: new Date().toISOString().split('T')[0] },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      financeService.createIncome({ ...data, categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : null } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['income'] }); closeDialog(); toast.success('Income added') },
    onError: () => toast.error('Failed to save income'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      financeService.updateIncome(id, { ...data, categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : null } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['income'] }); closeDialog(); toast.success('Income updated') },
    onError: () => toast.error('Failed to update income'),
  })

  const deleteMutation = useMutation({
    mutationFn: financeService.deleteIncome,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['income'] }); setConfirmId(null); toast.success('Income deleted') },
    onError: () => toast.error('Failed to delete income'),
  })

  function openCreate() {
    setEditing(null)
    reset({ sourceName: '', amount: '', receivedDate: new Date().toISOString().split('T')[0], categoryId: 'none', note: '' })
    setOpen(true)
  }

  function openEdit(item: Income) {
    setEditing(item)
    reset({
      sourceName: item.sourceName,
      amount: stripAmountZeros(item.amount),
      receivedDate: item.receivedDate,
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

  const getCategoryName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : '—'

  const filtered = [...incomeList]
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
    .filter((item) => item.receivedDate.startsWith(monthStr()))

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Income</Button>
      </div>


      {isLoading ? (
        <div className="flex justify-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">Loading…</div>
      ) : incomeList.length === 0 ? (
        <EmptyState
          icon={financeIcon}
          title="No income yet"
          description="Add your first income source to start tracking."
        />
      ) : filtered.length === 0 ? (
        <div className="flex justify-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
          {'No income entries for this month.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 shrink-0">
                  <img src={financeIcon} alt="" className="h-5 w-5 object-contain mix-blend-multiply dark:mix-blend-normal" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{item.sourceName}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {fmtDate(item.receivedDate)}
                    {item.categoryId && ` · ${getCategoryName(item.categoryId)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-green-600">{fmt(item.amount)}</span>
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
            <DialogTitle>{editing ? 'Edit Income' : 'Add Income'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Source Name</Label>
              <Input {...register('sourceName')} placeholder="e.g. Salary, Freelance" />
              {errors.sourceName && <p className="text-xs text-destructive">{errors.sourceName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount ({currency})</Label>
                <Input {...register('amount')} placeholder="0" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date Received</Label>
                <Input type="date" {...register('receivedDate')} />
                {errors.receivedDate && <p className="text-xs text-destructive">{errors.receivedDate.message}</p>}
              </div>
            </div>

            {incomeCategories.length > 0 && (
              <div className="space-y-1.5">
                <Label>Category <span className="text-zinc-400 text-xs">(optional)</span></Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {incomeCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Note <span className="text-zinc-400 text-xs">(optional)</span></Label>
              <Textarea {...register('note')} placeholder="Any additional notes…" rows={2} />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Income'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete income entry?"
        description="This will permanently remove this income record."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
