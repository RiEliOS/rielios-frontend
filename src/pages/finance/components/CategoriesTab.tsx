import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Tag, MoreVertical } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { financeService } from '@/services/finance.service'
import type { Category, CategoryType } from '@/types/finance'

const schema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense', 'saving', 'investment']),
  color: z.string().optional(),
  icon: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const TYPE_COLORS: Record<CategoryType, string> = {
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
  saving: 'bg-blue-100 text-blue-700',
  investment: 'bg-purple-100 text-purple-700',
}

export default function CategoriesTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: financeService.getCategories,
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'expense' },
  })

  const createMutation = useMutation({
    mutationFn: financeService.createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); closeDialog(); toast.success('Category created') },
    onError: () => toast.error('Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      financeService.updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); closeDialog(); toast.success('Category updated') },
    onError: () => toast.error('Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: financeService.deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setConfirmId(null); toast.success('Category deleted') },
    onError: () => toast.error('Failed to delete category'),
  })

  function openCreate() {
    setEditing(null)
    reset({ type: 'expense', name: '', color: '', icon: '' })
    setOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    reset({ name: cat.name, type: cat.type, color: cat.color ?? '', icon: cat.icon ?? '' })
    setOpen(true)
  }

  function closeDialog() {
    setOpen(false)
    setEditing(null)
  }

  function onSubmit(data: FormData) {
    const payload = { ...data, color: data.color || null, icon: data.icon || null }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { name: payload.name, color: payload.color, icon: payload.icon } })
    } else {
      createMutation.mutate(payload as any)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Category</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create categories to organise your income and expenses."
          action={{ label: 'Add Category', onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-zinc-200 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                  style={{ backgroundColor: cat.color ?? '#e4e4e7' }}
                >
                  <Tag className="h-4 w-4 text-white opacity-90" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-800">{cat.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[cat.type]}`}>
                    {cat.type}
                  </span>
                </div>
              </div>
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
                      onSelect={() => openEdit(cat)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuPrimitive.Item>
                    <DropdownMenuPrimitive.Item
                      onSelect={() => setConfirmId(cat.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-destructive/10 text-destructive outline-none select-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuPrimitive.Item>
                  </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Root>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. Groceries" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {!editing && (
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="saving">Saving</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Color <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <Input
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={field.value || '#3b82f6'}
                      onChange={field.onChange}
                      className="h-10 w-10 rounded border cursor-pointer p-0.5"
                    />
                  </div>
                )}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!confirmId}
        title="Delete category?"
        description="This will permanently remove this category."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
