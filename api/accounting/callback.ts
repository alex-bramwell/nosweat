/**
 * OAuth Callback Endpoint
 * Handles OAuth 2.0 callback from QuickBooks or Xero
 * Exchanges authorization code for access/refresh tokens and stores them encrypted
 *
 * GET /api/accounting/callback?code=xxx&state=xxx&realmId=xxx (QuickBooks)
 * GET /api/accounting/callback?code=xxx&state=xxx (Xero)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { encryptToken } from '../utils/encryption.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface QuickBooksTokenResponse extends OAuthTokenResponse {
  x_refresh_token_expires_in?: number;
}

/**
 * Exchange authorization code for tokens (QuickBooks)
 */
async function exchangeQuickBooksCode(code: string): Promise<QuickBooksTokenResponse> {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('QuickBooks OAuth credentials not configured');
  }

  const tokenUrl = environment === 'production'
    ? 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    : 'https://oauth-sandbox.platform.intuit.com/oauth2/v1/tokens/bearer';

  // Basic auth header
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('QuickBooks token exchange failed:', errorText);
    throw new Error(`QuickBooks token exchange failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Exchange authorization code for tokens (Xero)
 */
async function exchangeXeroCode(code: string): Promise<OAuthTokenResponse> {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Xero OAuth credentials not configured');
  }

  const response = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Xero token exchange failed:', errorText);
    throw new Error(`Xero token exchange failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get QuickBooks company info
 */
async function getQuickBooksCompanyInfo(accessToken: string, realmId: string): Promise<{ companyName: string }> {
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
  const baseUrl = environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  const response = await fetch(
    `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=65`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    console.error('Failed to fetch QuickBooks company info');
    return { companyName: 'Unknown Company' };
  }

  const data = await response.json();
  return {
    companyName: data.CompanyInfo?.CompanyName || 'Unknown Company'
  };
}

/**
 * Get Xero organization info
 */
async function getXeroOrganizationInfo(accessToken: string): Promise<{ tenantId: string; companyName: string }> {
  // First, get connections (tenant IDs)
  const connectionsResponse = await fetch('https://api.xero.com/connections', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!connectionsResponse.ok) {
    throw new Error('Failed to fetch Xero connections');
  }

  const connections = await connectionsResponse.json();

  if (!connections || connections.length === 0) {
    throw new Error('No Xero organizations found');
  }

  // Use first connection
  const connection = connections[0];

  return {
    tenantId: connection.tenantId,
    companyName: connection.tenantName || 'Unknown Company'
  };
}

/**
 * Store integration in database
 */
async function storeIntegration(
  provider: 'quickbooks' | 'xero',
  tokens: OAuthTokenResponse,
  metadata: {
    realmId?: string;
    tenantId?: string;
    companyName: string;
  }
): Promise<void> {
  // Encrypt tokens
  const encryptedAccessToken = encryptToken(tokens.access_token);
  const encryptedRefreshToken = encryptToken(tokens.refresh_token);

  // Calculate token expiry
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Upsert integration (update if exists, insert if not)
  const { error } = await supabase
    .from('accounting_integrations')
    .upsert({
      provider,
      status: 'active',
      access_token_encrypted: encryptedAccessToken,
      refresh_token_encrypted: encryptedRefreshToken,
      token_expires_at: expiresAt.toISOString(),
      realm_id: metadata.realmId || null,
      tenant_id: metadata.tenantId || null,
      company_name: metadata.companyName,
      last_sync_at: null,
      last_sync_status: null,
      last_error: null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'provider' // Update if provider already exists
    });

  if (error) {
    console.error('Failed to store integration:', error);
    throw new Error('Failed to store integration in database');
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, realmId, error: oauthError } = req.query;

    // Check for OAuth errors
    if (oauthError) {
      console.error('OAuth error:', oauthError);
      return res.status(400).json({
        error: 'OAuth authorization failed',
        message: oauthError
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'code and state are required'
      });
    }

    // TODO: Verify state parameter (CSRF protection)
    // For Phase 1, we'll skip state verification
    // In Phase 2, implement proper state storage and verification

    // Determine provider based on query parameters
    // QuickBooks includes realmId, Xero doesn't
    const provider = realmId ? 'quickbooks' : 'xero';

    let tokens: OAuthTokenResponse;
    let metadata: {
      realmId?: string;
      tenantId?: string;
      companyName: string;
    };

    if (provider === 'quickbooks') {
      // Exchange code for tokens
      tokens = await exchangeQuickBooksCode(code as string);

      // Get company info
      const companyInfo = await getQuickBooksCompanyInfo(
        tokens.access_token,
        realmId as string
      );

      metadata = {
        realmId: realmId as string,
        companyName: companyInfo.companyName
      };

    } else {
      // Xero
      tokens = await exchangeXeroCode(code as string);

      // Get organization info
      const orgInfo = await getXeroOrganizationInfo(tokens.access_token);

      metadata = {
        tenantId: orgInfo.tenantId,
        companyName: orgInfo.companyName
      };
    }

    // Store encrypted tokens in database
    await storeIntegration(provider, tokens, metadata);

    // Redirect back to admin settings page with success message
    // TODO: Get redirect URL from stored state in Phase 2
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${redirectUrl}/admin/settings?accounting=${provider}&status=connected`;

    return res.redirect(302, successUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);

    // Redirect to frontend with error
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorUrl = `${redirectUrl}/admin/settings?accounting=error&message=${encodeURIComponent(
      error instanceof Error ? error.message : 'Unknown error'
    )}`;

    return res.redirect(302, errorUrl);
  }
}
