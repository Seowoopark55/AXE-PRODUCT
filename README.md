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


## 3.18.2 · CONTEXT UTILITY RAIL R1
- Uses the wide desktop workspace as an intentional context zone instead of stretching operational tables.
- Adds a page-aware utility rail for Fund / Members / Assets / Accounts / Settings.
- Rail shows current company + Discord/role context, page status metrics, and existing safe quick actions.
- Core operation rails remain 636px (Settings 680px); Utility Rail appears only at desktop widths >= 1280px.
- Service Worker cache bumped to `axe-product-pwa-3.18.2-r1`.

## 3.18.3 · QUIET WORKSPACE R1
- Context Utility Rail removed to avoid duplicate controls and duplicate status information.
- Wide desktop APP frame remains.
- Right-side open area is now a passive workspace field with only subtle structural lines and a low-contrast AXE PRODUCT signature.
- No clickable controls, operational counts, or duplicate navigation are rendered in the right-side field.
- Service Worker cache bumped to `axe-product-pwa-3.18.3-r1`.


## 3.18.4 · AXE AMBIENT BRAND SHELL R1
- Restored intentional left/right breathing room around the centered AXE PRODUCT app frame.
- Replaced empty outer margins with a subtle AXE ambient brand background built from newly synthesized black-and-gold emblem artwork.
- Removed the 3.18.3 internal quiet-workspace overlay so the decorative treatment lives outside the app, not inside the operational canvas.
- Desktop browser keeps larger side margins; standalone PWA keeps smaller but still visible side margins.
- Added `/public/brand/axe-ambient-shell-wide.png` and pre-cached it in the PWA service worker.


## 3.18.5 · CENTERED AMBIENT WEB SHELL R1
- PWA install/update experience removed. AXE PRODUCT is WEB-only again.
- Existing AXE PWA service workers/caches are actively unregistered/cleared once by the web client.
- The app frame is narrowed and exactly centered so left/right outside margins are equal.
- Ambient AXE artwork is now intentionally visible in the outer margins instead of being hidden behind an oversized app frame.
- The operational content rails and existing management functionality are unchanged.


## 3.18.6 · VISIBLE AMBIENT SIDES R1
- Fixed the ambient art being visually lost behind the dark overlay.
- Added a brighter side-focused brand asset: `/public/brand/axe-ambient-shell-wide-v2.png`.
- The brand artwork is now the actual body background rather than an opacity-filtered pseudo layer.
- Kept the centered 1120px app shell and equal left/right gutters from 3.18.5.
- PWA remains removed; no install/update UI is restored.


## 3.18.7 · ROOT-CAUSE BRANDED SHARED CONSOLE R1
- Root cause fixed: `index.html` applied an opaque background to `#app`, covering the body-level AXE artwork in the side gutters. `#app` is now transparent on desktop; the centered console remains opaque.
- AXE black/gold side artwork is deliberately stronger for a shared branded management console while operational surfaces stay readable.
- Equal 1120px centered console geometry remains unchanged.
- Company banner upload/registration is removed from Company Settings and from WEB runtime mutation wiring. Legacy storage/API support is not destructively deleted.
- PWA stays disabled; only legacy service-worker/cache cleanup remains.


## 3.18.8 · SUBTLE TILED BRAND SIDES R1
- Replaced the oversized dramatic emblem wallpaper with a subtle side-only branded shell.
- Side margins now show small repeated AXE logo tiles plus a faint grid/check overlay.
- The central app frame remains centered and unchanged in width.
- Company banner upload UI remains removed for the shared-console direction.


## 3.18.9 · DIAMOND BRAND SIDES R1
- Increased side-brand visibility while keeping the shared console tasteful.
- Replaced the previous square/check look with a faint diamond lattice.
- Small repeated AXE logo tiles remain only in the side margins, now slightly more visible.
- Central console width and layout remain unchanged.


## 3.18.10 · DIAMOND STAGGERED LOGO SIDES R1
- Side branding no longer uses logos in literal rows.
- The repeated AXE marks are arranged diagonally inside a larger tile so the pattern reads as staggered rather than lined up.
- The diamond lattice remains subtle and quieter than the logos.
- Central shared-console layout remains unchanged.


## 3.18.11 · GENERATED AMBIENT SHELL R1
- Applied the newly generated high-quality AXE side-shell artwork directly to the desktop web shell.
- Removed the previous repeated-logo pattern block from the active background.
- Preserved the centered 1120px shared-console app frame and existing content-fit layout.
- Company banner upload UI remains removed.


## 3.19.0 · GUIDED SETUP PREVIEW R1
- Login copy changed to ‘회사를 움직이는 하나의 콘솔.’ / ‘Discord 기반의 회사 운영을 더 간결하고 체계적으로.’
- Removed invite-code join entry points from the WEB UI; member onboarding points to Discord user context menu registration.
- Added a non-destructive Guided Setup preview in Company Settings. The preview simulates Discord connect → roles → modules → channels → completion and never writes company settings.
- Existing real onboarding/backend APIs remain intact; this release is for UX validation before replacing the live onboarding flow.


## 3.19.1 · GUIDED SETUP TYPOGRAPHY R1
- Increased text sizes throughout Guided Setup preview only.
- Layout, interactions, preview-only behavior, and real settings remain unchanged.


## 3.19.2 · GUIDED CHANNEL BUILDER PREVIEW R1
- Expanded the non-destructive Guided Setup preview with a channel configuration choice: Quick Setup or Direct Connect.
- Quick Setup proposes only the channels required by enabled features. Fund uses a single `공금현황판` channel because payment is handled from the same board.
- Before simulated creation, the company can freely edit the Discord category name and every proposed channel name.
- `이 구성으로 생성 체험` shows the resulting category/channel creation and automatic feature linkage without changing Discord or database data.
- Direct Connect remains available for companies that already have their own Discord channel structure.


## 3.19.3 · GUIDED MEMBER IMPORT + FIXED FOOTER R1
- Fixed Guided Setup footer clipping: channel/member content now scrolls inside the modal while the navigation footer stays visible.
- Added a preview-only bulk member registration quest after channel setup.
- Users can filter Discord members by a selected role (member/admin/guest), select visible users, and preview bulk AXE role assignment.
- Individual Discord right-click registration remains available as a later fallback.
- No Discord, DB, BOT, or LIVE AXE mutations are performed by this preview.
