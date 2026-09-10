# AXE PRODUCT WEB STAGING 3.15.0

## CUSTOMER ONBOARDING + SAFE DISCORD RECONNECT
- Based on current WEB STAGING 3.14.7.
- Uses DB v1.7.41 `web_get_company_onboarding_status` and `request_company_discord_reconnect`.
- New companies are routed directly to Company Settings onboarding.
- Company Settings shows Discord → role → module/channel readiness progress.
- Connected servers expose `다시 설정` only after a confirmation modal.
- Reconnect queues a BOT `discord_reset`; browser never writes reset tables directly.
- During reset, settings are locked and status is polled until BOT cleanup completes.
- Reset preserves business data and clears only Discord linkage/configuration/persistent panels.
- Same Discord guild can be connected again after BOT completion.
- STAGING WEB ONLY. No LIVE BOT/WEB changes.
