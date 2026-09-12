# AXE PRODUCT WEB STAGING 3.21.5 · Discord reapproval UUID fix

## Root cause
`api/discord/reapprove.js` had a malformed UUID regular expression. Valid company UUIDs were rejected with `회사 ID가 올바르지 않습니다.` before the Discord authorization URL could be generated.

## Fix
The reapproval endpoint now uses the same canonical UUID pattern already used by the normal Discord connect and Guided Setup channel endpoints.

## Scope
WEB STAGING only. No database migration. No PRODUCT BOT patch. No LIVE AXE / NEW AXE NET changes.
