/**
 * Accounting Controllers
 * Helper functions for QuickBooks and Xero integration
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Verify admin role
 */
export async function requireAdmin(req: express.Request): Promise<string> {
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
export function getQuickBooksAuthUrl(state: string, redirectUri: string): string {
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
export function getXeroAuthUrl(state: string, redirectUri: string): string {
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
export async function storeOAuthState(
  userId: string,
  provider: string,
  state: string,
  redirectUrl: string
): Promise<void> {
  console.log(`Storing OAuth state: ${state} for user ${userId}, provider ${provider}`);
  // TODO: Implement proper state storage in database
}

/**
 * Revoke QuickBooks tokens
 */
export async function revokeQuickBooksTokens(refreshToken: string): Promise<void> {
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
export async function revokeXeroTokens(accessToken: string): Promise<void> {
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
