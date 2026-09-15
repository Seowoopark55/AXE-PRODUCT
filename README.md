# AXE ONE · PRODUCT STAGING

AXE ONE is the customer-facing brand for the existing AXE PRODUCT platform.

## Release

- WEB STAGING 3.26.10 / package `1.7.41-web-ui.71`
- Second-pass visual cleanup for operational lists and compact identity rows.
- Hides single-page range footers, moves role/order/type metadata into compact inline badges, and removes generic placeholder copy.
- Reworks the fund ledger into single-line date/account/type/status metadata while preserving all operational information.
- Keeps meaning-bearing data, privacy notices, permission disclosures, module descriptions, and onboarding/error guidance.

## Deployment

This repository is WEB STAGING. Deploy by replacing the GitHub working tree contents with this FULL CLEAN package, committing, pushing, and confirming Vercel is Ready. Do not use `apply-axe-product.sh` for WEB deployment.

## Internal compatibility names

The following technical identifiers intentionally remain unchanged to avoid unnecessary migration risk:

- Supabase schema: `axe_product`
- Environment variables such as `AXE_PRODUCT_APP_URL`
- Existing storage / localStorage keys and internal function names
- Repository / Vercel URL may remain on the existing technical name until separately migrated

## Database

No new DB migration is required for 3.26.10.

## Validation

- `npm run check`: PASS
- Local `npm run build` requires Vite dependencies to be installed; final build confirmation remains Vercel Ready.
