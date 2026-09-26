-- LAC HUB / notice inline image upload.
-- Run once in Supabase SQL Editor before deploying the matching web patch.
-- Existing notices and existing board attachments are not changed.
begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('lac-hub-notice-images','lac-hub-notice-images',true,10485760,array['image/jpeg','image/png','image/webp']::text[])
on conflict(id) do update
set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists lac_hub_notice_image_admin_insert on storage.objects;
create policy lac_hub_notice_image_admin_insert on storage.objects
for insert to authenticated
with check(
  bucket_id='lac-hub-notice-images'
  and axe_product.platform_is_admin()
  and name ~ '^notices/[0-9a-f-]{36}\.(png|jpg|webp)$'
);

drop policy if exists lac_hub_notice_image_admin_delete on storage.objects;
create policy lac_hub_notice_image_admin_delete on storage.objects
for delete to authenticated
using(
  bucket_id='lac-hub-notice-images'
  and axe_product.platform_is_admin()
  and name ~ '^notices/[0-9a-f-]{36}\.(png|jpg|webp)$'
);

commit;
