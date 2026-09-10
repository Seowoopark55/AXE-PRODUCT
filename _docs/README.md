# AXE PRODUCT WEB STAGING 3.15.1

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

## ONBOARDING SAVE FLOW REFINEMENT
- WEB-only refinement; no DB migration and no BOT change.
- During the role onboarding step, selecting `기능 설정` automatically saves the current Basic/role values before moving forward.
- The normal top-right action reads `저장하고 다음` on the role step and `설정 완료` on the module/channel step.
- Role onboarding requires both administrator and member roles before moving forward, with a clear validation message.
- The onboarding helper copy explains that forward navigation saves the current values automatically.
- After the final module/channel save, a completed onboarding state is reported as `초기 설정이 완료됐습니다.`
- Outside onboarding, the existing independent `설정 저장` behavior remains unchanged.
