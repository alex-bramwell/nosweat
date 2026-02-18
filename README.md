# No Sweat 🏋️‍♂️

A multi-tenant SaaS platform for gyms and fitness studios, built with React, TypeScript, and Vite. Features include class scheduling, WOD programming, coach profiles, payments — all customisable to each gym's brand.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?logo=stripe)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Docker Setup](#docker-setup)
- [Root Directory Files Reference](#root-directory-files-reference)
- [Local Development with Supabase](#local-development-with-supabase)
- [Project Structure](#project-structure)
- [Git Workflow & GitFlow Guidelines](#git-workflow--gitflow-guidelines)
- [Component Library](#component-library)
- [Content Architecture](#content-architecture)
- [Payment Setup](#payment-setup)
- [Security Features](#security-features)
- [Design System](#design-system)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  - [Production Release (GitFlow)](#production-release-gitflow)
  - [Supabase Migrations](#supabase-migrations)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features
- 🏠 **Homepage** - Hero section, programs, stats, WOD, and CTAs
- 📅 **Class Schedule** - Interactive schedule with booking capabilities
- 🎫 **Day Pass Booking** - One-time £10 day pass purchases
- 🆓 **Free Trial System** - Card-authorized trial memberships
- 👥 **Coach Profiles** - Team member pages with certifications
- 📖 **About Page** - Gym story, philosophy, and facility info

### Technical Features
- 🔐 **Secure Authentication** - Supabase auth with email verification
- 💳 **Stripe Payments** - PaymentIntents and SetupIntents integration
- 🛡️ **Security Hardened** - Rate limiting, HIBP checks, session management
- 📱 **Responsive Design** - Mobile-first CSS with container queries
- ⚡ **Fast Performance** - Vite build with code splitting and tree shaking
- 🎨 **Design System** - Reusable component library with TypeScript

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript, Vite 7 |
| **Styling** | SCSS Modules, CSS Custom Properties |
| **Routing** | React Router DOM 7 |
| **Authentication** | Supabase Auth |
| **Database** | Supabase (PostgreSQL) |
| **Payments** | Stripe (PaymentIntents & SetupIntents) |
| **Deployment** | Vercel (with Serverless Functions) |
| **Linting** | ESLint with TypeScript rules |

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (test mode for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/alex-bramwell/nosweat.git
cd nosweat

# Copy environment variables and add your credentials
cp .env.example .env.local

# Start development with Docker (Recommended - no npm install needed!)
./scripts/dev.sh

# Or use npm directly (requires Node.js and npm installed locally)
npm install
npm run dev
```

### Available Scripts

**Shell scripts (Easiest):**
```bash
./scripts/dev.sh     # Start development environment
./scripts/prod.sh    # Start production environment
./scripts/down.sh    # Stop all Docker services
```

**Docker commands:**
```bash
docker-compose up          # Start in Docker container
docker-compose up -d       # Start in detached mode
docker-compose down        # Stop container
docker-compose up --build  # Rebuild and start
```

**npm scripts:**
```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Build for production (TypeScript + Vite)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint checks
```

### Database Scripts

```bash
npm run seed:coaches   # Seed coach accounts to database
npm run db:run-sql     # Run SQL files directly against database
```

#### Seeding Coaches

To add coach accounts to the database:

```bash
npm run seed:coaches
```

This creates coach accounts with:
- Email: `{name}@nosweat.fitness` (dan, lizzie, lewis, sam, george, thea)
- Default password: `CoachTemp123!`
- Role: `coach` with corresponding `coach_id`

#### Running Raw SQL

For migrations or complex database operations that can't be done via the Supabase JS client:

```bash
npm run db:run-sql                           # Runs scripts/fix-trigger-and-seed.sql
npm run db:run-sql path/to/custom.sql        # Run a custom SQL file
```

**Required environment variables in `.env`:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_PASSWORD=your-database-password
```

The script connects via Session Pooler (IPv4 compatible) to run SQL statements directly.

---

## Docker Setup

For a containerized development environment, you can use Docker and Docker Compose.

### Prerequisites

- Docker Desktop installed
- Docker Compose (included with Docker Desktop)

### Development Mode

Docker handles all dependencies automatically with hot reloading:

```bash
# Start development servers (simplest way)
./scripts/dev.sh

# Or use docker-compose directly
docker-compose up --build

# Stop services
./scripts/down.sh
# or: docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f backend  # Backend only
docker-compose logs -f frontend # Frontend only
```

**Development servers:**
- Frontend: http://localhost:5173 (Vite with HMR)
- Backend: http://localhost:3001 (Express with hot reload)

**No local npm needed!** All dependencies run inside Docker containers.

### Production Mode

Optimized production builds with nginx:

```bash
# Build and start production services
./scripts/prod.sh

# Stop services
./scripts/down.sh
```

**Production servers:**
- Frontend: http://localhost:8080 (Nginx serving static build)
- Backend: http://localhost:3001 (Express production mode)

The application will be available at:
- **Frontend**: `http://localhost:5173`
- **API Server**: `http://localhost:3001`

### Docker Architecture

The Docker setup runs two services:

#### 1. Frontend Service (Port 5173)
- **Vite dev server** for React application
- Hot module replacement for instant updates
- Proxies API requests to backend service

#### 2. Backend Service (Port 3001)
- **Express API server** for payments, accounting, webhooks
- Handles all `/api/*` routes
- Supports Stripe, QuickBooks, and Xero integrations

### Docker Configuration

**Dockerfile (Frontend):**
- Based on `node:20-alpine` for a lightweight image
- Installs dependencies using `npm ci` for faster, reproducible builds
- Exposes port 5173
- Runs the Vite dev server with host binding

**Dockerfile.api (Backend):**
- Based on `node:20-alpine` for a lightweight image
- Installs dependencies using `npm ci`
- Exposes port 3001
- Runs the Express server with `tsx` for TypeScript support

**docker-compose.yml:**
- Orchestrates both frontend and backend services
- Mounts the current directory for live code reloading
- Preserves `node_modules` in named volumes
- Loads environment variables from `.env.local`
- Automatic service dependency management

**.dockerignore:**
- Excludes unnecessary files (node_modules, dist, .git, .env)
- Reduces build context and image size

### Environment Variables

Ensure you have a `.env.local` file with the required credentials before starting:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Server (automatically set by docker-compose)
VITE_API_URL=http://localhost:3001

# QuickBooks/Xero (optional, for accounting integration)
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3001/api/accounting/callback
QUICKBOOKS_ENVIRONMENT=sandbox
```

See the [Local Development with Supabase](#local-development-with-supabase) section for more details on environment configuration.

### Why Express Instead of Vercel Functions?

We migrated from Vercel serverless functions to an Express API server for better local development:

**Benefits:**
- ✅ Full Docker support - everything runs in containers
- ✅ Easier team onboarding - just run `docker-compose up`
- ✅ No platform dependencies - works anywhere Node.js runs
- ✅ Better debugging - standard Express middleware and logging
- ✅ Faster development - no need to switch between `vercel dev` and Docker

**Note:** The `/api` folder with Vercel functions still exists for production deployment but is replaced by the Express server (`/server`) in local development.

---

## Root Directory Files Reference

This section documents all files in the project root directory and their purpose.

### Configuration Files

| File | Purpose |
|------|---------|
| **package.json** | Node.js project manifest - dependencies, scripts, project metadata |
| **package-lock.json** | Locked dependency versions for reproducible builds |
| **tsconfig.json** | Root TypeScript configuration |
| **tsconfig.app.json** | TypeScript config for application code |
| **tsconfig.node.json** | TypeScript config for Node.js tooling (Vite config, etc.) |
| **vite.config.ts** | Vite build tool configuration - dev server, build settings, plugins |
| **eslint.config.js** | ESLint linting rules and configuration |
| **vercel.json** | Vercel deployment configuration - routes, rewrites, headers |

### Docker Files

| File | Purpose |
|------|---------|
| **Dockerfile** | Frontend development container - Node 20 Alpine with Vite dev server |
| **Dockerfile.prod** | Frontend production container - Multi-stage build with nginx |
| **Dockerfile.api** | Backend development container - Express API with hot reload (tsx) |
| **Dockerfile.api.prod** | Backend production container - Express API optimized build |
| **docker-compose.yml** | Development orchestration - Frontend + Backend with hot reload |
| **docker-compose.prod.yml** | Production orchestration - Optimized builds with nginx |
| **nginx.conf** | Nginx configuration for production frontend - SPA routing, gzip, caching |
| **.dockerignore** | Excludes files from Docker build context (node_modules, .git, etc.) |

### Environment & Secrets

| File | Purpose |
|------|---------|
| **.env.example** | Template showing required environment variables |
| **.env.local** | Local development environment variables (gitignored - not committed) |
| **.gitignore** | Specifies files Git should ignore (node_modules, .env, build files) |
| **.vercelignore** | Specifies files Vercel should ignore during deployment |

### Entry Points

| File | Purpose |
|------|---------|
| **index.html** | HTML entry point - Loads the React app via `<script src="/src/main.tsx">` |
| **README.md** | Project documentation (this file) |

### Project Directories

| Directory | Purpose |
|-----------|---------|
| **src/** | React application source code - components, pages, styles, utilities |
| **server/** | Express API server - accounting integrations, payment endpoints |
| **api/** | Vercel serverless functions - production API endpoints (replaced by /server locally) |
| **public/** | Static assets served directly - images, fonts, favicon |
| **scripts/** | Utility shell scripts - dev.sh, prod.sh, down.sh for Docker management |
| **supabase/** | Database migrations and Supabase configuration |
| **node_modules/** | Installed npm dependencies (not committed to git) |
| **.git/** | Git version control metadata |
| **.github/** | GitHub Actions workflows (CI/CD, automated migrations) |
| **.claude/** | Claude Code CLI configuration and memory |
| **.devcontainer/** | VS Code dev container configuration |

### Why Two API Folders?

The project has both `/api` and `/server` directories:

- **`/api`** - Vercel serverless functions for **production deployment**
  - Used when deployed to Vercel
  - Each file becomes an endpoint (e.g., `api/payments/create-payment-intent.ts` → `/api/payments/create-payment-intent`)

- **`/server`** - Express API server for **local development**
  - Used when running with Docker
  - Full Express server with middleware, better debugging, hot reload
  - Provides the same endpoints as `/api` but in a traditional server architecture

This dual approach allows:
- ✅ Easy local development with Docker (no platform dependencies)
- ✅ Production deployment to Vercel (leveraging serverless infrastructure)
- ✅ Team onboarding without Vercel CLI (`docker-compose up` just works)

---

### Local Development with Supabase

**IMPORTANT: Development Policy**
We exclusively use the **live Supabase database** for local development. Although this acts as our "production" environment, it serves as a shared test database for all developers. We **DO NOT** use local Docker databases (`npx supabase start`) to ensure everyone is working with the same data state.

#### 1. Setup Environment Variables

To run the app locally, you must create a `.env.local` file that points to our live Supabase instance.

**Step 1:** Create `.env.local` in the project root:

```bash
touch .env.local
```

**Step 2:** Add the live credentials:

Get these credentials from the project README or ask a team member. You will need the **Project URL** and the **Anon Public Key**.

```env
# .env.local
# Points to Live/Test Supabase Instance
VITE_SUPABASE_URL=https://woyupptawdfhzrfzksgb.supabase.co
VITE_SUPABASE_ANON_KEY=<Request-From-Team-Leader>
```

> **Note:** The `VITE_SUPABASE_ANON_KEY` is typically found in the Supabase Dashboard under Settings > API > Project API Keys > **anon / public**.

#### 2. Start Development Server

Once your `.env.local` is configured:

```bash
npm run dev
```

The app will now use the shared live database. All accounts, bookings, and data created locally will be visible to other developers and on the live site.

#### Common Issues

**"401 Unauthorized" or Connection Errors**
- Verify your `VITE_SUPABASE_ANON_KEY` in `.env.local` matches the valid `anon` key from the Supabase dashboard.
- Ensure you are NOT using the `sb_publishable...` format key (which is for a different feature).
- Restart the dev server (`Ctrl+C` then `npm run dev`) after making changes to `.env.local`.

---

## Project Structure

```
nosweat/
├── api/                        # Vercel serverless functions
│   ├── payments/
│   │   ├── create-payment-intent.ts  # Day pass payments
│   │   └── create-setup-intent.ts    # Trial card authorization
│   └── webhooks/
│       └── stripe.ts           # Stripe webhook handler
├── public/                     # Static assets
├── src/
│   ├── assets/                 # Images, icons, etc.
│   ├── components/
│   │   ├── common/             # Reusable UI components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Container/
│   │   │   ├── Modal/
│   │   │   └── Section/
│   │   ├── sections/           # Page section components
│   │   │   ├── Hero/
│   │   │   ├── Programs/
│   │   │   ├── Stats/
│   │   │   ├── WOD/
│   │   │   └── CTA/
│   │   ├── AuthModal/          # Authentication modal
│   │   ├── DayPassPaymentModal/# Day pass checkout
│   │   ├── ProfileSettings/    # User profile management
│   │   ├── ProgramModal/       # Program details modal
│   │   ├── SessionWarning/     # Session timeout warning
│   │   ├── StripeCardSetupForm/# Trial card setup
│   │   ├── TrialModal/         # Trial signup flow
│   │   ├── Layout.tsx          # Main layout wrapper
│   │   ├── Navbar.tsx          # Navigation component
│   │   ├── Footer.tsx          # Footer component
│   │   ├── ProtectedRoute.tsx  # Auth route guard
│   │   └── ScrollToHash.tsx    # Hash navigation helper
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── RegistrationContext.tsx # User intent tracking
│   ├── data/                   # Static data files
│   │   ├── coaches.ts
│   │   ├── programs.ts
│   │   ├── programDetails.ts
│   │   ├── schedule.ts
│   │   ├── stats.ts
│   │   └── wod.ts
│   ├── hooks/
│   │   └── useSessionTimeout.ts # Session management hook
│   ├── lib/
│   │   ├── stripe.ts           # Stripe client config
│   │   └── supabase.ts         # Supabase client config
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Coaches.tsx
│   │   ├── Schedule.tsx
│   │   ├── Dashboard.tsx
│   │   ├── BookingConfirmation.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── EmailVerified.tsx
│   │   └── ComponentDemo.tsx   # UI component showcase
│   ├── styles/
│   │   ├── _variables.scss     # Design tokens
│   │   └── globals.scss        # Global styles
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   ├── payment.ts          # Payment helper functions
│   │   └── security.ts         # Security utilities
│   ├── App.tsx                 # Main app component
│   ├── App.css
│   ├── main.tsx                # Application entry point
│   └── index.css
├── supabase/
│   └── migrations/             # Database migration files
│       ├── 001_create_stripe_customers.sql
│       ├── 002_create_bookings.sql
│       ├── 003_create_payments.sql
│       ├── 004_create_trial_memberships.sql
│       ├── 005_update_profiles.sql
│       ├── 007_create_workouts.sql       # WOD/workout programming
│       ├── 008_create_movements.sql      # CrossFit movements database
│       ├── 013_add_movement_subcategories.sql  # Movement categorization
│       └── 014_fix_workouts_created_by.sql     # Auto-set created_by trigger
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

---

## Git Workflow & GitFlow Guidelines

This project follows the **GitFlow** branching model for organized version control and release management.

### Branch Structure

```
main          ← Production-ready code (tagged releases)
  │
  └── develop ← Integration branch for features
        │
        ├── feature/* ← New feature development
        ├── release/* ← Release preparation
        └── hotfix/*  ← Production bug fixes
```

### Main Branches

| Branch | Purpose | Merges From | Merges To |
|--------|---------|-------------|-----------|
| `main` | Production code, all releases tagged | `release/*`, `hotfix/*` | — |
| `develop` | Latest development changes | `feature/*`, `release/*`, `hotfix/*` | — |

### Supporting Branches

#### Feature Branches
For developing new features.

```bash
# Naming: feature/<feature-name>
# Branch from: develop
# Merge back to: develop

# Create a feature branch
git checkout develop
git pull origin develop
git checkout -b feature/new-program-page

# Work on your feature...
git add .
git commit -m "feat(programs): add new program detail page"

# Push and create PR to develop
git push origin feature/new-program-page
```

#### Release Branches
For preparing a production release.

```bash
# Naming: release/<version>
# Branch from: develop
# Merge back to: main AND develop

# Create a release branch
git checkout develop
git checkout -b release/1.0.0

# Make final adjustments, update version numbers
git commit -m "chore: prepare release 1.0.0"

# Merge to main
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/1.0.0
git push origin develop

# Delete release branch
git branch -d release/1.0.0
git push origin --delete release/1.0.0
```

#### Hotfix Branches
For urgent production bug fixes.

```bash
# Naming: hotfix/<issue>
# Branch from: main
# Merge back to: main AND develop

# Create a hotfix branch
git checkout main
git checkout -b hotfix/critical-payment-bug

# Fix the issue
git commit -m "fix: resolve payment processing error"

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-payment-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-payment-bug
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-payment-bug
git push origin --delete hotfix/critical-payment-bug
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

#### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons, etc.) |
| `refactor` | Code refactoring (no feature/fix) |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, dependencies |
| `ci` | CI/CD configuration |

#### Examples

```bash
feat(navbar): add mobile menu toggle
fix(payments): correct Stripe webhook signature verification
docs(readme): update installation instructions
style(components): format with Prettier
refactor(auth): extract password validation logic
perf(images): add lazy loading to coach photos
test(booking): add unit tests for date selection
chore(deps): update sass-embedded to v1.93.0
ci(github): add automated testing workflow
```

### Pull Request Guidelines

1. **Branch naming** - Follow the GitFlow naming conventions
2. **PR title** - Use conventional commit format
3. **Description** - Explain what, why, and how
4. **Linked issues** - Reference related GitHub issues
5. **Review required** - At least one team member approval
6. **CI checks** - All automated checks must pass
7. **Merge strategy** - Squash and merge for features, merge commit for releases
8. **Branch cleanup** - Delete branch after merging

#### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Version Numbering

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

| Version Part | When to Increment | Example |
|--------------|-------------------|---------|
| **MAJOR** | Breaking changes | `1.0.0` → `2.0.0` |
| **MINOR** | New features (backwards compatible) | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes (backwards compatible) | `1.0.0` → `1.0.1` |

### Daily Workflow Summary

```bash
# 1. Start your day - update develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes and commit often
git add .
git commit -m "feat: implement feature"

# 4. Keep branch updated (if long-running)
git checkout develop
git pull origin develop
git checkout feature/your-feature
git merge develop

# 5. Push and create PR
git push origin feature/your-feature
# Create PR in GitHub UI → develop

# 6. After PR approved and merged
git checkout develop
git pull origin develop
git branch -d feature/your-feature
```

### Useful Git Commands

```bash
# View branch status
git branch -a

# View commit history
git log --oneline --graph --all

# Stash work in progress
git stash
git stash pop

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Interactive rebase (clean up commits)
git rebase -i HEAD~3

# Cherry-pick a commit
git cherry-pick <commit-hash>

# Compare branches
git diff develop..feature/my-feature
```

### Quick Reference: Local Development & Production

Copy-paste commands for common workflows.

#### 🔧 Working Locally (Day-to-Day Development)

```bash
# 1. Start the development server
# Ensure .env.local is configured with live DB credentials first!
npm run dev

# 2. Make changes, then commit to feature branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 3. Commit your work
git add -A
git commit -m "feat: your feature description"

# 4. Push feature branch and merge to develop
git push origin feature/your-feature-name
git checkout develop
git merge --no-ff feature/your-feature-name -m "merge: feature/your-feature-name into develop"
git push origin develop

# 5. Clean up feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

#### 🚀 Push to Production (Release to Main)

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Create release branch
git checkout -b release/X.X.X

# 3. Merge release to main
git checkout main
git pull origin main
git merge --no-ff release/X.X.X -m "release: version X.X.X"

# 4. Tag the release
git tag -a vX.X.X -m "Release version X.X.X"
git push origin main --tags

# 5. Merge release back to develop
git checkout develop
git merge --no-ff release/X.X.X -m "merge: release/X.X.X back to develop"
git push origin develop

# 6. Clean up release branch
git branch -d release/X.X.X
```

**Note:** When migrations in `supabase/migrations/` are pushed to main, GitHub Actions automatically deploys them to production Supabase.

#### 🐳 Supabase Local Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View local Supabase status
supabase status

# Reset local database (runs all migrations fresh)
supabase db reset

# Create new migration
supabase migration new <migration_name>

# View local Studio (database UI)
# Open: http://127.0.0.1:54323
```

#### 📋 Quick Status Check

```bash
# What branch am I on?
git branch --show-current

# What's the status?
git status

# View recent commits
git log --oneline -10

# Is local Supabase running?
supabase status
```

---

## Component Library

### Overview

Reusable UI components following React best practices with TypeScript and CSS Modules.

```
src/components/common/
├── Button/           # Button with variants
├── Card/             # Content containers
├── Container/        # Max-width wrapper
├── Modal/            # Dialog component
├── Section/          # Page section wrapper
└── index.ts          # Centralized exports
```

### Import Pattern

```tsx
// Import all common components
import { Button, Card, Section, Container } from '@/components/common';

// Or import individually
import Button from '@/components/common/Button';
```

### Button Component

Versatile button with multiple variants and sizes.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `fullWidth` | `boolean` | `false` | Full width button |
| `as` | `'button' \| 'a'` | `'button'` | Render element |
| `href` | `string` | — | URL when rendered as anchor |

```tsx
// Primary button
<Button variant="primary">Join Now</Button>

// Outline button as link
<Button variant="outline" as="a" href="/schedule">View Schedule</Button>

// Large full-width button
<Button variant="primary" size="large" fullWidth>
  Book Free Trial
</Button>
```

### Card Component

Content container with different visual styles.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'elevated' \| 'bordered'` | `'default'` | Visual style |
| `padding` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Internal padding |
| `hoverable` | `boolean` | `false` | Hover lift effect |

```tsx
// Elevated card with hover effect
<Card variant="elevated" hoverable>
  <h3>CrossFit Fundamentals</h3>
  <p>Learn the basics of CrossFit movements</p>
</Card>

// Card with no padding (for images)
<Card padding="none">
  <img src="hero.jpg" alt="Gym" />
  <div style={{ padding: '1rem' }}>
    <h3>Our Facility</h3>
  </div>
</Card>
```

### Section Component

Semantic wrapper for page sections with consistent spacing.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | `'none' \| 'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Vertical padding |
| `background` | `'default' \| 'surface' \| 'dark'` | `'default'` | Background color |
| `fullWidth` | `boolean` | `false` | Remove horizontal padding |
| `as` | `'section' \| 'div' \| 'article'` | `'section'` | HTML element |

```tsx
<Section spacing="large" background="surface">
  <Container>
    <h2>Our Programs</h2>
    <p>Choose the program that fits your goals</p>
  </Container>
</Section>
```

### Container Component

Max-width container for centering content.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Max width |
| `as` | `'div' \| 'main' \| 'article' \| 'section'` | `'div'` | HTML element |

**Sizes:**
- `small`: 768px max-width
- `medium`: 1200px max-width
- `large`: 1440px max-width
- `full`: 100% width with padding

```tsx
<Container size="small">
  <form>
    {/* Form content */}
  </form>
</Container>
```

### Example: Building a Page Section

```tsx
import { Section, Container, Card, Button } from '@/components/common';

const ProgramsSection = () => (
  <Section spacing="large" background="surface">
    <Container>
      <h2>Our Programs</h2>
      <p>Choose the program that fits your goals</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        <Card variant="elevated" hoverable>
          <h3>CrossFit</h3>
          <p>High-intensity functional fitness</p>
          <Button variant="primary" fullWidth>Learn More</Button>
        </Card>
        
        <Card variant="elevated" hoverable>
          <h3>Foundations</h3>
          <p>Learn the basics with expert coaching</p>
          <Button variant="primary" fullWidth>Learn More</Button>
        </Card>
        
        <Card variant="elevated" hoverable>
          <h3>Open Gym</h3>
          <p>Train on your own schedule</p>
          <Button variant="primary" fullWidth>Learn More</Button>
        </Card>
      </div>
    </Container>
  </Section>
);
```

---

## Content Architecture

### Hybrid Approach

The project uses a **hybrid data-driven and hard-coded approach**:

#### Data-Driven Content (TypeScript files)
Content that changes frequently:
- ✅ Programs (`src/data/programs.ts`)
- ✅ Coaches (`src/data/coaches.ts`)
- ✅ Stats (`src/data/stats.ts`)
- ✅ WOD (`src/data/wod.ts`)
- ✅ Schedule (`src/data/schedule.ts`)

#### Hard-Coded Content (Components)
Static content that rarely changes:
- ✅ Hero section messaging
- ✅ CTA sections
- ✅ About/Mission content
- ✅ Section headings

### Data Types

```typescript
// Program
interface Program {
  id: string;
  title: string;
  description: string;
  features: string[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  image?: string;
}

// Coach
interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  certifications: string[];
  specialties: string[];
  image?: string;
}

// Stat
interface Stat {
  id: string;
  value: string | number;
  label: string;
  suffix?: string;
}

// WOD
interface WOD {
  id: string;
  date: string;
  title: string;
  description: string;
  movements: string[];
  type: 'amrap' | 'fortime' | 'emom' | 'strength' | 'endurance';
  duration?: string;
  rounds?: number;
}
```

### Updating Content

#### Adding a Program

```typescript
// src/data/programs.ts
{
  id: 'new-program',
  title: 'New Program Name',
  description: 'Program description here',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  level: 'intermediate',
}
```

#### Adding a Coach

```typescript
// src/data/coaches.ts
{
  id: 'john-doe',
  name: 'John Doe',
  title: 'Head Coach',
  bio: 'John has 10 years of coaching experience...',
  certifications: ['CF-L3', 'USA Weightlifting'],
  specialties: ['Olympic Lifting', 'Mobility'],
}
```

#### Updating Daily WOD

```typescript
// src/data/wod.ts
export const todaysWOD: WOD = {
  id: 'wod-2025-01-06',
  date: '2025-01-06',
  title: 'Monday Madness',
  description: 'AMRAP in 20 minutes',
  movements: [
    '10 Pull-ups',
    '15 Push-ups',
    '20 Air Squats',
  ],
  type: 'amrap',
  duration: '20:00',
};
```

---

## Payment Setup

### Overview

Full Stripe integration for day pass purchases (£10) and trial membership card authorization.

### User Flows

#### Day Pass Flow
1. User clicks "Book Day Pass" on Hero
2. Redirected to Schedule page
3. Auth modal opens (if not logged in)
4. User selects a class
5. Payment modal opens with Stripe Elements
6. User pays £10
7. Booking confirmed via webhook
8. Redirect to confirmation page

#### Trial Flow
1. User clicks "Book Trial Pass" on Hero
2. Trial modal explains what's included
3. User creates account
4. Card authorization form (no charge)
5. SetupIntent created for future billing
6. Trial activated, redirect to schedule

### Database Setup

Run migrations in Supabase SQL Editor (in order):

```sql
-- Execute each file in supabase/migrations/ folder:
001_create_stripe_customers.sql
002_create_bookings.sql
003_create_payments.sql
004_create_trial_memberships.sql
005_update_profiles.sql
```

### Stripe Setup

1. **Create Stripe Account** at [stripe.com](https://stripe.com)
2. **Enable Test Mode** (toggle in dashboard)
3. **Create Products:**
   - Day Pass: One-time £10.00 GBP
   - Trial Membership Setup: £0.00 (setup intent only)
4. **Get API Keys** (Developers → API keys)
5. **Setup Webhook** (Developers → Webhooks)
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `setup_intent.succeeded`, `setup_intent.setup_failed`

### Test Cards

| Scenario | Card Number |
|----------|-------------|
| Success | `4242 4242 4242 4242` |
| Decline | `4000 0000 0000 0002` |
| Insufficient Funds | `4000 0000 0000 9995` |
| Requires Auth | `4000 0027 6000 3184` |

Use any future expiry, any 3-digit CVC, any postal code.

### Local Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

---

## Security Features

### Password Security

- **12+ character minimum** with uppercase, lowercase, number, and special character
- **Password strength meter** with visual feedback
- **Have I Been Pwned integration** - checks against 600M+ compromised passwords
- **Password visibility toggle** with security warning

### Rate Limiting

- Maximum 5 failed login attempts
- 5-minute lockout after max attempts
- Progressive warnings after 3 failures
- Automatic reset on successful login

### Bot Prevention

- **Honeypot field** - invisible to users, catches automated bots
- Silently rejects submissions if honeypot is filled
- **Development mode**: Honeypot is disabled in development (`import.meta.env.PROD === false`) to prevent false positives from browser extensions and password managers that auto-fill hidden fields
- **Production mode**: Honeypot is fully active and blocks suspicious submissions

### Input Sanitization

- XSS prevention (HTML encoding)
- SQL injection pattern detection
- Email validation with regex

### Session Security

- **30-minute inactivity timeout** (configurable)
- **5-minute warning** before expiration
- Activity tracking (mouse, keyboard, scroll, touch)
- Session warning modal with countdown

### Configuration

```typescript
// Session timeout (in App.tsx)
useSessionTimeout({
  timeoutMinutes: 30,
  warningMinutes: 5,
  onWarning: () => setShowWarning(true),
  onTimeout: () => handleLogout()
});

// Rate limiter (in security.ts)
new RateLimiter(
  5,      // max attempts
  900000, // 15 min window
  300000  // 5 min lockout
);
```

---

## Design System

### Colors

```scss
// Backgrounds
--color-bg: #181820           // Main background
--color-bg-light: #2a2a38     // Lighter background
--color-bg-dark: #0f0f14      // Darker background
--color-surface: #23232e      // Card/surface color

// Accents
--color-accent: #ff4f1f       // Primary orange (CTAs)
--color-accent2: #ff1f4f      // Secondary red

// Text
--color-text: #fff            // Primary text
--color-muted: #888           // Muted text
```

### Typography

```scss
--font-header: 'Oswald'       // Bold, impactful headers
--font-body: 'Inter'          // Clean, readable body text
```

### Spacing Scale

| Name | Desktop | Mobile |
|------|---------|--------|
| `none` | 0 | 0 |
| `small` | 2rem | 1.5rem |
| `medium` | 4rem | 3rem |
| `large` | 6rem | 4rem |
| `xlarge` | 8rem | 5rem |

### Variants

**Buttons:**
- `primary` - Main CTAs (orange background)
- `secondary` - Alternative actions (surface background)
- `outline` - Less prominent (transparent with border)
- `ghost` - Minimal style (transparent)

**Cards:**
- `default` - Standard surface background
- `elevated` - With box shadow
- `bordered` - With border

**Sections:**
- `default` - Main background (#181820)
- `surface` - Lighter (#23232e)
- `dark` - Darker (#0f0f14)

---

## Environment Variables

### Production Environment (`.env`)

Create a `.env` file in the root directory for production credentials:

```env
# Supabase (Production)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Local Development Environment (`.env.local`)

For local development with Supabase running in Docker:

```env
# Supabase (Local)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from-npx-supabase-status>
```

> **Important:** `.env.local` takes priority over `.env` and is gitignored, allowing you to work locally without affecting production. See the [Local Development with Supabase](#local-development-with-supabase) section for setup instructions.

### Vercel Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL | All |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | All |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Server only |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | All |
| `STRIPE_SECRET_KEY` | Stripe secret key | Server only |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Server only |

---

## Deployment

### Production Release (GitFlow)

Follow this process when deploying to production:

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Create a release branch
git checkout -b release/1.0.0

# 3. Make any final adjustments (version bump, changelog, etc.)
git commit -m "chore: prepare release 1.0.0"

# 4. Merge to main
git checkout main
git pull origin main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# 5. Merge back to develop
git checkout develop
git merge --no-ff release/1.0.0
git push origin develop

# 6. Delete release branch
git branch -d release/1.0.0
```

### What Happens on Push to Main

| Step | Service | Action |
|------|---------|--------|
| 1 | **Vercel** | Automatically deploys code |
| 2 | **GitHub Actions** | Automatically runs Supabase migrations |

### Supabase Migrations

#### Automated (Recommended)

Migrations are automatically applied via GitHub Actions when you push to `main`. See `.github/workflows/supabase-migrations.yml`.

**Required GitHub Secrets:**
- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token
- `SUPABASE_PROJECT_ID` - Your project reference ID
- `SUPABASE_DB_PASSWORD` - Your database password

To get these values:
1. **Access Token**: Supabase Dashboard → Account → Access Tokens → Generate
2. **Project ID**: Supabase Dashboard → Settings → General → Reference ID
3. **DB Password**: Supabase Dashboard → Settings → Database → Database Password

#### Manual Deployment

If you need to manually push migrations:

```bash
# Login to Supabase (one-time)
npx supabase login

# Link your project (one-time)
npx supabase link --project-ref <your-project-ref>

# Push migrations to production
npx supabase db push
```

#### Useful Migration Commands

```bash
# View pending migrations
npx supabase migration list

# See what will change in production
npx supabase db diff

# Push to production (will prompt for confirmation)
npx supabase db push

# Pull remote schema to local (if production has manual changes)
npx supabase db pull

# Create a new migration
npx supabase migration new <migration_name>
```

#### ⚠️ Migration Safety

1. **Always test locally first** with `npx supabase db reset`
2. **Backup production** before applying destructive migrations
3. **Review migrations** with `npx supabase db diff` before pushing
4. **Destructive changes** (dropping tables/columns) require `--include-all` flag

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Production deployment
vercel --prod
```

### Manual Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Post-Deployment Checklist

- [ ] Verify Vercel deployment succeeded
- [ ] Verify GitHub Actions migration workflow passed
- [ ] Update Stripe webhook URL to production domain
- [ ] Verify all environment variables are set
- [ ] Run through day pass and trial flows
- [ ] Check Vercel function logs for any errors

---

## Testing

### Local Development

```bash
# Start dev server
npm run dev

# Run linting
npm run lint
```

### Testing Checklist

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Auth modal opens and closes
- [ ] Sign up with valid credentials
- [ ] Login with existing account
- [ ] Password strength meter functions
- [ ] Session timeout warning appears
- [ ] Day pass payment flow completes
- [ ] Trial signup flow completes
- [ ] Schedule displays correctly
- [ ] Booking confirmation shows details
- [ ] Responsive design on mobile

### Security Testing

- [ ] Try weak passwords (should be rejected)
- [ ] Test compromised password detection
- [ ] Trigger rate limiting (5 failed logins)
- [ ] Verify session timeout after inactivity
- [ ] Test XSS in form inputs

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request to `develop`

Please follow the [Git Workflow](#git-workflow--gitflow-guidelines) guidelines.

---

## Troubleshooting

### Common Issues

**Payment Intent Not Creating**
- Check Stripe secret key in Vercel env vars
- Verify Supabase service key is set
- Check API route logs in Vercel dashboard

**Webhook Not Firing**
- Verify webhook URL in Stripe dashboard
- Check webhook secret in Vercel env vars
- Test webhook locally with Stripe CLI

**Auth Not Working**
- Verify Supabase URL and anon key
- Check email confirmation is enabled
- Review Supabase auth logs
- In development: If login fails silently with "An error occurred", check if a browser extension is auto-filling the honeypot field (this is disabled in dev mode, but older builds may still have it enabled)

**Build Failing**
- Run `npm run lint` to check for errors
- Ensure TypeScript types are correct
- Check for missing dependencies

---

## License

This project is private and proprietary. All rights reserved.

---

## Support

For issues or questions:
- Check Vercel function logs for API errors
- Check Stripe Dashboard → Events for webhook delivery
- Check Supabase Dashboard → Table Editor for data
- Review browser console for frontend errors

---

<div align="center">
  <p>Built with ❤️ by the No Sweat Team</p>
  <p>
    <a href="https://react.dev">React</a> •
    <a href="https://vite.dev">Vite</a> •
    <a href="https://supabase.com">Supabase</a> •
    <a href="https://stripe.com">Stripe</a>
  </p>
</div>
