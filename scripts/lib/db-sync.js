/**
 * Shared helpers for the data-sync scripts (db:pull / db:push-data).
 *
 * Design: all Postgres dump/restore runs through the LOCAL Supabase database
 * container's bundled pg_dump/psql, so the host needs no Postgres client tools.
 * The same container reaches prod over the session pooler (internet), so one
 * toolchain handles both sides. Prod credentials come from .env.local.
 */
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, '..', '..');

// Load .env.local first (source of truth for local dev), then .env as fallback.
dotenv.config({ path: join(REPO_ROOT, '.env.local') });
dotenv.config({ path: join(REPO_ROOT, '.env') });

// Local Supabase DB container (named from supabase/config.toml project_id "nosweat").
export const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER || 'supabase_db_nosweat';

// Connection string for the LOCAL db as seen from INSIDE the container.
export const LOCAL_CONN = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

const MAX_BUFFER = 1024 * 1024 * 1024; // 1 GiB - dev DBs are small

export function prodRef() {
  if (process.env.SUPABASE_PROD_PROJECT_REF) return process.env.SUPABASE_PROD_PROJECT_REF;
  const refFile = join(REPO_ROOT, 'supabase', '.temp', 'project-ref');
  if (existsSync(refFile)) return readFileSync(refFile, 'utf8').trim();
  throw new Error('No prod project ref: set SUPABASE_PROD_PROJECT_REF in .env.local or run `supabase link`.');
}

export function prodUrl() {
  return process.env.SUPABASE_PROD_URL || `https://${prodRef()}.supabase.co`;
}

/** Prod connection string via the IPv4 session pooler (matches scripts/run-sql.js). */
export function prodConn() {
  const pw = process.env.SUPABASE_DB_PASSWORD;
  if (!pw) throw new Error('Set SUPABASE_DB_PASSWORD (prod database password) in .env.local');
  const host = process.env.SUPABASE_PROD_POOLER_HOST || 'aws-1-eu-north-1.pooler.supabase.com';
  const port = process.env.SUPABASE_PROD_POOLER_PORT || '5432';
  return `postgresql://postgres.${prodRef()}:${encodeURIComponent(pw)}@${host}:${port}/postgres?sslmode=require`;
}

export function assertContainerRunning() {
  try {
    execFileSync('docker', ['inspect', '-f', '{{.State.Running}}', DB_CONTAINER], { stdio: 'pipe' });
  } catch {
    throw new Error(`Local DB container "${DB_CONTAINER}" is not running. Start it with: npm run db:start`);
  }
}

/** Run pg_dump inside the container against `conn`, returning the SQL as a Buffer. */
export function pgDump(conn, args) {
  return execFileSync(
    'docker',
    ['exec', DB_CONTAINER, 'pg_dump', conn, ...args],
    { maxBuffer: MAX_BUFFER }
  );
}

/** Pipe SQL (Buffer/string) into psql inside the container against `conn`. */
export function psqlExec(conn, sql, { stopOnError = true } = {}) {
  const flags = ['-v', `ON_ERROR_STOP=${stopOnError ? 1 : 0}`];
  return execFileSync(
    'docker',
    ['exec', '-i', DB_CONTAINER, 'psql', conn, ...flags, '-f', '-'],
    { input: sql, maxBuffer: MAX_BUFFER, stdio: ['pipe', 'inherit', 'inherit'] }
  );
}

/** Run a single query inside the container and return trimmed stdout. */
export function psqlQuery(conn, query) {
  return execFileSync(
    'docker',
    ['exec', DB_CONTAINER, 'psql', conn, '-tAc', query],
    { maxBuffer: MAX_BUFFER }
  ).toString().trim();
}

/** Build a TRUNCATE ... CASCADE statement for every base table in a schema. */
export function truncateSchemaSql(conn, schema) {
  const names = psqlQuery(
    conn,
    `SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
       FROM pg_tables WHERE schemaname = '${schema}';`
  );
  if (!names) return null;
  return `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`;
}

export function timestamp() {
  // Local-time compact stamp: YYYYMMDD-HHMMSS
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15).replace(/(\d{8})(\d{6})/, '$1-$2');
}
