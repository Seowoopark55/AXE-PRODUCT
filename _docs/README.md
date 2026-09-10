# AXE PRODUCT WEB STAGING 3.15.2

STAGING-only onboarding catalog readiness hardening.

- Keeps 3.15.1 save-and-next onboarding flow.
- After Discord OAuth reconnect, waits for `web_get_company_onboarding_status().catalog_ready`.
- While catalog is not ready, role selects and onboarding progression are disabled and a syncing message is shown instead of an empty dropdown.
- Polls readiness for up to ~60 seconds and automatically reloads roles/channels when ready.
- On ordinary reload, a connected company with `catalog_ready=false` self-starts the readiness poll.
- No DATABASE migration and no BOT/LIVE changes are contained in this WEB package.
