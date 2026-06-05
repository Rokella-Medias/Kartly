# 📊 Kartly — Unified E-Commerce Analytics Dashboard

Kartly is a high-performance, premium e-commerce insights hub built using **React (TypeScript)**, **Vite**, **Tailwind CSS**, and **Shadcn UI**. It empowers online sellers to consolidate and normalize order sales CSVs from major marketplaces (**Amazon**, **Flipkart**, and **Meesho**) into a single, cohesive dashboard with tax-ready report exports.

---

## 🌟 Features

- 📁 **Marketplace CSV Import**: Import order CSV/Excel sheets directly from Amazon, Flipkart, and Meesho.
- 📈 **Unified Financial Analytics**: Track net settlement, gross revenue, order volume, and average order value across multiple sales channels.
- 📑 **CA-Audit Ready Reports**: Generate and export government-compliant GST returns (GSTR-1, GSTR-3B formats), invoice-level tax registers, commission breakdowns, and product sales summaries.
- 🔒 **Row-Level Security (RLS)**: Fine-grained security policies ensure that every user's data remains isolated and completely private.
- 🌗 **Responsive Design & Dark Mode**: Sleek glassmorphism and animations tailored for desktops, tablets, and mobile devices.

---

## 🛠️ Technology Stack

- **Core Framework**: [React 18](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) (fast HMR, optimized production builds)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) (using Radix UI primitives)
- **Database & Authentication**: [Supabase](https://supabase.com/) (PostgreSQL with RLS)
- **Deployment**: [Firebase Hosting](https://firebase.google.com/products/hosting)

---

## 🚀 Local Development Setup

To run this application locally, follow these steps:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [Supabase](https://supabase.com/) account (Free tier is sufficient)
- A [Firebase](https://firebase.google.com/) project

### 2. Clone and Install
Clone the repository and install all dependencies:
```sh
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the root directory (refer to [.env.example](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/.env.example) as a template) and add your Supabase and Firebase keys:
```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
VITE_SUPABASE_URL="https://your-supabase-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"

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
Run the SQL migrations located in the [supabase/migrations/](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/supabase/migrations/) folder in your Supabase project's SQL Editor:
1. Copy the contents of the SQL migration files (or run them using the Supabase CLI).
2. Execute them in your Supabase SQL Editor. This sets up the `profiles`, `orders`, `csv_uploads`, and `user_roles` tables along with their RLS policies and onboarding triggers.

### 5. Start Development Server
```sh
npm run dev
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 🔑 Config OAuth (Google Sign-In)

To set up Google login for local and production:

1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Set up your OAuth consent screen.
   - Under **Credentials**, create an **OAuth 2.0 Client ID** (Web application).
   - In **Authorized JavaScript origins**, add your local URL (`http://localhost:8080`) and your production URL (e.g., `https://your-app.web.app`).
   - In **Authorized redirect URIs**, add your Supabase project callback URL:
     `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`

2. **Supabase Console**:
   - Navigate to **Authentication** -> **Providers** -> **Google**.
   - Enable Google authentication.
   - Paste your Google **Client ID** and **Client Secret**.
   - Save changes.
   - Go to **URL Configuration** and add your redirect URLs (e.g., `http://localhost:8080/**` and `https://your-app.web.app/**`).

---

## 📦 Deployment

This project uses [Firebase Hosting](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/firebase.json) for static file hosting:

```sh
# Step 1: Build the production bundle
npm run build

# Step 2: Deploy to Firebase Hosting
firebase deploy --only hosting
```
Production assets are generated in the `dist/` directory and uploaded securely.

---

## 📂 Core Codebase Links

- 🛠️ [Vite Configuration](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/vite.config.ts)
- 🔌 [Supabase Integration Client](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/src/integrations/supabase/client.ts)
- 🔥 [Firebase Integration Client](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/src/lib/firebase.ts)
- 🔒 [Route Guards (RequireProfile)](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/src/components/RequireProfile.tsx)
- 🚪 [Login Page](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/src/pages/Login.tsx) | [Signup Page](file:///c:/Users/thaku/OneDrive/Desktop/Work/e-commerce-insights-hub-main/src/pages/Signup.tsx)
