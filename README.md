# AXE ONE WEB STAGING 3.26.17 · FUND reference table unification R1

Baseline: AXE ONE WEB STAGING 3.26.16.

Changes:
- FUND ledger `구분` no longer repeats `수입/지출`; direction remains visually encoded by signed amount/color.
- Members / Assets / Accounts desktop operational rails standardized to the proven 636px FUND ledger rail.
- Header and row cells share identical grid templates and centered visual axes.
- Core operational rows compacted to 40px; status/action controls remain explicit.
- Asset returns follow the same column-axis contract.
- Cooking menu list standardized to 636px with matching header/body axes and compact rows.
- FUND weekly status and FUND review sub-tables standardized to the same 636px/center-axis table grammar.
- Platform company management keeps 760px because of eight business columns, but header/value axes are centered consistently.
- Mobile labeled-row fallback is preserved.

Safety:
- WEB only.
- No DB migration.
- No BOT change.
- LIVE untouched.
- `index.html`, `src/main.js`, and root `src/styles.css` are byte-identical to 3.26.16; only targeted renderer/styles/checks changed.

Validation:
- `npm run check`: PASS (all project checks + 12/12 table-standard checks).
- `node --check src/ui/render.js`: PASS.
- CSS brace balance: PASS.
- Local `npm run build` not executed because Vite is not installed in the artifact workspace; use Vercel Ready as the final build check.
