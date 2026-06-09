/**
 * db:pull - copy PROD data into the LOCAL Supabase database (and Storage).
 *
 * Safe direction: only the LOCAL database is written. It DOES replace your local
 * data with prod's, so local dev mirrors production.
 *
 *   npm run db:pull                # app tables + auth users + storage
 *   npm run db:pull -- --yes       # skip the confirmation prompt
 *   npm run db:pull -- --no-auth   # skip auth.users
 *   npm run db:pull -- --no-storage
 *   npm run db:pull -- --no-reset  # don't rebuild local schema first
 *
 * Required in .env.local: SUPABASE_DB_PASSWORD (prod db password),
 * SUPABASE_PROD_SERVICE_KEY (for storage). Prod ref is read from
 * supabase/.temp/project-ref unless SUPABASE_PROD_PROJECT_REF is set.
 */
import { execFileSync } from 'child_process';
import readline from 'readline';
import {
  LOCAL_CONN, prodConn, prodUrl, assertContainerRunning,
  pgDump, psqlExec, truncateSchemaSql,
} from './lib/db-sync.js';
import { syncStorage } from './lib/storage-sync.js';

const args = new Set(process.argv.slice(2));
const opt = (f) => args.has(f);

async function confirm(question) {
  if (opt('--yes')) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((r) => rl.question(question, r));
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

async function main() {
  assertContainerRunning();
  const prod = prodConn();

  console.log('⬇️  db:pull - PROD -> LOCAL');
  console.log(`   prod: ${prodUrl()}`);
  console.log('   This REPLACES your local database data with prod.\n');
  if (!(await confirm('Continue? [y/N] '))) {
    console.log('Aborted.');
    process.exit(0);
  }

  const includeAuth = !opt('--no-auth');
  const includeStorage = !opt('--no-storage');

  // 1. Dump prod data (data-only; --disable-triggers bypasses FK ordering on restore).
  console.log('\n• Dumping prod public data...');
  const publicDump = pgDump(prod, ['--data-only', '--disable-triggers', '--no-owner', '--schema=public']);

  let authDump = null;
  if (includeAuth) {
    console.log('• Dumping prod auth users...');
    authDump = pgDump(prod, [
      '--data-only', '--disable-triggers', '--no-owner',
      '-t', 'auth.users', '-t', 'auth.identities',
    ]);
  }

  // 2. Rebuild local schema from migrations (clean, matches prod).
  if (!opt('--no-reset')) {
    console.log('• Resetting local schema (supabase db reset)...');
    execFileSync('npx', ['supabase', 'db', 'reset'], { stdio: 'inherit' });
  }

  // 3. Clear local data so prod rows load without PK conflicts (seed migrations, etc.).
  console.log('• Clearing local data...');
  if (includeAuth) {
    psqlExec(LOCAL_CONN, 'TRUNCATE TABLE auth.users RESTART IDENTITY CASCADE;', { stopOnError: false });
  }
  const truncatePublic = truncateSchemaSql(LOCAL_CONN, 'public');
  if (truncatePublic) psqlExec(LOCAL_CONN, truncatePublic, { stopOnError: false });

  // 4. Restore: auth first (public.profiles FK references auth.users), then public.
  if (authDump) {
    console.log('• Restoring auth users into local...');
    psqlExec(LOCAL_CONN, authDump, { stopOnError: false });
  }
  console.log('• Restoring public data into local...');
  psqlExec(LOCAL_CONN, publicDump, { stopOnError: false });

  // 5. Storage.
  if (includeStorage) {
    console.log('• Syncing storage objects (prod -> local)...');
    await syncStorage({
      fromUrl: prodUrl(),
      fromKey: process.env.SUPABASE_PROD_SERVICE_KEY,
      toUrl: 'http://127.0.0.1:54321',
      toKey: process.env.SUPABASE_SERVICE_KEY,
    });
  }

  console.log('\n✅ db:pull complete. Local now mirrors prod.');
}

main().catch((err) => {
  console.error('\n❌ db:pull failed:', err.message);
  process.exit(1);
});
