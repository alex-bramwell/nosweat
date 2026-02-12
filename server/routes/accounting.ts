/**
 * Accounting API Routes
 * Handles QuickBooks and Xero integration endpoints
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { decryptToken } from '../utils/encryption.js';
import {
  requireAdmin,
  getQuickBooksAuthUrl,
  getXeroAuthUrl,
  storeOAuthState,
  revokeQuickBooksTokens,
  revokeXeroTokens
} from '../controllers/accounting.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /api/accounting/connection
 * Connect or disconnect from QuickBooks/Xero
 */
router.post('/connection', async (req, res) => {
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
});

/**
 * Handle connect action
 */
async function handleConnect(req: express.Request, userId: string) {
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
                     `http://localhost:3001/api/accounting/callback`;

  console.log('[OAuth] Using callback URI:', callbackUri);

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
 * Handle disconnect action
 */
async function handleDisconnect(req: express.Request) {
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

// TODO: Add callback, sync, and accounts routes
// These will be implemented similarly

export default router;
