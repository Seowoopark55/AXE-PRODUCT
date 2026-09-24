-- LAC HUB: one company-wide entitlement. Run in Supabase SQL Editor BEFORE deploying Stage 12 web.
-- Existing subscriptions (including AXE paused), companies and members are NOT changed.
-- New companies have no access unless a platform administrator explicitly grants it.
BEGIN;
CREATE TABLE IF NOT EXISTS axe_product.lac_company_access (
    company_id uuid PRIMARY KEY REFERENCES axe_product.companies(id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE axe_product.lac_company_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE axe_product.lac_company_access FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION axe_product.lac_my_company_access(p_company_id uuid)
RETURNS TABLE(company_id uuid, entitlement_enabled boolean, subscription_status text, can_use boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR p_company_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM axe_product.company_memberships m
    WHERE m.company_id=p_company_id AND m.user_id=auth.uid() AND m.status='active'
  ) THEN
    RAISE EXCEPTION 'active company membership required' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT c.id, COALESCE(a.enabled,false),
    CASE WHEN s.company_id IS NULL THEN 'unassigned'
         WHEN s.status='lifetime' THEN 'active'
         WHEN s.status IN ('paused','expired') THEN s.status
         WHEN s.starts_at IS NOT NULL AND s.starts_at > now() THEN 'pending'
         WHEN s.ends_at IS NOT NULL AND COALESCE(s.grace_until,s.ends_at)<now() THEN 'expired'
         ELSE s.status END,
    (COALESCE(a.enabled,false) AND s.company_id IS NOT NULL
     AND s.status IN ('trial','active','lifetime')
     AND (s.starts_at IS NULL OR s.starts_at <= now())
     AND (s.status='lifetime' OR s.ends_at IS NULL OR COALESCE(s.grace_until,s.ends_at)>=now()))
  FROM axe_product.companies c
  LEFT JOIN axe_product.lac_company_access a ON a.company_id=c.id
  LEFT JOIN axe_product.company_subscriptions s ON s.company_id=c.id
  WHERE c.id=p_company_id AND c.status='active';
END;
$function$;

CREATE OR REPLACE FUNCTION axe_product.lac_admin_list_company_access()
RETURNS TABLE(company_id uuid, enabled boolean, updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT axe_product.platform_is_admin() THEN
    RAISE EXCEPTION 'platform administrator required' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT a.company_id,a.enabled,a.updated_at
  FROM axe_product.lac_company_access a ORDER BY a.company_id;
END;
$function$;

CREATE OR REPLACE FUNCTION axe_product.lac_admin_set_company_access(p_company_id uuid, p_enabled boolean)
RETURNS TABLE(company_id uuid, enabled boolean, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT axe_product.platform_is_admin() THEN
    RAISE EXCEPTION 'platform administrator required' USING ERRCODE='42501';
  END IF;
  IF p_company_id IS NULL OR p_enabled IS NULL OR NOT EXISTS (
    SELECT 1 FROM axe_product.companies c WHERE c.id=p_company_id AND c.status='active'
  ) THEN
    RAISE EXCEPTION 'valid active company and entitlement status required' USING ERRCODE='22023';
  END IF;
  RETURN QUERY
  INSERT INTO axe_product.lac_company_access AS a(company_id,enabled,updated_at,updated_by)
  VALUES(p_company_id,p_enabled,now(),auth.uid())
  ON CONFLICT ON CONSTRAINT lac_company_access_pkey
  DO UPDATE SET enabled=EXCLUDED.enabled,updated_at=EXCLUDED.updated_at,updated_by=EXCLUDED.updated_by
  RETURNING a.company_id,a.enabled,a.updated_at;
END;
$function$;

REVOKE ALL ON FUNCTION axe_product.lac_my_company_access(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_admin_list_company_access() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_admin_set_company_access(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION axe_product.lac_my_company_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_admin_list_company_access() TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_admin_set_company_access(uuid,boolean) TO authenticated;
COMMIT;
-- Read-only confirmation:
-- SELECT c.name, s.status AS existing_subscription_status,
--        COALESCE(a.enabled,false) AS company_pass_enabled
-- FROM axe_product.companies c
-- LEFT JOIN axe_product.company_subscriptions s ON s.company_id=c.id
-- LEFT JOIN axe_product.lac_company_access a ON a.company_id=c.id;
