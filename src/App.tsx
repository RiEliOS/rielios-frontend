import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import PublicLayout from '@/components/layout/PublicLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import LandingPage from '@/pages/landing/LandingPage'
import AboutPage from '@/pages/landing/AboutPage'
import PricingPage from '@/pages/landing/PricingPage'
import ContactPage from '@/pages/landing/ContactPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import FinancePage from '@/pages/finance/FinancePage'
import GoalsPage from '@/pages/goals/TargetsPage'
import SavingsPage from '@/pages/savings/SavingsPage'
import InvestmentsPage from '@/pages/investments/InvestmentsPage'
import LifeAreasPage from '@/pages/life-areas/LifeAreasPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import SettingsPage from '@/pages/settings/SettingsPage'

export default function App() {
  return (
    <>
    <Toaster position="top-right" richColors closeButton />
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public marketing routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/finance/*" element={<FinancePage />} />
            <Route path="/targets/*" element={<GoalsPage />} />
            <Route path="/savings/*" element={<SavingsPage />} />
            <Route path="/investments/*" element={<InvestmentsPage />} />
            <Route path="/life-areas/*" element={<LifeAreasPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}
