# Technical Upgrade Plan — noSweatFitness

**Audience:** Claude Opus, executing safe technical upgrades on this codebase.
**Goal:** Remove duplication, fix latent bugs, and adopt better patterns **without changing the site's behaviour or visual design.**
**Author:** Generated from a full read-only audit (frontend duplication, SCSS/design tokens, services/API). Every item below cites real `file:line` evidence.

---

## 0. Rules of engagement (read first, every time)

These are hard constraints. Breaking any of them fails the task.

1. **Do not change visual design or behaviour.** These are refactors. After each change, the rendered output must look and behave identically. The only exception is fixing the **undefined CSS tokens** (Phase 2), which currently render as broken/inherited values — there the goal is to make them render *correctly* and you must verify the result looks right in both themes.
2. **Two theming contexts exist.** Per `CLAUDE.md`: the **platform** site (`/*`, dark theme via `$platform-*` SCSS vars + `--color-*` overridden dark) and **gym** sites (`/gym/:slug/*`, per-tenant `--color-*`). Any shared component/token change must be checked in **both** contexts.
3. **One small PR per phase (or per sub-item for risky ones).** Branch from `develop`: `fix/<name>` or `feature/<name>` → PR into `develop` → after CI green, merge `develop` → `main`. Use explicit merge commits. **Never reference Claude/AI/"Co-Authored-By" in commit messages. Never use em dashes** in commits or user-facing copy — use hyphens.
4. **Keep lint at 0 errors.** Run `docker-compose exec -T frontend npm run lint` and `docker-compose exec -T frontend npm run build` before every commit. No `console.log`/`console.debug` in `src/` (warn/error for real failures only). `noUnusedLocals` is on, so remove dead code you create.
5. **Verify visually for any UI-touching change.** The repo has Playwright at `node_modules/.bin/playwright`. Drive the affected page at desktop (1280) and mobile (390) widths and screenshot before/after. Local dev: Docker stack on `:5173`/`:3001` + local Supabase `:54321`. A confirmed local test user is `cardtest@example.com` / `TestPass123!` (owns the `comet` gym locally).
6. **Backend boundary:** code in `api/` must never import from `src/`; use `process.env`, the shared `api/lib/*` singletons (`supabase`, `stripe`, `auth` `verifyAuth`/`assertMethod`, `sentry` `captureError`, `rateLimit` `checkRateLimit`).
7. **DB changes = a new numbered migration** in `supabase/migrations/` (write the file; CI applies it on merge to main). Most of this plan needs **no** DB changes.
8. **Update `README.md` / `CLAUDE.md`** if you rename/move things they reference.

**Suggested order:** Phase 1 (correctness) → Phase 2 (broken tokens) → Phase 3 (shared utils) → Phase 6 (SCSS hygiene) → Phase 4 (component extraction) → Phase 5 (services) → Phase 7 (types). Phases are independent; ship each before starting the next.

---

## Phase 1 — Correctness fixes (backend, highest priority, zero design risk)

### 1.1 — CRITICAL: member-subscription webhook uses unsafe `current_period_end`
- **File:** `api/webhooks/stripe.ts:469-470` (inside `handleSubscriptionUpdated`, the member-subscription branch).
- **Problem:** It does `new Date(subscription.current_period_end * 1000).toISOString()` and `...current_period_start...`. In the pinned Stripe API version these top-level fields are `undefined` (they moved onto `subscription.items.data[0]`), so `new Date(undefined * 1000).toISOString()` throws `RangeError`, the handler returns 500, and Stripe retries forever. The **platform** path was already fixed in this codebase using the helper `subscriptionPeriodEnd(subscription)` at lines 241-244 (used at 302 and 433).
- **Fix:**
  - Replace line 470 with `current_period_end: subscriptionPeriodEnd(subscription),`.
  - For `current_period_start` (line 469), add a sibling helper `subscriptionPeriodStart(subscription)` mirroring `subscriptionPeriodEnd` (read `subscription.items?.data?.[0]?.current_period_start ?? subscription.current_period_start`, guard for null), or inline the same item-first fallback. Do **not** leave the raw top-level read.
  - While here, the `console.log` on line 474 contains an em dash (`—`); change it to a hyphen to satisfy the no-em-dash rule.
- **Risk:** None to design. Pure correctness.
- **Verify:** `npm run build`. Optionally simulate: create a real test subscription via the Stripe test key, sign a `customer.subscription.updated` event for it, POST to the local webhook with the forwarder running (`stripe listen --api-key <sk_test> --forward-to localhost:3001/api/webhooks/stripe`), and confirm a `200` and no thrown error. (This mirrors how the platform path was validated.)

### 1.2 — Add `captureError` to API catch blocks that lack it
- **Problem:** Per `CLAUDE.md` new handlers should `await captureError(err, { endpoint })` in their catch. These payment/subscription/connect/domain handlers don't:
  - `api/subscriptions/cancel-subscription.ts` (catch ~79-85)
  - `api/subscriptions/create-gym-subscription.ts` (~167-173)
  - `api/subscriptions/create-checkout-session.ts` (~31-38)
  - `api/subscriptions/session-status.ts` (~22-28)
  - `api/connect/onboarding-link.ts` (~51-57)
  - `api/connect/dashboard-link.ts` (~44-50)
  - `api/payments/refund-service-booking.ts` (~109-115)
  - `api/domains/add.ts` (~132-135)
- **Fix:** In each catch, before the 500 response, add `await captureError(error, { endpoint: '<dir>/<name>' });` and import `captureError` from `../lib/sentry.js`. Sentry is a no-op without a DSN, so this is safe.
- **Risk:** None. **Verify:** `npm run build`.

### 1.3 — Add rate limiting to abuse-prone creation endpoints
- **Problem:** `create-payment-intent` / `create-setup-intent` / `create-service-payment-intent` already call `checkRateLimit()` (good examples at `api/payments/create-payment-intent.ts:58-60`). These don't:
  - `api/subscriptions/create-gym-subscription.ts`, `api/subscriptions/cancel-subscription.ts`, `api/subscriptions/create-checkout-session.ts`
  - `api/connect/create-account.ts`, `api/connect/onboarding-link.ts`, `api/connect/dashboard-link.ts`
- **Fix:** After `verifyAuth` (or after extracting an identifier for the unauthenticated `create-checkout-session`), add the same `checkRateLimit` guard pattern already used in the payment endpoints (copy the exact shape/limits from `create-setup-intent.ts`). Keep limits generous (these are legitimate but should not be hammerable).
- **Risk:** Low; mirror existing, proven usage. **Verify:** `npm run build`; manually hit an endpoint in a loop locally and confirm a `429` after the threshold.

**Phase 1 done when:** webhook helper used for member path, all listed catches call `captureError`, all listed creation endpoints rate-limited, lint + build green.

---

## Phase 2 — Fix undefined CSS variables (broken tokens → correct tokens)

These tokens are **referenced but never defined** (not in `src/styles/_variables.scss`, no `:root`/`.platformLayout` override). They currently resolve to nothing/inherited, so these panels render with wrong/fallback colours. This was already fixed for the four payment forms this way; repeat the exact approach.

**The real defined token set** (in `_variables.scss`, each with an `-rgb` sibling): `--color-bg`, `--color-bg-light`, `--color-bg-dark`, `--color-surface`, `--color-accent`, `--color-secondary`, `--color-specialty`, `--color-text`, `--color-muted`, `--color-header`, `--color-footer`. There are **no status colours** (success/error/warning/info) — add them.

### 2.1 — Add status tokens to `_variables.scss`
Add to the `:root` block (light defaults), with `-rgb` variants, and mirror appropriate dark values in the platform override (`PlatformLayout.module.scss` where the other `--color-*` are overridden):
```
--color-success: #22c55e;  --color-success-rgb: 34, 197, 94;
--color-error:   #ef4444;  --color-error-rgb:   239, 68, 68;
--color-warning: #f59e0b;  --color-warning-rgb: 245, 158, 11;
--color-info:    var(--color-accent); /* info == brand accent */
--color-border:  rgba(var(--color-text-rgb), 0.12); /* standard hairline border */
```
(These hexes match what the payment-form fix used: `#ef4444`, `#22c55e`.)

### 2.2 — Map the undefined tokens to real ones, file by file
**Files to fix (the complete list):**
- `src/pages/BookingConfirmation.module.scss` (the biggest offender — text/border/background/status tokens)
- `src/pages/CoachView.module.scss`
- `src/components/UserManagement/UserManagement.module.scss`
- `src/components/WeeklyVolume/WeeklyVolume.module.scss`
- `src/components/common/Select/Select.module.scss`

**Mapping table (apply consistently):**
| Undefined token | Replace with |
|---|---|
| `var(--text-primary)` | `var(--color-text)` |
| `var(--text-secondary)` | `var(--color-muted)` |
| `var(--text-tertiary)` | `var(--color-muted)` |
| `var(--background-secondary)` | `var(--color-bg-light)` |
| `var(--background-tertiary)` | `var(--color-bg-light)` (or `rgba(var(--color-accent-rgb), 0.08)` if it's a highlighted/price box — check context) |
| `var(--background-info)` | `rgba(var(--color-accent-rgb), 0.1)` |
| `var(--border-color)` | `var(--color-border)` (the new token) — for spinner rings use `var(--color-bg-light)` |
| `var(--border-info)` | `rgba(var(--color-accent-rgb), 0.3)` |
| `var(--primary)` | `var(--color-accent)` |
| `var(--info)` | `var(--color-accent)` |
| `var(--success)` / `--success-light` | `var(--color-success)` / `rgba(var(--color-success-rgb), 0.12)` |
| `var(--error)` | `var(--color-error)` |
| `var(--warning)` / `--warning-light` | `var(--color-warning)` / `rgba(var(--color-warning-rgb), 0.12)` |

**Context note for spinners:** several files do `border: 4px solid var(--border-color); border-top-color: var(--primary)`. Map to `border: 4px solid var(--color-bg-light); border-top-color: var(--color-accent)` (this is exactly what the existing day-pass spinner uses).

- **Risk:** Visual — these are currently broken, so the change is an improvement, but you MUST verify it looks right. **BookingConfirmation** is the post-payment screen (gym, dark theme) — drive `/gym/comet/booking-confirmation?bookingId=...` or inspect the component in isolation. **CoachView/UserManagement/WeeklyVolume** are admin/coach screens. Screenshot each before (broken) and after.
- **Verify:** build + Playwright screenshots of each affected page in its real theme context.

**Phase 2 done when:** zero `var(--text-primary|--primary|--border-color|...)` references remain in `src` (grep returns nothing), status tokens defined once, all five screens visually verified.

---

## Phase 3 — Extract shared utilities & hooks (kill duplication, zero behaviour change)

Each item: create the shared thing, replace the duplicates, delete the local copies. Verify identical behaviour.

### 3.1 — `src/config/pricing.ts`: day-pass price constant
- **Problem:** `1000` (pence) and the string `£10` are hardcoded in ~8 places: `DayPassPaymentModal.tsx:106,119`, `DayPassModal.tsx:84,~400,~558`, `Schedule.tsx:150,166`, `BookingConfirmation.tsx:180`.
- **Fix:** `export const DAY_PASS_PRICE_PENCE = 1000;` and a formatted helper (reuse the existing `formatCurrency`). Replace every literal. **Do not** change the displayed value.

### 3.2 — `src/utils/passwordValidation.ts` (+ `src/config/security.ts`)
- **Problem:** identical `validatePassword()` / `calculatePasswordStrength()` and the requirement constants (minLength 12, upper/lower/number/special) exist in both `AuthModal/AuthModal.tsx` (~48-56, 99-115) and `ProfileSettings/ProfileSettings.tsx` (~31-39, 42-58).
- **Fix:** Move the functions to `src/utils/passwordValidation.ts` and the rules to `src/config/security.ts` (`PASSWORD_REQUIREMENTS`). Import in both. Behaviour must be byte-identical.

### 3.3 — `src/utils/dateFormatting.ts`
- **Problem:** local `formatDate`/`formatTime` reimplemented in `ServicePaymentForm.tsx:88-104`, `AccountingIntegration/SyncDashboard.tsx:56`, `GymAdmin/PlatformBillingPanel.tsx:11`, with inconsistent locales (en-US vs en-GB).
- **Fix:** `formatDate(iso, opts?)`, `formatTime(...)`, `formatDateTime(...)` with a single default locale from `src/config/locale.ts` (`DEFAULT_LOCALE = 'en-GB'`). Replace local copies. **Caution:** keep each call site's *output* the same — if one used en-US deliberately, preserve that via an arg rather than silently changing it.

### 3.4 — `src/hooks/useClickOutside.ts`
- **Problem:** the same click-outside + Escape listener appears in `Navbar.tsx:133-146`, `common/Select/Select.tsx:31-53`, `common/InfoTooltip/InfoTooltip.tsx:136-166`.
- **Fix:** `useClickOutside(ref, onClose, { closeOnEscape = true })`. Replace the three implementations. Verify dropdowns/tooltips still close on outside-click and Escape.

### 3.5 — `src/utils/classType.ts`
- **Problem:** class-type detection (`includes('crossfit')`, `'open gym'`, `'specialty')`, plus the genericised `'group training'` added recently) is duplicated in `Schedule.tsx:85-111` (`getClassTypeStyle`, `getBadgeForClassType`) and `DayPassModal.tsx:276-301` (`isCrossFitClass`, `getClassTypes`, `getClassTypeStyle`).
- **Fix:** Centralise the taxonomy and the helpers. Keep a `CLASS_TYPES` constant (`src/config/classTypes.ts`) and pure functions that take a class name + return style key / badge. **Important:** the badge label and legend already adapt for the demo gym (`isDemoGym` → `GT`/`Group Training`); preserve that behaviour by passing a flag into the helper rather than hardcoding. Do not regress the demo genericisation.

### 3.6 — `src/hooks/useStripePayment.ts` (the big DRY win)
- **Problem:** four components repeat the same Stripe flow (`elements.getElement(CardNumberElement)` → `confirmCardPayment`/`confirmCardSetup` → error via `handlePaymentError` → processing state → success callback): `DayPassModal.tsx:55`, `DayPassPaymentModal.tsx:61`, `ServicePaymentForm.tsx:72`, `StripeCardSetupForm.tsx:45`.
- **Fix:** `useStripePayment({ mode: 'payment' | 'setup', clientSecret, onSuccess, onError })` returning `{ submit, isProcessing }`. Each form keeps its own JSX (`<CardFields />` already shared) but calls the hook. **Risk: medium** — this is the live payments path. Do it as its own PR. Verify end-to-end with the local Stripe webhook forwarder for at least the day-pass flow (drive the browser, type `4242 4242 4242 4242`, confirm `succeeded` and the booking confirmation). Do **not** merge to main without a green local end-to-end run.

**Phase 3 done when:** each util/hook exists, all duplicate copies removed (`noUnusedLocals` passes), behaviour verified, lint + build green.

---

## Phase 4 — Component extraction (medium risk, do after Phase 3)

### 4.1 — `<NavBrand />` and shared icon components
- **Problem:** `Navbar.tsx` renders the logo/name block twice (desktop ~168-177, mobile ~401-410) and the logout SVG twice (~374-378, ~531-535). The "secure payment" lock SVG and other icons are re-inlined across payment/auth components.
- **Fix:** Extract `<NavBrand className?>` used in both navbar spots. Create `src/components/common/icons/` with `<LogoutIcon/>`, `<SecurityIcon/>`, `<GlobeIcon/>` etc., and replace inline duplicates. Pure markup move — pixel-identical.

### 4.2 — Split `AuthModal.tsx` (1217 lines)
- **Problem:** one 1217-line file holds login, signup+validation, reset-password, change-password, plus security logic (compromise check, honeypot, rate limiting).
- **Fix:** Extract `<LoginForm/>`, `<SignupForm/>`, `<ResetPasswordForm/>`, `<ChangePasswordForm/>` into `src/components/AuthModal/` subfiles; move security helpers to hooks/utils (reuse Phase 3.2). The modal becomes a thin switch. **Risk: medium-high** (auth is critical). Keep each extracted form's logic identical; verify every flow (login, signup, reset, change) manually. Separate PR.

### 4.3 — Consider splitting `ProfileSettings.tsx` (500) and `WODEditorEnhanced.tsx` (548)
- Lower priority. Extract `<PasswordChangeForm/>` from ProfileSettings (reuses Phase 3.2). Only split WODEditorEnhanced if a clean subcomponent boundary exists; otherwise leave it.

---

## Phase 5 — Centralise data access in services (medium risk)

The app mixes `src/services/*`, direct `supabase.from(...)` in components, and raw `fetch()`. Standardise.

### 5.1 — New services for repeated tables
- `gym_features` is queried/mutated in `TenantContext.tsx:304`, `FeatureTogglePanel.tsx:122`, `BrandingEditor.tsx:285`, `Onboarding.tsx:266` → create `src/services/gymFeaturesService.ts` (`getFeaturesForGym`, `toggleFeature`, `initializeFeatures`).
- `gym_branding` in `TenantContext.tsx:299`, `BrandingEditor.tsx:207`, `Onboarding.tsx:225` → `src/services/gymBrandingService.ts` (`getBranding`, `updateBranding`).
- Route the component-level direct queries (`trial_memberships` polling in `StripeCardSetupForm.tsx:65-69`, `service_bookings` in `ServiceBookingModal.tsx:196`, profile counts in `GettingStarted.tsx:27-29`, `TrialBanner.tsx:43-50`) through services.
- **Caution:** `TenantContext` fetches 6 tables in one `Promise.all` for performance — keep that pattern; the services are for the *other* call sites, not for slowing the context down.

### 5.2 — Replace raw `fetch()` with `authFetch`
- `StripeCardSetupForm.tsx:160` and `ServiceBookingModal.tsx:105` call `/api/...` with hand-built `fetch` + headers. Use `authFetch` from `src/lib/auth.ts` (handles the bearer token + error). Verify the request bodies/responses are unchanged.

**Risk:** medium (touches payment setup + booking). One service per PR; verify the relevant flow each time.

---

## Phase 6 — SCSS hygiene (low risk, high tidiness)

### 6.1 — Migrate deprecated `@import` → `@use ... as *`
- **14 files** still use `@import '.../variables'` (Sass 3 will remove it). Full list: `CoachProfileEditor`, `UserManagement`, `WODEditor/WODEditorEnhanced`, `WODEditor/MovementBuilder`, `CoachAnalytics`, `common/Select`, `common/InfoTooltip`, `ServiceBookingModal`, `WeeklyVolume`, `AccountingIntegration`, `DayPassModal`, `TrialModal`, `pages/CoachView`, `pages/Schedule` (all `.module.scss`).
- **Fix:** Replace line 1 with `@use '<relative>/styles/variables' as *;` (match the existing relative depth). Mechanical; build will fail loudly if a path is wrong.

### 6.2 — Use the mixins instead of re-implementing them
- `_mixins.scss` provides `glass`, `glass-elevated`, `glass-dense`, `gradient-border`, `light-refraction`, `hover-lift`. Re-implemented inline in: `common/GlassCard/GlassCard.module.scss:13-31` (gradient-border) and `:34-48` (light-refraction) — replace with `@include`. `common/Select`, `Navbar`, `common/Modal` hand-roll `backdrop-filter` blur — switch to `@include glass(...)`. **Verify the blur/border look identical** (mixin params may differ slightly; tune to match).

### 6.3 — Hardcoded colours → tokens (do last, carefully)
- Worst offenders: `CoachAnalytics.module.scss` (~99 literals), `CoachDashboard`, `Dashboard`, `AccountingIntegration`, `ProfileSettings`, `BrandingEditor`. Many are **data-viz/status** colours (chart greens/blues) — those are legitimately fixed and may stay, but app-chrome colours (`rgba(255,255,255,...)` surfaces/borders, brand colours) should use `var(--color-*)` so they theme. **This is judgement-heavy; do per-file, screenshot-verify, and leave intentional chart palettes alone.** Lowest priority.

### 6.4 — One class-naming violation
- `CoachAnalytics.module.scss:367` `&.small` → rename to a semantic name (e.g. `.chartCompact`) and update the consumer. Trivial.

---

## Phase 7 — Type consolidation (low risk)

- Booking shapes are defined in `src/types/index.ts:40-53` plus `classBookingService.ts:3-15`, `wodBookingService.ts:3-24`, `coachServicesService.ts:19-40`, and a local `BookingDetails` in `ServicePaymentForm.tsx`. Coach shapes in `types/index.ts:3-11`, `coachProfileService.ts:4-20`, `coachServicesService.ts:5-17`.
- **Fix:** Consolidate canonical shapes into `src/types/` with clear names (`Booking`, `ClassBooking`, `WorkoutBooking`, `ServiceBooking`, `Coach`, `CoachProfile`, `CoachService`); have services import them. Don't merge genuinely-different shapes — only de-duplicate identical ones. TypeScript will flag mismatches; let the compiler guide you.
- Also check `src/services/index.ts` for a possibly-unused `subscriptionService` export and remove if truly unimported (grep first).

---

## Per-phase checklist (use for every PR)

- [ ] Branched from up-to-date `develop`.
- [ ] Behaviour/visual unchanged (or, for Phase 2, verified-correct in both themes).
- [ ] All duplicate copies removed; no new dead code (`noUnusedLocals`).
- [ ] `npm run lint` → 0 errors; `npm run build` → green.
- [ ] UI-touching change: Playwright screenshots desktop + mobile, before/after.
- [ ] Payment-touching change (3.6, 5.x): local end-to-end with the Stripe webhook forwarder, card `4242 4242 4242 4242`, confirmed `succeeded` + booking.
- [ ] Commit message follows convention (prefix, no em dash, no AI mention).
- [ ] PR → `develop`; CI green; merge `develop` → `main`.
- [ ] `README.md` / `CLAUDE.md` updated if anything they reference moved.

## Impact summary

| Phase | Type | Risk | Why it matters |
|---|---|---|---|
| 1 | Correctness | none-low | Fixes a real webhook crash + observability + abuse protection on live payments |
| 2 | Bug (visual) | low | 5 screens currently render with broken/undefined colours |
| 3 | Duplication | low | One source of truth for price, password rules, dates, click-outside, class types, Stripe flow |
| 4 | Structure | medium | 1217-line AuthModal + duplicated nav/icons |
| 5 | Architecture | medium | Consistent data access; fewer scattered queries/fetches |
| 6 | SCSS hygiene | low | Removes deprecated `@import`, reuses mixins, themable colours |
| 7 | Types | low | De-duplicated, canonical domain types |

**Start with Phase 1.1 — it's a live bug.**
