# No Sweat Fitness

A multi-tenant SaaS platform for gyms and fitness studios. Each gym gets a branded website with class booking, WOD programming, coach profiles, day passes, service booking, payments, and more — all under one roof.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?logo=stripe)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Docker Setup](#docker-setup)
- [Project Structure](#project-structure)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Marketing Site (Platform)](#marketing-site-platform)
- [Git Workflow](#git-workflow)
- [Environment Variables](#environment-variables)
- [Payment Setup](#payment-setup)
- [Security Features](#security-features)
- [Design System](#design-system)
- [Database & Migrations](#database--migrations)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

No Sweat Fitness operates as two applications in one:

1. **Marketing Site** (platform routes at `/`) — the public-facing SaaS website where gym owners discover the product, view features, sign up, and onboard.
2. **Tenant Sites** (gym routes at `/gym/:slug`) — each gym's branded website with scheduling, WODs, coach profiles, dashboards, and payments.

```
nosweat.fitness/              → Marketing site (PlatformHome, Guide, Login, Signup)
nosweat.fitness/guide         → Feature guide with SVG illustrations
nosweat.fitness/signup        → Gym owner registration
nosweat.fitness/onboarding    → Gym setup wizard

nosweat.fitness/gym/comet     → CrossFit Comet's branded site
nosweat.fitness/gym/comet/schedule    → Class schedule & booking
nosweat.fitness/gym/comet/coaches     → Coach profiles
nosweat.fitness/gym/comet/dashboard   → Member dashboard
```

---

## Features

### Platform Features (Marketing Site)
- **Homepage** — Hero with background imagery, feature grid, pricing, and how-it-works
- **Feature Guide** (`/guide`) — 12 detailed feature showcases with custom SVG illustrations, stock photo dividers, sticky section navigation, and final CTA
- **Authentication** — Sign up, log in, onboarding wizard for new gym owners
- **Geo-localised Pricing** — Automatically shows USD, GBP, or EUR based on user location

### Tenant Features (Per-Gym)
- **Class Booking** — Weekly timetable with capacity limits, waitlists, and one-tap booking
- **WOD Programming** — Daily workout builder with movement database, structured blocks
- **Coach Profiles** — Dedicated pages with bios, certifications, specialties, and bookable services
- **Day Passes** — Stripe-powered one-time purchases for drop-in visitors
- **Free Trials** — Card-authorised trial memberships with zero upfront charge
- **Service Booking** — PT, massage, nutrition — coach-managed availability with online payment
- **Member Dashboard** — Today's WOD, upcoming bookings, profile management
- **Member Management** — Admin panel with roles, invitations, and directory
- **Coach Analytics** — Muscle group tracking, volume analysis, programming balance
- **Accounting Integration** — QuickBooks and Xero sync for payments and invoices
- **Custom Domains** - Gyms can use their own domain (e.g., www.mygym.com) as a paid feature with automatic DNS verification
- **Feature Toggles** - Gym owners enable/disable features from admin panel
- **Full Brand Customisation** - Logo, colours, fonts, and theme per tenant

### Technical Features
- **Multi-tenant routing** - Path-based (`/gym/:slug`) and custom domain (hostname-based) with per-tenant theming via CSS custom properties
- **Supabase Auth** — Email verification, password recovery, session management
- **Stripe Payments** — PaymentIntents (day passes) and SetupIntents (trials)
- **Row-Level Security** — Tenant data isolation at the database level
- **SCSS Modules** — Scoped styles with design tokens
- **Docker Compose** — Frontend + backend development with hot reload
- **Responsive Design** — Mobile-first with `clamp()` typography and grid breakpoints

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Styling** | SCSS Modules, CSS Custom Properties |
| **Routing** | React Router DOM 7 |
| **Authentication** | Supabase Auth |
| **Database** | Supabase (PostgreSQL) with RLS |
| **Payments** | Stripe (PaymentIntents & SetupIntents) |
| **Accounting** | QuickBooks / Xero integration |
| **Containerisation** | Docker Compose (dev + prod) |
| **Deployment** | Vercel (frontend + serverless functions) |

---

## Quick Start

### Prerequisites

- Docker Desktop (recommended) — or Node.js 20+
- Supabase account with project configured
- Stripe account (test mode for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/alex-bramwell/gym.GymForge.git
cd gym.GymForge

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe credentials

# Start with Docker (recommended — no local npm needed)
./scripts/dev.sh

# Or use docker-compose directly
docker-compose up --build
```

### Development Servers

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Vite dev server with HMR |
| Backend | http://localhost:3001 | Express API server |

### Available Scripts

```bash
# Docker (recommended)
./scripts/dev.sh       # Start development environment
./scripts/prod.sh      # Start production build
./scripts/down.sh      # Stop all services

# npm (if running without Docker)
npm run dev            # Vite dev server
npm run build          # Production build (TypeScript + Vite)
npm run preview        # Preview production build
npm run lint           # ESLint checks

# Database
npm run seed:coaches   # Seed coach accounts
npm run db:run-sql     # Run SQL files against database
```

---

## Docker Setup

### Development Mode

```bash
# Start with hot reloading
docker-compose up --build

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Stop
docker-compose down
```

### Production Mode

```bash
./scripts/prod.sh
# Frontend: http://localhost:8080 (nginx)
# Backend: http://localhost:3001 (Express)
```

### Docker Architecture

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| Frontend | `gymgymforge-frontend-1` | 5173 | Vite dev server, proxies API to backend |
| Backend | `gymgymforge-backend-1` | 3001 | Express API: payments, accounting, webhooks |

Both services mount the project directory for live reloading. Node modules are preserved in Docker volumes.

---

## Project Structure

```
gym.GymForge/
├── api/                              # Vercel serverless functions (production)
│   ├── lib/                         # Shared API utilities
│   │   ├── supabase.ts              # Singleton Supabase service client
│   │   └── auth.ts                  # verifyAuth() + assertMethod() helpers
│   ├── domains/                     # Custom domain management (add, verify, remove, resolve)
│   ├── connect/                     # Stripe Connect account management
│   ├── payments/
│   ├── subscriptions/
│   ├── accounting/
│   └── webhooks/
├── server/                           # Express API server (local development)
├── public/                           # Static assets
├── scripts/                          # Shell scripts (dev.sh, prod.sh, down.sh)
├── supabase/
│   └── migrations/                   # 43 SQL migration files (000-060)
├── src/
│   ├── components/
│   │   ├── common/                   # Reusable UI components
│   │   │   ├── AnimatedSection/      # Scroll-triggered animations
│   │   │   ├── Button/              # Button with variants
│   │   │   ├── Card/               # Content containers
│   │   │   ├── Container/          # Max-width wrapper
│   │   │   ├── DurationInput/      # Time duration input
│   │   │   ├── FeatureGate/        # Conditional feature rendering
│   │   │   ├── GlassCard/          # Glassmorphism card
│   │   │   ├── GlassDivider/       # Glass-style divider
│   │   │   ├── GradientText/       # Gradient text effect
│   │   │   ├── StatusBadge/       # Pill badge (default/warning/success/error)
│   │   │   ├── DetailGrid/        # Label/value pairs with status coloring
│   │   │   ├── SelectableCard/    # Clickable option card (icon, title, desc)
│   │   │   ├── InfoBox/           # Styled instruction/tip block
│   │   │   ├── Icons/              # SVG icon components
│   │   │   ├── illustrations/      # 12 SVG feature illustrations
│   │   │   ├── Logo.tsx            # NSF logo component
│   │   │   ├── FeatureIcon.tsx     # Feature icon mapper
│   │   │   ├── Modal/             # Dialog component
│   │   │   ├── NumberInput/       # Numeric input
│   │   │   ├── Section/          # Page section wrapper
│   │   │   ├── Select/           # Dropdown select
│   │   │   └── StatCard/         # Statistics card
│   │   ├── guide/                   # Guide page components
│   │   │   ├── guideData.ts        # Section/feature data (12 features, 4 groups)
│   │   │   └── GuideIllustrations.tsx  # SVG illustration barrel
│   │   ├── sections/                # Tenant page sections (Hero, Programs, WOD, etc.)
│   │   ├── AuthModal/              # Authentication modal
│   │   ├── DayPassModal/           # Day pass payment flow
│   │   ├── ProfileSettings/        # User profile management
│   │   ├── SessionWarning/         # Session timeout warning
│   │   ├── Layout.tsx              # Tenant layout wrapper
│   │   ├── ProtectedRoute.tsx      # Auth route guard
│   │   └── ScrollToHash.tsx        # Hash navigation
│   ├── config/
│   │   └── features.ts            # Feature definitions (9 toggleable features)
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Authentication state
│   │   ├── TenantContext.tsx       # Tenant/gym state
│   │   └── RegistrationContext.tsx # User intent tracking
│   ├── hooks/
│   │   ├── useDomainResolution.ts # Custom domain hostname resolution
│   │   ├── useMessage.ts         # Success/error toast state with auto-dismiss
│   │   ├── usePermissions.ts      # Role-based permissions
│   │   ├── useSessionTimeout.ts   # Session management
│   │   └── useTenantTheme.ts      # Per-tenant CSS theming
│   ├── lib/
│   │   ├── auth.ts               # getAccessToken() + authFetch() utilities
│   │   ├── stripe.ts             # Stripe client config
│   │   └── supabase.ts           # Supabase client config
│   ├── pages/
│   │   ├── platform/              # Marketing site pages
│   │   │   ├── PlatformLayout.tsx # Navbar + footer wrapper
│   │   │   ├── PlatformHome.tsx   # Homepage with hero, features, pricing
│   │   │   ├── Guide.tsx          # Feature guide (12 sections + illustrations)
│   │   │   ├── Guide.module.scss  # Guide page styles
│   │   │   ├── PlatformLogin.tsx  # Login page
│   │   │   ├── PlatformSignup.tsx # Signup page
│   │   │   └── Onboarding.tsx     # Gym setup wizard
│   │   ├── Home.tsx               # Tenant homepage
│   │   ├── Schedule.tsx           # Class schedule & booking
│   │   ├── Coaches.tsx            # Coach profiles
│   │   ├── About.tsx              # Gym about page
│   │   ├── Dashboard.tsx          # Member dashboard
│   │   ├── CoachDashboard.tsx     # Coach admin dashboard
│   │   ├── GymAdmin.tsx           # Gym owner admin panel
│   │   └── GymNotFound.tsx        # 404 for invalid gym slugs
│   ├── styles/
│   │   ├── _variables.scss        # Design tokens
│   │   ├── _mixins.scss           # SCSS mixins
│   │   ├── _animations.scss       # Shared animations
│   │   └── globals.scss           # Global styles
│   ├── types/                     # TypeScript type definitions
│   ├── utils/
│   │   ├── pricing.ts            # Geo-localised pricing
│   │   ├── payment.ts            # Payment helpers
│   │   └── security.ts           # Security utilities
│   ├── App.tsx                    # Root component (routing)
│   └── main.tsx                   # Application entry point
├── docker-compose.yml             # Development orchestration
├── docker-compose.prod.yml        # Production orchestration
├── Dockerfile                     # Frontend dev container
├── Dockerfile.api                 # Backend dev container
├── vercel.json                    # Vercel deployment config
└── package.json                   # Dependencies and scripts
```

### Why Two API Folders?

- **`/api`** - Vercel serverless functions for production deployment
- **`/server`** - Express server for local Docker development (same endpoints, better DX)

### Shared Utilities

**Backend (`api/lib/`)**

All API endpoints import from shared utilities rather than duplicating boilerplate:

```typescript
import { supabase } from '../lib/supabase';        // Singleton Supabase service client
import { verifyAuth, assertMethod } from '../lib/auth';  // Auth + method guards

export default async function handler(req, res) {
  if (!assertMethod(req, res, 'POST')) return;       // 405 if wrong method
  const user = await verifyAuth(req, res);           // 401 if not authenticated
  if (!user) return;
  // ... business logic using user.id and supabase
}
```

**Frontend (`src/lib/auth.ts`)**

Components use `authFetch()` instead of manually constructing fetch calls with auth headers:

```typescript
import { authFetch } from '../../lib/auth';

// Before (repeated in every component):
const token = await getAccessToken();
const res = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ gymId }),
});
const data = await res.json();
if (!res.ok) throw new Error(data.error);

// After (one line):
const data = await authFetch('/api/endpoint', { gymId });
```

**Hooks (`src/hooks/useMessage.ts`)**

Replaces the repeated message/toast pattern across admin components:

```typescript
const { message, showSuccess, showError } = useMessage();
// Auto-dismisses after 5 seconds, handles timeout cleanup
```

---

## Multi-Tenant Architecture

### How It Works

Each gym is a tenant identified by a URL slug. The `TenantContext` loads gym data from Supabase and applies per-tenant theming.

```
/gym/:slug → TenantProvider loads gym → AuthProvider → GymShell renders tenant routes
```

### Tenant Theming

Each gym customises colours, fonts, logo, and theme (light/dark). The `useTenantTheme` hook applies these as CSS custom properties:

```css
--color-accent: #ff4f1f;      /* Gym's primary colour */
--font-header: 'Poppins';     /* Gym's header font */
--font-body: 'Open Sans';     /* Gym's body font */
```

Google Fonts are loaded dynamically based on the gym's font selections.

### Feature Toggles

All 9 features are available to every gym. Owners toggle them on/off from the admin panel. The `FeatureGate` component conditionally renders routes and UI based on enabled features.

### Database Isolation

Row-Level Security (RLS) policies ensure tenants can only access their own data. The `gym_id` column on all tenant tables is used for isolation.

---

## Marketing Site (Platform)

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `PlatformHome` | Hero with gym photo, feature grid, pricing, how-it-works |
| `/guide` | `Guide` | 12-feature showcase with SVG illustrations and photo dividers |
| `/login` | `PlatformLogin` | Gym owner login |
| `/signup` | `PlatformSignup` | Gym owner registration |
| `/onboarding` | `Onboarding` | Multi-step gym setup wizard |

### Guide Page Architecture

The guide page (`/guide`) is built from data-driven components:

- **`guideData.ts`** — Defines 4 section groups with 12 features (titles, descriptions, bullets, illustration keys)
- **`GuideIllustrations.tsx`** — Maps 12 custom inline SVG illustrations (UI mockups built with geometric shapes and platform design tokens)
- **`Guide.module.scss`** — Full page styles: hero, sticky nav, feature rows, photo dividers, CTA
- **`Guide.tsx`** — Assembles everything with IntersectionObserver for active section highlighting

### Design Approach

- Dark glass aesthetic (`#0a0a0f` base, glass blur effects, subtle borders)
- Unsplash stock photography with gradient overlays for hero, dividers, and CTA
- Custom SVG illustrations (no emoji) depicting UI mockups of each feature
- Responsive: `clamp()` typography, grid collapse at 768px, mobile-first

---

## Git Workflow

This project follows **GitFlow** with conventional commits.

### Branch Structure

```
main           ← Production-ready code (tagged releases)
  └── develop  ← Integration branch
        └── feature/*  ← Feature development
```

### Daily Workflow

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Commit with conventional commits
git add <files>
git commit -m "feat(scope): description"

# 4. Merge to develop
git checkout develop
git merge --no-ff feature/your-feature
git push origin develop

# 5. When ready for production
git checkout main
git merge --no-ff develop
git push origin main

# 6. Sync develop with main
git checkout develop
git merge main
git push origin develop
```

### Commit Convention

```
feat(guide): add feature guide with SVG illustrations
fix(auth): resolve session timeout on password recovery
docs(readme): update project documentation
chore(deps): upgrade vite to 7.2
```

---

## Environment Variables

### Required (`.env.local`)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# API (set automatically by docker-compose)
VITE_API_URL=http://localhost:3001

# Accounting (optional)
QUICKBOOKS_CLIENT_ID=xxx
QUICKBOOKS_CLIENT_SECRET=xxx
QUICKBOOKS_REDIRECT_URI=http://localhost:3001/api/accounting/callback
QUICKBOOKS_ENVIRONMENT=sandbox
```

### Vercel Production

Set these in Vercel Dashboard > Project Settings > Environment Variables:

| Variable | Scope |
|----------|-------|
| `VITE_SUPABASE_URL` | All |
| `VITE_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_KEY` | Server only |
| `VITE_STRIPE_PUBLISHABLE_KEY` | All |
| `STRIPE_SECRET_KEY` | Server only |
| `STRIPE_WEBHOOK_SECRET` | Server only |

---

## Payment Setup

### Stripe Integration

Day passes use `PaymentIntent` (immediate charge). Free trials use `SetupIntent` (card authorisation, no charge).

### Test Cards

| Scenario | Card Number |
|----------|-------------|
| Success | `4242 4242 4242 4242` |
| Decline | `4000 0000 0000 0002` |
| Requires Auth | `4000 0027 6000 3184` |

### Webhook Setup

```bash
# Local testing with Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Production webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `setup_intent.succeeded`, `setup_intent.setup_failed`

---

## Security Features

- **Password Policy** — 12+ characters, uppercase, lowercase, number, special character
- **HIBP Integration** — Checks passwords against 600M+ known breaches
- **Rate Limiting** — 5 failed login attempts triggers 5-minute lockout
- **Honeypot Fields** — Invisible bot trap (active in production only)
- **Session Timeout** — 30-minute inactivity with 5-minute warning
- **Input Sanitisation** — XSS prevention, SQL injection detection
- **Row-Level Security** — Tenant data isolation at database level

---

## Design System

### Platform Design Tokens (Marketing Site)

```scss
// Backgrounds
$platform-bg: #0a0a0f;
$platform-bg-light: #12121a;
$platform-surface: #1a1a2e;

// Accent
$platform-accent: #2563eb;       // Blue
$platform-secondary: #7c3aed;    // Purple

// Text
$platform-text: #f0f0f5;
$platform-text-muted: #8b8b9e;

// Glass effects
$platform-glass-bg: rgba(255, 255, 255, 0.04);
$platform-border: rgba(255, 255, 255, 0.08);
```

### Tenant Design Tokens (Per-Gym)

Each tenant overrides colours and fonts via CSS custom properties loaded from the database. Available fonts: Inter, Poppins, Open Sans, Roboto, Oswald, Montserrat, Lato, Raleway, Playfair Display.

---

## Database & Migrations

### Migration Files

43 migration files in `supabase/migrations/` covering:
- Base tables (profiles, bookings, payments, stripe customers, workouts, movements)
- Multi-tenancy (gyms, feature toggles, tenant-scoped RLS policies)
- Seed data (CrossFit Comet demo gym)

### Running Migrations

```bash
# Via the SQL runner script (inside Docker)
npm run db:run-sql path/to/migration.sql

# Via Supabase CLI
npx supabase db push
```

### Automated Deployments

Migrations in `supabase/migrations/` are automatically applied via GitHub Actions when pushed to `main`.

---

## Deployment

### Production Release

```bash
# Merge develop to main
git checkout main
git merge --no-ff develop
git push origin main

# Sync develop
git checkout develop
git merge main
git push origin develop
```

### What Happens on Push to Main

| Step | Service | Action |
|------|---------|--------|
| 1 | Vercel | Automatically deploys frontend + serverless functions |
| 2 | GitHub Actions | Automatically runs Supabase migrations |

### Manual Build

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview locally
```

---

## Testing

### Test Account

A shared test account is available for QA on both local and production environments:

| Field | Value |
|-------|-------|
| **Email** | `test@nosweattest.com` |
| **Password** | `testtest123` |

Use the `/test-reset` page to wipe the test account's gym data and re-run the onboarding flow.

### Checklist

- [ ] Marketing site: homepage, guide page, login, signup load correctly
- [ ] Tenant site: `/gym/comet` loads with correct branding
- [ ] Navigation: all links and routing work
- [ ] Auth: sign up, log in, password recovery
- [ ] Payments: day pass and trial flows complete
- [ ] Scheduling: classes display, booking works
- [ ] Responsive: test at 768px and 480px breakpoints
- [ ] Feature toggles: disabled features show fallback UI

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build verification
npm run build
```

---

## Troubleshooting

**Gym Not Found (404 on `/gym/:slug`)**
- Verify the gym exists in the `gyms` table with `status = 'active'`
- Check Supabase URL and anon key in `.env.local`

**SCSS compilation errors**
- Use `rgba($color-variable, alpha)` not `rgba($rgb-tuple, alpha)` for Sass variables
- Restart the Docker container to clear Vite cache: `docker restart gymgymforge-frontend-1`

**Payment Intent not creating**
- Check Stripe keys in `.env.local`
- Verify backend is running on port 3001

**Auth not working**
- Verify Supabase URL and anon key match the correct project
- Check email confirmation settings in Supabase dashboard

---

## License

This project is private and proprietary. All rights reserved.

---

<div align="center">
  <p>Built by the No Sweat Fitness team</p>
  <p>
    <a href="https://react.dev">React</a> &middot;
    <a href="https://vite.dev">Vite</a> &middot;
    <a href="https://supabase.com">Supabase</a> &middot;
    <a href="https://stripe.com">Stripe</a>
  </p>
</div>
