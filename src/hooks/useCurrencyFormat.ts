import { useAuthStore } from '@/store/auth.store'

export function stripAmountZeros(val: string | null | undefined): string {
  if (!val) return ''
  const n = parseFloat(val)
  return isNaN(n) ? '' : String(n)
}

export function useCurrencyCode() {
  const { user } = useAuthStore()
  return user?.profile?.currency ?? 'USD'
}

export function useCurrencyFormat() {
  const currency = useCurrencyCode()
  return (n: string | number | null | undefined): string => {
    if (n == null || n === '') return '—'
    const num = typeof n === 'number' ? n : parseFloat(n)
    if (isNaN(num)) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }
}
