# AXE PRODUCT WEB STAGING · UI 3.14.3 + DB BRIDGE 1.7.37

이 ZIP은 AXE PRODUCT 상품화 WEB STAGING용 Vite 전체 소스입니다.
LIVE AXE BOT/AXE NET 배포 파일이 아닙니다.

## Preconditions
- PRODUCT STAGING Supabase에 AXE_PRODUCT_1_7_37_WEB_OPERATIONS_BRIDGE.sql 적용 완료
- 1.7.37 validation functions=true / feedback_rls=true / raw_write_seal=false 확인 완료
- 기존 Vercel 환경변수는 유지

## Deployment boundary
- WEB STAGING only
- DO NOT run: bash ~/apply-axe-product.sh ...
- DO NOT touch: /home/pyipsw001/axe-bot or PM2 axe-bot
- No .env / Discord secret / service-role key included

## What is integrated
- AXE PRODUCT UI baseline 3.14.3
- Discord OAuth / company multi-tenancy / axe_product schema lock preserved
- Fund treasury ledger + weekly status/review/balance/settings
- Members admin
- Assets inventory/returns
- Accounts request/review
- Company settings + Discord role/channel selection
- Feedback/report submission

## Local checks
- npm run check
  - source boundary check
  - WEB 1.7.37 RPC binding check
  - protected raw-write check
  - UI structure/safety check
