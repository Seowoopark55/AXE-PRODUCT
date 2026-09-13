# AXE PRODUCT WEB 3.23.3 · QUESTION IMAGE LIGHTBOX

STAGING only.

## Changes
- Question/reply attachment clicks no longer open a browser tab.
- Images open in an AXE PRODUCT in-app lightbox over the current question thread.
- Close controls: top-right X, bottom Close button, backdrop click, ESC key.
- The underlying question thread stays open after the image viewer closes.
- No DB migration and no BOT change are required for this UI-only refinement.

## Apply order
1. Overwrite the GitHub WEB STAGING project with this package.
2. Commit/push and confirm Vercel STAGING is Ready.

Do not deploy this WEB package with `apply-axe-product.sh`.
