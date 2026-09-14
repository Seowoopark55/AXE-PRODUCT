# AXE ONE · PRODUCT STAGING

AXE ONE is the customer-facing brand for the existing AXE PRODUCT platform.

## Deployment

This repository is WEB STAGING. Deploy by replacing the GitHub working tree contents with this FULL CLEAN package, committing, pushing, and confirming Vercel is Ready. Do not use `apply-axe-product.sh` for WEB deployment.

## Internal compatibility names

The following technical identifiers intentionally remain unchanged to avoid unnecessary migration risk:

- Supabase schema: `axe_product`
- Environment variables such as `AXE_PRODUCT_APP_URL`
- Existing storage / localStorage keys and internal function names
- Repository / Vercel URL may remain on the existing technical name until separately migrated

## Database

SQL history is kept under `database/migrations/`. The AXE ONE brand migration for this release is `SUPABASE_MIGRATION_3_26_5_AXE_ONE_BRAND.sql`.

## Validation

Run `npm run check` before deployment when dependencies are installed.
