import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  isPending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-1">{description}</p>
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
