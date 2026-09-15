# AXE ONE · PRODUCT STAGING

AXE ONE is the customer-facing brand for the existing AXE PRODUCT platform.

## Release

- WEB STAGING 3.26.13 / package `1.7.41-web-ui.74`
- FUND ledger reference-layout correction on top of 3.26.12.
- Returns the full FUND rail to the same compact 636px width as the top summary and tabs.
- Keeps all eight ledger columns: `날짜 / 이름 / 계좌 / 내역 / 구분 / 금액 / 증빙 / 관리`.
- Header and body use the exact same grid tracks and per-column alignment.
- Tightens row height, gaps, action buttons, and type sizes so all eight columns fit without clipping.
- The ledger is intended to become the visual reference before propagating the same rhythm to the other operational tables.
- No business logic, data model, DB RPC, BOT behavior, or LIVE environment is changed.

## Deployment

This repository is WEB STAGING. Preserve `.git`, replace the rest of the GitHub STAGING working tree with this FULL CLEAN package, commit, push, and confirm Vercel is Ready. Do not use `apply-axe-product.sh` for WEB deployment.

## Internal compatibility names

Technical identifiers such as the `axe_product` schema, environment variables, storage/localStorage keys, and internal RPC names intentionally remain unchanged.

## Database / BOT

No DB migration and no BOT change are required for 3.26.13.

## Validation

- `npm run check`: run before packaging.
- Local `npm run build`: only when Vite is available in the workspace; final build confirmation remains Vercel Ready.
