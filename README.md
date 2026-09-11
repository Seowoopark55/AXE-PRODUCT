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


## 3.17.4 · FUND APP SHELL BALANCE R1
- FUND page: top company banner removed
- FUND page: refresh button removed
- Sidebar no longer stretches with a large empty footer gap
- FUND summary/ledger aligned to a tighter app shell rail


## 3.17.5 · GLOBAL APP SHELL HARMONIZATION R1
- Restored shell max constraint below 1440px so header account area stays inside the app frame
- FUND summary reduced to 3 metrics (removed pending review card)
- Members / Assets / Accounts / Settings page shells are left-anchored to the same compact content rail
- Compact boards, settings boards, review strips and tabs no longer auto-center inside the page shell


## 3.17.6 · CONTENT-FIT PROPAGATION R1
- Removed the company banner from all main pages so each management page starts tighter under the global header
- Reduced shell max to 1020px so the top-right account box stays further inside the app frame
- FUND summary/tabs/ledger now share the same 636px rail
- Members / Assets / Accounts / Settings now use page-specific content-fit rails for both the top summary and the working board


## 3.17.7 · FUND VISUAL STANDARD PROPAGATION R1
- Members / Assets / Accounts now inherit FUND's 636px operational frame
- Header title/description rhythm and summary-card density match FUND
- Assets navigation adopts the same underline-tab grammar as FUND
- Top-right user identity is aligned inside the active content rail instead of the outer shell edge
- Company Settings is explicitly excluded: its 3.17.3 gold layout is restored and its company banner remains available there
- LIVE AXE / PRODUCT BOT / DB are untouched
