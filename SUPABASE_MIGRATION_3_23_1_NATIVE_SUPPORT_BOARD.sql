-- AXE PRODUCT 3.23.1
-- Native support question board (site-owned, Discord optional notification only)
-- STAGING FIRST. Schema: axe_product

begin;

-- -----------------------------------------------------------------------------
-- 1) Tables
-- -----------------------------------------------------------------------------
create table if not exists axe_product.support_questions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_membership_id uuid references axe_product.company_memberships(id) on delete set null,
  author_name text not null,
  author_discord_user_id text,
  title text not null,
  body text not null,
  status text not null default 'pending',
  platform_unread boolean not null default true,
  customer_unread boolean not null default false,
  answered_at timestamptz,
  answered_by_user_id uuid references auth.users(id) on delete set null,
  dm_notified_at timestamptz,
  dm_notification_error text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_questions_status_check check (status in ('pending','checking','complete')),
  constraint support_questions_title_check check (char_length(btrim(title)) between 1 and 120),
  constraint support_questions_body_check check (char_length(btrim(body)) between 1 and 4000)
);

create table if not exists axe_product.support_question_messages (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references axe_product.support_questions(id) on delete cascade,
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_type text not null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint support_question_messages_author_type_check check (author_type in ('customer','platform')),
  constraint support_question_messages_body_check check (char_length(btrim(body)) between 1 and 4000)
);

create index if not exists idx_support_questions_company_status_last
  on axe_product.support_questions(company_id, status, last_message_at desc);
create index if not exists idx_support_questions_platform_queue
  on axe_product.support_questions(status, platform_unread, last_message_at desc);
create index if not exists idx_support_question_messages_question_created
  on axe_product.support_question_messages(question_id, created_at asc);

alter table axe_product.support_questions enable row level security;
alter table axe_product.support_question_messages enable row level security;
revoke all on table axe_product.support_questions from anon, authenticated;
revoke all on table axe_product.support_question_messages from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2) Company board list
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_support_list_questions(
  p_company_id uuid,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 200));
  v_counts jsonb;
  v_items jsonb;
begin
  select exists(
    select 1
    from axe_product.company_memberships cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status, 'active') = 'active'
  ) into v_member;

  if not v_platform and not v_member then
    raise exception 'company membership required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'pending', count(*) filter (where q.status = 'pending'),
    'checking', count(*) filter (where q.status = 'checking'),
    'complete', count(*) filter (where q.status = 'complete'),
    'unread', count(*) filter (where case when v_platform then q.platform_unread else (q.customer_unread and q.created_by_user_id = auth.uid()) end),
    'total', count(*)
  )
  into v_counts
  from axe_product.support_questions q
  where q.company_id = p_company_id;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc), '[]'::jsonb)
  into v_items
  from (
    select
      q.id,
      q.company_id,
      q.title,
      left(q.body, 260) as body_preview,
      q.status,
      q.author_name,
      q.created_at,
      q.updated_at,
      q.last_message_at,
      q.answered_at,
      q.dm_notified_at,
      case when v_platform then q.platform_unread else (q.customer_unread and q.created_by_user_id = auth.uid()) end as unread,
      (1 + (select count(*) from axe_product.support_question_messages m where m.question_id = q.id))::integer as message_count
    from axe_product.support_questions q
    where q.company_id = p_company_id
    order by q.last_message_at desc
    limit v_limit
  ) x;

  return jsonb_build_object(
    'configured', true,
    'counts', coalesce(v_counts, jsonb_build_object('pending',0,'checking',0,'complete',0,'unread',0,'total',0)),
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 3) Create a question (active company member)
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_support_create_question(
  p_company_id uuid,
  p_title text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_membership axe_product.company_memberships%rowtype;
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
  v_name text;
begin
  if char_length(v_title) < 1 or char_length(v_title) > 120 then
    raise exception '질문 제목은 1~120자로 입력해 주세요.' using errcode = '22023';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 4000 then
    raise exception '질문 내용은 1~4000자로 입력해 주세요.' using errcode = '22023';
  end if;

  select cm.*
  into v_membership
  from axe_product.company_memberships cm
  where cm.company_id = p_company_id
    and cm.user_id = auth.uid()
    and coalesce(cm.status, 'active') = 'active'
  limit 1;

  if not found then
    raise exception '현재 회사의 활동 멤버만 질문을 등록할 수 있습니다.' using errcode = '42501';
  end if;

  v_name := coalesce(
    nullif(btrim(v_membership.alias_name), ''),
    nullif(btrim(v_membership.display_name), ''),
    nullif(btrim(v_membership.discord_display_name), ''),
    '사용자'
  );

  insert into axe_product.support_questions(
    company_id,
    created_by_user_id,
    created_by_membership_id,
    author_name,
    author_discord_user_id,
    title,
    body,
    status,
    platform_unread,
    customer_unread,
    last_message_at,
    created_at,
    updated_at
  ) values (
    p_company_id,
    auth.uid(),
    v_membership.id,
    v_name,
    nullif(btrim(v_membership.discord_user_id), ''),
    v_title,
    v_body,
    'pending',
    true,
    false,
    now(),
    now(),
    now()
  ) returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4) Question detail + thread messages
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_support_get_question(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_q axe_product.support_questions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
  v_messages jsonb;
begin
  select * into v_q
  from axe_product.support_questions
  where id = p_question_id;

  if not found then
    raise exception '질문을 찾을 수 없습니다.' using errcode = '22023';
  end if;

  select exists(
    select 1
    from axe_product.company_memberships cm
    where cm.company_id = v_q.company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status, 'active') = 'active'
  ) into v_member;

  if not v_platform and not v_member then
    raise exception 'question access denied' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'author_type', m.author_type,
    'author_name', m.author_name,
    'body', m.body,
    'created_at', m.created_at
  ) order by m.created_at asc), '[]'::jsonb)
  into v_messages
  from axe_product.support_question_messages m
  where m.question_id = v_q.id;

  return jsonb_build_object(
    'id', v_q.id,
    'company_id', v_q.company_id,
    'company_name', (select c.name from axe_product.companies c where c.id = v_q.company_id),
    'title', v_q.title,
    'body', v_q.body,
    'status', v_q.status,
    'author_name', v_q.author_name,
    'created_at', v_q.created_at,
    'updated_at', v_q.updated_at,
    'last_message_at', v_q.last_message_at,
    'answered_at', v_q.answered_at,
    'dm_notified_at', v_q.dm_notified_at,
    'unread', case when v_platform then v_q.platform_unread else (v_q.customer_unread and v_q.created_by_user_id = auth.uid()) end,
    'viewer_is_platform', v_platform,
    'viewer_can_reply', (v_platform or v_q.created_by_user_id = auth.uid()),
    'messages', coalesce(v_messages, '[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 5) Add reply/follow-up
-- Platform reply => auto complete + customer unread
-- Customer follow-up => auto reopen to pending + platform unread
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_support_add_message(
  p_question_id uuid,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_q axe_product.support_questions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member axe_product.company_memberships%rowtype;
  v_body text := btrim(coalesce(p_body, ''));
  v_name text;
  v_message_id uuid;
begin
  if char_length(v_body) < 1 or char_length(v_body) > 4000 then
    raise exception '답변 내용은 1~4000자로 입력해 주세요.' using errcode = '22023';
  end if;

  select * into v_q
  from axe_product.support_questions
  where id = p_question_id
  for update;

  if not found then
    raise exception '질문을 찾을 수 없습니다.' using errcode = '22023';
  end if;

  if v_platform then
    v_name := 'AXE PRODUCT 운영자';
    insert into axe_product.support_question_messages(
      question_id, company_id, author_user_id, author_type, author_name, body
    ) values (
      v_q.id, v_q.company_id, auth.uid(), 'platform', v_name, v_body
    ) returning id into v_message_id;

    update axe_product.support_questions
    set status = 'complete',
        platform_unread = false,
        customer_unread = true,
        answered_at = now(),
        answered_by_user_id = auth.uid(),
        dm_notified_at = null,
        dm_notification_error = null,
        last_message_at = now(),
        updated_at = now()
    where id = v_q.id;
  else
    select cm.* into v_member
    from axe_product.company_memberships cm
    where cm.company_id = v_q.company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status, 'active') = 'active'
    limit 1;

    if not found then
      raise exception '현재 회사의 활동 멤버만 질문을 확인할 수 있습니다.' using errcode = '42501';
    end if;

    if v_q.created_by_user_id is distinct from auth.uid() then
      raise exception '추가 질문은 최초 질문 작성자만 등록할 수 있습니다.' using errcode = '42501';
    end if;

    v_name := coalesce(
      nullif(btrim(v_member.alias_name), ''),
      nullif(btrim(v_member.display_name), ''),
      nullif(btrim(v_member.discord_display_name), ''),
      '사용자'
    );

    insert into axe_product.support_question_messages(
      question_id, company_id, author_user_id, author_type, author_name, body
    ) values (
      v_q.id, v_q.company_id, auth.uid(), 'customer', v_name, v_body
    ) returning id into v_message_id;

    update axe_product.support_questions
    set status = 'pending',
        platform_unread = true,
        customer_unread = false,
        answered_at = null,
        answered_by_user_id = null,
        dm_notified_at = null,
        dm_notification_error = null,
        last_message_at = now(),
        updated_at = now()
    where id = v_q.id;
  end if;

  return jsonb_build_object(
    'message_id', v_message_id,
    'status', case when v_platform then 'complete' else 'pending' end,
    'viewer_is_platform', v_platform
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) Platform owner status control
-- -----------------------------------------------------------------------------
create or replace function axe_product.platform_support_set_status(
  p_question_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_rows integer;
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode = '42501';
  end if;
  if v_status not in ('pending','checking','complete') then
    raise exception '올바른 질문 상태가 아닙니다.' using errcode = '22023';
  end if;

  update axe_product.support_questions
  set status = v_status,
      platform_unread = false,
      customer_unread = case when v_status = 'complete' then true else customer_unread end,
      answered_at = case when v_status = 'complete' then coalesce(answered_at, now()) else answered_at end,
      answered_by_user_id = case when v_status = 'complete' then coalesce(answered_by_user_id, auth.uid()) else answered_by_user_id end,
      updated_at = now()
  where id = p_question_id;
  get diagnostics v_rows = row_count;

  if v_rows <> 1 then
    raise exception '질문을 찾을 수 없습니다.' using errcode = '22023';
  end if;

  return jsonb_build_object('updated', true, 'status', v_status);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7) Read marker (site badge)
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_support_mark_seen(p_question_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_q axe_product.support_questions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
begin
  select * into v_q from axe_product.support_questions where id = p_question_id;
  if not found then return false; end if;

  select exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id = v_q.company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status, 'active') = 'active'
  ) into v_member;

  if not v_platform and not v_member then
    raise exception 'question access denied' using errcode = '42501';
  end if;

  if v_platform then
    update axe_product.support_questions set platform_unread = false where id = p_question_id;
  else
    update axe_product.support_questions
    set customer_unread = false
    where id = p_question_id
      and created_by_user_id = auth.uid();
  end if;
  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- 8) Global support queue for PLATFORM OWNER
-- -----------------------------------------------------------------------------
create or replace function axe_product.platform_support_list_questions(p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 200));
  v_counts jsonb;
  v_items jsonb;
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'pending', count(*) filter (where q.status = 'pending'),
    'checking', count(*) filter (where q.status = 'checking'),
    'complete', count(*) filter (where q.status = 'complete'),
    'unread', count(*) filter (where q.platform_unread),
    'total', count(*)
  ) into v_counts
  from axe_product.support_questions q;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc), '[]'::jsonb)
  into v_items
  from (
    select
      q.id,
      q.company_id,
      c.name as company_name,
      q.title,
      q.status,
      q.author_name,
      q.platform_unread as unread,
      q.created_at,
      q.last_message_at,
      q.answered_at,
      q.dm_notified_at,
      (1 + (select count(*) from axe_product.support_question_messages m where m.question_id = q.id))::integer as message_count
    from axe_product.support_questions q
    join axe_product.companies c on c.id = q.company_id
    order by
      case q.status when 'pending' then 0 when 'checking' then 1 else 2 end,
      q.last_message_at desc
    limit v_limit
  ) x;

  return jsonb_build_object(
    'counts', coalesce(v_counts, jsonb_build_object('pending',0,'checking',0,'complete',0,'unread',0,'total',0)),
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 9) Notification target + result (PLATFORM OWNER only)
-- -----------------------------------------------------------------------------
create or replace function axe_product.platform_support_notification_target(p_question_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_q axe_product.support_questions%rowtype;
  v_company_name text;
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode = '42501';
  end if;

  select q.*
  into v_q
  from axe_product.support_questions q
  where q.id = p_question_id;

  if not found then
    raise exception '질문을 찾을 수 없습니다.' using errcode = '22023';
  end if;

  select c.name into v_company_name
  from axe_product.companies c
  where c.id = v_q.company_id;

  return jsonb_build_object(
    'question_id', v_q.id,
    'company_id', v_q.company_id,
    'company_name', v_company_name,
    'title', v_q.title,
    'discord_user_id', coalesce(
      (select nullif(btrim(cm.discord_user_id), '')
       from axe_product.company_memberships cm
       where cm.id = v_q.created_by_membership_id
       limit 1),
      v_q.author_discord_user_id
    ),
    'status', v_q.status
  );
end;
$$;

create or replace function axe_product.platform_support_mark_dm_result(
  p_question_id uuid,
  p_sent boolean,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode = '42501';
  end if;

  update axe_product.support_questions
  set dm_notified_at = case when coalesce(p_sent,false) then now() else null end,
      dm_notification_error = case when coalesce(p_sent,false) then null else nullif(left(coalesce(p_error,''),500),'') end,
      updated_at = now()
  where id = p_question_id;

  return found;
end;
$$;

-- -----------------------------------------------------------------------------
-- 10) Grants: only RPC surface is exposed to authenticated users
-- -----------------------------------------------------------------------------
revoke all on function axe_product.web_support_list_questions(uuid, integer) from public;
revoke all on function axe_product.web_support_create_question(uuid, text, text) from public;
revoke all on function axe_product.web_support_get_question(uuid) from public;
revoke all on function axe_product.web_support_add_message(uuid, text) from public;
revoke all on function axe_product.platform_support_set_status(uuid, text) from public;
revoke all on function axe_product.web_support_mark_seen(uuid) from public;
revoke all on function axe_product.platform_support_list_questions(integer) from public;
revoke all on function axe_product.platform_support_notification_target(uuid) from public;
revoke all on function axe_product.platform_support_mark_dm_result(uuid, boolean, text) from public;

grant execute on function axe_product.web_support_list_questions(uuid, integer) to authenticated;
grant execute on function axe_product.web_support_create_question(uuid, text, text) to authenticated;
grant execute on function axe_product.web_support_get_question(uuid) to authenticated;
grant execute on function axe_product.web_support_add_message(uuid, text) to authenticated;
grant execute on function axe_product.platform_support_set_status(uuid, text) to authenticated;
grant execute on function axe_product.web_support_mark_seen(uuid) to authenticated;
grant execute on function axe_product.platform_support_list_questions(integer) to authenticated;
grant execute on function axe_product.platform_support_notification_target(uuid) to authenticated;
grant execute on function axe_product.platform_support_mark_dm_result(uuid, boolean, text) to authenticated;

commit;
