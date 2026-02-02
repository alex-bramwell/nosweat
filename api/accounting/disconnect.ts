/**
 * OAuth Disconnect Endpoint
 * Disconnects from QuickBooks or Xero by revoking tokens and removing integration
 *
 * POST /api/accounting/disconnect
 * Body: { provider: 'quickbooks' | 'xero' }
 * Returns: { success: true, message: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { decryptToken } from '../../src/utils/encryption';

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

  // Basic auth header
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
      // Don't throw error - we still want to remove from database
    }

    console.log('QuickBooks tokens revoked successfully');
  } catch (error) {
    console.error('Error revoking QuickBooks tokens:', error);
    // Continue with database cleanup even if revocation fails
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
      // Don't throw error - we still want to remove from database
    }

    console.log('Xero tokens revoked successfully');
  } catch (error) {
    console.error('Error revoking Xero tokens:', error);
    // Continue with database cleanup even if revocation fails
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

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to fetch integration: ${error.message}`);
  }

  return data;
}

/**
 * Remove integration from database
 */
async function removeIntegration(provider: 'quickbooks' | 'xero'): Promise<void> {
  // Update status to disconnected and clear tokens
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
    await requireAdmin(req);

    // Parse request body
    const { provider } = req.body;

    // Validate provider
    if (!provider || !['quickbooks', 'xero'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: 'Provider must be "quickbooks" or "xero"'
      });
    }

    // Get existing integration
    const integration = await getIntegration(provider);

    if (!integration) {
      return res.status(404).json({
        error: 'Integration not found',
        message: `No ${provider} integration found to disconnect`
      });
    }

    if (integration.status === 'disconnected') {
      return res.status(400).json({
        error: 'Already disconnected',
        message: `${provider} integration is already disconnected`
      });
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
      // Continue with database cleanup even if decryption fails
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

    return res.status(200).json({
      success: true,
      provider,
      message: `Successfully disconnected from ${provider === 'quickbooks' ? 'QuickBooks' : 'Xero'}`
    });

  } catch (error) {
    console.error('Disconnect error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return res.status(error.message.includes('Unauthorized') ? 401 : 403).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Failed to disconnect integration',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to disconnect integration',
      message: 'Unknown error occurred'
    });
  }
}
