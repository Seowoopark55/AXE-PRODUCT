# AXE PRODUCT WEB 3.22.1 · GUIDE DIALOG R1

## Goal
Make the Usage Guide feel like a focused help layer inside AXE PRODUCT instead of a sudden replacement website.

## Changes
- `사용 가이드` no longer changes the current page route.
- Opening the guide keeps the current dashboard/operations screen behind a dimmed backdrop.
- Guide Center now opens as a large dedicated dialog, matching Guided Setup's mental model.
- Added two obvious exits:
  - left rail `가이드 닫기`
  - top-right `×`
- Clicking the backdrop also closes the guide.
- The guide keeps its large two-pane layout and readable typography.
- Feature buttons inside the guide close the guide first, then navigate to the target operation page.
- Mobile uses a full-screen guide dialog with horizontally scrollable section tabs.
- `guide` was removed from normal page routes so it cannot feel like a separate site.

## Unchanged
- Default home remains Dashboard.
- Full top AXE PRODUCT banner remains a Dashboard target, excluding account controls.
- Guide content itself is unchanged: FUND / AMMO / MODBOOK / MEMBERS / ASSETS & ACCOUNTS / OUTLAW / COOKING / DISCORD.
- No DB changes.
- No PRODUCT BOT changes.
- No LIVE AXE changes.
