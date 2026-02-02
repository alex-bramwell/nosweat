/**
 * OAuth Connect Endpoint
 * Initiates OAuth 2.0 flow for QuickBooks or Xero
 *
 * POST /api/accounting/connect
 * Body: { provider: 'quickbooks' | 'xero', redirectUrl: string }
 * Returns: { authorizationUrl: string, state: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Verify admin role
 */
async function requireAdmin(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing authorization header');
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return user.id;
}

/**
 * Generate QuickBooks authorization URL
 */
function getQuickBooksAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';

  if (!clientId) {
    throw new Error('QUICKBOOKS_CLIENT_ID not configured');
  }

  const authUrl = environment === 'production'
    ? 'https://appcenter.intuit.com/connect/oauth2'
    : 'https://appcenter-sandbox.intuit.com/connect/oauth2';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state: state
  });

  return `${authUrl}?${params.toString()}`;
}

/**
 * Generate Xero authorization URL
 */
function getXeroAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.XERO_CLIENT_ID;

  if (!clientId) {
    throw new Error('XERO_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'accounting.transactions accounting.settings',
    state: state
  });

  return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
}

/**
 * Store OAuth state in database for CSRF protection
 */
async function storeOAuthState(
  userId: string,
  provider: string,
  state: string,
  redirectUrl: string
): Promise<void> {
  // Store state in a temporary table or cache
  // For now, we'll use a simple approach with expiry
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Note: You may want to create a separate oauth_states table for this
  // For Phase 1, we'll store in accounting_integrations metadata or use a separate storage
  console.log(`Storing OAuth state: ${state} for user ${userId}, provider ${provider}`);
  // TODO: Implement proper state storage in Phase 2
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const userId = await requireAdmin(req);

    // Parse request body
    const { provider, redirectUrl } = req.body;

    // Validate provider
    if (!provider || !['quickbooks', 'xero'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: 'Provider must be "quickbooks" or "xero"'
      });
    }

    // Validate redirect URL
    if (!redirectUrl) {
      return res.status(400).json({
        error: 'Missing redirect URL',
        message: 'redirectUrl is required'
      });
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Store state for verification in callback
    await storeOAuthState(userId, provider, state, redirectUrl);

    // Get callback URI from environment
    const callbackUri = process.env.QUICKBOOKS_REDIRECT_URI ||
                       process.env.XERO_REDIRECT_URI ||
                       `${req.headers.host}/api/accounting/callback`;

    // Generate authorization URL based on provider
    let authorizationUrl: string;

    if (provider === 'quickbooks') {
      authorizationUrl = getQuickBooksAuthUrl(state, callbackUri);
    } else {
      authorizationUrl = getXeroAuthUrl(state, callbackUri);
    }

    // Return authorization URL to frontend
    return res.status(200).json({
      authorizationUrl,
      state,
      provider,
      message: 'Redirect user to authorizationUrl to complete OAuth flow'
    });

  } catch (error) {
    console.error('OAuth connect error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return res.status(error.message.includes('Unauthorized') ? 401 : 403).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Failed to initiate OAuth connection',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to initiate OAuth connection',
      message: 'Unknown error occurred'
    });
  }
}
