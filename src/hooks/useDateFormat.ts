import { useAuthStore } from '@/store/auth.store'

export function useDateFormat() {
  const { user } = useAuthStore()
  const timeZone = user?.profile?.timezone ?? 'UTC'

  const fmtDate = (d: string, opts?: Intl.DateTimeFormatOptions): string => {
    const date = new Date(d.length === 10 ? d + 'T00:00:00' : d)
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      timeZone,
      ...opts,
    })
  }

  const fmtDateShort = (d: string): string =>
    fmtDate(d, { year: undefined as any })

  const fmtDateTime = (d: string): string =>
    new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZone,
    })

  return { fmtDate, fmtDateShort, fmtDateTime, timeZone }
}
