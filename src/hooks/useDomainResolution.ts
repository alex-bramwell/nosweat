import { useState, useEffect } from 'react';

// Known platform hostnames that should NOT trigger domain resolution
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
  const [result, setResult] = useState<DomainResolution>(() => {
    const hostname = window.location.hostname;

    // Fast path: known platform host
    if (isPlatformHost(hostname)) {
      return { mode: 'platform' };
    }

    // Check sessionStorage cache
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

    return { mode: 'loading' };
  });

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
