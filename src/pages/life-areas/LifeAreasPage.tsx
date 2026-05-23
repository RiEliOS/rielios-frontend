import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Plus, Layers, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/services/api'

interface LifeArea {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
}

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  description: z.string().optional(),
  icon: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const EMOJIS = [
  '💪','🏋️','🧘','🏃','🚴','🥗','❤️','🧠',
  '💼','🖥️','📊','📝','🚀','🏢','🔧','📱',
  '💰','💵','📈','🏦','💎','🪙','💳','🤑',
  '🎯','🏆','⭐','🌟','💡','🔥','✨','🥇',
  '📚','🎓','🔬','📖','✏️','🧪','🗒️','🖊️',
  '✈️','🌍','🗺️','🧳','🏖️','🚂','🏕️','🌄',
  '🏠','🌱','🌿','🛋️','🔑','🐾','🌺','🌙',
  '👫','🤝','🗣️','🎉','🎊','🎶','🎨','📸',
]


export default function LifeAreasPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LifeArea | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)

  const { data: areas = [], isLoading } = useQuery<LifeArea[]>({
    queryKey: ['life-areas'],
    queryFn: () => api.get('/life-areas').then((r) => r.data),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', icon: '' },
  })

  const watchedName = watch('name')
  const watchedIcon = watch('icon')

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/life-areas', {
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['life-areas'] }); closeDialog(); toast.success('Life area created') },
    onError: () => toast.error('Failed to create life area'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.patch(`/life-areas/${id}`, {
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['life-areas'] }); closeDialog(); toast.success('Life area updated') },
    onError: () => toast.error('Failed to update life area'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/life-areas/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['life-areas'] }); setConfirmId(null); toast.success('Life area deleted') },
    onError: () => toast.error('Failed to delete life area'),
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '', icon: '' })
    setOpen(true)
  }

  function openEdit(area: LifeArea) {
    setEditing(area)
    reset({ name: area.name, description: area.description ?? '', icon: area.icon ?? '' })
    setOpen(true)
  }

  function closeDialog() {
    setOpen(false)
    setEditing(null)
    setEmojiOpen(false)
  }

  function onSubmit(data: FormData) {
    if (editing) updateMutation.mutate({ id: editing.id, data })
    else createMutation.mutate(data)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const emojiButtonLabel = watchedIcon || watchedName?.[0]?.toUpperCase() || '?'

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Life Areas</h1>
          <p className="text-sm text-zinc-500 mt-1">Organize the key areas of your life</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Area</Button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-xl animate-pulse bg-zinc-100 shrink-0" />
              <div className="flex-1 h-4 animate-pulse bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      ) : areas.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No life areas yet"
          description="Define the pillars of your life to organize goals and investments."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {areas.map((area) => (
            <div key={area.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm font-bold shrink-0 select-none">
                {area.icon || area.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800">{area.name}</p>
                {area.description && (
                  <p className="text-xs text-zinc-400 truncate">{area.description}</p>
                )}
              </div>
              <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                      onSelect={() => openEdit(area)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground outline-none select-none"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuPrimitive.Item>
                    <DropdownMenuPrimitive.Item
                      onSelect={() => setConfirmId(area.id)}
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

      <ConfirmDialog
        open={!!confirmId}
        title="Delete life area?"
        description="This will permanently remove this life area."
        onConfirm={() => deleteMutation.mutate(confirmId!)}
        onCancel={() => setConfirmId(null)}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Life Area' : 'New Life Area'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <div className="flex rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <PopoverPrimitive.Root open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverPrimitive.Trigger asChild>
                    <button
                      type="button"
                      className="w-10 flex items-center justify-center bg-muted border-r border-input text-sm shrink-0 select-none hover:bg-muted/80 transition-colors"
                      title="Pick an emoji"
                    >
                      {emojiButtonLabel}
                    </button>
                  </PopoverPrimitive.Trigger>
                  <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                      align="start"
                      sideOffset={8}
                      className="z-50 rounded-lg border bg-popover shadow-md p-3 outline-none"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-medium">Pick an emoji</p>
                        {watchedIcon && (
                          <button
                            type="button"
                            onClick={() => { setValue('icon', ''); setEmojiOpen(false) }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-8 gap-0.5">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => { setValue('icon', e); setEmojiOpen(false) }}
                            className={`h-8 w-8 text-base flex items-center justify-center rounded hover:bg-accent transition-colors ${watchedIcon === e ? 'bg-accent' : ''}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </PopoverPrimitive.Content>
                  </PopoverPrimitive.Portal>
                </PopoverPrimitive.Root>
                <input
                  {...register('name')}
                  placeholder="e.g. Health & Fitness"
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-background outline-none placeholder:text-muted-foreground"
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea {...register('description')} placeholder="What does this life area cover?" rows={2} />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Area'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
