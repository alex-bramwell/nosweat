/**
 * Express API Server (local Docker dev)
 *
 * Single source of truth: this server does NOT reimplement any endpoints. It
 * auto-mounts the real Vercel serverless functions from `/api` so local dev runs
 * byte-for-byte the same handler code that ships to production on Vercel.
 *
 * The `/api` handlers are `export default (req: VercelRequest, res: VercelResponse)`.
 * VercelRequest/Response are thin extensions of Node's IncomingMessage/ServerResponse,
 * and the members the handlers use (req.method/headers/query/body, res.status().json()/
 * send()/setHeader()/redirect()) are all present on Express req/res, so each handler
 * mounts directly as an Express route.
 *
 * Production keeps using `/api` directly via Vercel's file-based routing; this file
 * is only the local adapter.
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join, dirname, relative, sep } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(__dirname, '..', 'api');

// Folders under api/ that hold shared modules, not HTTP endpoints.
const NON_ENDPOINT_DIRS = new Set(['lib', 'utils', 'services']);

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true,
}));

// JSON body parsing for everything EXCEPT webhooks. Stripe's handler reads the
// raw request stream (`buffer(req)` from `micro`) to verify the signature, so the
// stream must stay unconsumed for /api/webhooks/* — no body parser there.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) return next();
  return express.json()(req, res, next);
});

/**
 * Recursively collect endpoint files under api/, skipping shared-module folders.
 */
function collectEndpointFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (NON_ENDPOINT_DIRS.has(entry.name)) continue;
      out.push(...collectEndpointFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

/**
 * Map an absolute api file path to its route, e.g.
 *   <repo>/api/payments/create-payment-intent.ts -> /api/payments/create-payment-intent
 */
function fileToRoute(file: string): string {
  const rel = relative(API_DIR, file).replace(/\.ts$/, '');
  return '/api/' + rel.split(sep).join('/');
}

// Cache imported handler modules so each file is evaluated at most once.
const handlerCache = new Map<string, (req: express.Request, res: express.Response) => unknown>();

async function loadHandler(file: string) {
  let handler = handlerCache.get(file);
  if (!handler) {
    const mod = await import(pathToFileURL(file).href);
    handler = mod.default;
    if (typeof handler !== 'function') {
      throw new Error(`No default export in ${file}`);
    }
    handlerCache.set(file, handler);
  }
  return handler;
}

function mountApiRoutes() {
  const files = collectEndpointFiles(API_DIR);
  // Lazy mount: routes are registered from filenames at startup, but each
  // handler module is imported on first request. This keeps the server booting
  // even if one handler has a load-time error, and mirrors Vercel's per-function
  // isolation (a broken function fails only when invoked, not at deploy).
  for (const file of files) {
    const route = fileToRoute(file);
    app.all(route, async (req, res, next) => {
      try {
        const handler = await loadHandler(file);
        await handler(req, res);
      } catch (err) {
        next(err);
      }
    });
    console.log(`  ↳ ${route}`);
  }
  console.log(`✅ Registered ${files.length} /api routes (handlers load on first request)`);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount all /api handlers, then register the error middleware LAST so it can
// catch errors thrown by those route handlers (Express runs middleware in order).
mountApiRoutes();

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.VITE_APP_URL || 'http://localhost:5173'}`);
});

export default app;
