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


## 3.17.8 · APP SHELL LEFT-RAIL COMPLETION R1
- Company Settings top company hero/banner is no longer rendered; settings begins directly under the global header.
- Company Settings is left-anchored on a 680px content rail; its header/overview/navigation use the same compact vertical rhythm as FUND.
- FUND `납부 현황 / 납부 검수 / 잔액 점검 / 공금 설정` subviews no longer auto-center; they share the same left origin as the FUND ledger.
- Top-right identity remains inside the active content rail: 636px for operational pages and 680px for Company Settings.
- Company banner data/upload behavior is preserved; this patch only removes the large page hero from the app shell.
- LIVE AXE / PRODUCT BOT / DB are untouched.


## 3.18.0 · PWA APP EXPERIENCE R1
AXE PRODUCT now has an installable standalone app layer on top of the 3.17.8 app-shell UI. The PWA service worker only handles same-origin static shell assets; operational data remains network-first and is never cached as business data.

### STAGING verification
- Install from Chrome/Edge and launch from the desktop/start menu.
- Confirm there is no browser address bar in standalone mode.
- Confirm Supabase Discord login and company Discord OAuth return correctly.
- Confirm Fund/Members/Assets/Accounts remain live network data.
- Toggle offline after one successful install: AXE should show an offline state rather than stale treasury/member/account data.
- When a later service worker is waiting, use `새 버전 적용` from the sidebar.


## 3.18.1 · DESKTOP APP FRAME R1
- Desktop browser: AXE PRODUCT now occupies nearly the whole window inside a visible application frame.
- Installed PWA: outer gutter contracts further so standalone mode reads like a native desktop console.
- Compact 636px/680px operation rails are preserved; only the surrounding application canvas expands.
- Main workspace receives a subtle full-height surface so unused right-side space belongs to the app instead of reading as an empty webpage.
- Header identity remains aligned to the active content rail inside the expanded frame.
- Service Worker cache bumped to `axe-product-pwa-3.18.1-r1`.
- LIVE AXE / PRODUCT BOT / DB unchanged.
