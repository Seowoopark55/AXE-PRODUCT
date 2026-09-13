# AXE PRODUCT WEB 3.23.2 · QUESTION MEDIA + DELETE

STAGING only.

## Changes
- Native question board: original author / PLATFORM OWNER can delete a question.
- Deleting a question removes thread messages and attachment metadata; attachment objects are removed first.
- Question and reply images: JPG/PNG/WEBP, max 10MB each, max 5 per question/reply.
- Supports file picker, drag-and-drop, and clipboard screenshot paste (Ctrl+V).
- Private Supabase Storage bucket `axe-support-attachments` with company/question scoped read/write/delete policies.
- Discord remains optional notification only; no Discord forum dependency.

## Apply order
1. Run `SUPABASE_MIGRATION_3_23_2_NATIVE_SUPPORT_ATTACHMENTS_DELETE.sql` on STAGING Supabase.
2. Overwrite the GitHub WEB STAGING project with this package.
3. Commit/push and confirm Vercel STAGING is Ready.

Do not deploy this WEB package with `apply-axe-product.sh`.
