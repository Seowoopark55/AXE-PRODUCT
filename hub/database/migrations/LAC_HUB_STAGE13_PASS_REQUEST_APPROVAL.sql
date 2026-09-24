-- Stage 13: company-wide pass applications / platform-owner review.
-- PREREQUISITE: Stage 12 unified-pass SQL installed and verified.
-- Existing company/subscription/entitlement values are not migrated or reset.
BEGIN;
DO $preflight$ BEGIN
  IF to_regclass('axe_product.lac_company_access') IS NULL THEN
    RAISE EXCEPTION 'Stage 12 통합 이용권 SQL을 먼저 적용해 주세요.';
  END IF;
END $preflight$;
CREATE TABLE IF NOT EXISTS axe_product.lac_pass_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES axe_product.companies(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  dm_claimed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS lac_pass_requests_one_pending_per_company
  ON axe_product.lac_pass_requests(company_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS lac_pass_requests_recent_idx ON axe_product.lac_pass_requests(requested_at DESC);
ALTER TABLE axe_product.lac_pass_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE axe_product.lac_pass_requests FROM PUBLIC,anon,authenticated;

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
  -- A paused existing pass is a subscription issue, not a missing entitlement.
  IF EXISTS (SELECT 1 FROM axe_product.lac_company_access a
             WHERE a.company_id=p_company_id AND a.enabled=true) THEN
    RAISE EXCEPTION '이미 발급된 이용권입니다. 사용이 제한된다면 회사의 구독 상태를 확인해 주세요.' USING ERRCODE='22023';
  END IF;
  SELECT r.id INTO v_existing FROM axe_product.lac_pass_requests r
  WHERE r.company_id=p_company_id AND r.status='pending' ORDER BY r.requested_at DESC LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN QUERY SELECT v_existing, 'pending'::text,false; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM axe_product.lac_pass_requests r WHERE r.company_id=p_company_id
    AND r.status='rejected' AND r.reviewed_at > now()-interval '30 minutes') THEN
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

CREATE OR REPLACE FUNCTION axe_product.lac_pass_request_my_latest(p_company_id uuid)
RETURNS TABLE(id uuid,status text,requested_at timestamptz,reviewed_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR p_company_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM axe_product.company_memberships m
    WHERE m.company_id=p_company_id AND m.user_id=auth.uid() AND m.status='active'
  ) THEN RAISE EXCEPTION '회사 멤버 권한이 필요합니다.' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT r.id,r.status,r.requested_at,r.reviewed_at
    FROM axe_product.lac_pass_requests r WHERE r.company_id=p_company_id
    ORDER BY CASE WHEN r.status='pending' THEN 0 ELSE 1 END,r.requested_at DESC LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION axe_product.lac_admin_list_pass_requests()
RETURNS TABLE(id uuid,company_id uuid,company_name text,requested_by uuid,requester_name text,
  status text,requested_at timestamptz,reviewed_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT axe_product.platform_is_admin() THEN
    RAISE EXCEPTION '운영자 권한이 필요합니다.' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT r.id,r.company_id,c.name::text,r.requested_by,
      COALESCE(m.display_name,'Discord 사용자')::text,r.status,r.requested_at,r.reviewed_at
    FROM axe_product.lac_pass_requests r
    JOIN axe_product.companies c ON c.id=r.company_id
    LEFT JOIN axe_product.company_memberships m ON m.company_id=r.company_id AND m.user_id=r.requested_by AND m.status='active'
    ORDER BY CASE WHEN r.status='pending' THEN 0 ELSE 1 END,r.requested_at DESC LIMIT 100;
END;
$function$;

CREATE OR REPLACE FUNCTION axe_product.lac_admin_review_pass_request(p_request_id uuid,p_approve boolean)
RETURNS TABLE(id uuid,company_id uuid,status text,pass_enabled boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_request axe_product.lac_pass_requests%rowtype;
BEGIN
  IF auth.uid() IS NULL OR NOT axe_product.platform_is_admin() THEN
    RAISE EXCEPTION '운영자 권한이 필요합니다.' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_approve IS NULL THEN
    RAISE EXCEPTION '올바른 승인 요청이 필요합니다.' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_request FROM axe_product.lac_pass_requests r
    WHERE r.id=p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.status<>'pending' THEN
    RAISE EXCEPTION '이미 처리되었거나 존재하지 않는 신청입니다.' USING ERRCODE='22023'; END IF;
  IF NOT p_approve AND EXISTS (SELECT 1 FROM axe_product.lac_company_access a
    WHERE a.company_id=v_request.company_id AND a.enabled=true) THEN
    RAISE EXCEPTION '이미 발급된 이용권이 있으므로 해당 신청을 반려할 수 없습니다.' USING ERRCODE='22023'; END IF;
  IF p_approve THEN
    IF NOT EXISTS (SELECT 1 FROM axe_product.companies c WHERE c.id=v_request.company_id AND c.status='active') THEN
      RAISE EXCEPTION '비활성 회사에는 이용권을 발급할 수 없습니다.' USING ERRCODE='22023'; END IF;
    INSERT INTO axe_product.lac_company_access AS a(company_id,enabled,updated_at,updated_by)
      VALUES(v_request.company_id,true,now(),auth.uid())
      ON CONFLICT ON CONSTRAINT lac_company_access_pkey
      DO UPDATE SET enabled=true,updated_at=now(),updated_by=auth.uid();
  END IF;
  UPDATE axe_product.lac_pass_requests AS r
    SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        reviewed_at=now(),reviewed_by=auth.uid()
    WHERE r.id=p_request_id;
  -- Approval NEVER changes company_subscriptions.status, including paused.
  RETURN QUERY SELECT v_request.id,v_request.company_id,
    CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END::text,
    COALESCE((SELECT a.enabled FROM axe_product.lac_company_access a WHERE a.company_id=v_request.company_id),false);
END;
$function$;

-- This RPC is only for the applicant's server-authenticated DM delivery attempt.
-- Atomic claim ensures repeated API calls cannot send repeated messages.
CREATE OR REPLACE FUNCTION axe_product.lac_pass_claim_dm(p_request_id uuid)
RETURNS TABLE(company_name text,request_id uuid,requester_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_company_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_request_id IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.' USING ERRCODE='42501'; END IF;
  UPDATE axe_product.lac_pass_requests AS r SET dm_claimed_at=now()
    WHERE r.id=p_request_id AND r.requested_by=auth.uid()
      AND r.status='pending' AND r.dm_claimed_at IS NULL
    RETURNING r.company_id INTO v_company_id;
  IF v_company_id IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT c.name::text,p_request_id,COALESCE(m.display_name,'회사 멤버')::text
    FROM axe_product.companies c
    LEFT JOIN axe_product.company_memberships m ON m.company_id=c.id AND m.user_id=auth.uid() AND m.status='active'
    WHERE c.id=v_company_id LIMIT 1;
END;
$function$;

REVOKE ALL ON FUNCTION axe_product.lac_pass_request_create(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_pass_request_my_latest(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_admin_list_pass_requests() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_admin_review_pass_request(uuid,boolean) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_pass_claim_dm(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION axe_product.lac_pass_request_create(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_pass_request_my_latest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_admin_list_pass_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_admin_review_pass_request(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_pass_claim_dm(uuid) TO authenticated;
COMMIT;
