import { api } from './api'
import type { Category, Income, Expense, MonthlyBudget } from '@/types/finance'

export const financeService = {
  // Categories
  getCategories: () => api.get<Category[]>('/finance/categories').then((r) => r.data),
  createCategory: (data: Omit<Category, 'id' | 'createdAt'>) =>
    api.post<Category>('/finance/categories', data).then((r) => r.data),
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'type'>>) =>
    api.patch<Category>(`/finance/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id: string) => api.delete(`/finance/categories/${id}`),

  // Income
  getIncome: () => api.get<Income[]>('/finance/income').then((r) => r.data),
  createIncome: (data: Omit<Income, 'id' | 'createdAt'>) =>
    api.post<Income>('/finance/income', data).then((r) => r.data),
  updateIncome: (id: string, data: Partial<Omit<Income, 'id' | 'createdAt'>>) =>
    api.patch<Income>(`/finance/income/${id}`, data).then((r) => r.data),
  deleteIncome: (id: string) => api.delete(`/finance/income/${id}`),

  // Expenses
  getExpenses: () => api.get<Expense[]>('/finance/expenses').then((r) => r.data),
  createExpense: (data: Omit<Expense, 'id' | 'createdAt'>) =>
    api.post<Expense>('/finance/expenses', data).then((r) => r.data),
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) =>
    api.patch<Expense>(`/finance/expenses/${id}`, data).then((r) => r.data),
  deleteExpense: (id: string) => api.delete(`/finance/expenses/${id}`),

  // Budgets
  getBudgets: () => api.get<MonthlyBudget[]>('/finance/budgets').then((r) => r.data),
  createBudget: (data: { monthId: string; categoryId: string; plannedBudget: string }) =>
    api.post<MonthlyBudget>('/finance/budgets', data).then((r) => r.data),
  updateBudget: (id: string, data: { plannedBudget: string }) =>
    api.patch<MonthlyBudget>(`/finance/budgets/${id}`, data).then((r) => r.data),
  deleteBudget: (id: string) => api.delete(`/finance/budgets/${id}`),

  // Months
  getOrCreateMonth: (month: number, year: number) =>
    api.post('/finance/months', { month, year }).then((r) => r.data),
}
