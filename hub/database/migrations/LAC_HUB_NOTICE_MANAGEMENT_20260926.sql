-- LAC HUB / notice edit + delete management.
-- Run once in Supabase SQL Editor before deploying the matching web patch.
-- Existing notices are not changed by this migration.
begin;

create or replace function axe_product.hub_board_update_notice(p_notice_id uuid,p_title text,p_body text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_id uuid;v_title text:=btrim(coalesce(p_title,''));v_body text:=btrim(coalesce(p_body,''));
begin
 if auth.uid() is null or not axe_product.platform_is_admin() then raise exception '운영자 권한이 필요합니다.' using errcode='42501';end if;
 if p_notice_id is null then raise exception '수정할 공지를 선택해 주세요.' using errcode='22023';end if;
 if char_length(v_title) not between 2 and 120 or char_length(v_body) not between 2 and 4000 then raise exception '제목 2~120자, 내용 2~4000자로 입력해 주세요.' using errcode='22023';end if;
 update axe_product.hub_notices set title=v_title,body=v_body where id=p_notice_id returning id into v_id;
 if v_id is null then raise exception '공지를 찾을 수 없습니다.' using errcode='22023';end if;
 return v_id;
end;$$;

create or replace function axe_product.hub_board_delete_notice(p_notice_id uuid)
returns void language plpgsql security definer set search_path to '' as $$
begin
 if auth.uid() is null or not axe_product.platform_is_admin() then raise exception '운영자 권한이 필요합니다.' using errcode='42501';end if;
 if p_notice_id is null then raise exception '삭제할 공지를 선택해 주세요.' using errcode='22023';end if;
 delete from axe_product.hub_notices where id=p_notice_id;
 if not found then raise exception '공지를 찾을 수 없습니다.' using errcode='22023';end if;
end;$$;

revoke all on function axe_product.hub_board_update_notice(uuid,text,text),axe_product.hub_board_delete_notice(uuid) from public,anon;
grant execute on function axe_product.hub_board_update_notice(uuid,text,text),axe_product.hub_board_delete_notice(uuid) to authenticated;

commit;
