# AXE PRODUCT — STAGE 4D

Track: **[상품화] only**

This WEB directory is the full AXE-PRODUCT source for STAGE 4D. It is based on the verified STAGE 4C source and requires the STAGE 4D DB migration in the parent package to be applied first.

## Added in STAGE 4D
- Private Supabase Storage evidence upload for fund payment requests.
- MEMBER web payment request form.
- Payment modes: 공용계좌 / 회사잔고 / 분할납부.
- Evidence types: JPG / PNG / WEBP, max 10MB.
- Evidence object path: `<company_uuid>/<auth_user_uuid>/<random_uuid>.<ext>`.
- Failed request submission performs best-effort cleanup of an unclaimed uploaded file.
- OWNER / ADMIN review queue opens evidence through a short-lived signed URL.
- Evidence bucket is never public and the web never uses `getPublicUrl()`.

## Security boundary
- The fund data tables are still not read/written directly by the web.
- Request creation uses the verified `fund_submit_request` RPC.
- Storage RLS restricts upload to the logged-in member's own company/user folder.
- Members can read only their own evidence; OWNER/ADMIN can read evidence for their own company.
- Evidence has no UPDATE policy, so browser users cannot overwrite a file.
- A browser user may delete only an unclaimed own evidence object. Once a fund request references it, delete is denied.
- A DB trigger verifies every `submitted_via='web'` request claims an actually existing object under the same company and submitting user.

## Not included yet
- Discord fund panel / buttons / commands.
- Automatic Discord notifications for fund workflow.
- Changes to `axe-product-staging-bot`.
- Changes to live `axe-bot`, NEW AXE NET, or AXE HUB.

## Deployment order
1. Apply and validate the parent package `DB/` SQL in Supabase SQL Editor.
2. Only after DB validation, copy the contents of this `WEB/` directory over the AXE-PRODUCT GitHub working tree.
3. Push AXE-PRODUCT and verify the Vercel deployment.

Do not copy these files into NEW AXE NET, AXE HUB, or either Discord bot directory.


## STAGE 4D FIX (0.8.1)
- Fixes browser native validation blocking non-split fund submissions.
- Hidden split amount inputs remain disabled unless payment mode is 분할납부.
- No DB/Storage/RPC changes.
