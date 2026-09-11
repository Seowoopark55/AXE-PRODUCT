# AXE PRODUCT WEB STAGING

Current STAGING web source for WEB 3.17.2 FUND COLUMN ALIGNMENT R1, based on the verified 3.17.1 content-fit source.

## Runtime scope
- WEB STAGING only.
- Deploy only through GitHub STAGING -> commit/push -> Vercel Ready.
- Do not use `apply-axe-product.sh` for this WEB package.
- No DATABASE patch is included.
- No STAGING BOT patch is included.
- LIVE AXE BOT is not touched.


## 3.17.2 FUND column alignment
- Keeps the verified 636px content-fit ledger width from 3.17.1.
- Centers all six desktop ledger headers on their lane axes.
- Centers member, detail, and amount row values under the same axes; detail badges stay grouped with the title.
- Company Settings, DB, BOT, and LIVE AXE are untouched.

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

5. FUND weekly console cleanup
   - Weekly status requests are limited to real Saturday-based fund periods for the selected month.
   - Months with four Saturdays no longer request week 5, so the browser console stays clean.

## Company cooking menu
Company Settings includes a company-scoped cooking menu manager backed directly by `axe_product.cooking_order_types` and existing authenticated RLS. The UI intentionally uses enable/disable instead of hard delete so historical order type keys remain stable.
