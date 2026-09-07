# AXE PRODUCT — STAGE 4C

Track: **[상품화] only**

This is the full AXE-PRODUCT web source package for STAGE 4C.
It is based on the uploaded latest AXE-PRODUCT source and requires the already-applied STAGE 4A + 4B database/RPC layer.

## Added in STAGE 4C
- Dedicated `공금` navigation item.
- The menu is available only when the company `fund` module is ON.
- MEMBER: read-only recent personal fund periods and status.
- OWNER / ADMIN: company period status by year/month/week.
- OWNER / ADMIN: weekly fee rule starting from a selected period.
- OWNER / ADMIN: payment request queue and approve / hold / reject actions.
- Evidence values are read-only; HTTP(S) evidence can be opened safely in a new tab.

## Deliberately NOT included yet
- Member web payment submission.
- Evidence file upload / Supabase Storage bucket.
- Discord fund panel / buttons / commands.
- Changes to `axe-product-staging-bot`.
- Changes to live `axe-bot`, NEW AXE NET, or AXE HUB.

Member web submission stays closed because `fund_submit_request` requires an evidence path. We do not bypass that requirement with a fake path or arbitrary URL input. Evidence storage will be implemented first in the next stage.

## Security boundary
The web does not access `fund_*` tables directly. STAGE 4C uses only the authenticated STAGE 4B RPCs:
- `fund_get_my_periods`
- `fund_admin_list_requests`
- `fund_admin_get_period_status`
- `fund_admin_review_request`
- `fund_admin_set_fee_rule`

Tenant isolation and OWNER/ADMIN authorization remain enforced by the database RPC layer.

## Deployment target
- GitHub repository: AXE-PRODUCT only.
- Vercel project: axe-product only.
- No SSH bot deployment in STAGE 4C.

Do not copy this package into NEW AXE NET, AXE HUB, or either Discord bot directory.
