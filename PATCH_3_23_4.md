# AXE PRODUCT WEB 3.23.4 · QUESTION IMAGE LIGHTBOX LAYER FIX

STAGING only.

## Issue
- The question/reply image lightbox used z-index 1800 while the runtime question modal backdrop uses z-index 5000.
- The image viewer therefore rendered behind the open question modal and appeared hidden by it.

## Fix
- Raised `.support-image-lightbox` to z-index 8000.
- The viewer now sits above the question modal, while global runtime banners remain above the viewer.
- Existing close methods remain: top-right X, bottom Close, backdrop click, ESC.
- No DB migration and no BOT change are required.

## Apply
1. Overwrite GitHub WEB STAGING with this package.
2. Commit/push.
3. Confirm Vercel STAGING Ready.

Do not deploy with `apply-axe-product.sh`.
