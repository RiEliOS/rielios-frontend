import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import IncomeTab from './components/IncomeTab'
import ExpensesTab from './components/ExpensesTab'
import BudgetsTab from './components/BudgetsTab'
import CategoriesTab from './components/CategoriesTab'

export default function FinancePage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Finance</h1>
        <p className="text-sm text-zinc-500 mt-1">Track your income, expenses, and budgets</p>
      </div>

      <Tabs defaultValue="income">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="income"><IncomeTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="budgets"><BudgetsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
      </Tabs>
    </div>
  )
}
