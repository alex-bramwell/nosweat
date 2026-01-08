# Environment Configuration

This project uses different environment files for local development and production deployment.

## File Structure

```
.env                  # Production config (committed to git, used by Vercel)
.env.local            # Local dev config (git-ignored, used in Codespaces)
.env.example          # Template for setup
```

## How It Works

### Production (Vercel)
When you push to `main`, Vercel will use:
- `.env` file (production Supabase URL: `woyupptawdfhzrfzksgb.supabase.co`)
- Plus any environment variables set in Vercel dashboard

### Local Development (Codespaces)
When running `npm run dev` in Codespaces:
- `.env.local` overrides `.env`
- Uses local Supabase via forwarded port

## Local Supabase Setup in Codespaces

### 1. Start Supabase
```bash
npx supabase start
```

### 2. Make Port 54321 Public
**IMPORTANT**: In VS Code Ports tab (bottom panel):
1. Find port `54321`
2. Right-click → Change Port Visibility → **Public**

### 3. Update `.env.local`
Replace `urban-zebra-pj9945gx446v27wp9` with your actual Codespace name:

```env
VITE_SUPABASE_URL=https://YOUR-CODESPACE-NAME-54321.app.github.dev
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

Find your Codespace name in the URL or run:
```bash
echo $CODESPACE_NAME
```

### 4. Start Dev Server
```bash
npm run dev
```

## Test Accounts (Local Supabase Only)

**Member Account:**
- Email: `alex.s.bramwell.86@gmail.com`
- Password: `TestPassword123!`
- Role: `member`

**Coach Admin Account:**
- Email: `coach@test.com`
- Password: `TestPassword123!`
- Role: `admin`

## Troubleshooting

### "An error occurred. Please try again" when logging in
- Check that port 54321 is set to **Public** in Ports tab
- Verify `.env.local` has the correct Codespace URL
- Restart the dev server: Kill and run `npm run dev` again

### "Connection refused" errors
- Make sure Supabase is running: `npx supabase status`
- If stopped, start it: `npx supabase start`

### Changes not reflecting
- Restart dev server (kill and run `npm run dev`)
- Clear browser localStorage
- Hard refresh (Cmd/Ctrl + Shift + R)

## Important Notes

- ⚠️ **Never commit `.env.local`** - it's git-ignored for security
- ✅ **`.env` is committed** - it contains production config for Vercel
- 🔄 **Local database resets** - `npx supabase db reset` will wipe local data
- 🚀 **Production uses remote Supabase** - local changes don't affect production
