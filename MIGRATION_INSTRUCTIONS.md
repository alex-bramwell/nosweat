# How to Run the Database Migration

## The Problem
Your database has some tables but is missing critical ones like `payments`, which the accounting integration depends on.

## Solution
Run the `fix_missing_tables.sql` migration directly in Supabase SQL Editor:

### Steps:

1. **Open Supabase SQL Editor:**
   - Go to https://supabase.com/dashboard/project/woyupptawdfhzrfzksgb/sql

2. **Open the migration file:**
   - Open `supabase/migrations/fix_missing_tables.sql` in your code editor
   - Select ALL text (Ctrl+A or Cmd+A)
   - Copy it (Ctrl+C or Cmd+C)

3. **Paste into SQL Editor:**
   - Paste the entire content into the Supabase SQL Editor
   - Click "Run" button

4. **Check the output:**
   - Look for NOTICE messages showing what was created:
     - "Created stripe_customers table"
     - "Created payments table"
     - "Created accounting_integrations table"
     - etc.
   - You should see "✅ Migration complete!" at the end

## What This Migration Does

It safely adds all missing tables without duplicating anything:

**Base Tables (needed for payments):**
- stripe_customers
- bookings
- payments ← **CRITICAL for accounting**
- trial_memberships
- workout_bookings

**Payment Fields:**
- Adds payment tracking to service_bookings (if table exists)

**Accounting Tables (for QuickBooks/Xero integration):**
- accounting_integrations (stores encrypted OAuth tokens)
- accounting_account_mappings (maps revenue categories to Chart of Accounts)
- accounting_sync_logs (audit trail)
- accounting_synced_transactions (idempotency tracking)
- accounting_encryption_keys (key rotation)

**Accounting Fields:**
- Adds accounting_synced_qb, accounting_synced_xero to payments table

## Why Not Use the Script?

The `run-sql.js` script splits SQL by semicolons, which breaks DO blocks (PL/pgSQL procedural blocks). The Supabase SQL Editor handles these correctly.

## Next Steps After Migration

Once the migration succeeds, we can:
1. Test the OAuth connect endpoint
2. Build the admin UI for account integration
3. Implement the sync engine
