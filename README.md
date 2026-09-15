# AXE ONE · PRODUCT STAGING

AXE ONE is the customer-facing brand for the existing AXE PRODUCT platform.

## Release

- WEB STAGING 3.26.14 / package `1.7.41-web-ui.75`
- Keeps the 3.26.13 FUND ledger 636px reference rail and compact density.
- Keeps all eight ledger columns: `날짜 / 이름 / 계좌 / 내역 / 구분 / 금액 / 증빙 / 관리`.
- Aligns every header and row value to the same center axis inside its grid track.
- Fixes the visual drift where only 날짜 appeared centered while 이름/계좌/내역/구분/금액 leaned to an edge.
- Long text remains ellipsized inside its own column, so the compact board width is preserved.
- No business logic, data model, DB RPC, BOT behavior, or LIVE environment is changed.

## Deployment

This repository is WEB STAGING. Preserve `.git`, replace the rest of the GitHub STAGING working tree with this FULL CLEAN package, commit, push, and confirm Vercel is Ready. Do not use `apply-axe-product.sh` for WEB deployment.

## Internal compatibility names

Technical identifiers such as the `axe_product` schema, environment variables, storage/localStorage keys, and internal RPC names intentionally remain unchanged.

## Database / BOT

No DB migration and no BOT change are required for 3.26.14.

## Validation

- `npm run check`: run before packaging.
- Local `npm run build`: only when Vite is available in the workspace; final build confirmation remains Vercel Ready.
