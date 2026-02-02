/**
 * Chart of Accounts Endpoint
 * Fetches available accounts from QuickBooks/Xero for mapping configuration
 * GET /api/accounting/accounts?provider=quickbooks
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createQBClient, getChartOfAccounts } from '../services/quickbooksService';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Verify user is authenticated and has admin role
 */
async function verifyAdmin(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);

  // Verify JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return false;
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const isAdmin = await verifyAdmin(req.headers.authorization);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    // Get provider from query
    const { provider } = req.query;

    if (!provider || typeof provider !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid provider parameter'
      });
    }

    if (!['quickbooks', 'xero'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider. Must be "quickbooks" or "xero"'
      });
    }

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('accounting_integrations')
      .select('*')
      .eq('provider', provider)
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({
        error: `${provider} integration not found or not active`
      });
    }

    // Fetch Chart of Accounts based on provider
    let accounts;

    if (provider === 'quickbooks') {
      const qbo = await createQBClient(integration.id);
      accounts = await getChartOfAccounts(qbo);

      // Format for frontend
      accounts = accounts.map((account: any) => ({
        id: account.Id,
        name: account.Name,
        type: account.AccountType,
        subType: account.AccountSubType,
        code: account.AcctNum || null,
        active: account.Active
      }));
    } else if (provider === 'xero') {
      // TODO: Implement Xero in Phase 6
      return res.status(501).json({
        error: 'Xero integration not yet implemented'
      });
    }

    return res.status(200).json({
      provider,
      accounts: accounts || []
    });

  } catch (error: any) {
    console.error('[Accounts] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
