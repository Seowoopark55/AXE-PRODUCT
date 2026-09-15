# AXE ONE · PRODUCT STAGING

AXE ONE is the customer-facing brand for the existing AXE PRODUCT platform.

## Release

- WEB STAGING 3.26.9 / package `1.7.41-web-ui.70`
- Extends the dashboard cleanup across the main operating tabs.
- Removes redundant helper copy where labels, values, states, or controls are already self-explanatory.
- Keeps meaning-bearing metadata, privacy notices, permission disclosures, module descriptions, and onboarding/error guidance.

## Deployment

This repository is WEB STAGING. Deploy by replacing the GitHub working tree contents with this FULL CLEAN package, committing, pushing, and confirming Vercel is Ready. Do not use `apply-axe-product.sh` for WEB deployment.

## Internal compatibility names

The following technical identifiers intentionally remain unchanged to avoid unnecessary migration risk:

- Supabase schema: `axe_product`
- Environment variables such as `AXE_PRODUCT_APP_URL`
- Existing storage / localStorage keys and internal function names
- Repository / Vercel URL may remain on the existing technical name until separately migrated

## Database

No new DB migration is required for 3.26.9.

## Validation

- `npm run check`: PASS
- Local `npm run build` requires Vite dependencies to be installed; final build confirmation remains Vercel Ready.
