# AXE PRODUCT WEB STAGING

Current STAGING web source consolidated from the user-uploaded repository snapshot on 2026-09-11.

## Runtime scope
- WEB STAGING only.
- Deploy only through GitHub STAGING -> commit/push -> Vercel Ready.
- Do not use `apply-axe-product.sh` for this WEB package.
- No DATABASE patch is included.
- No STAGING BOT patch is included.
- LIVE AXE BOT is not touched.

## Included fixes
1. FUND weekly payment status refresh
   - Opening `납부 현황` always reloads `fund_admin_get_period_status`.
   - The FUND `새로고침` button also reloads weekly status while that tab is active.
   - This prevents an already-approved payment from remaining as a stale `미납` mark.

2. FUND approved weekly-payment label hardening
   - Rows with `entry_type = payment` are rendered as `주간공금` / `공금납부`.
   - This matches the verified DB row and `fund_admin_get_treasury_snapshot`, which pass the ledger fields through unchanged.
   - The uploaded source did not contain the literal `추가입금`; the staging screen that showed that label was therefore not consistent with this source + verified DB response. Deploying this consolidated source removes that mismatch and the renderer now defensively normalizes weekly payment rows.

## Preserved behavior
- Discord OAuth/connect flow.
- Catalog-ready onboarding gate.
- Stable role/channel native select behavior.
- Inline SVG favicon.
- Existing FUND / members / assets / accounts / settings RPC bindings.
