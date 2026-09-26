-- LAC HUB / global modbook catalogue + platform approval workflow
-- Apply in Supabase SQL Editor BEFORE deploying the matching WEB/BOT patches.
-- Additive migration: the legacy company-scoped modbook_catalog and modbook_requests
-- are kept intact for rollback/history. Existing catalogue rows are copied, not deleted.
begin;

create or replace function axe_product.modbook_name_key_v1(p_value text)
returns text
language sql immutable
set search_path to ''
as $$
  select lower(regexp_replace(regexp_replace(btrim(coalesce(p_value,'')), '^!+', '', 'g'), '\s+', '', 'g'));
$$;

create table if not exists axe_product.modbook_master_catalog (
  id uuid primary key default extensions.gen_random_uuid(),
  legacy_catalog_id uuid,
  type text not null,
  category text not null,
  name text not null,
  name_key text not null,
  parts text not null default '',
  option1 text,
  option2 text,
  option3 text,
  success_rate integer check (success_rate is null or success_rate between 0 and 100),
  note text,
  sort_order integer not null default 0,
  active boolean not null default true,
  source_request_id uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modbook_master_name_not_blank check (length(btrim(name)) between 1 and 160),
  constraint modbook_master_type_not_blank check (length(btrim(type)) between 1 and 40),
  constraint modbook_master_category_not_blank check (length(btrim(category)) between 1 and 160)
);
create unique index if not exists modbook_master_type_name_key_uq
  on axe_product.modbook_master_catalog (lower(btrim(type)), name_key);
create index if not exists modbook_master_active_sort_idx
  on axe_product.modbook_master_catalog (active, type, category, sort_order, name);

create table if not exists axe_product.modbook_company_data (
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  modbook_id uuid not null references axe_product.modbook_master_catalog(id) on delete cascade,
  recent_price bigint,
  recent_date date,
  price_note text,
  company_note text,
  visible boolean not null default true,
  legacy_catalog_id uuid,
  updated_by_membership_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, modbook_id),
  constraint modbook_company_price_nonnegative check (recent_price is null or recent_price >= 0)
);
create index if not exists modbook_company_data_modbook_idx
  on axe_product.modbook_company_data(modbook_id, company_id);

create table if not exists axe_product.modbook_global_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  membership_id uuid,
  member_display_name text,
  applicant_discord_user_id text,
  type text not null,
  category text not null,
  name text not null,
  name_key text not null,
  parts text not null default '',
  option1 text,
  option2 text,
  option3 text,
  success_rate integer check (success_rate is null or success_rate between 0 and 100),
  note text,
  source_image_url text,
  source_guild_id text,
  source_channel_id text,
  source_message_id text,
  status text not null default 'pending' check (status in ('pending','approved','merged','rejected')),
  review_note text,
  reviewer_user_id uuid,
  reviewed_at timestamptz,
  resolved_modbook_id uuid references axe_product.modbook_master_catalog(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modbook_global_request_name_not_blank check (length(btrim(name)) between 1 and 160)
);
create unique index if not exists modbook_global_requests_pending_uq
  on axe_product.modbook_global_requests(company_id, lower(btrim(type)), name_key)
  where status='pending';
create index if not exists modbook_global_requests_status_created_idx
  on axe_product.modbook_global_requests(status, created_at desc);

-- Browser reads only the approved common catalogue. Mutations and request queues
-- remain RPC-only so company users cannot publish or review requests directly.
alter table axe_product.modbook_master_catalog enable row level security;
alter table axe_product.modbook_company_data enable row level security;
alter table axe_product.modbook_global_requests enable row level security;

drop policy if exists lac_modbook_master_read on axe_product.modbook_master_catalog;
create policy lac_modbook_master_read on axe_product.modbook_master_catalog
  for select to authenticated using (true);

grant select on axe_product.modbook_master_catalog to authenticated;
revoke insert,update,delete on axe_product.modbook_master_catalog from anon,authenticated;
revoke all on axe_product.modbook_company_data from anon,authenticated;
revoke all on axe_product.modbook_global_requests from anon,authenticated;

-- Seed one common row for each logical modbook. When companies currently disagree,
-- the most recently updated company row is used as the initial common definition.
with ranked as (
  select mc.*,
         axe_product.modbook_name_key_v1(mc.name) as nk,
         row_number() over (
           partition by lower(btrim(mc.type)), axe_product.modbook_name_key_v1(mc.name)
           order by mc.updated_at desc nulls last, mc.created_at desc nulls last, mc.id desc
         ) as rn
  from axe_product.modbook_catalog mc
  where length(btrim(coalesce(mc.name,'')))>0
), picked as (
  select * from ranked where rn=1
)
insert into axe_product.modbook_master_catalog(
  legacy_catalog_id,type,category,name,name_key,parts,option1,option2,option3,
  success_rate,note,sort_order,active,created_at,updated_at
)
select p.id,p.type,p.category,p.name,p.nk,coalesce(p.parts,''),p.option1,p.option2,p.option3,
       p.success_rate,p.note,p.sort_order,p.active,coalesce(p.created_at,now()),coalesce(p.updated_at,now())
from picked p
on conflict do nothing;

-- Preserve each company's price/date/memo/visibility as an overlay on the common row.
with mapped as (
  select mc.*,
         mm.id as master_id,
         row_number() over (
           partition by mc.company_id, mm.id
           order by mc.updated_at desc nulls last, mc.created_at desc nulls last, mc.id desc
         ) as rn
  from axe_product.modbook_catalog mc
  join axe_product.modbook_master_catalog mm
    on lower(btrim(mm.type))=lower(btrim(mc.type))
   and mm.name_key=axe_product.modbook_name_key_v1(mc.name)
)
insert into axe_product.modbook_company_data(
  company_id,modbook_id,recent_price,recent_date,price_note,company_note,visible,legacy_catalog_id,created_at,updated_at
)
select m.company_id,m.master_id,m.recent_price,m.recent_date,m.price_note,m.note,m.active,m.id,
       coalesce(m.created_at,now()),coalesce(m.updated_at,now())
from mapped m where m.rn=1
on conflict (company_id,modbook_id) do update set
  recent_price=excluded.recent_price,
  recent_date=excluded.recent_date,
  price_note=excluded.price_note,
  company_note=excluded.company_note,
  visible=excluded.visible,
  legacy_catalog_id=coalesce(axe_product.modbook_company_data.legacy_catalog_id,excluded.legacy_catalog_id),
  updated_at=greatest(axe_product.modbook_company_data.updated_at,excluded.updated_at);

-- Carry forward still-pending legacy submissions so they are not stranded when the
-- Discord company-admin approval buttons are removed.
insert into axe_product.modbook_global_requests(
  company_id,membership_id,member_display_name,applicant_discord_user_id,
  type,category,name,name_key,parts,option1,option2,option3,success_rate,note,status,created_at,updated_at
)
select r.company_id,r.membership_id,r.member_display_name,m.discord_user_id,
       r.type,r.category,r.name,axe_product.modbook_name_key_v1(r.name),coalesce(r.parts,''),
       r.option1,r.option2,r.option3,r.success_rate,r.note,'pending',r.created_at,r.updated_at
from axe_product.modbook_requests r
left join axe_product.company_memberships m
  on m.company_id=r.company_id and m.id=r.membership_id
where r.status='pending'
  and not exists (
    select 1 from axe_product.modbook_global_requests g
    where g.company_id=r.company_id
      and lower(btrim(g.type))=lower(btrim(r.type))
      and g.name_key=axe_product.modbook_name_key_v1(r.name)
      and g.status='pending'
  );

-- BOT: common catalogue rendered in each connected company with only that company's
-- price/date overlay. The JSON shape intentionally matches the old BOT catalogue RPC.
create or replace function axe_product.bot_runtime_get_modbook_global_catalog_v1(p_runtime_key text)
returns jsonb
language plpgsql stable security definer
set search_path to ''
as $$
declare
  v_key_id uuid;
  v_result jsonb;
begin
  if p_runtime_key is null or char_length(p_runtime_key)<48 or char_length(p_runtime_key)>160 then
    raise exception 'Invalid runtime credential.' using errcode='42501';
  end if;
  select k.id into v_key_id from axe_product.bot_runtime_keys k
   where k.status='active' and k.key_hash=extensions.digest(p_runtime_key,'sha256') limit 1;
  if v_key_id is null then raise exception 'Invalid runtime credential.' using errcode='42501'; end if;

  select coalesce(jsonb_agg(company_row order by company_row->>'company_name'),'[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'company_id',c.id,
      'company_name',c.name,
      'guild_id',dc.guild_id,
      'guild_name',dc.guild_name,
      'module_enabled',coalesce(cm.enabled,false),
      'settings',coalesce(cm.settings,'{}'::jsonb),
      'items',coalesce((
        select jsonb_agg(jsonb_build_object(
          'id',m.id,'type',m.type,'category',m.category,'name',m.name,'parts',m.parts,
          'option1',m.option1,'option2',m.option2,'option3',m.option3,'success_rate',m.success_rate,
          'recent_price',cd.recent_price,'recent_date',cd.recent_date,'price_note',cd.price_note,
          'note',m.note,'sort_order',m.sort_order,'active',m.active,'updated_at',m.updated_at
        ) order by m.sort_order,m.name,m.id)
        from axe_product.modbook_master_catalog m
        left join axe_product.modbook_company_data cd on cd.company_id=c.id and cd.modbook_id=m.id
        where m.active=true and coalesce(cd.visible,true)=true
      ),'[]'::jsonb),
      'updated_at',greatest(
        coalesce(cm.updated_at,'epoch'::timestamptz),
        coalesce((select max(m.updated_at) from axe_product.modbook_master_catalog m),'epoch'::timestamptz),
        coalesce((select max(cd.updated_at) from axe_product.modbook_company_data cd where cd.company_id=c.id),'epoch'::timestamptz)
      )
    ) as company_row
    from axe_product.companies c
    join axe_product.discord_connections dc on dc.company_id=c.id and dc.status='connected'
    left join axe_product.company_modules cm on cm.company_id=c.id and cm.module_key='modbook'
    where c.status='active'
  ) q;
  return coalesce(v_result,'[]'::jsonb);
end;
$$;
revoke all on function axe_product.bot_runtime_get_modbook_global_catalog_v1(text) from public,authenticated;
grant execute on function axe_product.bot_runtime_get_modbook_global_catalog_v1(text) to anon;

create or replace function axe_product.bot_runtime_update_modbook_company_price_v1(
  p_runtime_key text,p_guild_id text,p_discord_user_id text,p_name text,p_price bigint,
  p_actor_name text default null,p_recent_date date default null
) returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  v_key_id uuid; v_company_id uuid; v_membership_id uuid; v_modbook axe_product.modbook_master_catalog%rowtype;
begin
  if p_runtime_key is null or char_length(p_runtime_key)<48 or char_length(p_runtime_key)>160 then raise exception 'Invalid runtime credential.' using errcode='42501'; end if;
  select k.id into v_key_id from axe_product.bot_runtime_keys k where k.status='active' and k.key_hash=extensions.digest(p_runtime_key,'sha256') limit 1;
  if v_key_id is null then raise exception 'Invalid runtime credential.' using errcode='42501'; end if;
  update axe_product.bot_runtime_keys set last_used_at=now() where id=v_key_id;
  if p_price is null or p_price<0 then raise exception '가격을 확인해 주세요.' using errcode='22023'; end if;

  select c.id into v_company_id
  from axe_product.companies c join axe_product.discord_connections dc on dc.company_id=c.id
  left join axe_product.company_modules cm on cm.company_id=c.id and cm.module_key='modbook'
  where c.status='active' and dc.status='connected' and dc.guild_id=p_guild_id and coalesce(cm.enabled,false)=true limit 1;
  if v_company_id is null then raise exception '현재 회사에서 개조서 기능을 사용할 수 없습니다.' using errcode='42501'; end if;
  select m.id into v_membership_id from axe_product.company_memberships m
   where m.company_id=v_company_id and m.status='active' and m.discord_user_id=p_discord_user_id limit 1;
  if v_membership_id is null then raise exception '회사 멤버만 가격을 갱신할 수 있습니다.' using errcode='42501'; end if;

  select m.* into v_modbook from axe_product.modbook_master_catalog m
   where m.active=true and m.name_key=axe_product.modbook_name_key_v1(p_name)
   order by (lower(btrim(m.name))=lower(btrim(p_name))) desc,m.sort_order,m.id limit 1;
  if v_modbook.id is null then raise exception '등록된 개조서를 찾을 수 없습니다.' using errcode='22023'; end if;

  insert into axe_product.modbook_company_data(company_id,modbook_id,recent_price,recent_date,updated_by_membership_id,updated_at)
  values(v_company_id,v_modbook.id,p_price,coalesce(p_recent_date,current_date),v_membership_id,now())
  on conflict(company_id,modbook_id) do update set
    recent_price=excluded.recent_price,recent_date=excluded.recent_date,
    updated_by_membership_id=excluded.updated_by_membership_id,updated_at=now();

  return to_jsonb(v_modbook) || jsonb_build_object(
    'recent_price',p_price,'recent_date',coalesce(p_recent_date,current_date),
    'actor_name',nullif(btrim(coalesce(p_actor_name,'')),'')
  );
end;
$$;
revoke all on function axe_product.bot_runtime_update_modbook_company_price_v1(text,text,text,text,bigint,text,date) from public,authenticated;
grant execute on function axe_product.bot_runtime_update_modbook_company_price_v1(text,text,text,text,bigint,text,date) to anon;

create or replace function axe_product.bot_runtime_submit_modbook_global_request_v1(
  p_runtime_key text,p_guild_id text,p_discord_user_id text,p_actor_name text,
  p_type text,p_category text,p_name text,p_parts text,p_option1 text,p_option2 text,p_option3 text,
  p_success_rate integer,p_note text,p_source_image_url text default null,
  p_source_channel_id text default null,p_source_message_id text default null
) returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  v_key_id uuid; v_company_id uuid; v_company_name text; v_membership_id uuid; v_display_name text;
  v_name text:=btrim(coalesce(p_name,'')); v_name_key text; v_request axe_product.modbook_global_requests%rowtype;
  v_reviewers jsonb;
begin
  if p_runtime_key is null or char_length(p_runtime_key)<48 or char_length(p_runtime_key)>160 then raise exception 'Invalid runtime credential.' using errcode='42501'; end if;
  select k.id into v_key_id from axe_product.bot_runtime_keys k where k.status='active' and k.key_hash=extensions.digest(p_runtime_key,'sha256') limit 1;
  if v_key_id is null then raise exception 'Invalid runtime credential.' using errcode='42501'; end if;
  update axe_product.bot_runtime_keys set last_used_at=now() where id=v_key_id;

  select c.id,c.name into v_company_id,v_company_name
  from axe_product.companies c join axe_product.discord_connections dc on dc.company_id=c.id
  left join axe_product.company_modules cm on cm.company_id=c.id and cm.module_key='modbook'
  where c.status='active' and dc.status='connected' and dc.guild_id=p_guild_id and coalesce(cm.enabled,false)=true limit 1;
  if v_company_id is null then raise exception '현재 회사에서 개조서 기능을 사용할 수 없습니다.' using errcode='42501'; end if;
  select m.id,coalesce(nullif(btrim(m.display_name),''),nullif(btrim(m.discord_display_name),''),nullif(btrim(p_actor_name),''),'멤버')
    into v_membership_id,v_display_name
  from axe_product.company_memberships m
  where m.company_id=v_company_id and m.status='active' and m.discord_user_id=p_discord_user_id limit 1;
  if v_membership_id is null then raise exception '회사 멤버만 개조서 등록을 신청할 수 있습니다.' using errcode='42501'; end if;

  if length(v_name) not between 1 and 160 or length(btrim(coalesce(p_type,''))) not between 1 and 40
     or length(btrim(coalesce(p_category,''))) not between 1 and 160 then
    raise exception '개조서 이름·위치·분류를 확인해 주세요.' using errcode='22023';
  end if;
  if p_success_rate is not null and (p_success_rate<0 or p_success_rate>100) then raise exception '성공률은 0~100 사이여야 합니다.' using errcode='22023'; end if;
  v_name_key:=axe_product.modbook_name_key_v1(v_name);
  if exists(select 1 from axe_product.modbook_master_catalog m where m.active=true and lower(btrim(m.type))=lower(btrim(p_type)) and m.name_key=v_name_key) then
    raise exception '이미 공통 개조서에 등록된 항목입니다.' using errcode='23505';
  end if;

  select g.* into v_request from axe_product.modbook_global_requests g
   where g.company_id=v_company_id and g.status='pending' and lower(btrim(g.type))=lower(btrim(p_type)) and g.name_key=v_name_key
   order by g.created_at desc limit 1;
  if v_request.id is null then
    insert into axe_product.modbook_global_requests(
      company_id,membership_id,member_display_name,applicant_discord_user_id,type,category,name,name_key,parts,
      option1,option2,option3,success_rate,note,source_image_url,source_guild_id,source_channel_id,source_message_id
    ) values(
      v_company_id,v_membership_id,v_display_name,p_discord_user_id,btrim(p_type),btrim(p_category),v_name,v_name_key,coalesce(btrim(p_parts),''),
      nullif(btrim(coalesce(p_option1,'')),''),nullif(btrim(coalesce(p_option2,'')),''),nullif(btrim(coalesce(p_option3,'')),''),p_success_rate,
      nullif(btrim(coalesce(p_note,'')),''),nullif(btrim(coalesce(p_source_image_url,'')),''),p_guild_id,
      nullif(btrim(coalesce(p_source_channel_id,'')),''),nullif(btrim(coalesce(p_source_message_id,'')),'')
    ) returning * into v_request;
  end if;

  -- Resolve platform-admin Discord identities from both linked company memberships
  -- and Supabase Discord auth metadata. This keeps DM delivery resilient when one
  -- of the two sources has not been populated yet.
  select coalesce(jsonb_agg(x.did order by x.did),'[]'::jsonb) into v_reviewers
  from (
    select distinct d.did
    from (
      select nullif(btrim(cm.discord_user_id),'') as did
      from axe_product.platform_admins pa
      join axe_product.company_memberships cm on cm.user_id=pa.user_id
      where cm.status='active'
      union
      select coalesce(
        nullif(u.raw_user_meta_data->>'provider_id',''),
        nullif(u.raw_user_meta_data->>'sub',''),
        (select coalesce(nullif(i.identity_data->>'provider_id',''),nullif(i.identity_data->>'sub',''))
           from auth.identities i where i.user_id=u.id and i.provider='discord' order by i.created_at limit 1)
      ) as did
      from axe_product.platform_admins pa join auth.users u on u.id=pa.user_id
    ) d
    where d.did ~ '^[0-9]{15,22}$'
  ) x;

  return to_jsonb(v_request) || jsonb_build_object('company_name',v_company_name,'reviewer_discord_ids',v_reviewers);
end;
$$;
revoke all on function axe_product.bot_runtime_submit_modbook_global_request_v1(text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text) from public,authenticated;
grant execute on function axe_product.bot_runtime_submit_modbook_global_request_v1(text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text) to anon;

-- Platform WEB: read all application queues, never company-admin scoped.
create or replace function axe_product.platform_modbook_request_list_v1(p_status text default 'pending')
returns table(
  id uuid,company_id uuid,company_name text,membership_id uuid,member_display_name text,applicant_discord_user_id text,
  type text,category text,name text,parts text,option1 text,option2 text,option3 text,success_rate integer,note text,
  source_image_url text,status text,review_note text,reviewed_at timestamptz,resolved_modbook_id uuid,created_at timestamptz,updated_at timestamptz
)
language plpgsql stable security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not axe_product.platform_is_admin() then raise exception '플랫폼 운영자 권한이 필요합니다.' using errcode='42501'; end if;
  return query
  select r.id,r.company_id,c.name,r.membership_id,r.member_display_name,r.applicant_discord_user_id,
         r.type,r.category,r.name,r.parts,r.option1,r.option2,r.option3,r.success_rate,r.note,
         r.source_image_url,r.status,r.review_note,r.reviewed_at,r.resolved_modbook_id,r.created_at,r.updated_at
  from axe_product.modbook_global_requests r join axe_product.companies c on c.id=r.company_id
  where p_status is null or p_status='' or p_status='all' or r.status=p_status
  order by case when r.status='pending' then 0 else 1 end,r.created_at desc;
end;
$$;
revoke all on function axe_product.platform_modbook_request_list_v1(text) from public,anon;
grant execute on function axe_product.platform_modbook_request_list_v1(text) to authenticated;

create or replace function axe_product.platform_modbook_request_review_v1(
  p_request_id uuid,p_action text,p_payload jsonb default null,p_merge_modbook_id uuid default null,p_review_note text default null
) returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  v_request axe_product.modbook_global_requests%rowtype; v_master axe_product.modbook_master_catalog%rowtype;
  v_action text:=lower(btrim(coalesce(p_action,''))); v_payload jsonb:=coalesce(p_payload,'{}'::jsonb);
  v_type text;v_category text;v_name text;v_parts text;v_option1 text;v_option2 text;v_option3 text;v_note text;
  v_success integer;v_sort integer;v_active boolean;v_name_key text;
begin
  if auth.uid() is null or not axe_product.platform_is_admin() then raise exception '플랫폼 운영자 권한이 필요합니다.' using errcode='42501'; end if;
  select * into v_request from axe_product.modbook_global_requests where id=p_request_id for update;
  if v_request.id is null then raise exception '등록 신청을 찾을 수 없습니다.' using errcode='22023'; end if;
  if v_request.status<>'pending' then raise exception '이미 처리된 신청입니다.' using errcode='22023'; end if;

  if v_action='reject' then
    update axe_product.modbook_global_requests set status='rejected',review_note=nullif(btrim(coalesce(p_review_note,'')),''),reviewer_user_id=auth.uid(),reviewed_at=now(),updated_at=now() where id=v_request.id returning * into v_request;
    return jsonb_build_object('request',to_jsonb(v_request),'master',null);
  elsif v_action='merge' then
    if p_merge_modbook_id is null then raise exception '병합할 기존 개조서를 선택해 주세요.' using errcode='22023'; end if;
    select * into v_master from axe_product.modbook_master_catalog where id=p_merge_modbook_id;
    if v_master.id is null then raise exception '병합할 개조서를 찾을 수 없습니다.' using errcode='22023'; end if;
    update axe_product.modbook_global_requests set status='merged',resolved_modbook_id=v_master.id,review_note=nullif(btrim(coalesce(p_review_note,'')),''),reviewer_user_id=auth.uid(),reviewed_at=now(),updated_at=now() where id=v_request.id returning * into v_request;
    return jsonb_build_object('request',to_jsonb(v_request),'master',to_jsonb(v_master));
  elsif v_action not in ('approve','approve_edit') then
    raise exception '지원하지 않는 검수 작업입니다.' using errcode='22023';
  end if;

  v_type:=coalesce(nullif(btrim(v_payload->>'type'),''),v_request.type);
  v_category:=coalesce(nullif(btrim(v_payload->>'category'),''),v_request.category);
  v_name:=coalesce(nullif(btrim(v_payload->>'name'),''),v_request.name);
  v_parts:=coalesce(v_payload->>'parts',v_request.parts,'');
  v_option1:=case when v_payload ? 'option1' then nullif(btrim(v_payload->>'option1'),'') else v_request.option1 end;
  v_option2:=case when v_payload ? 'option2' then nullif(btrim(v_payload->>'option2'),'') else v_request.option2 end;
  v_option3:=case when v_payload ? 'option3' then nullif(btrim(v_payload->>'option3'),'') else v_request.option3 end;
  v_note:=case when v_payload ? 'note' then nullif(btrim(v_payload->>'note'),'') else v_request.note end;
  v_success:=case when v_payload ? 'success_rate' and jsonb_typeof(v_payload->'success_rate')<>'null' then (v_payload->>'success_rate')::integer else v_request.success_rate end;
  v_sort:=case when v_payload ? 'sort_order' then coalesce((v_payload->>'sort_order')::integer,0) else 0 end;
  v_active:=case when v_payload ? 'active' then coalesce((v_payload->>'active')::boolean,true) else true end;
  if length(v_name) not between 1 and 160 or length(v_type) not between 1 and 40 or length(v_category) not between 1 and 160 then raise exception '개조서 이름·위치·분류를 확인해 주세요.' using errcode='22023'; end if;
  if v_success is not null and (v_success<0 or v_success>100) then raise exception '성공률은 0~100 사이여야 합니다.' using errcode='22023'; end if;
  v_name_key:=axe_product.modbook_name_key_v1(v_name);
  if exists(select 1 from axe_product.modbook_master_catalog m where lower(btrim(m.type))=lower(btrim(v_type)) and m.name_key=v_name_key) then
    raise exception '이미 등록된 공통 개조서가 있습니다. 기존 항목과 병합해 주세요.' using errcode='23505';
  end if;
  if v_sort=0 then select coalesce(max(m.sort_order),0)+10 into v_sort from axe_product.modbook_master_catalog m where lower(btrim(m.type))=lower(btrim(v_type)) and lower(btrim(m.category))=lower(btrim(v_category)); end if;

  insert into axe_product.modbook_master_catalog(type,category,name,name_key,parts,option1,option2,option3,success_rate,note,sort_order,active,source_request_id,created_by,updated_by)
  values(v_type,v_category,v_name,v_name_key,coalesce(v_parts,''),v_option1,v_option2,v_option3,v_success,v_note,v_sort,v_active,v_request.id,auth.uid(),auth.uid())
  returning * into v_master;
  update axe_product.modbook_global_requests set status='approved',resolved_modbook_id=v_master.id,review_note=nullif(btrim(coalesce(p_review_note,'')),''),reviewer_user_id=auth.uid(),reviewed_at=now(),updated_at=now() where id=v_request.id returning * into v_request;
  return jsonb_build_object('request',to_jsonb(v_request),'master',to_jsonb(v_master));
end;
$$;
revoke all on function axe_product.platform_modbook_request_review_v1(uuid,text,jsonb,uuid,text) from public,anon;
grant execute on function axe_product.platform_modbook_request_review_v1(uuid,text,jsonb,uuid,text) to authenticated;

-- Platform admin direct editor for the common catalogue. This replaces only the
-- modbook branch of lac_admin_save_game_info; all other game-info RPCs remain untouched.
create or replace function axe_product.lac_admin_save_modbook_master_v1(
  p_id uuid,p_payload jsonb,p_expected_updated_at timestamptz default null
) returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  v_before jsonb;v_after jsonb;v_id uuid;v_name_key text;v_type text;v_category text;v_name text;
  v_parts text;v_o1 text;v_o2 text;v_o3 text;v_note text;v_success integer;v_sort integer;v_active boolean;
begin
  if auth.uid() is null or not axe_product.platform_is_admin() then raise exception '플랫폼 운영자만 개조서를 관리할 수 있습니다.' using errcode='42501'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception '저장할 정보를 확인해 주세요.' using errcode='22023'; end if;
  if exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('type','category','name','parts','option1','option2','option3','success_rate','note','sort_order','active')) then raise exception '수정할 수 없는 개조서 필드가 포함되어 있습니다.' using errcode='22023'; end if;
  v_type=btrim(coalesce(p_payload->>'type',''));v_category=btrim(coalesce(p_payload->>'category',''));v_name=btrim(coalesce(p_payload->>'name',''));
  v_parts=coalesce(p_payload->>'parts','');v_o1=nullif(btrim(p_payload->>'option1'),'');v_o2=nullif(btrim(p_payload->>'option2'),'');v_o3=nullif(btrim(p_payload->>'option3'),'');v_note=nullif(btrim(p_payload->>'note'),'');
  v_success=case when not(p_payload?'success_rate') or jsonb_typeof(p_payload->'success_rate')='null' then null else (p_payload->>'success_rate')::integer end;
  v_sort=coalesce((p_payload->>'sort_order')::integer,0);v_active=coalesce((p_payload->>'active')::boolean,true);
  if length(v_name) not between 1 and 160 or length(v_type) not between 1 and 40 or length(v_category) not between 1 and 160 then raise exception '개조서 이름·위치·분류를 입력해 주세요.' using errcode='22023'; end if;
  if v_success is not null and (v_success<0 or v_success>100) then raise exception '성공률은 0~100 사이여야 합니다.' using errcode='22023'; end if;
  v_name_key=axe_product.modbook_name_key_v1(v_name);

  if p_id is null then
    if exists(select 1 from axe_product.modbook_master_catalog m where lower(btrim(m.type))=lower(btrim(v_type)) and m.name_key=v_name_key) then raise exception '이미 등록된 개조서입니다.' using errcode='23505'; end if;
    if v_sort=0 then select coalesce(max(m.sort_order),0)+10 into v_sort from axe_product.modbook_master_catalog m where lower(btrim(m.type))=lower(btrim(v_type)) and lower(btrim(m.category))=lower(btrim(v_category)); end if;
    insert into axe_product.modbook_master_catalog as m(type,category,name,name_key,parts,option1,option2,option3,success_rate,note,sort_order,active,created_by,updated_by)
    values(v_type,v_category,v_name,v_name_key,v_parts,v_o1,v_o2,v_o3,v_success,v_note,v_sort,v_active,auth.uid(),auth.uid()) returning m.id,to_jsonb(m) into v_id,v_after;
  else
    select to_jsonb(m) into v_before from axe_product.modbook_master_catalog m where m.id=p_id for update;
    if v_before is null then raise exception '수정할 개조서를 찾을 수 없습니다.' using errcode='22023'; end if;
    if p_expected_updated_at is null or (v_before->>'updated_at')::timestamptz is distinct from p_expected_updated_at then raise exception '다른 곳에서 먼저 수정했습니다. 새로고침 후 다시 시도해 주세요.' using errcode='40001'; end if;
    if exists(select 1 from axe_product.modbook_master_catalog m where m.id<>p_id and lower(btrim(m.type))=lower(btrim(v_type)) and m.name_key=v_name_key) then raise exception '같은 이름의 개조서가 이미 등록되어 있습니다.' using errcode='23505'; end if;
    update axe_product.modbook_master_catalog m set type=v_type,category=v_category,name=v_name,name_key=v_name_key,parts=v_parts,option1=v_o1,option2=v_o2,option3=v_o3,success_rate=v_success,note=v_note,sort_order=v_sort,active=v_active,updated_by=auth.uid(),updated_at=now() where m.id=p_id returning m.id,to_jsonb(m) into v_id,v_after;
  end if;
  insert into axe_product.info_admin_history(table_name,record_id,company_id,action,before_data,after_data,actor_id)
  values('modbook_catalog',v_id::text,null,case when p_id is null then 'create' else 'update' end,v_before,v_after,auth.uid());
  return v_after;
end;
$$;
revoke all on function axe_product.lac_admin_save_modbook_master_v1(uuid,jsonb,timestamptz) from public,anon;
grant execute on function axe_product.lac_admin_save_modbook_master_v1(uuid,jsonb,timestamptz) to authenticated;

commit;
