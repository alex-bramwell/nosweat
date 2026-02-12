/**
 * QuickBooks API Service
 * Handles all interactions with the QuickBooks API
 */

import QuickBooks from 'node-quickbooks';
import { createClient } from '@supabase/supabase-js';
import { decryptToken, encryptToken } from '../utils/encryption.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface QBTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: Date;
}

interface QBCustomer {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
}

interface QBSalesReceipt {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  TotalAmt: number;
}

interface QBCreditMemo {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  TotalAmt: number;
}

/**
 * Get QuickBooks tokens from database and decrypt
 */
async function getQBTokens(integrationId: string): Promise<QBTokens> {
  const { data, error } = await supabase
    .from('accounting_integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('provider', 'quickbooks')
    .single();

  if (error || !data) {
    throw new Error('QuickBooks integration not found');
  }

  const accessToken = await decryptToken(data.encrypted_access_token);
  const refreshToken = await decryptToken(data.encrypted_refresh_token);

  return {
    accessToken,
    refreshToken,
    realmId: data.realm_id,
    expiresAt: new Date(data.token_expires_at)
  };
}

/**
 * Save updated tokens back to database
 */
async function saveQBTokens(
  integrationId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<void> {
  const encryptedAccessToken = await encryptToken(accessToken);
  const encryptedRefreshToken = await encryptToken(refreshToken);

  const { error } = await supabase
    .from('accounting_integrations')
    .update({
      encrypted_access_token: encryptedAccessToken,
      encrypted_refresh_token: encryptedRefreshToken,
      token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', integrationId);

  if (error) {
    throw new Error(`Failed to save tokens: ${error.message}`);
  }
}

/**
 * Refresh QuickBooks access token if expired or expiring soon
 */
export async function refreshQBTokenIfNeeded(integrationId: string): Promise<QBTokens> {
  const tokens = await getQBTokens(integrationId);

  // Check if token expires in next 5 minutes
  const expiresIn = tokens.expiresAt.getTime() - Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresIn > fiveMinutes) {
    // Token still valid
    return tokens;
  }

  console.log('[QB] Token expiring soon, refreshing...');

  // Initialize OAuth client
  const oauthClient = new (require('intuit-oauth'))({
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!
  });

  try {
    // Set current tokens
    oauthClient.setToken({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      realmId: tokens.realmId
    });

    // Refresh the token
    const authResponse = await oauthClient.refresh();

    const newAccessToken = authResponse.token.access_token;
    const newRefreshToken = authResponse.token.refresh_token;
    const expiresIn = authResponse.token.expires_in; // seconds

    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Save new tokens
    await saveQBTokens(integrationId, newAccessToken, newRefreshToken, newExpiresAt);

    console.log('[QB] Token refreshed successfully');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      realmId: tokens.realmId,
      expiresAt: newExpiresAt
    };
  } catch (error: any) {
    console.error('[QB] Token refresh failed:', error);
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

/**
 * Create QuickBooks client instance
 */
export async function createQBClient(integrationId: string): Promise<any> {
  const tokens = await refreshQBTokenIfNeeded(integrationId);

  const qbo = new QuickBooks(
    process.env.QUICKBOOKS_CLIENT_ID!,
    process.env.QUICKBOOKS_CLIENT_SECRET!,
    tokens.accessToken,
    false, // no token secret for OAuth 2.0
    tokens.realmId,
    process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox', // use sandbox
    true, // enable debugging
    null, // minor version
    '2.0', // oauth version
    tokens.refreshToken
  );

  return qbo;
}

/**
 * Find customer by email or create new one
 */
export async function getOrCreateCustomer(
  qbo: any,
  email: string,
  displayName: string
): Promise<QBCustomer> {
  return new Promise((resolve, reject) => {
    // Search for customer by email
    const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`;

    qbo.findCustomers(query, (err: any, customers: any) => {
      if (err) {
        return reject(new Error(`Customer search failed: ${err.message}`));
      }

      // Customer exists
      if (customers && customers.QueryResponse && customers.QueryResponse.Customer) {
        const customer = customers.QueryResponse.Customer[0];
        console.log(`[QB] Found existing customer: ${customer.Id}`);
        return resolve(customer);
      }

      // Create new customer
      console.log(`[QB] Creating new customer: ${email}`);
      const customerData = {
        DisplayName: displayName,
        PrimaryEmailAddr: {
          Address: email
        }
      };

      qbo.createCustomer(customerData, (createErr: any, newCustomer: any) => {
        if (createErr) {
          return reject(new Error(`Customer creation failed: ${createErr.message}`));
        }

        console.log(`[QB] Created customer: ${newCustomer.Id}`);
        resolve(newCustomer);
      });
    });
  });
}

/**
 * Create a sales receipt in QuickBooks
 */
export async function createSalesReceipt(
  qbo: any,
  params: {
    customerId: string;
    amount: number;
    description: string;
    accountId: string;
    txnDate: string;
    paymentRefNum: string;
  }
): Promise<QBSalesReceipt> {
  return new Promise((resolve, reject) => {
    const salesReceiptData = {
      CustomerRef: {
        value: params.customerId
      },
      TxnDate: params.txnDate,
      PaymentRefNum: params.paymentRefNum,
      DepositToAccountRef: {
        value: params.accountId
      },
      Line: [
        {
          Amount: params.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1' // TODO: Map to actual item or use account-based line item
            },
            Qty: 1,
            UnitPrice: params.amount
          },
          Description: params.description
        }
      ]
    };

    qbo.createSalesReceipt(salesReceiptData, (err: any, salesReceipt: any) => {
      if (err) {
        return reject(new Error(`Sales receipt creation failed: ${err.message}`));
      }

      console.log(`[QB] Created sales receipt: ${salesReceipt.Id}`);
      resolve(salesReceipt);
    });
  });
}

/**
 * Create a credit memo for refunds
 */
export async function createCreditMemo(
  qbo: any,
  params: {
    customerId: string;
    amount: number;
    description: string;
    accountId: string;
    txnDate: string;
  }
): Promise<QBCreditMemo> {
  return new Promise((resolve, reject) => {
    const creditMemoData = {
      CustomerRef: {
        value: params.customerId
      },
      TxnDate: params.txnDate,
      Line: [
        {
          Amount: params.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1' // TODO: Map to actual item
            },
            Qty: 1,
            UnitPrice: params.amount
          },
          Description: params.description
        }
      ]
    };

    qbo.createCreditMemo(creditMemoData, (err: any, creditMemo: any) => {
      if (err) {
        return reject(new Error(`Credit memo creation failed: ${err.message}`));
      }

      console.log(`[QB] Created credit memo: ${creditMemo.Id}`);
      resolve(creditMemo);
    });
  });
}

/**
 * Get Chart of Accounts from QuickBooks
 */
export async function getChartOfAccounts(qbo: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    qbo.findAccounts(
      {
        AccountType: ['Income', 'Expense'],
        limit: 1000
      },
      (err: any, accounts: any) => {
        if (err) {
          return reject(new Error(`Failed to fetch accounts: ${err.message}`));
        }

        if (accounts && accounts.QueryResponse && accounts.QueryResponse.Account) {
          resolve(accounts.QueryResponse.Account);
        } else {
          resolve([]);
        }
      }
    );
  });
}
