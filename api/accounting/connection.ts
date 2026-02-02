/**
 * OAuth Connection Management Endpoint
 * Handles both connecting and disconnecting from QuickBooks or Xero
 *
 * POST /api/accounting/connection
 * Body: { action: 'connect' | 'disconnect', provider: 'quickbooks' | 'xero', redirectUrl?: string }
 * Returns: { authorizationUrl, state } for connect, or { success: true } for disconnect
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { decryptToken } from '../utils/encryption.js';
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

  console.log('[QB OAuth] Generating auth URL with:', {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'undefined',
    redirectUri,
    environment
  });

  // QuickBooks uses the same authorization URL for both sandbox and production
  // The environment is determined by your credentials, not the URL
  const authUrl = 'https://appcenter.intuit.com/connect/oauth2';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state: state
  });

  const fullUrl = `${authUrl}?${params.toString()}`;
  console.log('[QB OAuth] Generated URL:', fullUrl);

  return fullUrl;
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
  console.log(`Storing OAuth state: ${state} for user ${userId}, provider ${provider}`);
  // TODO: Implement proper state storage
}

/**
 * Handle connect action
 */
async function handleConnect(req: VercelRequest, userId: string) {
  const { provider, redirectUrl } = req.body;

  // Validate provider
  if (!provider || !['quickbooks', 'xero'].includes(provider)) {
    return {
      status: 400,
      body: {
        error: 'Invalid provider',
        message: 'Provider must be "quickbooks" or "xero"'
      }
    };
  }

  // Validate redirect URL
  if (!redirectUrl) {
    return {
      status: 400,
      body: {
        error: 'Missing redirect URL',
        message: 'redirectUrl is required'
      }
    };
  }

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString('hex');

  // Store state for verification in callback
  await storeOAuthState(userId, provider, state, redirectUrl);

  // Get callback URI from environment
  const callbackUri = process.env.QUICKBOOKS_REDIRECT_URI ||
                     process.env.XERO_REDIRECT_URI ||
                     `${req.headers.host}/api/accounting/callback`;

  console.log('[OAuth] Using callback URI:', callbackUri);
  console.log('[OAuth] Environment variables check:', {
    hasQuickBooksRedirectUri: !!process.env.QUICKBOOKS_REDIRECT_URI,
    hasXeroRedirectUri: !!process.env.XERO_REDIRECT_URI,
    hostHeader: req.headers.host
  });

  // Generate authorization URL based on provider
  let authorizationUrl: string;

  if (provider === 'quickbooks') {
    authorizationUrl = getQuickBooksAuthUrl(state, callbackUri);
  } else {
    authorizationUrl = getXeroAuthUrl(state, callbackUri);
  }

  return {
    status: 200,
    body: {
      authorizationUrl,
      state,
      provider,
      message: 'Redirect user to authorizationUrl to complete OAuth flow'
    }
  };
}

/**
 * Revoke QuickBooks tokens
 */
async function revokeQuickBooksTokens(refreshToken: string): Promise<void> {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';

  if (!clientId || !clientSecret) {
    console.error('QuickBooks credentials not configured, skipping token revocation');
    return;
  }

  const revokeUrl = environment === 'production'
    ? 'https://oauth.platform.intuit.com/oauth2/v1/tokens/revoke'
    : 'https://oauth-sandbox.platform.intuit.com/oauth2/v1/tokens/revoke';

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QuickBooks token revocation failed:', errorText);
    } else {
      console.log('QuickBooks tokens revoked successfully');
    }
  } catch (error) {
    console.error('Error revoking QuickBooks tokens:', error);
  }
}

/**
 * Revoke Xero tokens
 */
async function revokeXeroTokens(accessToken: string): Promise<void> {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Xero credentials not configured, skipping token revocation');
    return;
  }

  try {
    const response = await fetch('https://identity.xero.com/connect/revocation', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        token: accessToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Xero token revocation failed:', errorText);
    } else {
      console.log('Xero tokens revoked successfully');
    }
  } catch (error) {
    console.error('Error revoking Xero tokens:', error);
  }
}

/**
 * Get integration by provider
 */
async function getIntegration(provider: 'quickbooks' | 'xero') {
  const { data, error } = await supabase
    .from('accounting_integrations')
    .select('*')
    .eq('provider', provider)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch integration: ${error.message}`);
  }

  return data;
}

/**
 * Remove integration from database
 */
async function removeIntegration(provider: 'quickbooks' | 'xero'): Promise<void> {
  const { error } = await supabase
    .from('accounting_integrations')
    .update({
      status: 'disconnected',
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      last_sync_at: null,
      last_sync_status: null,
      last_error: null,
      updated_at: new Date().toISOString()
    })
    .eq('provider', provider);

  if (error) {
    throw new Error(`Failed to remove integration: ${error.message}`);
  }
}

/**
 * Handle disconnect action
 */
async function handleDisconnect(req: VercelRequest) {
  const { provider } = req.body;

  // Validate provider
  if (!provider || !['quickbooks', 'xero'].includes(provider)) {
    return {
      status: 400,
      body: {
        error: 'Invalid provider',
        message: 'Provider must be "quickbooks" or "xero"'
      }
    };
  }

  // Get existing integration
  const integration = await getIntegration(provider);

  if (!integration) {
    return {
      status: 404,
      body: {
        error: 'Integration not found',
        message: `No ${provider} integration found to disconnect`
      }
    };
  }

  if (integration.status === 'disconnected') {
    return {
      status: 400,
      body: {
        error: 'Already disconnected',
        message: `${provider} integration is already disconnected`
      }
    };
  }

  // Decrypt tokens for revocation
  let decryptedRefreshToken: string | null = null;
  let decryptedAccessToken: string | null = null;

  try {
    if (integration.refresh_token_encrypted) {
      decryptedRefreshToken = decryptToken(integration.refresh_token_encrypted);
    }
    if (integration.access_token_encrypted) {
      decryptedAccessToken = decryptToken(integration.access_token_encrypted);
    }
  } catch (error) {
    console.error('Failed to decrypt tokens:', error);
  }

  // Revoke tokens with provider
  if (provider === 'quickbooks' && decryptedRefreshToken) {
    await revokeQuickBooksTokens(decryptedRefreshToken);
  } else if (provider === 'xero' && decryptedAccessToken) {
    await revokeXeroTokens(decryptedAccessToken);
  }

  // Remove integration from database
  await removeIntegration(provider);

  console.log(`Successfully disconnected ${provider} integration`);

  return {
    status: 200,
    body: {
      success: true,
      provider,
      message: `Successfully disconnected from ${provider === 'quickbooks' ? 'QuickBooks' : 'Xero'}`
    }
  };
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
    console.log('[Connection] Request received:', {
      action: req.body?.action,
      provider: req.body?.provider,
      envVars: {
        hasQuickBooksClientId: !!process.env.QUICKBOOKS_CLIENT_ID,
        hasQuickBooksClientSecret: !!process.env.QUICKBOOKS_CLIENT_SECRET,
        hasQuickBooksRedirectUri: !!process.env.QUICKBOOKS_REDIRECT_URI,
        quickbooksEnvironment: process.env.QUICKBOOKS_ENVIRONMENT
      }
    });

    // Verify admin authentication
    const userId = await requireAdmin(req);

    // Get action from request body
    const { action } = req.body;

    if (!action || !['connect', 'disconnect'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Action must be "connect" or "disconnect"'
      });
    }

    // Route to appropriate handler
    let result;
    if (action === 'connect') {
      result = await handleConnect(req, userId);
    } else {
      result = await handleDisconnect(req);
    }

    return res.status(result.status).json(result.body);

  } catch (error) {
    console.error('Connection endpoint error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return res.status(error.message.includes('Unauthorized') ? 401 : 403).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Failed to process request',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to process request',
      message: 'Unknown error occurred'
    });
  }
}
