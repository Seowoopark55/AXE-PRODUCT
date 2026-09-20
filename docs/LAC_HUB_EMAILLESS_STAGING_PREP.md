# LAC HUB Discord identify-only login: STAGING preparation

Source: user's latest `lac one(1).zip`. This package changes **one runtime file**:
`api/auth/discord-userinfo.js`. This server-side GET endpoint is only a
userinfo format adapter; **it does not replace the website login**. It passes a
Discord OAuth bearer token to Discord's `/users/@me`, validates the Discord ID,
and returns a normalized `sub` / `provider_id` JSON response with **no email**.
No secrets are configured or logged. The endpoint returns no sessions or accounts.

## Why it is needed
Discord's `identify` userinfo response returns `id`, not `sub`. Supabase's
custom OAuth2 provider reads OIDC-like userinfo fields and requires `sub` to
resolve the identity. Merely registering Discord's original userinfo endpoint
in the Supabase generic provider can fail with a missing provider ID.

## Deliberately NOT done
- No change to existing `discord` provider or its login button / default scope.
- No Supabase settings, migrations, account identities, UID, memberships, RLS,
  callback URLs, or bot/AXE NET files are changed.
- No `linkIdentity` call is made and no user is signed out.
- The new endpoint by itself does **not** remove email permission from login.

## Do not switch login until a later stage has completed
1. Separately register a **generic OAuth2** custom provider with `identify`
   and `email_optional: true`; don't invent an issuer or JWKS URL. Set its
   userinfo URL to this adapter's deployed HTTPS URL. A UI validation bug may
   require Supabase's official Admin API; do not put any admin keys in GitHub,
   Vite environment variables, frontend code, or the chat.
2. While signed in as the original representative user, enable/manual-link
   the custom identity via `linkIdentity`. Verify the identity is linked to
   the **same** Supabase UID. Do not attempt a normal custom-provider sign-in
   first, which could create a separate account.
3. Test a fresh custom-provider sign-in on STAGING, verify original UID and
   company permissions, then switch the STAGING login configuration. Retain
   existing `discord` provider as rollback until verified.

If STAGING and production share one Supabase project, provider creation and
manual-linking settings affect both. Keep all changes gated until explicitly
reviewed; do not deploy this package to AXE NET or AXE BOT.
