# Golden List

Stay in touch with the people who matter. A mobile-first PWA that reminds you to reach out to friends, family, and contacts.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffcucullu%2FGoldenlist&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_SUBJECT&envDescription=See%20DEPLOYMENT.md%20for%20setup%20instructions&project-name=goldenlist)

## Setup (5 steps from your phone)

### 1. Supabase
- Go to [supabase.com](https://supabase.com) → **New Project** → name it `goldenlist`
- Go to **Settings → API** → copy the **URL**, **anon key**, and **service_role key**
- Go to **SQL Editor** → paste the contents of `supabase/migrations/001_initial_schema.sql` → **Run**

### 2. Google OAuth
- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Create Credentials → OAuth client ID** (Web app)
- Add redirect URI: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
- Copy Client ID + Secret

### 3. Enable Google in Supabase
- In Supabase → **Authentication → Providers → Google**
- Paste the Client ID + Secret → Save

### 4. Deploy to Vercel
- Click the **Deploy** button above (or import the repo at [vercel.com](https://vercel.com))
- Fill in the env vars when prompted:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from step 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 1 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | from the same command above |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` |

### 5. Custom Domain + Final Config
- In Vercel → **Settings → Domains** → add `goldenlist.franciscocucullu.com`
- In your DNS: add CNAME `goldenlist` → `cname.vercel-dns.com`
- In Supabase → **Authentication → URL Configuration**:
  - Site URL: `https://goldenlist.franciscocucullu.com`
  - Redirect URLs: `https://goldenlist.franciscocucullu.com/callback`

Done! Open your site and sign in with Google.
