# AXE ONE · PRODUCT STAGING

AXE ONE is the customer-facing brand for the existing AXE PRODUCT platform.

## Release

- WEB STAGING 3.26.11 / package `1.7.41-web-ui.72`
- Replaces the 3.26.10 inline metadata-badge experiment with explicit data columns.
- Keeps the 3.26.8~3.26.10 copy cleanup: obvious helper copy stays removed, single-page footers stay hidden, and filtered-result counts only appear when useful.
- Members: `이름 / 역할 / 입사일 / 상태 / 관리`.
- Assets: `보유자 / 자산 / 취득 방식 / 분류 / 상태 / 관리`.
- Returns: `자산 / 이전 보유자 / 처리 / 메모 / 확인자 / 처리일`.
- Accounts: `이름 / 역할 / 계좌번호 / 상태 / 관리`.
- FUND ledger: `날짜 / 이름 / 계좌 / 내역 / 구분 / 금액 / 증빙 / 관리`; dates remain single-line and memo text stays in the 내역 lane.
- FUND weekly/review views also expose role/payment metadata as columns instead of second-line helper text.
- Cooking menu: `메뉴 / 설명 / 가격 / 순서 / 상태 / 관리`; generic placeholder descriptions stay hidden.
- PLATFORM OWNER company list: company, Discord, member count, status, plan, period, owner, and management are separated into columns.
- Status/action controls remain badges or buttons only where rapid state recognition or interaction is useful.
- Responsive rows expose field labels on narrow screens so the added columns remain understandable.

## Deployment

This repository is WEB STAGING. Deploy by preserving `.git`, replacing the rest of the GitHub STAGING working tree with this FULL CLEAN package, committing, pushing, and confirming Vercel is Ready. Do not use `apply-axe-product.sh` for WEB deployment.

## Internal compatibility names

The following technical identifiers intentionally remain unchanged to avoid unnecessary migration risk:

- Supabase schema: `axe_product`
- Environment variables such as `AXE_PRODUCT_APP_URL`
- Existing storage / localStorage keys and internal function names
- Repository / Vercel URL may remain on the existing technical name until separately migrated

## Database / BOT

No DB migration and no BOT change are required for 3.26.11.

## Validation

- `npm run check`: PASS.
- Local `npm run build`: not executed successfully in this workspace because the Vite binary is not installed (`vite: not found`). Final build confirmation remains Vercel Ready.
