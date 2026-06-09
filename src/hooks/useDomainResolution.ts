// =============================================================================
// useDomainResolution - Custom Domain Detection Hook
//
// PROBLEM: When a gym uses their own domain (www.mygym.com), we need to know
// which gym it belongs to BEFORE React Router mounts, because the entire
// routing tree changes (root-mounted gym vs path-based /gym/:slug).
//
// THREE-TIER RESOLUTION STRATEGY (optimized for speed):
//   1. KNOWN HOSTS (instant, no network) - If hostname matches our platform
//      domains (localhost, nosweat.fitness, *.vercel.app), skip API entirely.
//      This is the fast path for 99%+ of traffic.
//
//   2. SESSION CACHE (instant, no network) - For custom domains, check
//      sessionStorage for a cached slug with 5-min TTL. Repeat page loads
//      on a custom domain resolve instantly without an API call.
//
//   3. API CALL (one-time) - First visit on an unknown hostname hits
//      /api/domains/resolve, which looks up the hostname in the gyms table.
//      Result is cached in sessionStorage for subsequent loads.
//
// FAILURE MODE: Falls back to 'platform' mode if the API call fails. This
// means unknown domains show the marketing site rather than an error page -
// a deliberate choice for graceful degradation.
//
// TYPE SAFETY: The discriminated union return type makes it impossible to
// access `slug` without first narrowing to 'custom-domain' mode.
// =============================================================================

import { useState, useEffect } from 'react';

// Known platform hostnames - the "fast path" that skips the API entirely.
// The vast majority of traffic hits these hosts.
const PLATFORM_HOSTS = [
  'localhost',
  '127.0.0.1',
  'nosweat.fitness',
  'www.nosweat.fitness',
  'nosweatfitness.vercel.app',
];

// Also match any *.vercel.app preview deployments
function isPlatformHost(hostname: string): boolean {
  if (PLATFORM_HOSTS.includes(hostname)) return true;
  if (hostname.endsWith('.vercel.app')) return true;
  if (hostname.endsWith('.localhost')) return true;
  return false;
}

export type DomainResolution =
  | { mode: 'loading' }
  | { mode: 'platform' }
  | { mode: 'custom-domain'; slug: string };

const CACHE_KEY = 'nsf_domain_slug';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useDomainResolution(): DomainResolution {
  // LAZY INITIALIZER: The synchronous checks (known hosts + cache) run during
  // the initial render, not in an effect. This means platform hosts get an
  // instant result with zero flicker - no loading state at all.
  const [result, setResult] = useState<DomainResolution>(() => {
    const hostname = window.location.hostname;

    // Tier 1: Known platform host - instant, no network call
    if (isPlatformHost(hostname)) {
      return { mode: 'platform' };
    }

    // Tier 2: Check sessionStorage cache (5-min TTL)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { hostname: cachedHost, slug, timestamp } = JSON.parse(cached);
        if (cachedHost === hostname && Date.now() - timestamp < CACHE_TTL) {
          return { mode: 'custom-domain', slug };
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Neither fast path matched - need to call the API (Tier 3)
    return { mode: 'loading' };
  });

  // Tier 3: API call - only runs if Tiers 1 and 2 didn't resolve.
  // The effect guards on result.mode !== 'loading', so it only fires once.
  useEffect(() => {
    if (result.mode !== 'loading') return;

    const hostname = window.location.hostname;

    fetch(`/api/domains/resolve?hostname=${encodeURIComponent(hostname)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(({ slug }) => {
        // Cache the result
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ hostname, slug, timestamp: Date.now() })
          );
        } catch {
          // Ignore storage errors
        }
        setResult({ mode: 'custom-domain', slug });
      })
      .catch(() => {
        // Unknown domain - fall through to platform (will likely show 404)
        setResult({ mode: 'platform' });
      });
  }, [result.mode]);

  return result;
}
