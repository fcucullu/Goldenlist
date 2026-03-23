# Golden List — Deployment Guide

## Step 1: Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Name it `goldenlist`, choose a region close to you, set a database password
4. Wait for the project to finish setting up (~2 min)

### 1.2 Get Your Keys
1. Go to **Settings → API** in the Supabase dashboard
2. Copy these values into your `.env.local` file:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Run the Database Migration
1. Go to **SQL Editor** in the Supabase dashboard
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql` and paste it
4. Click **Run** — this creates all tables, RLS policies, triggers, and functions

### 1.4 Enable Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add these **Authorized redirect URIs**:
   - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - `http://localhost:3000/callback` (for local dev)
7. Copy the **Client ID** and **Client Secret**

Now back in Supabase:
1. Go to **Authentication → Providers → Google**
2. Enable Google
3. Paste the Client ID and Client Secret
4. Save

---

## Step 2: Vercel Deployment

### 2.1 Connect Repository
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import the `fcucullu/Goldenlist` repository
4. Framework preset should auto-detect **Next.js**

### 2.2 Set Environment Variables
In the Vercel project settings, add these environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` |

### 2.3 Deploy
Click **Deploy**. Vercel will build and deploy the app.

---

## Step 3: Custom Domain

### 3.1 Add Domain in Vercel
1. In your Vercel project, go to **Settings → Domains**
2. Add `goldenlist.franciscocucullu.com`
3. Vercel will show you DNS instructions

### 3.2 Configure DNS
Go to your domain registrar (wherever you manage `franciscocucullu.com`) and add:

| Type | Name | Value |
|---|---|---|
| CNAME | goldenlist | cname.vercel-dns.com |

Wait a few minutes for DNS propagation. Vercel handles SSL automatically.

### 3.3 Update Auth Redirect URLs
After the custom domain is live, update these:

**In Google Cloud Console** (APIs & Services → Credentials → your OAuth client):
- Add redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
  (this should already be there from step 1.4)

**In Supabase** (Authentication → URL Configuration):
- Set **Site URL** to: `https://goldenlist.franciscocucullu.com`
- Add to **Redirect URLs**: `https://goldenlist.franciscocucullu.com/callback`

---

## Step 4: Push Notifications (Optional Cron)

To send push notifications automatically:

### 4.1 Via Vercel Cron (Simpler)
Add this to your `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/push/send",
    "schedule": "0 9,18 * * *"
  }]
}
```
Note: The `/api/push/send` endpoint uses `SUPABASE_SERVICE_ROLE_KEY` for auth.
You'll need to update the auth check to also accept Vercel's cron secret.

### 4.2 Via Supabase pg_cron + Edge Function (Advanced)
1. Deploy the Edge Function: `supabase functions deploy push-notify`
2. Set up pg_cron in the SQL editor to call it on schedule

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

Make sure your `.env.local` file has all the values filled in.

---

## Checklist

- [ ] Supabase project created
- [ ] Database migration run
- [ ] Google OAuth configured (Google Cloud + Supabase)
- [ ] Vercel project connected to GitHub repo
- [ ] Environment variables set in Vercel
- [ ] Custom domain added and DNS configured
- [ ] Site URL and redirect URLs updated in Supabase
- [ ] Test: sign in with Google
- [ ] Test: add a contact
- [ ] Test: install as PWA on phone
