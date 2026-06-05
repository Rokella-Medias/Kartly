# Kartly — Multi-Platform E-Commerce Analytics Dashboard

Kartly is a unified analytics dashboard that helps e-commerce sellers turn scattered CSV sales reports from **Amazon**, **Flipkart**, and **Meesho** into clear, actionable business insights.

## Features

- **Multi-Platform Import**: Drag-and-drop CSV or Excel reports from Amazon, Flipkart, and Meesho.
- **Unified Analytics Dashboard**: Track total orders, total revenue, average order value, and net settlement amount in one place.
- **Government-Ready Tax Reports**: Generate and export GSTR-1, GSTR-3B, GST Summary, and Invoice-Level Tax Reports for CA audits.
- **Business Performance Analysis**: Breakdown revenue by product, SKU, and marketplace.
- **Secure & Private**: Row-Level Security (RLS) ensures your business data is only accessible to you.

---

## Tech Stack

- **Frontend**: React (TypeScript), Vite, Tailwind CSS, Shadcn UI
- **Database / Auth**: Supabase
- **Hosting**: Firebase Hosting

---

## Local Development Setup

Follow these steps to run the application locally on your machine:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
```sh
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
VITE_SUPABASE_URL="https://your-supabase-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
```

### 4. Database Setup
Run the database migrations located in the `supabase/migrations/` folder on your Supabase instance to set up the necessary tables, enums, triggers, and RLS policies.

### 5. Start Development Server
```sh
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## Deploying to Firebase Hosting

To deploy updates to Firebase Hosting, run:

```sh
# Step 1: Build the production bundle
npm run build

# Step 2: Deploy to Firebase
firebase deploy --only hosting
```
