import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import dns from 'dns';

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function main() {
  const sqlFile = process.argv[2] || 'scripts/fix-trigger-and-seed.sql';
  console.log(`Running SQL from: ${sqlFile}\n`);

  const sql = readFileSync(sqlFile, 'utf8');

  if (!process.env.DATABASE_PASSWORD) {
    console.log('Please provide DATABASE_PASSWORD:');
    console.log(`  DATABASE_PASSWORD=yourpassword node scripts/run-sql.js`);
    process.exit(1);
  }

  const { default: pg } = await import('pg');

  // Session pooler connection (IPv4 compatible)
  const connectionConfigs = [
    {
      name: 'Session Pooler (eu-north-1)',
      config: {
        host: 'aws-1-eu-north-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: process.env.DATABASE_PASSWORD,
        ssl: { rejectUnauthorized: false }
      }
    }
  ];

  let connected = false;
  let client;

  for (const conn of connectionConfigs) {
    console.log(`Trying ${conn.name}...`);
    client = new pg.Client(conn.config);

    try {
      await client.connect();
      console.log(`✅ Connected via ${conn.name}\n`);
      connected = true;
      break;
    } catch (err) {
      console.log(`   Failed: ${err.message}`);
      try { await client.end(); } catch {}
    }
  }

  if (!connected) {
    console.log('\n❌ Could not connect to database.');
    console.log(`\nPlease run manually at:`);
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql`);
    process.exit(1);
  }

  console.log('Running SQL statements...\n');

  // Split and run statements
  const statements = sql
    .replace(/--.*$/gm, '') // Remove comments
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

    try {
      const res = await client.query(stmt);
      console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);

      if (res.rows && res.rows.length > 0 && res.rows.length < 20) {
        console.table(res.rows);
      }
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}... (already exists)`);
      } else {
        console.log(`❌ [${i + 1}/${statements.length}] ${preview}...`);
        console.log(`   Error: ${err.message}`);
      }
    }
  }

  await client.end();
  console.log('\n✅ Done!');
}

main().catch(console.error);
