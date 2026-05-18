export type CategoryType = 'income' | 'expense' | 'saving' | 'investment'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other'

export interface Category {
  id: string
  name: string
  type: CategoryType
  color: string | null
  icon: string | null
  createdAt: string
}

export interface Income {
  id: string
  categoryId: string | null
  sourceName: string
  amount: string
  receivedDate: string
  note: string | null
  createdAt: string
}

export interface Expense {
  id: string
  categoryId: string | null
  description: string | null
  amount: string
  spentDate: string
  paymentMethod: PaymentMethod
  note: string | null
  createdAt: string
}

export interface MonthlyBudget {
  id: string
  monthId: string
  categoryId: string
  plannedBudget: string
  actualSpent: string
  month: number
  year: number
}

export interface Month {
  id: string
  month: number
  year: number
}
