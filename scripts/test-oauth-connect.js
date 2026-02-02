/**
 * Test script for OAuth connect endpoint
 * This simulates calling the connect API to get the QuickBooks authorization URL
 */

import dotenv from 'dotenv';
dotenv.config();

async function testOAuthConnect() {
  console.log('🧪 Testing OAuth Connect Endpoint\n');

  // Simulate admin JWT token (in real scenario, this comes from Supabase auth)
  // For testing, we'll check if the endpoint returns the authorization URL
  const provider = 'quickbooks';

  console.log(`Provider: ${provider}`);
  console.log(`Environment: ${process.env.QUICKBOOKS_ENVIRONMENT}`);
  console.log(`Client ID: ${process.env.QUICKBOOKS_CLIENT_ID?.substring(0, 20)}...`);
  console.log(`Redirect URI: ${process.env.QUICKBOOKS_REDIRECT_URI}\n`);

  // Build expected authorization URL
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
  const authUrl = environment === 'production'
    ? 'https://appcenter.intuit.com/connect/oauth2'
    : 'https://appcenter-sandbox.intuit.com/connect/oauth2';

  const params = new URLSearchParams({
    client_id: process.env.QUICKBOOKS_CLIENT_ID,
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state: 'PLACEHOLDER_STATE' // Will be random in actual endpoint
  });

  const expectedUrl = `${authUrl}?${params.toString()}`;

  console.log('✅ Expected Authorization URL structure:');
  console.log(`   ${authUrl}?client_id=...&redirect_uri=...&response_type=code&scope=...&state=...\n`);

  console.log('📝 Next Steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. In another terminal, test the endpoint:');
  console.log('   curl -X POST http://localhost:5173/api/accounting/connect \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\');
  console.log('     -d \'{"provider":"quickbooks"}\'\n');
  console.log('3. Copy the authorization URL from the response');
  console.log('4. Open it in your browser to start OAuth flow');
  console.log('5. After authorizing, QuickBooks will redirect to the callback endpoint');
  console.log('   which will store the encrypted tokens in the database\n');

  console.log('🔐 Environment Check:');
  console.log(`   QUICKBOOKS_CLIENT_ID: ${process.env.QUICKBOOKS_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   QUICKBOOKS_CLIENT_SECRET: ${process.env.QUICKBOOKS_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   QUICKBOOKS_REDIRECT_URI: ${process.env.QUICKBOOKS_REDIRECT_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`   ACCOUNTING_ENCRYPTION_KEY: ${process.env.ACCOUNTING_ENCRYPTION_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`);

  const allSet =
    process.env.QUICKBOOKS_CLIENT_ID &&
    process.env.QUICKBOOKS_CLIENT_SECRET &&
    process.env.QUICKBOOKS_REDIRECT_URI &&
    process.env.ACCOUNTING_ENCRYPTION_KEY &&
    process.env.VITE_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_KEY;

  if (allSet) {
    console.log('\n✅ All required environment variables are set!');
    console.log('   You can proceed with testing the OAuth flow.');
  } else {
    console.log('\n❌ Some environment variables are missing!');
    console.log('   Check your .env file before testing.');
  }
}

testOAuthConnect().catch(console.error);
