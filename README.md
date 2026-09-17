# AXE ONE WEB STAGING 3.26.19 · ACCESS GATE LOGIN R3

Baseline: AXE ONE 3.26.19 Access Gate / Invite Login R2 Polish.

Changes:
- Reworked the unauthenticated entry surface around one clear purpose: AXE ONE login.
- Removed decorative English labels from the customer-facing login surface.
- Reduced the visual weight of the brand/marketing side and expanded the actual login panel.
- Main CTA is now clearly `Discord로 로그인`.
- Invite-code entry remains a secondary path for first-time invited users.
- Replaced developer/security-console wording with short Korean access and privacy guidance.
- Kept invite URL capture, secure invite redemption, membership recheck, and unaffiliated-user blocking unchanged.
- Also localized the post-login company access gate labels for visual consistency.

Safety:
- WEB only.
- No DB migration.
- No BOT change.
- LIVE untouched.
- Access Gate / invite logic remains the existing R1/R2 implementation.

Validation:
- `node --check src/ui/render.js`: PASS.
- `npm run check`: PASS, including Access Gate 10/10, first-run 30/30, onboarding integrity 36/36.
- `npm run validate:static`: PASS.
- `npm run validate:assets`: PASS.
- `npm run validate:fixtures`: PASS.
- Local production build not run because this workspace has no installed Vite binary; confirm final build with Vercel STAGING Ready.

OAuth note:
- This UI does not itself remove Discord email scope.
- Until the identify-only OAuth provider is activated, Discord may still display `이메일 주소 보기` on the authorization screen.
