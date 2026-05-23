import { create } from 'zustand'

interface MonthState {
  selectedMonth: number
  selectedYear: number
  monthLabel: () => string
  isCurrentMonth: () => boolean
  prevMonth: () => void
  nextMonth: () => void
  setMonth: (month: number, year: number) => void
  monthStr: () => string
}

const _now = new Date()

export const useMonthStore = create<MonthState>((set, get) => ({
  selectedMonth: _now.getMonth() + 1,
  selectedYear: _now.getFullYear(),

  monthLabel() {
    const { selectedMonth, selectedYear } = get()
    return new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    })
  },

  isCurrentMonth() {
    const { selectedMonth, selectedYear } = get()
    const now = new Date()
    return selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear()
  },

  monthStr() {
    const { selectedMonth, selectedYear } = get()
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
  },

  setMonth(month: number, year: number) {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) return
    set({ selectedMonth: month, selectedYear: year })
  },

  prevMonth() {
    const { selectedMonth, selectedYear } = get()
    if (selectedMonth === 1) {
      set({ selectedMonth: 12, selectedYear: selectedYear - 1 })
    } else {
      set({ selectedMonth: selectedMonth - 1 })
    }
  },

  nextMonth() {
    const { selectedMonth, selectedYear } = get()
    const now = new Date()
    if (selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear()) return
    if (selectedMonth === 12) {
      set({ selectedMonth: 1, selectedYear: selectedYear + 1 })
    } else {
      set({ selectedMonth: selectedMonth + 1 })
    }
  },
}))
