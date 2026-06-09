/**
 * Copy all Supabase Storage buckets/objects from a source project to a target.
 * Used by db:pull to bring prod images (logos, hero images) into local Storage.
 */
import { createClient } from '@supabase/supabase-js';

async function listAll(client, bucket, prefix = '') {
  const files = [];
  const pageSize = 1000;
  let offset = 0;
  for (;;) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(prefix, { limit: pageSize, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders come back with a null id; recurse into them.
      if (entry.id === null) {
        files.push(...await listAll(client, bucket, path));
      } else {
        files.push({ path, contentType: entry.metadata?.mimetype });
      }
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return files;
}

export async function syncStorage({ fromUrl, fromKey, toUrl, toKey }) {
  if (!fromKey) throw new Error('Missing SUPABASE_PROD_SERVICE_KEY for storage sync');
  if (!toKey) throw new Error('Missing SUPABASE_SERVICE_KEY (local) for storage sync');

  const from = createClient(fromUrl, fromKey, { auth: { persistSession: false } });
  const to = createClient(toUrl, toKey, { auth: { persistSession: false } });

  const { data: buckets, error: bucketErr } = await from.storage.listBuckets();
  if (bucketErr) throw bucketErr;
  if (!buckets?.length) {
    console.log('  (no storage buckets on source)');
    return;
  }

  let copied = 0;
  for (const bucket of buckets) {
    // Ensure the bucket exists locally (ignore "already exists").
    await to.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit ?? undefined,
      allowedMimeTypes: bucket.allowed_mime_types ?? undefined,
    }).catch(() => {});

    const files = await listAll(from, bucket.name);
    console.log(`  bucket "${bucket.name}": ${files.length} object(s)`);
    for (const file of files) {
      const { data: blob, error: dlErr } = await from.storage.from(bucket.name).download(file.path);
      if (dlErr) { console.warn(`    skip ${file.path}: ${dlErr.message}`); continue; }
      const buf = Buffer.from(await blob.arrayBuffer());
      const { error: upErr } = await to.storage.from(bucket.name).upload(file.path, buf, {
        upsert: true,
        contentType: file.contentType || blob.type || 'application/octet-stream',
      });
      if (upErr) { console.warn(`    fail ${file.path}: ${upErr.message}`); continue; }
      copied++;
    }
  }
  console.log(`  ✅ storage: ${copied} object(s) copied`);
}
