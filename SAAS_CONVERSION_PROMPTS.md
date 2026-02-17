# SaaS Conversion Master Prompt Guide

## Project Context (Include at the top of EVERY phase prompt)

This is a gym management web application currently built as a single-tenant app for "CrossFit Comet". We are converting it into a white-label, multi-tenant SaaS platform where any gym can sign up, customise their branding, and toggle features on/off at £10/feature/month.

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite 7 + React Router DOM 7
- **Styling:** SCSS Modules with CSS Custom Properties (variables in `src/styles/_variables.scss`)
- **Backend:** Supabase (PostgreSQL + Auth + RLS) + Vercel Serverless Functions
- **Payments:** Stripe (PaymentIntents, SetupIntents)
- **Accounting:** QuickBooks/Xero integrations
- **Deployment:** Vercel (production) + Docker (local dev)

### Current Architecture
- **Pages:** Home, Schedule, Coaches, About, Dashboard (member), CoachDashboard (admin), CoachView (coach), EmailVerified, ResetPassword, BookingConfirmation
- **Auth:** Supabase Auth with roles: member, staff, coach, admin
- **Components:** Modular SCSS module-scoped components in `src/components/`
- **Common UI:** Button, Card, Container, Section, Modal, Select, NumberInput, DurationInput, InfoTooltip (in `src/components/common/`)
- **Sections:** Hero, Programs, Stats, WOD, CTA (in `src/components/sections/`)
- **Static Data Files (need to become DB-driven):** `src/data/coaches.ts`, `src/data/programs.ts`, `src/data/programDetails.ts`, `src/data/schedule.ts`, `src/data/stats.ts`
- **Services:** analyticsService, coachProfileService, coachServicesService, movementService, userManagementService, wodBookingService, workoutService, accountingService, accountingSyncService

### Multi-Tenancy Strategy
- **Routing:** Subdomain-based (`comet.gymplatform.com`, `ironbox.gymplatform.com`)
- **Data Isolation:** Row-Level Security (RLS) with `gym_id` on every tenant-scoped table
- **Theming:** Runtime CSS variable injection from database-stored branding config
- **Feature Gating:** Database-driven feature flags per gym, £10/feature/month

### Files with Hardcoded "CrossFit Comet" References (23 files to update)
1. `index.html` — page title
2. `public/manifest.json` — PWA name, short_name, description
3. `src/components/Navbar.tsx` — logo text (2 places), mobile guest greeting
4. `src/components/Footer.tsx` — copyright notice
5. `src/components/sections/Hero/Hero.tsx` — welcome heading
6. `src/components/sections/WOD/WOD.tsx` — section heading
7. `src/components/sections/CTA/CTA.tsx` — CTA copy
8. `src/components/TrialModal/TrialModal.tsx` — trial subtitle
9. `src/components/AuthModal/AuthModal.tsx` — password reset text (3 places), signup subtitle, switch text
10. `src/components/ProfileSettings/ProfileSettings.tsx` — "Comet Plus" membership name
11. `src/pages/About.tsx` — mission statement, CTA text, map title
12. `src/pages/EmailVerified.tsx` — success message
13. `src/contexts/AuthContext.tsx` — "comet-plus" membership type
14. `src/contexts/RegistrationContext.tsx` — "cf_comet" storage key
15. `src/lib/supabase.ts` — "comet-plus" type definition
16. `src/types/index.ts` — membership type definitions
17. `src/data/programs.ts` — coach reference in description
18. `src/data/programDetails.ts` — "Comet Plus" program title
19. `src/styles/_variables.scss` — comment "Theme variables for CrossFit Comet"
20. `supabase/config.toml` — project config
21. `supabase/migrations/008_seed_coach_accounts.sql` — @crossfitcomet.com emails
22. `scripts/seed-coaches.js` — @crossfitcomet.com emails
23. `README.md` — project title

### Database Tables Requiring `gym_id`
1. `profiles` — user profiles
2. `stripe_customers` — Stripe customer records
3. `bookings` — class bookings
4. `payments` — payment records
5. `trial_memberships` — trial membership tracking
6. `workouts` — WOD programming
7. `workout_bookings` — WOD booking records
8. `coach_services` — coach service offerings
9. `service_bookings` — service booking records
10. `accounting_integrations` — QuickBooks/Xero connections
11. `accounting_account_mappings` — account mappings
12. `accounting_sync_logs` — sync history
13. `accounting_synced_transactions` — synced transactions

### Tables That Stay Gym-Agnostic
1. `crossfit_movements` — universal movement reference library
2. `accounting_encryption_keys` — global encryption metadata

---

## PHASE 1: Database Multi-Tenancy Foundation

### Prompt

```
You are working on a gym management SaaS platform conversion. This is PHASE 1: Database Multi-Tenancy Foundation.

[PASTE THE PROJECT CONTEXT SECTION ABOVE HERE]

## Your Task

Create the database migration(s) and update RLS policies to support multi-tenancy. This is the foundation — no frontend changes yet.

### Step 1: Create New Tables

Create a Supabase migration file at `supabase/migrations/050_multi_tenancy_foundation.sql` that:

#### 1a. `gyms` table
```sql
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,  -- used for subdomain: slug.gymplatform.com
  owner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'onboarding')),
  contact_email TEXT,
  contact_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'GB',
  website_url TEXT,
  google_maps_embed_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  stripe_account_id TEXT,  -- for Connect (future)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1b. `gym_branding` table
```sql
CREATE TABLE gym_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE UNIQUE,

  -- Colors
  color_bg TEXT DEFAULT '#ffffff',
  color_bg_light TEXT DEFAULT '#f8f9fa',
  color_bg_dark TEXT DEFAULT '#e9ecef',
  color_surface TEXT DEFAULT '#ffffff',
  color_accent TEXT DEFAULT '#2563eb',       -- primary brand color
  color_accent2 TEXT DEFAULT '#dc2626',      -- secondary accent
  color_secondary TEXT DEFAULT '#0891b2',    -- secondary color
  color_secondary2 TEXT DEFAULT '#059669',   -- tertiary color
  color_specialty TEXT DEFAULT '#7c3aed',    -- specialty color
  color_text TEXT DEFAULT '#1f2937',
  color_muted TEXT DEFAULT '#6b7280',
  color_header TEXT DEFAULT '#111827',
  color_footer TEXT DEFAULT '#111827',

  -- Typography
  font_header TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',

  -- Shape
  border_radius TEXT DEFAULT '0.5rem',

  -- Theme mode
  theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),

  -- Assets
  logo_url TEXT,
  logo_dark_url TEXT,        -- logo variant for dark backgrounds
  favicon_url TEXT,
  hero_image_url TEXT,
  about_image_url TEXT,
  og_image_url TEXT,         -- social sharing preview

  -- Content
  hero_headline TEXT DEFAULT 'Welcome to Your Gym',
  hero_subtitle TEXT DEFAULT 'Transform your fitness journey with expert coaching and a supportive community.',
  cta_headline TEXT DEFAULT 'Ready to Start Your Journey?',
  cta_subtitle TEXT DEFAULT 'Join us today and experience the difference. Your first class is free!',
  about_mission TEXT,
  about_philosophy TEXT,
  about_facility TEXT,
  footer_text TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1c. `gym_features` table
```sql
CREATE TABLE gym_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMPTZ,
  monthly_cost_pence INTEGER NOT NULL DEFAULT 1000,  -- £10.00
  UNIQUE(gym_id, feature_key)
);
```

The toggleable features (feature_key values) are:
- `class_booking` — Class schedule and booking system
- `wod_programming` — Workout of the Day editor and display
- `coach_profiles` — Coach profile pages with bios, certs, specialties
- `day_passes` — Day pass purchase with Stripe
- `trial_memberships` — Free trial with card authorisation
- `service_booking` — Coach services booking (PT, massage, nutrition, etc.)
- `accounting_integration` — QuickBooks/Xero integration
- `coach_analytics` — Coach analytics and volume tracking
- `member_management` — Admin user management panel

#### 1d. `gym_programs` table (replaces src/data/programs.ts and programDetails.ts)
```sql
CREATE TABLE gym_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  overview TEXT,
  features TEXT[],
  benefits JSONB,          -- [{title, description}]
  who_is_it_for TEXT[],
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  price_pence INTEGER,
  price_unit TEXT,
  price_note TEXT,
  schedule_info TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1e. `gym_schedule` table (replaces src/data/schedule.ts)
```sql
CREATE TABLE gym_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time TIME NOT NULL,
  end_time TIME,
  class_name TEXT NOT NULL,
  coach_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES gym_programs(id),
  max_capacity INTEGER DEFAULT 16,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1f. `gym_stats` table (replaces src/data/stats.ts)
```sql
CREATE TABLE gym_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value INTEGER NOT NULL,
  suffix TEXT,
  sort_order INTEGER DEFAULT 0
);
```

#### 1g. `gym_memberships` table (to replace hardcoded membership types)
```sql
CREATE TABLE gym_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                -- 'crossfit', 'premium', 'open-gym', etc.
  display_name TEXT NOT NULL,        -- 'CrossFit', 'Premium', 'Open Gym'
  description TEXT,
  price_pence INTEGER,
  billing_period TEXT DEFAULT 'monthly',
  features TEXT[],
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gym_id, slug)
);
```

### Step 2: Add `gym_id` to ALL 13 Existing Tables

Add a `gym_id UUID REFERENCES gyms(id)` column to each of these tables:
- profiles
- stripe_customers
- bookings
- payments
- trial_memberships
- workouts
- workout_bookings
- coach_services
- service_bookings
- accounting_integrations
- accounting_account_mappings
- accounting_sync_logs
- accounting_synced_transactions

For each table:
1. Add the column as nullable first (so existing data doesn't break)
2. Create an index on gym_id for query performance
3. DO NOT add NOT NULL yet — that happens in Phase 7 when we migrate Comet's data

### Step 3: Update the `handle_new_user()` Trigger

The trigger that creates profiles on signup needs updating. For now, it should accept a `gym_id` from the user metadata:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, gym_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'member',
    (NEW.raw_user_meta_data->>'gym_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 4: Update ALL RLS Policies

For EVERY table that now has gym_id, update the RLS policies to include gym_id scoping. The pattern is:

For user-facing queries, users should only see data from their own gym. Determine the user's gym from their profile:

```sql
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID AS $$
  SELECT gym_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Then update policies like:
```sql
-- Example for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id
    AND gym_id = get_user_gym_id()
  );
```

Apply this pattern to ALL existing policies on ALL 13 tables. Ensure admin/coach policies also scope to the same gym.

### Step 5: RLS for New Tables

Add RLS policies for all new tables:

**gyms:**
- Owners can view/update their own gym
- Platform admins can view all (future)
- Public can read basic gym info by slug (for subdomain resolution)

**gym_branding:**
- Public can read (needed to render the site)
- Gym owners/admins can update their own gym's branding

**gym_features:**
- Public can read (needed for feature gating in UI)
- Gym owners can toggle features (future: gated by payment)

**gym_programs, gym_schedule, gym_stats, gym_memberships:**
- Public can read (for the gym's public website)
- Gym admins can CRUD

### Step 6: Create Helper Functions

```sql
-- Resolve gym from subdomain slug
CREATE OR REPLACE FUNCTION get_gym_by_slug(slug_param TEXT)
RETURNS gyms AS $$
  SELECT * FROM gyms WHERE slug = slug_param AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if a feature is enabled for a gym
CREATE OR REPLACE FUNCTION is_feature_enabled(gym_id_param UUID, feature_key_param TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT enabled FROM gym_features WHERE gym_id = gym_id_param AND feature_key = feature_key_param),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Important Notes
- DO NOT modify any frontend code in this phase
- DO NOT delete any existing data or break existing functionality
- All new columns should be nullable for now (backward compatibility)
- Test that existing functionality still works after migration
- Run `npx supabase db diff` after to verify the migration
```

---

## PHASE 2: Tenant Context, Routing & White-Labelling

### Prompt

```
You are working on a gym management SaaS platform conversion. This is PHASE 2: Tenant Context, Routing & White-Labelling.

[PASTE THE PROJECT CONTEXT SECTION ABOVE HERE]

Phase 1 (Database Multi-Tenancy) is complete. The database now has:
- `gyms` table with slug-based identification
- `gym_branding` table with all theme config
- `gym_features` table with feature toggles
- `gym_programs`, `gym_schedule`, `gym_stats`, `gym_memberships` tables
- `gym_id` column on all 13 existing tenant-scoped tables
- `get_user_gym_id()` and `get_gym_by_slug()` helper functions
- Updated RLS policies scoping all queries by gym_id

## Your Task

Create the tenant resolution system, context providers, and replace all hardcoded "CrossFit Comet" references with dynamic tenant data.

### Step 1: Tenant Resolution & Context Provider

Create `src/contexts/TenantContext.tsx`:

```typescript
// This context resolves the current gym from the subdomain and provides:
// - gym: full gym record (name, slug, contact info, etc.)
// - branding: full branding config (colors, fonts, logos, content)
// - features: Record<string, boolean> of enabled features
// - programs: gym's programs
// - schedule: gym's class schedule
// - stats: gym's display stats
// - memberships: gym's membership types
// - isLoading: boolean
// - error: string | null

// Resolution logic:
// 1. Parse window.location.hostname to extract subdomain
//    e.g., "comet.gymplatform.com" -> slug = "comet"
// 2. For local development, support ?tenant=comet query parameter fallback
//    or localhost subdomains via /etc/hosts
// 3. Fetch gym by slug using get_gym_by_slug() or direct query
// 4. Fetch gym_branding, gym_features, gym_programs, gym_schedule, gym_stats, gym_memberships
// 5. If gym not found or suspended, show a "Gym not found" page
// 6. Cache the tenant data for the session
```

The provider should wrap the entire app in `App.tsx` (outside AuthProvider, since auth needs to know the gym_id).

### Step 2: Theme Injection Hook

Create `src/hooks/useTenantTheme.ts`:

```typescript
// This hook reads branding from TenantContext and injects CSS custom properties
// into document.documentElement.style so all SCSS modules pick them up automatically.
//
// It should map gym_branding fields to the existing CSS variables in _variables.scss:
//   branding.color_bg        -> --color-bg
//   branding.color_bg_light  -> --color-bg-light
//   branding.color_bg_dark   -> --color-bg-dark
//   branding.color_surface   -> --color-surface
//   branding.color_accent    -> --color-accent
//   branding.color_accent2   -> --color-accent2
//   branding.color_secondary -> --color-secondary
//   branding.color_secondary2-> --color-secondary2
//   branding.color_specialty -> --color-specialty
//   branding.color_text      -> --color-text
//   branding.color_muted     -> --color-muted
//   branding.color_header    -> --color-header
//   branding.color_footer    -> --color-footer
//   branding.font_header     -> --font-header
//   branding.font_body       -> --font-body
//   branding.border_radius   -> --border-radius
//
// Also handle:
// - Google Fonts loading for custom font_header and font_body
// - <title> tag update with gym name
// - Favicon update if branding.favicon_url is set
// - meta theme-color update
```

### Step 3: Feature Gate Components

Create `src/components/common/FeatureGate/FeatureGate.tsx`:

```typescript
// <FeatureGate feature="wod_programming">
//   <WODSection />
// </FeatureGate>
//
// If the feature is not enabled, renders nothing (or optional fallback prop).
// Uses TenantContext to check features.

// Also create a hook:
// const isEnabled = useFeature('day_passes');  // returns boolean
```

### Step 4: Update `_variables.scss`

Change the hardcoded values to sensible white-label defaults. The runtime injection from Step 2 will override these, but the defaults should be a clean, neutral light theme:

```scss
// Default white-label theme (overridden at runtime by TenantContext)
:root {
  --color-bg: #ffffff;
  --color-bg-light: #f8f9fa;
  --color-bg-dark: #e9ecef;
  --color-surface: #ffffff;
  --color-accent: #2563eb;
  --color-accent2: #dc2626;
  --color-secondary: #0891b2;
  --color-secondary2: #059669;
  --color-specialty: #7c3aed;
  --color-text: #1f2937;
  --color-muted: #6b7280;
  --color-header: #111827;
  --color-footer: #111827;
  --font-header: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --border-radius: 0.5rem;
}
```

### Step 5: Replace ALL 23 Hardcoded References

Go through every file listed in the "Files with Hardcoded References" section of the project context and replace hardcoded strings with tenant context data:

**Pattern for components:**
```typescript
import { useTenant } from '../../contexts/TenantContext';

function MyComponent() {
  const { gym, branding } = useTenant();

  return <h1>Welcome to {gym.name}</h1>;  // was: "Welcome to CrossFit Comet"
}
```

**Specific replacements needed:**

1. `index.html` — set a generic default title; the hook will update it dynamically
2. `public/manifest.json` — make generic; consider generating per-tenant via API
3. `Navbar.tsx` — `gym.name` for logo text, `branding.logo_url` for logo image
4. `Footer.tsx` — `gym.name` in copyright
5. `Hero.tsx` — `branding.hero_headline` and `branding.hero_subtitle`
6. `WOD.tsx` — `gym.name` in heading
7. `CTA.tsx` — `branding.cta_headline` and `branding.cta_subtitle`
8. `TrialModal.tsx` — `gym.name` in subtitle
9. `AuthModal.tsx` — `gym.name` in all 5 locations
10. `ProfileSettings.tsx` — use `memberships` from tenant context instead of hardcoded map
11. `About.tsx` — `branding.about_mission`, `gym.google_maps_embed_url`, etc.
12. `EmailVerified.tsx` — `gym.name` in success message
13. `RegistrationContext.tsx` — use `gym.slug` in storage key prefix
14. `AuthContext.tsx` — membership types from `gym_memberships` table
15. `src/types/index.ts` — make membership type dynamic (string instead of union)

### Step 6: Replace Static Data Imports

Every file that imports from `src/data/` should instead use TenantContext:

- `src/data/coaches.ts` → coaches come from `profiles` table WHERE role = 'coach' AND gym_id = tenant.gym.id
- `src/data/programs.ts` → `tenant.programs` from TenantContext
- `src/data/programDetails.ts` → merged into `gym_programs` table
- `src/data/schedule.ts` → `tenant.schedule` from TenantContext
- `src/data/stats.ts` → `tenant.stats` from TenantContext

After all imports are replaced, delete the `src/data/` directory.

### Step 7: Update AuthContext for Multi-Tenancy

Update `src/contexts/AuthContext.tsx`:
- The signup function should include `gym_id` in user metadata so the `handle_new_user()` trigger can set it
- Membership types should be dynamic (from gym_memberships) not hardcoded
- The `cf_comet_registration_intent` storage key should use the gym slug

### Step 8: Wrap the App

Update `src/App.tsx` to wrap everything with TenantProvider:

```tsx
function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <RegistrationProvider>
          <AppContent />
        </RegistrationProvider>
      </AuthProvider>
    </TenantProvider>
  );
}
```

### Step 9: Local Development Setup

Update `vite.config.ts` to support tenant resolution in development:
- Add a `?tenant=comet` query parameter fallback
- Or document how to set up `comet.localhost:5173` via /etc/hosts

### Important Notes
- Ensure the app works with NO tenant (show a "Gym not found" landing page)
- Ensure the app works with a valid tenant slug
- The existing SCSS module architecture should continue working — theme injection via CSS variables is transparent to components
- Do NOT change any database schema in this phase
- Do NOT build the admin dashboard yet — that's Phase 5
```

---

## PHASE 3: Dynamic Theming Engine & SCSS Cleanup

### Prompt

```
You are working on a gym management SaaS platform conversion. This is PHASE 3: Dynamic Theming Engine & SCSS Cleanup.

[PASTE THE PROJECT CONTEXT SECTION ABOVE HERE]

Phases 1-2 are complete. The database has multi-tenancy support, TenantContext resolves the gym from the subdomain, and CSS variables are injected at runtime from gym_branding. All hardcoded "CrossFit Comet" references have been replaced.

## Your Task

Audit and fix every SCSS file to ensure ALL colors reference CSS variables (no hardcoded hex/rgba values), and enhance the theming system for a polished white-label experience.

### Step 1: SCSS Hardcoded Color Audit & Fix

There are 35+ SCSS module files with hardcoded color values that bypass the CSS variable system. Find and fix ALL of them.

**Key offenders identified:**

1. `src/components/sections/Hero/Hero.module.scss`
   - `rgba(18, 18, 18, 0.75)` → should use `var(--color-bg)` with opacity
   - `rgba(255, 79, 31, ...)` orange comet effects → should use `var(--color-accent)`
   - `rgba(30, 30, 30, 0.9)` card backgrounds → should use `var(--color-surface)`
   - The entire "comet animation" uses hardcoded orange/cyan → make it use accent/secondary variables

2. `src/components/AuthModal/AuthModal.module.scss`
   - `rgba(0, 229, 255, 0.15)` cyan banners → use `var(--color-secondary)`
   - Focus states with hardcoded cyan → use `var(--color-secondary)`

3. `src/components/ProfileSettings/ProfileSettings.module.scss`
   - Hardcoded cyan focus states

4. ALL component SCSS files — search for any raw hex values (#xxx, #xxxxxx) or rgb/rgba values and replace with CSS variable references.

**Pattern for rgba with opacity:**
Create a helper approach. Since CSS variables can't be used directly inside `rgba()`, use this pattern:
```scss
// In _variables.scss, add RGB channel versions:
:root {
  --color-accent-rgb: 37, 99, 235;  // RGB values for accent color
  --color-secondary-rgb: 8, 145, 178;
  --color-bg-rgb: 255, 255, 255;
  --color-surface-rgb: 255, 255, 255;
  --color-text-rgb: 31, 41, 55;
}

// Then in components:
background: rgba(var(--color-accent-rgb), 0.15);
```

Update the `useTenantTheme.ts` hook to also compute and inject the `-rgb` versions of each color.

### Step 2: Light/Dark Theme Support

The current app is dark-themed. The white-label default should be light. Ensure:

1. The `theme_mode` field in `gym_branding` ('light' or 'dark') is respected
2. Add a `[data-theme="dark"]` and `[data-theme="light"]` attribute to `<html>`
3. Components that have dark-specific styling (shadows, overlays, glass effects) should adapt
4. The Hero section background overlay, card glass effects, etc. should work in both light and dark themes

### Step 3: Typography System

1. Add CSS variable `--font-weight-header` (default 600) and `--font-weight-body` (default 400) to the theme
2. Ensure all heading elements use `var(--font-header)` and body text uses `var(--font-body)`
3. The `useTenantTheme` hook should dynamically load Google Fonts based on the tenant's font choices
4. Provide a curated list of font options (for the Phase 5 brand builder): Inter, Poppins, Open Sans, Roboto, Montserrat, Lato, Oswald, Raleway, Playfair Display, Merriweather

### Step 4: Component Polish for White-Label

Review each common component to ensure it looks good with any color scheme:

- **Button** — all variants (primary, secondary, outline, ghost) should work with any accent color
- **Card** — elevated/bordered variants should adapt to light/dark themes
- **Modal** — overlay and backdrop should work in both themes
- **Section** — default/surface/dark variants need to be theme-aware
- **Navbar** — should support logo image OR text, and work on light or dark backgrounds
- **Footer** — same as Navbar

### Step 5: Remove the Comet-Specific Animation

The "comet" animation in `Hero.module.scss` (the orange streak effect) is specific to CrossFit Comet's branding. Either:
- Make it optional via a feature flag or branding setting
- Or replace it with a more generic, subtle animation that works for any gym

### Important Notes
- Run the app after changes and visually verify with the default light theme
- Ensure NO raw color values remain in any SCSS file (except for universal things like `transparent`, `inherit`, `currentColor`, pure `black`/`white` for shadows)
- The goal: any gym admin should be able to change their colors in gym_branding and the ENTIRE site updates consistently
```

---

## PHASE 4: Feature Toggle System & Pricing

### Prompt

```
You are working on a gym management SaaS platform conversion. This is PHASE 4: Feature Toggle System & Pricing.

[PASTE THE PROJECT CONTEXT SECTION ABOVE HERE]

Phases 1-3 are complete. The database supports multi-tenancy, all branding is dynamic, all SCSS uses CSS variables, and the TenantContext + FeatureGate components exist.

## Your Task

Wire up the feature toggle system end-to-end: database → context → UI gating → payment enforcement.

### Step 1: Define the Feature Map

Create `src/config/features.ts`:

```typescript
export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  monthlyPricePence: number;  // 1000 = £10
  category: 'core' | 'coaching' | 'business';
  icon: string;  // emoji or icon name
  dependencies?: string[];  // features that must also be enabled
}

export const FEATURES: FeatureDefinition[] = [
  {
    key: 'class_booking',
    name: 'Class Booking',
    description: 'Let members browse your schedule and book classes online. Includes waitlist management and capacity limits.',
    monthlyPricePence: 1000,
    category: 'core',
    icon: '📅',
  },
  {
    key: 'wod_programming',
    name: 'Workout Programming',
    description: 'Create and publish daily workouts (WODs). Coaches can program with the movement database and members see the daily workout.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '💪',
  },
  {
    key: 'coach_profiles',
    name: 'Coach Profiles',
    description: 'Dedicated coach profile pages with bios, certifications, specialties, and photos. Builds trust with potential members.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '👤',
  },
  {
    key: 'day_passes',
    name: 'Day Passes',
    description: 'Sell day passes online with Stripe payment processing. Drop-in visitors can buy and book in one flow.',
    monthlyPricePence: 1000,
    category: 'core',
    icon: '🎫',
    dependencies: ['class_booking'],
  },
  {
    key: 'trial_memberships',
    name: 'Free Trials',
    description: 'Offer free trial classes with card authorisation. Convert visitors to members with a friction-free trial experience.',
    monthlyPricePence: 1000,
    category: 'core',
    icon: '🆓',
    dependencies: ['class_booking'],
  },
  {
    key: 'service_booking',
    name: 'Service Booking',
    description: 'Let members book PT sessions, sports massage, nutrition consultations, and other coach services with online payment.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '🗓️',
    dependencies: ['coach_profiles'],
  },
  {
    key: 'accounting_integration',
    name: 'Accounting Integration',
    description: 'Sync payments and invoices automatically with QuickBooks or Xero. Save hours on bookkeeping.',
    monthlyPricePence: 1000,
    category: 'business',
    icon: '🧾',
  },
  {
    key: 'coach_analytics',
    name: 'Coach Analytics',
    description: 'Track workout volume, movement frequency, and programming balance with visual analytics dashboards.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '📊',
    dependencies: ['wod_programming'],
  },
  {
    key: 'member_management',
    name: 'Member Management',
    description: 'Admin panel to manage members, update roles, invite coaches, and oversee your gym community.',
    monthlyPricePence: 1000,
    category: 'business',
    icon: '👥',
  },
];
```

### Step 2: Wire FeatureGate Into Every Feature

Wrap every feature area with `<FeatureGate>`:

**Home page (`src/pages/Home.tsx`):**
```tsx
<Hero />  {/* Always shown */}
<FeatureGate feature="wod_programming"><WODSection /></FeatureGate>
<Programs />  {/* Always shown — it's the gym's offering */}
<Stats />  {/* Always shown */}
<FeatureGate feature="class_booking"><CTA /></FeatureGate>
```

**Schedule page:**
- Entire page gated by `class_booking`
- Day pass button gated by `day_passes`
- Trial button gated by `trial_memberships`

**Coaches page:**
- Entire page gated by `coach_profiles`

**Dashboard page:**
- Booking section gated by `class_booking`
- WOD display gated by `wod_programming`
- Service booking gated by `service_booking`

**CoachDashboard / CoachView:**
- WOD editor gated by `wod_programming`
- Analytics gated by `coach_analytics`
- User management gated by `member_management`
- Accounting gated by `accounting_integration`
- Service management gated by `service_booking`

**Navbar:**
- Schedule link gated by `class_booking`
- Coaches link gated by `coach_profiles`

### Step 3: API-Level Feature Enforcement

Features must also be enforced at the API level so users can't bypass the UI:

Create a Supabase function or API middleware:
```sql
-- Prevent bookings if class_booking is not enabled
CREATE OR REPLACE FUNCTION check_feature_before_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_feature_enabled(NEW.gym_id, 'class_booking') THEN
    RAISE EXCEPTION 'Feature class_booking is not enabled for this gym';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Apply similar triggers for:
- bookings → requires `class_booking`
- workouts → requires `wod_programming`
- coach_services / service_bookings → requires `service_booking`
- trial_memberships → requires `trial_memberships`
- payments with type 'day-pass' → requires `day_passes`

### Step 4: Feature Billing Tracking

Create a migration `supabase/migrations/052_feature_billing.sql`:

```sql
CREATE TABLE gym_feature_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_pence INTEGER NOT NULL DEFAULT 1000,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'waived')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

This is just the tracking table for now — actual Stripe subscription billing is a future enhancement.

### Step 5: Route Protection for Gated Pages

Update `src/App.tsx` routes to check features:

```tsx
<Route
  path="/schedule"
  element={
    <FeatureGate feature="class_booking" fallback={<FeatureNotEnabled feature="class_booking" />}>
      <Schedule />
    </FeatureGate>
  }
/>
```

Create a `FeatureNotEnabled` component that shows a friendly message like "This feature isn't enabled for [gym name]. Contact your gym admin."

### Important Notes
- Every feature should degrade gracefully — the site should never look broken, just simpler
- A gym with ZERO features enabled should still have: Home page (with hero, programs, stats), About page, login/signup
- Navigation should dynamically hide links to disabled features
- The feature definitions in `src/config/features.ts` are the single source of truth for feature metadata
```

---

## PHASE 5: Gym Admin Brand Builder Dashboard

### Prompt

```
You are working on a gym management SaaS platform conversion. This is PHASE 5: Gym Admin Brand Builder Dashboard.

[PASTE THE PROJECT CONTEXT SECTION ABOVE HERE]

Phases 1-4 are complete. The database supports multi-tenancy, branding is dynamic via CSS variables, all features are toggled via FeatureGate, and billing tracking exists.

## Your Task

Build the gym admin dashboard where gym owners customise their branding, toggle features, and manage their gym's content. This is the "control panel" that makes each gym unique.

### Step 1: New Route & Page

Create a new protected route `/gym-admin` accessible only to users with the gym owner role (the user whose ID matches `gyms.owner_id`).

Add a new page `src/pages/GymAdmin.tsx` with a tabbed layout:

**Tabs:**
1. **Branding** — visual theme editor
2. **Features** — toggle features on/off
3. **Content** — edit text content (hero, CTA, about)
4. **Programs** — manage gym programs
5. **Schedule** — manage class schedule
6. **Settings** — gym info, contact details, social links

### Step 2: Branding Tab (Visual Theme Editor)

Create `src/components/GymAdmin/BrandingEditor.tsx`:

This is the flagship feature — a visual, real-time brand builder.

**Layout:** Split-screen. Left panel = controls. Right panel = live preview (iframe or inline preview of the homepage).

**Controls:**

1. **Logo Upload**
   - Drag-and-drop or click-to-upload for logo
   - Accepts SVG, PNG, WEBP
   - Upload to Supabase Storage bucket
   - Preview immediately in the navbar of the preview panel

2. **Color Palette**
   - Color pickers for each color variable:
     - Primary Brand Color (accent) — with label explaining "buttons, links, CTAs"
     - Secondary Color — "accents, highlights"
     - Background Color — "main page background"
     - Surface Color — "cards, modals, panels"
     - Text Color — "body text"
     - Muted Color — "secondary text, placeholders"
   - Preset palettes: "Clean Light", "Bold Dark", "Earthy", "Ocean", "Minimal"
   - Auto-generate complementary colors from a single primary color pick

3. **Typography**
   - Dropdown for Header Font (curated list: Inter, Poppins, Open Sans, Roboto, Montserrat, Lato, Oswald, Raleway, Playfair Display, Merriweather)
   - Dropdown for Body Font (same list)
   - Font preview text that updates live

4. **Shape & Style**
   - Border radius slider (0px to 2rem) — "Squared" to "Rounded"
   - Theme mode toggle: Light / Dark

5. **Hero Image**
   - Upload hero background image
   - Or choose from a library of stock gym images

**Live Preview:**
- As the admin changes ANY setting, the preview panel updates in real-time
- Use a state-based approach: changes are held in local state, preview reflects local state, "Save" button writes to database
- "Reset" button reverts to last saved state

### Step 3: Features Tab

Create `src/components/GymAdmin/FeatureTogglePanel.tsx`:

Display all 9 features in a grid, grouped by category (Core, Coaching, Business).

Each feature card shows:
- Feature icon and name
- Description
- Price: "£10/month"
- Toggle switch (on/off)
- If feature has dependencies, show them: "Requires: Class Booking"
- If toggling off, warn about dependent features that will also be disabled
- Running total at the bottom: "3 features enabled — £30/month"

When a feature is toggled:
1. Update `gym_features` table
2. Refresh the TenantContext
3. Show confirmation toast

### Step 4: Content Tab

Create `src/components/GymAdmin/ContentEditor.tsx`:

Editable fields for:
- Hero headline (text input)
- Hero subtitle (textarea)
- CTA headline (text input)
- CTA subtitle (textarea)
- About: Mission statement (textarea)
- About: Philosophy (textarea)
- About: Facility description (textarea)
- Footer text (text input)

Each field saves to `gym_branding` table. Show character count and preview.

### Step 5: Programs Tab

Create `src/components/GymAdmin/ProgramManager.tsx`:

CRUD interface for `gym_programs`:
- List all programs with drag-to-reorder (sort_order)
- Add new program button
- Edit program: title, description, tagline, level, price, features list
- Delete program (with confirmation)
- Toggle active/inactive

### Step 6: Schedule Tab

Create `src/components/GymAdmin/ScheduleManager.tsx`:

Visual weekly schedule editor:
- Grid layout: days as columns, time slots as rows
- Click to add a class slot
- Modal for class details: name, time, coach (dropdown from gym's coaches), program link, capacity
- Drag to move time slots
- Delete time slots

### Step 7: Settings Tab

Create `src/components/GymAdmin/GymSettings.tsx`:

Form fields for:
- Gym name
- Contact email, phone
- Address fields
- Google Maps embed URL
- Social media links (Facebook, Instagram, Twitter)
- Slug (read-only, shows the current subdomain)

### Step 8: Navigation Update

Add "Gym Admin" link to the Navbar dropdown menu for gym owners. Use a building/cog icon to differentiate from the member dashboard.

### Important Notes
- All changes should save to Supabase and immediately reflect on the live site
- The live preview in the Branding tab should use the actual components (Hero, Navbar, etc.) rendered with temporary branding overrides
- Validate all inputs (valid hex colors, reasonable border radius values, etc.)
- Image uploads should go to a Supabase Storage bucket named per gym slug
- The admin dashboard itself should use the gym's own branding (it's part of their site)
```

---

## PHASE 6: SaaS Company Website & Onboarding

### Prompt

```
You are working on a gym management SaaS platform conversion. This is PHASE 6: SaaS Company Website & Onboarding.

[PASTE THE PROJECT CONTEXT SECTION ABOVE HERE]

Phases 1-5 are complete. The database is multi-tenant, branding is dynamic, features are toggleable, and gym admins have a full brand builder dashboard.

## Your Task

Build the platform-level marketing website and gym onboarding flow. This is what users see when they visit the root domain (e.g., `gymplatform.com` with no subdomain).

### Step 1: Platform Detection

Update the tenant resolution in `TenantContext.tsx`:

- If no subdomain is detected (user is on `gymplatform.com` or `localhost:5173`), set a flag: `isPlatformSite: true`
- The App component should render a DIFFERENT set of routes when `isPlatformSite` is true

```tsx
function AppContent() {
  const { isPlatformSite } = useTenant();

  if (isPlatformSite) {
    return <PlatformRoutes />;
  }

  return <GymRoutes />;  // existing gym-specific routes
}
```

### Step 2: Platform Marketing Homepage

Create `src/pages/platform/PlatformHome.tsx`:

A clean, modern SaaS marketing page with sections:

1. **Hero Section**
   - Headline: "The all-in-one platform for gyms & fitness studios"
   - Subtitle: "Launch your professional gym website in minutes. Class booking, WOD programming, coach profiles, payments — all customisable to your brand."
   - CTA buttons: "Get Started Free" and "See Demo"
   - Hero image/mockup showing the platform on various devices

2. **Features Grid**
   - Show all 9 features with icons, names, descriptions
   - "£10/month per feature — only pay for what you use"

3. **How It Works**
   - Step 1: Sign up and name your gym
   - Step 2: Customise your brand (colors, logo, fonts)
   - Step 3: Toggle on the features you need
   - Step 4: Share your link and start growing

4. **Social Proof / Testimonials** (placeholder section)

5. **Pricing Section**
   - Simple pricing: "£10/month per feature"
   - Calculator: checkboxes for features with running total
   - "No contracts. Cancel anytime. Only pay for what you use."

6. **Footer**
   - Platform branding, links, legal

### Step 3: Platform Auth

Create `src/pages/platform/PlatformLogin.tsx` and `PlatformSignup.tsx`:

- Platform-level login for gym owners
- Signup creates a new user AND starts the onboarding flow
- These use Supabase Auth but WITHOUT a gym_id (platform-level accounts)

### Step 4: Onboarding Wizard

Create `src/pages/platform/Onboarding.tsx`:

A multi-step wizard that guides new gym owners through setup:

**Step 1: Gym Basics**
- Gym name (required)
- Auto-generates slug from name (editable, with availability check)
- Contact email (pre-filled from auth)
- Phone (optional)

On submit: Creates the `gyms` record and `gym_branding` with defaults.

**Step 2: Brand Your Gym**
- Embed a simplified version of the BrandingEditor from Phase 5
- Logo upload
- Primary color picker (auto-generates palette)
- Light or dark theme
- "Skip for now" option

On submit: Updates `gym_branding`.

**Step 3: Choose Your Features**
- Show all 9 features as toggleable cards
- Running total: "3 features — £30/month"
- "You can change these anytime"
- Minimum 0 features (can run a basic info site for free)

On submit: Creates `gym_features` records.

**Step 4: Add Your Content**
- Quick-start content fields:
  - Hero headline
  - Hero subtitle
  - Add at least one program (name, description, level)
- "Skip for now" option

**Step 5: Preview & Launch**
- Full preview of their gym site with chosen branding
- "Your gym will be live at: comet.gymplatform.com"
- "Launch" button sets gym status to 'active'
- Confetti animation on launch 🎉
- Redirect to their new gym site

### Step 5: Platform Dashboard

Create `src/pages/platform/PlatformDashboard.tsx`:

After onboarding, gym owners land here when they log in at the platform level. Shows:
- Their gym(s) with quick links
- Monthly feature cost summary
- Quick actions: "Edit Branding", "Manage Features", "View Site"
- Link to the gym-specific admin dashboard

### Step 6: Platform Layout & Navigation

Create `src/components/platform/PlatformLayout.tsx`:
- Platform-specific navbar (different from gym navbars)
- Platform branding (the SaaS product's own brand, not any gym's)
- Clean, minimal design — think Vercel, Linear, Stripe dashboard style

### Step 7: Platform Routing

Create `src/routes/PlatformRoutes.tsx`:
```tsx
<Routes>
  <Route path="/" element={<PlatformHome />} />
  <Route path="/login" element={<PlatformLogin />} />
  <Route path="/signup" element={<PlatformSignup />} />
  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
  <Route path="/platform-dashboard" element={<ProtectedRoute><PlatformDashboard /></ProtectedRoute>} />
</Routes>
```

### Important Notes
- The platform site should have its OWN fixed branding (not dynamic) — clean, professional SaaS look
- The platform and gym sites share the same codebase but render completely different UIs based on whether a subdomain is present
- The onboarding wizard must feel smooth and fast — no unnecessary steps
- Every step of onboarding should be skippable (except gym name + slug)
- The platform site should be fully responsive
- Use the same Supabase instance — platform users are just users without a gym_id (or with a special platform role)
```

---

## PHASE 7: CrossFit Comet Re-Onboarding & Validation

### Prompt

```
You are working on a gym management SaaS platform conversion. This is PHASE 7: CrossFit Comet Re-Onboarding & Validation.

[PASTE THE PROJECT CONTEXT SECTION ABOVE HERE]

Phases 1-6 are complete. The entire SaaS platform is built: multi-tenant database, dynamic theming, feature toggles, gym admin dashboard, platform marketing site, and onboarding wizard.

## Your Task

Re-create CrossFit Comet as the FIRST tenant on the new platform. This validates the entire system and creates a seed/migration script that proves the onboarding flow works.

### Step 1: Create the Comet Seed Migration

Create `supabase/migrations/060_seed_crossfit_comet.sql`:

This migration recreates CrossFit Comet as a tenant with their exact original branding:

```sql
-- 1. Create the gym
INSERT INTO gyms (id, name, slug, status, contact_email, google_maps_embed_url)
VALUES (
  'GENERATE_UUID',
  'CrossFit Comet',
  'comet',
  'active',
  'info@crossfitcomet.com',
  'THE_ORIGINAL_MAPS_URL_FROM_ABOUT_PAGE'
);

-- 2. Set Comet's original branding (dark theme, orange accent)
INSERT INTO gym_branding (gym_id, color_bg, color_bg_light, color_bg_dark, color_surface, color_accent, color_accent2, color_secondary, color_secondary2, color_specialty, color_text, color_muted, color_header, color_footer, font_header, font_body, border_radius, theme_mode, hero_headline, hero_subtitle, cta_headline, cta_subtitle, about_mission)
VALUES (
  'COMET_GYM_ID',
  '#181820',          -- original dark bg
  '#2a2a38',          -- original light bg
  '#0f0f14',          -- original dark bg
  '#23232e',          -- original surface
  '#ff4f1f',          -- original orange accent
  '#ff1f4f',          -- original red accent
  '#00d4ff',          -- original cyan secondary
  '#00ff88',          -- original green secondary
  '#9d4edd',          -- original purple specialty
  '#ffffff',          -- white text
  '#888888',          -- muted gray
  '#ffffff',          -- header color
  '#ffffff',          -- footer color
  'Poppins',          -- original header font
  'Open Sans',        -- original body font
  '1rem',             -- original border radius
  'dark',             -- Comet uses dark theme
  'Welcome to CrossFit Comet',
  'Where strength meets community. Transform your fitness journey with expert coaching, world-class programming, and a supportive atmosphere.',
  'Ready to Start Your Journey?',
  'Join CrossFit Comet today and experience the difference. Your first class is free!',
  'At CrossFit Comet, we believe fitness is more than just a workout...'
);

-- 3. Enable ALL features for Comet (they had everything)
INSERT INTO gym_features (gym_id, feature_key, enabled, enabled_at) VALUES
  ('COMET_GYM_ID', 'class_booking', true, now()),
  ('COMET_GYM_ID', 'wod_programming', true, now()),
  ('COMET_GYM_ID', 'coach_profiles', true, now()),
  ('COMET_GYM_ID', 'day_passes', true, now()),
  ('COMET_GYM_ID', 'trial_memberships', true, now()),
  ('COMET_GYM_ID', 'service_booking', true, now()),
  ('COMET_GYM_ID', 'accounting_integration', true, now()),
  ('COMET_GYM_ID', 'coach_analytics', true, now()),
  ('COMET_GYM_ID', 'member_management', true, now());

-- 4. Seed Comet's programs (from original src/data/programs.ts)
-- Insert all 6 programs: CrossFit, Open Gym, Comet Plus, Specialty, Competition, Youth
-- Use the EXACT data from the original programs.ts and programDetails.ts files

-- 5. Seed Comet's schedule (from original src/data/schedule.ts)
-- Insert all 58 class slots with days, times, class names

-- 6. Seed Comet's stats (from original src/data/stats.ts)
-- Insert: "40+ Classes Per Week", "8 Certified Coaches" (or whatever the originals were)

-- 7. Seed Comet's membership types
INSERT INTO gym_memberships (gym_id, slug, display_name) VALUES
  ('COMET_GYM_ID', 'trial', 'Trial'),
  ('COMET_GYM_ID', 'crossfit', 'CrossFit'),
  ('COMET_GYM_ID', 'comet-plus', 'Comet Plus'),
  ('COMET_GYM_ID', 'open-gym', 'Open Gym'),
  ('COMET_GYM_ID', 'specialty', 'Specialty');

-- 8. Update existing data to belong to Comet
-- Set gym_id on all existing profiles, bookings, payments, etc.
UPDATE profiles SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE bookings SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE payments SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE workouts SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE trial_memberships SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE workout_bookings SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE coach_services SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE service_bookings SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE stripe_customers SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE accounting_integrations SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE accounting_account_mappings SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE accounting_sync_logs SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;
UPDATE accounting_synced_transactions SET gym_id = 'COMET_GYM_ID' WHERE gym_id IS NULL;

-- 9. NOW make gym_id NOT NULL on all tables (all data has been assigned)
ALTER TABLE profiles ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN gym_id SET NOT NULL;
-- ... repeat for all 13 tables
```

### Step 2: Validation Checklist

After running the migration, manually verify:

1. **Visit `comet.localhost:5173`** (or use `?tenant=comet`)
   - [ ] Site loads with Comet's dark theme and orange branding
   - [ ] Navbar shows "CrossFit Comet"
   - [ ] Hero shows original welcome message
   - [ ] Programs section shows all 6 programs
   - [ ] Stats show original numbers
   - [ ] Schedule page shows all class slots
   - [ ] Coaches page shows all coaches
   - [ ] WOD section works
   - [ ] Footer shows Comet copyright

2. **Auth flows work:**
   - [ ] Login with existing Comet accounts works
   - [ ] New member signup assigns gym_id automatically
   - [ ] Role-based access (member/coach/admin) still works

3. **Feature toggles work:**
   - [ ] Disable `wod_programming` → WOD section disappears from home
   - [ ] Disable `coach_profiles` → Coaches nav link and page disappear
   - [ ] Re-enable → everything comes back

4. **Branding customization works:**
   - [ ] Visit `/gym-admin` as gym owner
   - [ ] Change primary color → entire site updates
   - [ ] Change font → text updates
   - [ ] Upload a logo → navbar shows logo
   - [ ] Switch to light theme → site becomes light

5. **Multi-tenancy isolation:**
   - [ ] Create a second test gym via onboarding
   - [ ] Verify Comet data does NOT appear on the test gym
   - [ ] Verify test gym data does NOT appear on Comet

6. **Platform site works:**
   - [ ] Visit root domain (no subdomain) → see platform marketing site
   - [ ] Sign up → complete onboarding wizard
   - [ ] New gym site loads at chosen subdomain

### Step 3: Delete Old Static Data Files

Now that all data lives in the database, remove:
- `src/data/coaches.ts`
- `src/data/programs.ts`
- `src/data/programDetails.ts`
- `src/data/schedule.ts`
- `src/data/stats.ts`

Verify no imports reference these files. The `src/data/wod.ts` was already empty (WOD is database-driven).

Delete the entire `src/data/` directory.

### Step 4: Clean Up Seed Scripts

Update or remove:
- `scripts/seed-coaches.js` — no longer needed (coaches are per-gym in DB)
- `supabase/migrations/008_seed_coach_accounts.sql` — legacy, coaches are now onboarded per gym

### Step 5: Update Documentation

Update `README.md`:
- Remove all "CrossFit Comet" specific references
- Document the new multi-tenant architecture
- Add setup instructions for local development with tenant resolution
- Document the onboarding flow
- List all available features

### Important Notes
- The Comet seed migration is the PROOF that the entire system works
- If Comet's site looks and behaves exactly like it did before the conversion, the platform is working
- CrossFit Comet should be indistinguishable from its original single-tenant version
- Any other gym going through onboarding should get the same quality experience
- This phase is primarily about data migration and validation, minimal new code
```

---

## Usage Instructions

### How to use these prompts:

1. Start a new Claude conversation for each phase
2. Paste the **Project Context** section at the top of EVERY prompt
3. Paste the specific **Phase prompt** below it
4. Complete each phase fully before moving to the next
5. After each phase, verify the changes work before proceeding

### Phase Dependencies:
```
Phase 1 (Database)
  └── Phase 2 (Tenant Context + White-Label)
       └── Phase 3 (Theme Engine + SCSS)
            └── Phase 4 (Feature Toggles)
                 └── Phase 5 (Admin Dashboard)
                      └── Phase 6 (Platform Site + Onboarding)
                           └── Phase 7 (Comet Re-onboarding + Validation)
```

### Estimated Scope:
- Phase 1: ~1 large migration file, 2-3 helper functions
- Phase 2: ~4 new files, ~23 files modified
- Phase 3: ~35 SCSS files modified, 1-2 new files
- Phase 4: ~1 new config file, ~15 files modified with FeatureGates
- Phase 5: ~8-10 new component files, 1 new page
- Phase 6: ~6-8 new page/component files, routing changes
- Phase 7: ~1 migration file, cleanup of ~8 old files
