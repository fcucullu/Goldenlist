#!/bin/bash
# Golden List — One-time setup script
# Run this ONCE from your PC to configure everything.
# After this, all deploys happen automatically on git push.
#
# Prerequisites: gh (GitHub CLI), vercel, supabase, jq, curl
# Install: brew install gh vercel supabase jq curl

set -e

REPO="fcucullu/Goldenlist"
APP_NAME="goldenlist"
DOMAIN="franciscocucullu.com"

echo "======================================"
echo "  Golden List — Setup"
echo "======================================"
echo ""

# ── 1. Check tools ──
for cmd in gh vercel jq curl; do
  if ! command -v $cmd &>/dev/null; then
    echo "❌ Missing: $cmd"
    echo "Install it first, then re-run this script."
    exit 1
  fi
done

# Optional tools
HAS_SUPABASE=false
if command -v supabase &>/dev/null; then HAS_SUPABASE=true; fi

echo "✅ All required tools found"
echo ""

# ── 2. GitHub auth ──
if ! gh auth status &>/dev/null; then
  echo "📌 Log in to GitHub first:"
  gh auth login
fi
echo "✅ GitHub authenticated"

# ── 3. Supabase ──
echo ""
echo "── Supabase Setup ──"

if [ "$HAS_SUPABASE" = true ]; then
  echo "Do you want to create a new Supabase project? (y/n)"
  read -r CREATE_SUPABASE

  if [ "$CREATE_SUPABASE" = "y" ]; then
    echo "Enter your Supabase access token (from https://supabase.com/dashboard/account/tokens):"
    read -rs SUPABASE_ACCESS_TOKEN
    export SUPABASE_ACCESS_TOKEN

    echo "Enter a database password:"
    read -rs DB_PASSWORD

    echo "Creating Supabase project..."
    SUPABASE_OUTPUT=$(supabase projects create "$APP_NAME" --db-password "$DB_PASSWORD" --region us-east-1 2>&1)
    SUPABASE_PROJECT_REF=$(echo "$SUPABASE_OUTPUT" | grep -oP 'Created.*: \K\S+' || echo "")

    if [ -z "$SUPABASE_PROJECT_REF" ]; then
      echo "Enter your Supabase project ref manually (from the URL: supabase.com/dashboard/project/XXXXX):"
      read -r SUPABASE_PROJECT_REF
    fi

    echo "Linking and pushing migrations..."
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
    supabase db push

    echo "✅ Supabase project created and migrations applied"
  fi
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "Enter your Supabase project ref (from URL: supabase.com/dashboard/project/XXXXX):"
  read -r SUPABASE_PROJECT_REF
fi

echo "Enter your Supabase project URL (e.g. https://xxxxx.supabase.co):"
read -r SUPABASE_URL

echo "Enter your Supabase anon key:"
read -r SUPABASE_ANON_KEY

echo "Enter your Supabase service_role key:"
read -rs SUPABASE_SERVICE_ROLE_KEY
echo ""

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Enter your Supabase access token (for CI migrations, from https://supabase.com/dashboard/account/tokens):"
  read -rs SUPABASE_ACCESS_TOKEN
  echo ""
fi

echo "✅ Supabase configured"

# ── 4. Vercel ──
echo ""
echo "── Vercel Setup ──"

# Login if needed
if ! vercel whoami &>/dev/null 2>&1; then
  echo "📌 Log in to Vercel:"
  vercel login
fi

# Link project
echo "Linking Vercel project..."
vercel link --yes 2>/dev/null || vercel link

# Get project/org IDs
VERCEL_ORG_ID=$(jq -r '.orgId' .vercel/project.json)
VERCEL_PROJECT_ID=$(jq -r '.projectId' .vercel/project.json)

# Get token
echo "Enter your Vercel token (from https://vercel.com/account/tokens → Create):"
read -rs VERCEL_TOKEN
echo ""

# Set env vars in Vercel
echo "Setting Vercel environment variables..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --token="$VERCEL_TOKEN" 2>/dev/null || true
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token="$VERCEL_TOKEN" 2>/dev/null || true
echo "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --token="$VERCEL_TOKEN" 2>/dev/null || true
# Generate VAPID keys if not provided
echo "Generating VAPID keys for push notifications..."
VAPID_KEYS=$(npx web-push generate-vapid-keys --json 2>/dev/null || echo '{}')
VAPID_PUBLIC=$(echo "$VAPID_KEYS" | jq -r '.publicKey // empty')
VAPID_PRIVATE=$(echo "$VAPID_KEYS" | jq -r '.privateKey // empty')

if [ -z "$VAPID_PUBLIC" ]; then
  echo "Enter your VAPID public key (or run 'npx web-push generate-vapid-keys'):"
  read -r VAPID_PUBLIC
  echo "Enter your VAPID private key:"
  read -rs VAPID_PRIVATE
  echo ""
fi

echo "Enter the email for VAPID_SUBJECT (e.g. mailto:you@example.com):"
read -r VAPID_SUBJECT

echo "$VAPID_PUBLIC" | vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production --token="$VERCEL_TOKEN" 2>/dev/null || true
echo "$VAPID_PRIVATE" | vercel env add VAPID_PRIVATE_KEY production --token="$VERCEL_TOKEN" 2>/dev/null || true
echo "$VAPID_SUBJECT" | vercel env add VAPID_SUBJECT production --token="$VERCEL_TOKEN" 2>/dev/null || true

# Add custom domain
echo "Adding custom domain: ${APP_NAME}.${DOMAIN}"
vercel domains add "${APP_NAME}.${DOMAIN}" --token="$VERCEL_TOKEN" 2>/dev/null || true

echo "✅ Vercel configured"

# ── 5. Cloudflare DNS ──
echo ""
echo "── Cloudflare DNS ──"
echo "Do you want to set up Cloudflare DNS? (y/n)"
read -r SETUP_CF

CF_API_TOKEN=""
CF_ZONE_ID=""

if [ "$SETUP_CF" = "y" ]; then
  echo "Enter your Cloudflare API token (create at https://dash.cloudflare.com/profile/api-tokens with Zone:DNS:Edit):"
  read -rs CF_API_TOKEN
  echo ""

  echo "Enter your Cloudflare Zone ID (from the domain overview page):"
  read -r CF_ZONE_ID

  # Create CNAME record
  echo "Creating CNAME: ${APP_NAME}.${DOMAIN} → cname.vercel-dns.com"
  curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"${APP_NAME}\",\"content\":\"cname.vercel-dns.com\",\"proxied\":false}" | jq .

  echo "✅ Cloudflare DNS configured"
fi

# ── 6. Set GitHub secrets ──
echo ""
echo "── Setting GitHub Secrets ──"

gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN" --repo "$REPO"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID" --repo "$REPO"
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID" --repo "$REPO"
gh secret set SUPABASE_ACCESS_TOKEN --body "$SUPABASE_ACCESS_TOKEN" --repo "$REPO"
gh secret set SUPABASE_PROJECT_REF --body "$SUPABASE_PROJECT_REF" --repo "$REPO"

if [ -n "$CF_API_TOKEN" ]; then
  gh secret set CLOUDFLARE_API_TOKEN --body "$CF_API_TOKEN" --repo "$REPO"
  gh secret set CLOUDFLARE_ZONE_ID --body "$CF_ZONE_ID" --repo "$REPO"
  gh secret set CLOUDFLARE_DOMAIN --body "$DOMAIN" --repo "$REPO"
  gh secret set APP_SUBDOMAIN --body "$APP_NAME" --repo "$REPO"
fi

echo "✅ All GitHub secrets set"

# ── 7. Configure Supabase auth & Google OAuth ──
echo ""
echo "── Auth Configuration ──"

# Google OAuth (shared across all projects)
echo "Do you want to configure Google OAuth? (y/n)"
echo "(If already set up for another project, enter the same credentials)"
read -r SETUP_GOOGLE

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

if [ "$SETUP_GOOGLE" = "y" ]; then
  echo "Enter Google OAuth Client ID:"
  read -r GOOGLE_CLIENT_ID
  echo "Enter Google OAuth Client Secret:"
  read -rs GOOGLE_CLIENT_SECRET
  echo ""

  gh secret set GOOGLE_CLIENT_ID --body "$GOOGLE_CLIENT_ID" --repo "$REPO"
  gh secret set GOOGLE_CLIENT_SECRET --body "$GOOGLE_CLIENT_SECRET" --repo "$REPO"
  echo "✅ Google OAuth secrets saved"
fi

echo ""
echo "Note: Auth URLs and Google OAuth are configured automatically on deploy."
echo ""

# ── 8. Trigger first deploy ──
echo "Pushing to trigger first deploy..."
git push origin main 2>/dev/null || git push origin master 2>/dev/null || echo "Push manually to trigger deploy"

echo ""
echo "======================================"
echo "  ✅ Setup complete!"
echo "======================================"
echo ""
echo "  From now on:"
echo "  • Code from your phone via Claude Code"
echo "  • Push to main → auto-deploys to Vercel"
echo "  • DB migrations auto-applied"
echo "  • DNS already configured"
echo ""
echo "  Your app: https://${APP_NAME}.${DOMAIN}"
echo "======================================"
