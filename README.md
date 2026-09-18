# 📊 Kartly — Multi-Platform E-Commerce Analytics

Kartly is a high-performance, unified e-commerce analytics hub built using **React 18 (TypeScript)**, **Vite**, **Tailwind CSS**, and **Shadcn UI**. Online merchants can consolidate and normalize sales reports from major marketplaces (**Amazon**, **Flipkart**, and **Meesho**) into a single, cohesive dashboard with tax-ready report exports.

---

## 🌟 Features

- 📁 **Marketplace CSV Import**: Import order CSV/Excel sheets directly from Amazon, Flipkart, and Meesho.
- 📈 **Unified Financial Analytics**: Track net settlement, gross revenue, order volume, and average order value across multiple sales channels.
- 📑 **CA-Audit Ready Reports**: Generate and export government-compliant GST returns (GSTR-1, GSTR-3B formats), invoice-level tax registers, commission breakdowns, and product sales summaries.
- 🔒 **Row-Level Security (RLS)**: Fine-grained PostgreSQL security policies ensure that every user's data remains isolated and completely private.
- 🌗 **Responsive Design & Dark Mode**: Sleek modern UI tailored for desktops, tablets, and mobile devices.
- 🤖 **Automated Database Keep-Alive**: Built-in GitHub Actions workflow to prevent Supabase free tier inactivity auto-pause.

---

## 🛠️ Technology Stack

- **Frontend**: [React 18](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **Database & Authentication**: [Supabase](https://supabase.com/) (PostgreSQL with RLS)
- **Hosting**: [Firebase Hosting](https://firebase.google.com/products/hosting)
- **Automation**: [GitHub Actions](https://github.com/features/actions)

---

## 📂 Project Structure

```text
Kartly/
├── .github/
│   └── workflows/
│       └── keep-supabase-alive.yml    # Supabase keep-alive cron job
├── public/                            # Static assets (favicons, robots.txt)
├── src/
│   ├── assets/                        # Images, logos, branding assets
│   ├── components/
│   │   ├── dashboard/                 # Dashboard widgets, charts, and tables
│   │   ├── reports/                   # Report export cards & utilities
│   │   └── ui/                        # Reusable Radix UI & Shadcn components
│   ├── hooks/                         # Custom React hooks (useAuth, useAdmin, etc.)
│   ├── integrations/
│   │   └── supabase/                  # Supabase client & generated Database types
│   ├── lib/                           # Utility functions & parsers
│   ├── pages/                         # Route pages (Dashboard, Login, Signup, Reports)
│   ├── types/                         # Shared TypeScript interfaces & types
│   ├── App.tsx                        # Main application router
│   └── main.tsx                       # React application entrypoint
├── supabase/
│   ├── functions/                     # Supabase Edge Functions
│   ├── migrations/                    # Database migrations history
│   ├── supabase_setup.sql             # Consolidated database schema & setup script
│   └── config.toml                    # Supabase CLI project configuration
├── uploads/                           # Local sample CSVs for testing (git-ignored)
├── .env.example                       # Example environment variables template
├── firebase.json                      # Firebase Hosting configuration
├── package.json                       # Project dependencies and npm scripts
├── tailwind.config.ts                 # Tailwind design system configuration
└── vite.config.ts                     # Vite build & development configuration
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### 2. Clone and Install
```bash
git clone https://github.com/Rokella-Medias/Kartly.git
cd Kartly
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (refer to `.env.example` as a template):
```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
VITE_SUPABASE_URL="https://your-supabase-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-or-publishable-key"

# Supabase Server Key (Server / GitHub Actions only)
SUPABASE_SERVICE_ROLE_KEY="your-supabase-secret-key"

# Firebase Configuration
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-firebase-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-firebase-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-firebase-sender-id"
VITE_FIREBASE_APP_ID="your-firebase-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-firebase-measurement-id"
```

### 4. Database Setup (Supabase)
Run the consolidated script in your Supabase SQL Editor:
1. Open [`supabase/supabase_setup.sql`](./supabase/supabase_setup.sql).
2. Copy and execute the script in [Supabase SQL Editor](https://supabase.com/dashboard).
3. This creates all tables (`profiles`, `orders`, `csv_uploads`, `user_roles`), triggers, and RLS policies.

### 5. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 📦 Deployment

```bash
# Build the production bundle
npm run build

# Deploy to Firebase Hosting
npx firebase-tools deploy --only hosting
```
