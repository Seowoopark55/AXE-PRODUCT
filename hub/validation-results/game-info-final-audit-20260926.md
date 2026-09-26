# LAC HUB Game Info Final Audit — 2026-09-26

## Scope
Final cleanup of the approved Game Info experience after the platform-admin content manager was added. The public Game Info layout, banner, category structure, information content and approved interaction direction were intentionally preserved.

## Runtime cleanup and safeguards
- Common Game Info tables now use stable paginated reads (`500` rows/page) so growing catalogues are not silently truncated by a single PostgREST response limit.
- Company-scoped modbooks retain their existing paginated/company-filtered read path.
- Active viewers cannot see ingredient rows belonging to an inactive craft.
- `info_images` mappings are also paginated. If the optional admin image table is unavailable, the public catalogue still falls back to bundled artwork instead of failing.
- Platform-admin writes remain routed through `lac_admin_save_game_info`; the browser does not directly insert/update/delete the shared catalogue tables.
- The admin list now correctly rebuilds when “비활성 정보 포함” changes, while live search filters the mounted list without destroying an unsaved editor draft.
- Renaming an item or skill without selecting a new image carries the previous image association to the new public key, preventing artwork from unexpectedly disappearing.
- Replacing an image under the same key removes the previous immutable storage object only when no other image mapping references it.
- Admin image objects use one-year browser caching because every upload receives a fresh UUID path.
- A catalogue/company reset clears stale admin drafts and revokes any temporary preview object URL.

## Static image optimization
The 85 bundled item/quest PNG files were replaced by 768px-max lossless WebP assets. All files retain alpha and remain substantially larger than their current ~230px maximum display size.

- Before: 107,471,559 bytes (102.49 MiB)
- After: 36,556,262 bytes (34.86 MiB)
- Reduction: 65.99% (70,915,297 bytes)
- Converted assets: 85/85
- Corrupt assets found: 0
- Remaining PNG files in `public/hub/game-info/items`: 0

This specifically improves the first-immediate-visit case where a user enters Game Info before the browser cache is warm. It does not force all catalogue artwork to preload on initial HUB entry.

## Code cleanup
- Removed three stale patch/restore README artifacts left by previous deployment bundles.
- Kept historical phase CSS/check files that are not imported at runtime because deleting them would unnecessarily alter project history and legacy validation tooling.
- Did not aggressively collapse the approved `game-center.css` cascade: the current banner/UI is stable, and a cosmetic refactor would carry more regression risk than operational benefit at finalization.
- Added `scripts/game-info-final-check.mjs` and `npm run check:game-info` as the current Game Info regression check.
- The main project `npm run check` now runs the current Game Info check first.

## Verification
- `node --check` PASS:
  - `src/lib/productApi.js`
  - `src/ui/infoPage.js`
  - `src/ui/gameInfoAdmin.js`
  - `src/ui/render.js`
  - `src/main.js`
  - `scripts/game-info-final-check.mjs`
- `npm run check:game-info` → PASS.
- Current public template render smoke test → PASS.
- Current admin template render smoke test → PASS.
- All 82 unique runtime static item/quest WebP references resolve to files → PASS.
- Full project `npm run check` was executed. Game Info and the preceding suites pass; the command still exits 1 at the pre-existing, unrelated `First-run registration gate` suite (21/28 PASS, 7 failures), matching the baseline issue outside this scope.
- `npm ci`/Vite build could not be completed in the execution environment because dependency installation did not complete and was terminated. No successful production build is claimed by this audit.

## Database impact
This final cleanup adds no new database schema or policy migration. It assumes the previously supplied Game Info admin migration is already applied when admin write/image functions are used.

## Final assessment
Within the verified source-level and render-level scope, Game Info is ready to freeze as the current operating version. The remaining known project-check failures belong to first-run registration/onboarding and should be handled separately rather than by changing Game Info.
