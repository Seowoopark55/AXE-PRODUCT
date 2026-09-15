# AXE ONE · PRODUCT STAGING

AXE ONE is the customer-facing brand for the existing AXE PRODUCT platform.

## Release

- WEB STAGING 3.26.12 / package `1.7.41-web-ui.73`
- Targeted FUND ledger alignment correction on top of 3.26.11.
- Keeps the explicit eight-column ledger: `날짜 / 이름 / 계좌 / 내역 / 구분 / 금액 / 증빙 / 관리`.
- Fixes the older 636px FUND parent rail that constrained the newer 760px ledger and clipped the right-side `관리` lane.
- Header and row now use the same grid tracks and the same per-column alignment: identity/text lanes left, date/evidence/manage centered, amount right-aligned.
- This ledger is the reference layout before propagating the same table rhythm to other operational lists.
- No business logic, data model, DB RPC, BOT behavior, or LIVE environment is changed.

## Deployment

This repository is WEB STAGING. Preserve `.git`, replace the rest of the GitHub STAGING working tree with this FULL CLEAN package, commit, push, and confirm Vercel is Ready. Do not use `apply-axe-product.sh` for WEB deployment.

## Internal compatibility names

Technical identifiers such as the `axe_product` schema, environment variables, storage/localStorage keys, and internal RPC names intentionally remain unchanged.

## Database / BOT

No DB migration and no BOT change are required for 3.26.12.

## Validation

- `npm run check`: PASS.
- Local `npm run build`: not executed successfully in this workspace because the Vite binary is not installed (`vite: not found`). Final build confirmation remains Vercel Ready.
