/**
 * db:push-data - copy LOCAL data UP to PROD.  *** DANGEROUS ***
 *
 * This overwrites production data. Guardrails:
 *   1. Requires typing the literal word PROD to proceed.
 *   2. Takes a full prod backup (schema + data) to backups/ BEFORE writing.
 *   3. Pushes PUBLIC app tables only. auth.users and storage are NOT pushed
 *      (overwriting real login accounts / uploaded files with local copies is
 *      almost never what you want). There is intentionally no flag to push them.
 *
 *   npm run db:push-data
 *
 * Required in .env.local: SUPABASE_DB_PASSWORD (prod db password).
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import readline from 'readline';
import {
  REPO_ROOT, LOCAL_CONN, prodConn, prodUrl, assertContainerRunning,
  pgDump, psqlExec, psqlQuery, truncateSchemaSql, timestamp,
} from './lib/db-sync.js';

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((r) => rl.question(question, r));
  rl.close();
  return answer.trim();
}

async function main() {
  assertContainerRunning();

  console.log('⬆️  db:push-data - LOCAL -> PROD  (DESTRUCTIVE)');
  console.log(`   prod: ${prodUrl()}`);
  console.log('   Public app tables will be REPLACED with your local data.');
  console.log('   auth.users and storage are NOT pushed.\n');

  const typed = await ask('Type PROD (uppercase) to continue: ');
  if (typed !== 'PROD') {
    console.log('Aborted (confirmation not matched).');
    process.exit(0);
  }

  const prod = prodConn();

  // 1. Backup prod first (schema + data) so this is recoverable.
  const backupDir = join(REPO_ROOT, 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, `prod-backup-${timestamp()}.sql`);
  console.log(`\n• Backing up prod -> ${backupFile} ...`);
  const backup = pgDump(prod, ['--no-owner']);
  writeFileSync(backupFile, backup);
  console.log(`  ✅ backup written (${(backup.length / 1024 / 1024).toFixed(1)} MiB)`);

  // 2. Dump local public data.
  console.log('• Dumping local public data...');
  const localDump = pgDump(LOCAL_CONN, ['--data-only', '--disable-triggers', '--no-owner', '--schema=public']);

  // 3. Clear prod public data, then load local rows.
  console.log('• Clearing prod public data...');
  const truncatePublic = truncateSchemaSql(prod, 'public');
  if (truncatePublic) psqlExec(prod, truncatePublic, { stopOnError: false });

  console.log('• Loading local data into prod...');
  psqlExec(prod, localDump, { stopOnError: false });

  const gymCount = psqlQuery(prod, 'select count(*) from public.gyms;');
  console.log(`\n✅ db:push-data complete. Prod now has ${gymCount} gym(s).`);
  console.log(`   Restore from ${backupFile} if needed.`);
}

main().catch((err) => {
  console.error('\n❌ db:push-data failed:', err.message);
  process.exit(1);
});
