# AXE PRODUCT STAGING — STAGE 3A

Independent multi-tenant product frontend. This package consolidates STAGE 2 + HOTFIX 1 + HOTFIX 2 and adds the STAGE 3A secure invitation UI.

## Included STAGE 3A flows
- OWNER / ADMIN creates invitation codes.
- Raw code is shown only immediately after creation.
- Invitation list exposes hint/status/use count/expiry, never the stored SHA-256 hash.
- OWNER / ADMIN can revoke an active invitation.
- Logged-in users can join a company by invite code.
- Users with no company see Create Company and Join by Invite side-by-side.
- Existing users can join another company from the sidebar.
- Successful join refreshes tenant list and opens the joined company.

## Security boundary
- Supabase client remains locked to `axe_product`.
- No service-role key in browser source.
- No query to AXE HUB `public.profiles` / `public.builds`.
- No `new_axe_net` reference.
- Invitation table direct access remains blocked; frontend uses STAGE 3A RPCs only.

## Deployment
Replace the AXE-PRODUCT repository contents with this integrated package (or upload the changed files), then commit. Vercel redeploys automatically. Existing Vercel environment variables stay unchanged.
