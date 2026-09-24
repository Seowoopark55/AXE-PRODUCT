-- LAC HUB Stage 15: explicit expiry + fresh issuance + auditable history.
-- Run ONCE in Supabase SQL Editor before deploying Stage 15 web.
-- No existing company/subscription/pass values are changed by installation.
-- A company must finish its current subscription before receiving a fresh term.
BEGIN;
DO $preflight$
BEGIN
  IF to_regclass('axe_product.company_subscriptions') IS NULL
    OR to_regclass('axe_product.lac_company_access') IS NULL
    OR to_regclass('axe_product.lac_pass_requests') IS NULL THEN
    RAISE EXCEPTION 'Stage 12 and 13 must already be installed; nothing was changed.';
  END IF;
END;
$preflight$;

CREATE TABLE IF NOT EXISTS axe_product.lac_pass_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES axe_product.companies(id) ON DELETE CASCADE,
  event_action text NOT NULL CHECK (event_action IN ('issue','expire','pause','resume')),
  performed_at timestamptz NOT NULL DEFAULT now(),
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_subscription jsonb,
  next_subscription jsonb NOT NULL,
  previous_enabled boolean NOT NULL,
  next_enabled boolean NOT NULL,
  request_id uuid REFERENCES axe_product.lac_pass_requests(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS lac_pass_lifecycle_events_company_idx
  ON axe_product.lac_pass_lifecycle_events(company_id,performed_at DESC,id DESC);
ALTER TABLE axe_product.lac_pass_lifecycle_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE axe_product.lac_pass_lifecycle_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION axe_product.lac_admin_pass_lifecycle(
  p_company_id uuid,
  p_action text,
  p_days integer DEFAULT NULL,
  p_request_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_now timestamptz;
  v_subscription axe_product.company_subscriptions%rowtype;
  v_after axe_product.company_subscriptions%rowtype;
  v_before jsonb;
  v_exists boolean := false;
  v_enabled boolean := false;
  v_new_enabled boolean;
  v_request axe_product.lac_pass_requests%rowtype;
  v_plan text;
  v_status text;
BEGIN
  IF auth.uid() IS NULL OR NOT axe_product.platform_is_admin() THEN
    RAISE EXCEPTION '운영자 권한이 필요합니다.' USING ERRCODE='42501';
  END IF;
  IF p_company_id IS NULL OR p_action NOT IN ('issue','expire','pause','resume') OR p_action IS NULL THEN
    RAISE EXCEPTION '회사와 작업 종류를 확인해 주세요.' USING ERRCODE='22023';
  END IF;
  IF (p_action='issue' AND (p_days IS NULL OR p_days NOT IN (7,30,90)))
     OR (p_action<>'issue' AND p_days IS NOT NULL)
     OR (p_action<>'issue' AND p_request_id IS NOT NULL) THEN
    RAISE EXCEPTION '새 발급 기간은 7·30·90일 중 선택해 주세요.' USING ERRCODE='22023';
  END IF;
  -- Serialize all lifecycle operations on the company, including first issuance.
  PERFORM 1 FROM axe_product.companies c
    WHERE c.id=p_company_id AND c.status='active' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '활성 회사 정보를 찾을 수 없습니다.' USING ERRCODE='22023';
  END IF;
  v_now := clock_timestamp();
  SELECT * INTO v_subscription FROM axe_product.company_subscriptions s
    WHERE s.company_id=p_company_id FOR UPDATE;
  v_exists := FOUND;
  IF v_exists THEN v_before := to_jsonb(v_subscription); END IF;
  SELECT a.enabled INTO v_enabled FROM axe_product.lac_company_access a
    WHERE a.company_id=p_company_id FOR UPDATE;
  v_enabled := COALESCE(v_enabled,false);
  v_new_enabled := v_enabled;

  IF p_action='issue' THEN
    IF v_exists AND (v_enabled OR v_subscription.status='paused')
      AND v_subscription.status IN ('active','trial','paused','lifetime')
      AND (v_subscription.ends_at IS NULL OR COALESCE(v_subscription.grace_until,v_subscription.ends_at)>v_now) THEN
      RAISE EXCEPTION '기존 이용권이 진행 중이거나 일시정지 상태입니다. 먼저 즉시 만료해 주세요.' USING ERRCODE='22023';
    END IF;
    IF p_request_id IS NOT NULL THEN
      SELECT * INTO v_request FROM axe_product.lac_pass_requests r
        WHERE r.id=p_request_id AND r.company_id=p_company_id FOR UPDATE;
      IF NOT FOUND OR v_request.status<>'pending' THEN
        RAISE EXCEPTION '처리할 수 없는 이용권 신청입니다.' USING ERRCODE='22023';
      END IF;
    END IF;
    v_plan := CASE p_days WHEN 7 THEN 'trial' WHEN 30 THEN 'standard' ELSE 'pro' END;
    v_status := CASE WHEN p_days=7 THEN 'trial' ELSE 'active' END;
    INSERT INTO axe_product.company_subscriptions AS s
      (company_id,plan,status,starts_at,ends_at,grace_until,memo,updated_by,updated_at)
    VALUES (p_company_id,v_plan,v_status,v_now,v_now+make_interval(days=>p_days),NULL,
            CASE WHEN v_exists THEN v_subscription.memo ELSE NULL END,auth.uid(),v_now)
    ON CONFLICT (company_id) DO UPDATE SET
      plan=excluded.plan,status=excluded.status,starts_at=excluded.starts_at,
      ends_at=excluded.ends_at,grace_until=NULL,memo=excluded.memo,
      updated_by=auth.uid(),updated_at=v_now;
    INSERT INTO axe_product.lac_company_access AS a(company_id,enabled,updated_at,updated_by)
    VALUES(p_company_id,true,v_now,auth.uid())
    ON CONFLICT (company_id) DO UPDATE
      SET enabled=true,updated_at=v_now,updated_by=auth.uid();
    v_new_enabled := true;
    -- A manual issue also resolves any existing application for the company.
    UPDATE axe_product.lac_pass_requests r SET
      status='approved',reviewed_at=v_now,reviewed_by=auth.uid()
      WHERE r.company_id=p_company_id AND r.status='pending';
  ELSIF p_action='expire' THEN
    IF NOT v_exists OR (v_subscription.status='expired' AND NOT v_enabled) THEN
      RAISE EXCEPTION '종료할 이용권이 없습니다.' USING ERRCODE='22023';
    END IF;
    UPDATE axe_product.company_subscriptions s SET status='expired',
      ends_at=LEAST(COALESCE(s.ends_at,v_now),v_now),grace_until=NULL,
      updated_at=v_now,updated_by=auth.uid()
      WHERE s.company_id=p_company_id;
    INSERT INTO axe_product.lac_company_access AS a(company_id,enabled,updated_at,updated_by)
    VALUES(p_company_id,false,v_now,auth.uid())
    ON CONFLICT (company_id) DO UPDATE
      SET enabled=false,updated_at=v_now,updated_by=auth.uid();
    v_new_enabled := false;
  ELSIF p_action='pause' THEN
    IF NOT v_exists OR NOT v_enabled OR v_subscription.status NOT IN ('active','trial','lifetime')
      OR (v_subscription.ends_at IS NOT NULL AND v_subscription.ends_at<=v_now) THEN
      RAISE EXCEPTION '이용 중인 회사 이용권만 일시정지할 수 있습니다.' USING ERRCODE='22023';
    END IF;
    UPDATE axe_product.company_subscriptions s SET status='paused',updated_at=v_now,updated_by=auth.uid()
      WHERE s.company_id=p_company_id;
  ELSIF p_action='resume' THEN
    IF NOT v_exists OR NOT v_enabled OR v_subscription.status<>'paused'
      OR (v_subscription.ends_at IS NOT NULL AND v_subscription.ends_at<=v_now) THEN
      RAISE EXCEPTION '일시정지된 유효한 이용권만 재개할 수 있습니다. 기간이 지났다면 만료 후 새로 발급해 주세요.' USING ERRCODE='22023';
    END IF;
    UPDATE axe_product.company_subscriptions s SET
      status=CASE WHEN s.ends_at IS NULL THEN 'lifetime' WHEN s.plan='trial' THEN 'trial' ELSE 'active' END,
      updated_at=v_now,updated_by=auth.uid()
      WHERE s.company_id=p_company_id;
  END IF;
  SELECT * INTO v_after FROM axe_product.company_subscriptions s WHERE s.company_id=p_company_id;
  INSERT INTO axe_product.lac_pass_lifecycle_events
    (company_id,event_action,performed_at,performed_by,previous_subscription,next_subscription,
     previous_enabled,next_enabled,request_id)
    VALUES(p_company_id,p_action,v_now,auth.uid(),v_before,to_jsonb(v_after),v_enabled,v_new_enabled,p_request_id);
  RETURN jsonb_build_object('company_id',p_company_id,'action',p_action,'status',v_after.status,
    'starts_at',v_after.starts_at,'ends_at',v_after.ends_at,'enabled',v_new_enabled);
END;
$function$;

CREATE OR REPLACE FUNCTION axe_product.lac_admin_list_pass_lifecycle(p_company_id uuid)
RETURNS TABLE(event_action text,performed_at timestamptz,previous_subscription jsonb,
              next_subscription jsonb,performed_by uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT axe_product.platform_is_admin() THEN
    RAISE EXCEPTION '운영자 권한이 필요합니다.' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT e.event_action,e.performed_at,e.previous_subscription,
      e.next_subscription,e.performed_by
    FROM axe_product.lac_pass_lifecycle_events e
    WHERE e.company_id=p_company_id
    ORDER BY e.performed_at DESC,e.id DESC LIMIT 30;
END;
$function$;
-- Preserve Stage 14 operator retry policy while allowing natural-expiry renewal.
CREATE OR REPLACE FUNCTION axe_product.lac_pass_request_create(p_company_id uuid)
RETURNS TABLE(id uuid, status text, created boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_user uuid := auth.uid(); v_existing uuid; v_new uuid;
BEGIN
  IF v_user IS NULL OR p_company_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM axe_product.company_memberships m JOIN axe_product.companies c ON c.id=m.company_id
    WHERE m.company_id=p_company_id AND m.user_id=v_user AND m.status='active' AND c.status='active'
  ) THEN RAISE EXCEPTION '활동 중인 회사 멤버만 신청할 수 있습니다.' USING ERRCODE='42501'; END IF;
  -- A live or paused current term must not create a duplicate application.
  -- A naturally expired term may apply again even before a background process
  -- has cleared lac_company_access.enabled.
  IF EXISTS (
    SELECT 1 FROM axe_product.lac_company_access a
    JOIN axe_product.company_subscriptions s ON s.company_id=a.company_id
    WHERE a.company_id=p_company_id AND a.enabled=true
      AND s.status IN ('trial','active','paused','lifetime')
      AND (s.status='lifetime' OR s.ends_at IS NULL
           OR COALESCE(s.grace_until,s.ends_at)>=now())
  ) THEN
    RAISE EXCEPTION '현재 이용권이 남아 있습니다. 구독 상태를 확인해 주세요.' USING ERRCODE='22023';
  END IF;
  SELECT r.id INTO v_existing FROM axe_product.lac_pass_requests r
  WHERE r.company_id=p_company_id AND r.status='pending' ORDER BY r.requested_at DESC LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN QUERY SELECT v_existing, 'pending'::text,false; RETURN; END IF;
  IF NOT axe_product.platform_is_admin() AND EXISTS (
    SELECT 1 FROM axe_product.lac_pass_requests r WHERE r.company_id=p_company_id
    AND r.status='rejected' AND r.reviewed_at > now()-interval '30 minutes'
  ) THEN
    RAISE EXCEPTION '반려 후 30분 뒤에 다시 신청할 수 있습니다.' USING ERRCODE='22023';
  END IF;
  -- One DB transaction + partial unique index prevents duplicate requests across tabs.
  INSERT INTO axe_product.lac_pass_requests AS inserted(company_id,requested_by)
    VALUES (p_company_id,v_user) ON CONFLICT DO NOTHING RETURNING inserted.id INTO v_new;
  IF v_new IS NOT NULL THEN RETURN QUERY SELECT v_new,'pending'::text,true; RETURN; END IF;
  SELECT r.id INTO v_existing FROM axe_product.lac_pass_requests r
    WHERE r.company_id=p_company_id AND r.status='pending' ORDER BY r.requested_at DESC LIMIT 1;
  IF v_existing IS NULL THEN RAISE EXCEPTION '신청 상태가 변경되었습니다. 다시 시도해 주세요.'; END IF;
  RETURN QUERY SELECT v_existing,'pending'::text,false;
END;
$function$;


REVOKE ALL ON FUNCTION axe_product.lac_admin_pass_lifecycle(uuid,text,integer,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_admin_list_pass_lifecycle(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION axe_product.lac_admin_pass_lifecycle(uuid,text,integer,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_admin_list_pass_lifecycle(uuid) TO authenticated;
REVOKE ALL ON FUNCTION axe_product.lac_pass_request_create(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION axe_product.lac_pass_request_create(uuid) TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
-- Optional read-only verification after installation:
-- SELECT proname FROM pg_proc WHERE pronamespace='axe_product'::regnamespace
-- AND proname IN ('lac_admin_pass_lifecycle','lac_admin_list_pass_lifecycle');
-- Installation does not retrospectively reconstruct past subscription history.
