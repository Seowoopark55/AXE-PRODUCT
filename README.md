# AXE PRODUCT STAGING — STAGE 3B AUTO DISCORD CONNECT

This is the consolidated frontend/serverless package after STAGE 3A.

## What is added
- Company Settings -> Discord Server Connect button.
- OWNER / ADMIN only.
- Discord Authorization Code Grant with signed `state`.
- Guild installation context only.
- Bot permission request = 0.
- Discord returns the selected guild after OAuth code exchange.
- Browser never receives the Discord client secret.
- Guild ID / SQL manual entry is no longer required for normal use.
- Completion is bound back to the same Supabase user and company.
- Existing `axe_product.discord_connections` RLS performs the final DB authorization.
- Existing UNIQUE(company_id) and UNIQUE(guild_id) remain the duplicate guard.

## Security design
No Supabase server master key is introduced.

The Vercel API verifies the current Supabase user with the browser's short-lived access token, verifies OWNER/ADMIN membership through `axe_product` RLS, and performs the final connection upsert using that same user token.

OAuth flow:
1. Browser POST /api/discord/start with current Supabase bearer token.
2. Vercel verifies user + company OWNER/ADMIN.
3. Vercel creates HMAC-signed 10-minute OAuth state.
4. Discord guild install / authorization.
5. /api/discord/callback validates state and exchanges the code server-side.
6. Discord's guild object is converted to a short-lived signed completion token.
7. Completion token returns in URL fragment, not query string.
8. Browser POST /api/discord/complete with Supabase bearer token.
9. Vercel re-checks same user + OWNER/ADMIN and upserts `discord_connections` under RLS.

## Required Vercel environment variables
Already configured during STAGE 3B:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- DISCORD_CLIENT_ID
- DISCORD_CLIENT_SECRET
- DISCORD_OAUTH_STATE_SECRET

Optional overrides (not required for current production STAGING URL):
- DISCORD_REDIRECT_URI
- AXE_PRODUCT_APP_URL

Default callback:
https://axe-product.vercel.app/api/discord/callback

## Required Discord Developer Portal setting
AXE Staging -> Bot -> Require OAuth2 Code Grant = ON

## Deployment
Replace the AXE-PRODUCT GitHub repository contents with this package and commit.
Vercel should redeploy automatically.

No SSH bot files are changed by this package.
The PM2 process `axe-product-staging-bot` remains separate from the live `axe-bot`.


## STAGE 3D-C — Discord channel/role mapping UI

Added:
- company-scoped read of `discord_guild_channels`
- company-scoped read of `discord_guild_roles`
- company-scoped `discord_company_config`
- OWNER / ADMIN channel and role mapping form
- catalog refresh control
- members remain read-only

The browser does not write catalog rows.
The browser can only save company mapping through existing tenant RLS.
No service-role key was introduced.


## STAGE 3E-C
- OWNER/ADMIN test notification button
- enqueue_discord_test_notification RPC only
- recent delivery status read-only
- no arbitrary guild/channel/message input
- no service-role key
