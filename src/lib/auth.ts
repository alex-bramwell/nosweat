import { supabase } from './supabase';

/**
 * Get the current session's access token.
 * Throws if no active session exists.
 */
export async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

/**
 * Authenticated fetch wrapper. Automatically attaches the Bearer token,
 * sets Content-Type to JSON, and handles error responses.
 *
 * Usage:
 *   const data = await authFetch('/api/domains/add', { gymId, domain });
 *   // throws on non-ok response with the server error message
 */
export async function authFetch<T = Record<string, unknown>>(
  url: string,
  body?: Record<string, unknown>,
  options?: { method?: string }
): Promise<T> {
  const token = await getAccessToken();
  const method = options?.method ?? (body ? 'POST' : 'GET');

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data as T;
}
