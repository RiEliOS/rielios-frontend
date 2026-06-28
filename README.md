# RiEliOS Frontend

<div align="center">

<img src="./public/logo.png" alt="RiEliOS Logo" width="120" />

# RiEliOS

### Personal Life & Finance Operating System

A modern web-based platform for managing **finance, goals, savings, investments, life areas, budgeting, and personal growth** — all in one intelligent dashboard.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-cyan)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Overview

RiEliOS Frontend is the client-side application for **RiEliOS**, a **Personal Life Operating System** developed under the **RiEliTech** ecosystem.

Instead of juggling multiple disconnected apps, RiEliOS gives you one centralized platform to track money, set and achieve goals, monitor investments, and organize your life.

---

## Vision

> **Organize life, manage money, build discipline, and achieve goals — all from one platform.**

---

## Tech Stack

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| Vite | 6 | Build tool & dev server |
| TypeScript | 5.8 | Type safety |
| Tailwind CSS | 4 | Utility-first styling |

### UI & Components
| Package | Purpose |
|---------|---------|
| Radix UI (accordion, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, radio-group, scroll-area, select, separator, slot, switch, tabs, toast, tooltip) | Headless UI primitives |
| Lucide React | Icon library |
| Framer Motion | Animations |
| class-variance-authority | Component variant management |
| clsx + tailwind-merge | Class merging utilities |

### State & Data
| Package | Purpose |
|---------|---------|
| Zustand 5 | Global auth state |
| TanStack Query 5 | Server state, caching & mutations |
| Axios | HTTP client |

### Forms & Validation
| Package | Purpose |
|---------|---------|
| React Hook Form 7 | Form state management |
| @hookform/resolvers | Zod adapter for RHF |
| Zod | Schema validation |

### Routing & Notifications
| Package | Purpose |
|---------|---------|
| React Router DOM 6 | Client-side routing |
| Sonner 2 | Toast notifications |

---

## Project Structure

```
rielios-frontend/
│
├── public/
│   ├── logo.png
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── Layout.tsx           # App shell wrapper
│   │   │   └── ProtectedRoute.tsx   # Auth guard
│   │   └── ui/                      # shadcn/Radix UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── textarea.tsx
│   │       ├── dialog.tsx
│   │       ├── select.tsx
│   │       ├── tabs.tsx
│   │       ├── progress.tsx
│   │       ├── empty-state.tsx      # Shared empty state component
│   │       └── confirm-dialog.tsx   # Shared delete confirmation dialog
│   │
│   ├── pages/
│   │   ├── auth/                    # Login, Register, Forgot/Reset password
│   │   ├── dashboard/               # DashboardPage — KPIs, panels, quick-add
│   │   ├── finance/
│   │   │   ├── FinancePage.tsx      # Tabs shell
│   │   │   └── components/
│   │   │       ├── IncomeTab.tsx
│   │   │       ├── ExpensesTab.tsx
│   │   │       ├── BudgetsTab.tsx
│   │   │       └── CategoriesTab.tsx
│   │   ├── savings/                 # SavingsPage
│   │   ├── goals/                   # GoalsPage
│   │   ├── investments/             # InvestmentsPage + entries panel
│   │   ├── life-areas/              # LifeAreasPage
│   │   ├── reports/                 # ReportsPage — analytics panels
│   │   ├── settings/                # SettingsPage — profile & preferences
│   │   └── landing/                 # About/landing pages
│   │
│   ├── services/
│   │   ├── api.ts                   # Axios instance
│   │   └── finance.service.ts       # Finance API helpers
│   │
│   ├── store/
│   │   └── auth.store.ts            # Zustand auth store
│   │
│   ├── types/
│   │   └── finance.ts               # Shared TypeScript types
│   │
│   ├── lib/
│   │   └── utils.ts                 # cn() helper
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Email + password login |
| `/register` | RegisterPage | New account creation |
| `/forgot-password` | ForgotPasswordPage | Request password reset email |
| `/reset-password` | ResetPasswordPage | Set new password via token |
| `/dashboard` | DashboardPage | KPI overview, panels, recent transactions, quick add |
| `/finance` | FinancePage | Tabbed: Income · Expenses · Budgets · Categories |
| `/savings` | SavingsPage | Savings goals with progress tracking |
| `/goals` | GoalsPage | Personal goals with linked savings & investments |
| `/investments` | InvestmentsPage | Investment tracking with entries log |
| `/life-areas` | LifeAreasPage | Life area organization |
| `/reports` | ReportsPage | Finance, goals, investments & budget analytics |
| `/settings` | SettingsPage | Profile, preferences & account management |

---

## Core Features

### Authentication ✅
- Registration, login, forgot password, password reset
- JWT token storage and session persistence
- Protected routes with auth guard

### Dashboard ✅
- KPI cards: Net Flow, Income, Expenses, Available Cash (current month)
- Savings Goals panel with overall + per-goal progress bars
- Investments panel: budget vs contributed vs returned
- Personal Goals panel with priority badges and progress
- Budget Health panel with per-category spend bars (red if over)
- Recent Transactions list (income + expenses, chronological)
- **Quick Add** buttons — add income or expense directly from the dashboard without navigating away

### Finance — Income ✅
- Log income entries: source name, amount, date, optional category & note
- Month filter (native date picker) + text search
- Period total badge ("This Period" / "All Time")
- Human-readable date formatting (e.g. "May 19, 2026")
- Edit and delete with confirmation dialog

### Finance — Expenses ✅
- Log expenses: description, amount, date, optional category, payment method & note
- Month filter + text search
- Period total badge
- Budget hint — shows remaining budget for the selected category when adding
- Human-readable date formatting
- Edit and delete with confirmation dialog

### Finance — Budgets ✅
- Set monthly spending limits per expense category
- Real-time progress bars with color coding (green → amber at 80% → red when over)
- Over-budget alert banner with total overage and affected categories
- "All budgets on track" green banner when all are within limits
- Edit and delete with confirmation dialog

### Finance — Categories ✅
- Create income, expense, saving, or investment categories
- Custom color with color picker
- Type badges with distinct color coding
- Edit and delete with confirmation dialog

### Savings Goals ✅
- Create savings goals with name, target amount, saved amount, deadline, status
- Link to a Personal Goal
- Progress bar per goal, total saved vs total target summary stats
- Status: active, completed, paused, cancelled
- Edit and delete with confirmation dialog

### Personal Goals ✅
- Create goals with title, description, priority (low/medium/high), target date, life area
- Status management: active, completed, paused, cancelled
- Priority and status badges with color coding
- Linked savings goals shown as embedded progress bars
- Linked investments summary
- Target date display
- Edit and delete with confirmation dialog

### Investments ✅
- Track investments with planned budget, expected return
- Link to Personal Goal and Life Area
- Budget usage progress bar (red if over budget)
- Contributed vs Returned metrics with color-coded comparison
- **Entries panel** — log contributions, returns, and notes with a timestamped history
- Show/hide history toggle with summary stats (contributed total, returned total, net P&L)
- Edit and delete with confirmation dialog

### Life Areas ✅
- Define life pillars (Health, Career, Finance, etc.) with emoji picker and description
- Used as a linking dimension across Goals and Investments
- Edit and delete with confirmation dialog

### Reports ✅
- Finance summary: all-time income, expenses, invested, net balance, available cash
- Top expense categories with relative progress bars
- Goals summary: total count, breakdown by status
- Investments summary: budget usage, contributed vs returned, expected vs actual P&L, performance labels
- Budget performance: planned vs spent per category across all periods, variance totals

### Settings ✅
- Profile: full name, phone, avatar URL
- Preferences: currency, timezone, theme
- Account: change password

---

## Shared UI Patterns

### `EmptyState` component
Reusable empty state with icon, title, description, and optional call-to-action button. Used across all list pages.

### `ConfirmDialog` component
Reusable delete confirmation dialog. Applied consistently across all pages — no destructive action fires immediately on click.

### Design system conventions
- Cards: `bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700`
- All mutations show `toast.success` / `toast.error` feedback via Sonner
- Loading states use skeleton pulse animations
- Mobile-responsive tab overflow via `overflow-x-auto` on Finance tabs
- Dark mode toggled via `.dark` class on `<html>` from the user's saved theme preference
- `@custom-variant dark` in `index.css` enables class-based dark mode for Tailwind v4

---

## System Architecture

```
User
 ↓
React Frontend (Vite, React 19)
 ↓
Axios API Layer (services/api.ts)
 ↓
NestJS Backend API
 ↓
Drizzle ORM
 ↓
Supabase PostgreSQL
```

---

## Installation

```bash
git clone https://github.com/RiEliOS/rielios-frontend.git
cd rielios-frontend
pnpm install
```

---

## Environment Variables

```env
# Local
VITE_API_URL=http://localhost:3000

# Production
VITE_API_URL=https://api.os.rielitech.com
```

---

## Run Locally

```bash
pnpm dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## Build & Preview

```bash
pnpm build
pnpm preview
```

---

## Deployment

Frontend is deployed on **Vercel**.

**Production:** [https://os.rielitech.com](https://os.rielitech.com)

Cloudflare DNS:
| Type | Name | Target |
|------|------|--------|
| CNAME | os | Vercel Target |

---

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production |
| `develop` | Development |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

---

## Roadmap

### Phase 1 — Authentication ✅ Complete
- Register, login, forgot password, JWT auth, protected routes

### Phase 2 — Finance ✅ Complete
- Income, expenses, budgets, categories
- Month filtering, search, period totals, budget hints

### Phase 3 — Savings ✅ Complete
- Savings goals with progress tracking, deadlines, status, linked personal goals

### Phase 4 — Goals ✅ Complete
- Personal goals with priority, status, linked savings and investments, life area linking

### Phase 5 — Investments ✅ Complete
- Investment tracking, budget vs contributed vs returned, entries log with P&L

### Phase 6 — Life Areas ✅ Complete
- Life area definition with emoji picker, linked to goals and investments

### Phase 7 — Reports ✅ Complete
- Finance, goals, investments, and budget analytics panels

### Phase 8 — Dashboard & UX Polish ✅ Complete
- Real-time KPI cards, linked panels, recent transactions
- Quick Add income/expense from dashboard
- Delete confirmation dialogs across all pages
- Human-readable date formatting everywhere
- Toast notifications on all create/update/delete actions
- EmptyState and ConfirmDialog shared components
- Mobile-responsive finance tab overflow

### Phase 9 — Dark Mode ✅ Complete
- Full system dark mode across every page and component
- Class-based dark mode via `@custom-variant dark` in Tailwind v4
- Theme persisted in user profile (light / dark / system)
- Applied to: Dashboard, Finance, Savings, Investments, Goals, Life Areas, Reports, Settings, and all shared components
- PNG icon blend-mode fix (`dark:mix-blend-normal`) for visibility on dark backgrounds

### Phase 10 — Documents 📋 Planned
- Upload and manage receipts, contracts, and financial records

### Phase 11 — Advanced Analytics 📋 Planned
- Income/expense trend charts (bar, line)
- Category filter on income/expense lists
- Savings contribution shortcut
- Goal progress inline update
- CSV export

---

## License

MIT License

---

<div align="center">

### Built with ❤️ by RiEliTech

**RiEliOS — Your Personal Life Operating System**

</div>
