# AXE PRODUCT WEB STAGING

Current STAGING web source for **WEB 3.17.3 FUND LEFT-ANCHOR BALANCE R1**, based on the verified 3.17.2 source.

## Runtime scope
- WEB STAGING only.
- Deploy only through GitHub STAGING -> commit/push -> Vercel Ready.
- Do not use `apply-axe-product.sh` for this WEB package.
- No DATABASE patch is included.
- No STAGING BOT patch is included.
- LIVE AXE BOT is not touched.

## 3.17.3 FUND left-anchor balance
- FUND-only page rail is capped at 900px and anchored to the left edge of the main workspace.
- The company banner on the FUND page follows the same 900px rail so banner / summary / tabs / ledger share one visual origin.
- The ledger remains 636px content-fit, but is left anchored instead of floating in the center.
- Ledger columns now consume the whole 636px board with a flexible detail lane.
- `금액` header and amount values share the same centered column axis.
- Approved/manual source badges are removed from ledger rows; an approved entry already being present in the ledger is enough state information.
- `관리` always reserves a visible `수정` control. Rows reported by the current DB as `can_edit=true` remain fully editable; rows reported as non-editable show a disabled `수정` control rather than a meaningless dash.

## Important DB boundary
This WEB patch does **not** bypass the DB-provided `can_edit` flag. Approval-linked rows that the current PRODUCT DB reports as non-editable are intentionally not forced editable from the browser. Enabling those rows requires verifying the actual STAGING DB function behavior first; no DB assumption is made in this package.

## Preserved behavior
- Company Settings visual layout and behavior are untouched.
- Members / assets / returns / accounts content-fit rules are untouched.
- Discord OAuth/connect flow is untouched.
- FUND data RPC bindings are unchanged.
- Mobile FUND fallback is unchanged.
