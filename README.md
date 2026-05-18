# 🚀 RiEliOS Frontend

<div align="center">

<img src="./public/logo.png" alt="RiEliOS Logo" width="120" />

# RiEliOS

### Personal Life & Finance Operating System

A modern web-based platform for managing **finance, goals, savings, investments, life areas, budgeting, and personal growth** — all in one intelligent dashboard.

Built with **React, Vite, TypeScript, Tailwind CSS, Zustand, and modern frontend architecture**.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-Frontend-purple)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-cyan)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 📌 Overview

RiEliOS Frontend is the client-side application for **RiEliOS**, a modern **Personal Life Operating System** developed under the **RiEliTech** ecosystem.

RiEliOS helps users organize important areas of life from one centralized platform — instead of using multiple disconnected tools.

**Key benefits:**
- Financial growth & personal discipline
- Goal achievement & tracking
- Centralized life and data organization
- Productivity & progress insights

---

## 🎯 Vision

> **Organize life, manage money, build discipline, and achieve goals — all from one platform.**

RiEliOS aspires to be the most complete digital operating system for personal life management.

---

## ✨ Core Features

### 🔐 Authentication
- Secure registration & login
- Password reset
- JWT authentication & session persistence
- Protected routes

### 💰 Finance Management
- Track income and expenses
- Manage bill payments and categories
- Financial reports & spending overview

### 📊 Monthly Budgeting
- Set, track, and compare planned vs. actual budgets
- Category-based budgeting & monthly reports

### 💵 Savings Goals
- Create savings targets (e.g., emergency fund, travel fund)
- Track progress, deadlines, and goal completion

### 🎯 Personal Goals
- Set career, educational, health, or financial goals
- Monitor priorities, deadlines, milestones, and progress

### 📈 Investment Management
- Monitor investments (timber, agriculture, business, etc.)
- Plan budgets, track returns, document notes

### 🌱 Life Areas
- Organize your life: career, health, education, relationships, and more

### 📁 Documents Vault
- Securely store receipts, contracts, academic documents, financial records, and notes

### 📊 Reports & Analytics
- Visualize your progress: finance, savings, goals, investments, and monthly summaries

---

## 🛠 Tech Stack

**Frontend:**  
- React 19
- Vite
- TypeScript

**UI & Styling:**  
- Tailwind CSS
- ShadCN UI
- Framer Motion
- Lucide Icons

**State Management:**  
- Zustand

**API:**  
- Axios

**Data Fetching:**  
- TanStack Query

**Form Handling:**  
- React Hook Form
- Zod Validation

**Routing:**  
- React Router DOM

---

## 🏗 System Architecture

```txt
User
 ↓
React Frontend
 ↓
Axios API Layer
 ↓
NestJS Backend API
 ↓
Drizzle ORM
 ↓
Supabase PostgreSQL
```

---

## 📂 Project Structure

```txt
rielios-frontend/
│
├── public/
│   ├── logo.png
│   ├── favicon.ico
│
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── finance/
│   │   ├── goals/
│   │   ├── investments/
│   │   ├── life-areas/
│   │   ├── reports/
│   │   └── settings/
│   ├── services/
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🗺 Main Pages & Routes

- **Authentication**
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/reset-password`
- **Dashboard**
  - `/dashboard`
- **Finance**
  - `/finance`, `/finance/income`, `/finance/expenses`, `/finance/budgets`, `/finance/categories`, `/finance/savings`, `/finance/bills`
- **Goals:** `/goals`, `/goals/:id`
- **Investments:** `/investments`, `/investments/:id`
- **Life Areas:** `/life-areas`, `/life-areas/:id`
- **Reports:** `/reports`

---

## ⚙️ Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/RiEliOS/rielios-frontend.git
    ```
2. **Navigate to project:**
    ```bash
    cd rielios-frontend
    ```
3. **Install dependencies:**
  ```bash
  pnpm install
  ```

---

## 🔐 Environment Variables

Create a `.env` file with your API base URL:

**Example for local development:**
```env
VITE_API_URL=http://localhost:3000
```
**For production:**
```env
VITE_API_URL=https://api.os.rielitech.com
```

---

## ▶️ Run Locally

```bash
pnpm run dev
```
Visit: [http://localhost:5173](http://localhost:5173) by default

---

## 🏗 Build & Preview

**Build:**
```bash
pnpm run build
```

**Preview:**
```bash
pnpm run preview
```

---

## 🔌 API Integration

All requests go through:
```
src/services/api.ts
```

**Example:**
```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

---

## 🔒 Authentication Flow

```txt
Register
   ↓
Login
   ↓
JWT Token
   ↓
Store Authentication State
   ↓
Protected Routes
```

---

## 🌍 Deployment

Frontend is deployed with **Vercel**.

**Production:**  
[https://os.rielitech.com](https://os.rielitech.com)

**Production Env Variable:**
```env
VITE_API_URL=https://api.os.rielitech.com
```

---

## 🌐 DNS Configuration

Cloudflare DNS example:
| Type  | Name | Target         |
|-------|------|----------------|
| CNAME | os   | Vercel Target  |

---

## 🌿 Git Workflow

- `main` → Production
- `develop` → Development
- `feature/*` → New features
- `fix/*` → Bug fixes

**Example branch names:**
- `feature/auth`
- `feature/dashboard`
- `feature/finance-module`
- `fix/login-validation`

---

## 🗺 Roadmap

**Phase 1** — Authentication  
- Register, Login, Forgot password, JWT auth

**Phase 2** — Finance  
- Income, Expenses, Categories, Budgets, Bills

**Phase 3** — Savings  
- Savings goals, Progress tracking

**Phase 4** — Goals  
- Personal goals, Milestones, Progress tracking

**Phase 5** — Investments  
- Investments, Expenses, Returns

**Phase 6** — Documents  
- Upload, Storage, Categorization

**Phase 7** — Reports  
- Analytics, Charts, Monthly summaries

---

## 🤝 Contribution

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push branch
5. Open Pull Request

---

## 📄 License

MIT License

---

<div align="center">

### Built with ❤️ by RiEliTech

**RiEliOS — Your Personal Life Operating System**

</div>
