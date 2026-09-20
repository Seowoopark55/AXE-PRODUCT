# LAC ONE WEB · R2 corrective release (STAGING ONLY)

Source: uploaded `lac one.zip` WEB full package 1.7.41-web-ui.79, plus branding-only text work from R1. Do not apply to old AXE NET or operational BOT.

Correction: original generated black/gold outer wallpaper and compact 1672x941 premium login layout are restored, using separate retouched logo-clean image assets; no CSS-gradient replacement. The side wallpaper was retouched in several repeated AXE-logo locations, so inspect the dark textured side rails in STAGING before considering LIVE. Original login from uploaded ZIP contained only old `runtime-auth-card` markup even though the premium CSS existed but was not imported. This release reconnects that existing design to the working Discord login action. It does NOT invent invite-code login or change authentication logic.

Studio: original upload contains `src/ui/layoutStudio.js` and `src/styles/layout-studio.css` but no studio route, UI or handlers. This release restores a PLATFORM OWNER-only account menu, studio page, live settings, local save/revert/reset and persisted visual tokens. Storage key is the original one, and no DB writes are added.


Deploy to WEB STAGING via whole-folder GitHub copy/overwrite. Check premium login, background on desktop, account menu (PLATFORM OWNER), font + row + table width changed in Studio and preserved after reload. Non-owner accounts must not see Studio.

## Validation and remaining uncertainty
- `npm run check` and `node scripts/lac-one-rebrand-r2-check.mjs` pass in the isolated source workspace.
- Static JavaScript syntax checks pass.
- Local final Vite build is **not verified** because this workspace lacks a usable `vite` binary; verify Vercel STAGING build.
- Chromium headless preview did not complete in the isolated execution environment; actual desktop/mobile login and platform-owner Studio need screenshots and interaction check in STAGING.
- Uploaded `lac one.zip` has the premium login CSS and Studio helper/CSS, but does not contain working premium login markup or Studio route/actions. R2 reconnects/reconstructs these using the supplied implementation rather than promising byte-for-byte restoration of an unavailable earlier UI.
- Historic Phase 1 Layout Studio checker expects unrelated member-registration changes not present in the supplied baseline. Use the new R2 checker for this release; do not remove member-registration UI just to satisfy an outdated test.
