import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

// Initialised once per cold start. Without SENTRY_DSN this is a no-op, so local
// dev and unconfigured environments are unaffected.
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

/**
 * Report an error to Sentry. No-op unless SENTRY_DSN is set. Flushes before
 * resolving so events aren't lost when a serverless function returns right after.
 * Call this from handler catch blocks alongside the 500 response.
 */
export async function captureError(error: unknown, context?: Record<string, unknown>): Promise<void> {
  if (!dsn) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
  await Sentry.flush(2000);
}
