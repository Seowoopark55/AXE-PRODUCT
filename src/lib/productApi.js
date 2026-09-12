import { supabase } from './supabase.js';

function assertClient() {
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
}

function unwrap(result, fallbackMessage) {
  if (result.error) {
    const message = result.error.message || fallbackMessage;
    throw new Error(message);
  }
  return result.data;
}

export async function getSession() {
  assertClient();
  const result = await supabase.auth.getSession();
  if (result.error) throw result.error;
  return result.data.session;
}

export async function refreshSession() {
  assertClient();
  const result = await supabase.auth.refreshSession();
  if (result.error) throw result.error;
  return result.data.session;
}

export async function signInWithDiscord() {
  assertClient();
  const configuredProvider = String(import.meta.env.VITE_SUPABASE_DISCORD_AUTH_PROVIDER || 'discord').trim();
  const provider = configuredProvider || 'discord';
  const options = { redirectTo: `${window.location.origin}/` };
  if (provider.startsWith('custom:')) options.scopes = 'identify';
  const result = await supabase.auth.signInWithOAuth({ provider, options });
  if (result.error) throw result.error;
}

export async function signOut() {
  assertClient();
  const result = await supabase.auth.signOut();
  if (result.error) throw result.error;
}

export function onAuthStateChange(callback) {
  assertClient();
  return supabase.auth.onAuthStateChange(callback);
}

export async function listCompanies() {
  assertClient();
  const result = await supabase
    .from('companies')
    .select('id,name,slug,status,created_at,updated_at')
    .order('created_at', { ascending: true });
  return unwrap(result, '회사 목록을 불러오지 못했습니다.') || [];
}

export async function createCompany(name, slug = '') {
  assertClient();
  const result = await supabase.rpc('create_company', {
    p_name: name,
    p_slug: slug || null,
  });
  return unwrap(result, '회사를 생성하지 못했습니다.');
}

export async function getMemberships(companyId) {
  assertClient();
  const result = await supabase
    .from('company_memberships')
    .select('id,company_id,user_id,role,status,display_name,discord_user_id,discord_display_name,alias_name,employment_started_on,member_note,joined_at,created_at,updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });
  return unwrap(result, '멤버 목록을 불러오지 못했습니다.') || [];
}

export async function updateMembershipRole(membershipId, role) {
  assertClient();
  const result = await supabase
    .from('company_memberships')
    .update({ role })
    .eq('id', membershipId)
    .select('id,role')
    .single();
  return unwrap(result, '멤버 역할을 변경하지 못했습니다.');
}


export async function updateMembershipAlias(membershipId, aliasName) {
  assertClient();
  const value = String(aliasName || '').trim() || null;
  const result = await supabase
    .from('company_memberships')
    .update({ alias_name: value, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
    .select('id,display_name,discord_display_name,alias_name')
    .single();
  return unwrap(result, '멤버 별칭을 저장하지 못했습니다.');
}


export async function updateMembershipEmploymentDate(membershipId, employmentStartedOn) {
  assertClient();
  const value = String(employmentStartedOn || '').trim() || null;
  const result = await supabase
    .from('company_memberships')
    .update({ employment_started_on: value, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
    .select('id,employment_started_on')
    .single();
  return unwrap(result, '입사일을 저장하지 못했습니다.');
}

export async function updateMembershipNote(membershipId, memberNote) {
  assertClient();
  const value = String(memberNote || '').trim() || null;
  const result = await supabase
    .from('company_memberships')
    .update({ member_note: value, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
    .select('id,member_note')
    .single();
  return unwrap(result, '멤버 메모를 저장하지 못했습니다.');
}

export async function updateCompanyName(companyId, name) {
  assertClient();
  const normalized = String(name || '').trim();
  if (!normalized) throw new Error('회사 이름을 입력해 주세요.');
  const result = await supabase.rpc('web_company_admin_update_name', {
    p_company_id: companyId,
    p_name: normalized,
  });
  return unwrap(result, '회사 이름을 변경하지 못했습니다.');
}

const COMPANY_BRANDING_BUCKET = 'axe-product-company-branding';

export function getCompanyBannerPublicUrl(companyId, cacheKey = '') {
  assertClient();
  if (!companyId) return '';
  const path = `${companyId}/banner`;
  const result = supabase.storage.from(COMPANY_BRANDING_BUCKET).getPublicUrl(path);
  const url = result?.data?.publicUrl || '';
  if (!url) return '';
  return cacheKey ? `${url}?v=${encodeURIComponent(String(cacheKey))}` : url;
}

export async function uploadCompanyBanner(companyId, file) {
  assertClient();
  if (!companyId) throw new Error('회사를 확인할 수 없습니다.');
  if (!(file instanceof File) || !file.size) throw new Error('배너 이미지를 선택해 주세요.');
  const allowed = new Set(['image/jpeg','image/png','image/webp']);
  if (!allowed.has(file.type)) throw new Error('배너는 JPG, PNG, WEBP 이미지만 사용할 수 있습니다.');
  if (file.size > 5 * 1024 * 1024) throw new Error('배너 이미지는 5MB 이하여야 합니다.');
  const path = `${companyId}/banner`;
  const result = await supabase.storage.from(COMPANY_BRANDING_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (result.error) throw new Error(result.error.message || '배너 이미지를 업로드하지 못했습니다.');
  return { path, updatedAt: new Date().toISOString() };
}

export async function removeCompanyBanner(companyId) {
  assertClient();
  if (!companyId) throw new Error('회사를 확인할 수 없습니다.');
  const path = `${companyId}/banner`;
  const result = await supabase.storage.from(COMPANY_BRANDING_BUCKET).remove([path]);
  if (result.error) throw new Error(result.error.message || '배너 이미지를 삭제하지 못했습니다.');
  return true;
}

export async function getModuleCatalog() {
  assertClient();
  const result = await supabase
    .from('module_catalog')
    .select('module_key,display_name,description,sort_order,active')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  return unwrap(result, '모듈 목록을 불러오지 못했습니다.') || [];
}

export async function getCompanyModules(companyId) {
  assertClient();
  const result = await supabase
    .from('company_modules')
    .select('company_id,module_key,enabled,settings,updated_at')
    .eq('company_id', companyId);
  return unwrap(result, '회사 모듈 설정을 불러오지 못했습니다.') || [];
}

export async function setCompanyModule(companyId, moduleKey, enabled, userId) {
  assertClient();
  const result = await supabase
    .from('company_modules')
    .update({
      enabled,
      updated_by: userId,
    })
    .eq('company_id', companyId)
    .eq('module_key', moduleKey)
    .select('company_id,module_key,enabled,updated_at')
    .single();
  return unwrap(result, '모듈 설정을 변경하지 못했습니다.');
}

export async function getCookingOrderTypes(companyId) {
  assertClient();
  const result = await supabase
    .from('cooking_order_types')
    .select('company_id,type_key,label,short_label,detail,price_per_set,sort_order,enabled')
    .eq('company_id', companyId)
    .order('sort_order', { ascending: true })
    .order('type_key', { ascending: true });
  return unwrap(result, '요리 주문 메뉴를 불러오지 못했습니다.') || [];
}

export async function saveCookingOrderType(companyId, payload) {
  assertClient();
  const typeKey = String(payload?.typeKey || '').trim();
  const label = String(payload?.label || '').trim();
  const shortLabel = String(payload?.shortLabel || '').trim();
  const detail = String(payload?.detail || '').trim();
  const pricePerSet = Math.max(0, Math.floor(Number(payload?.pricePerSet || 0)));
  const sortOrder = Math.max(0, Math.floor(Number(payload?.sortOrder || 0)));
  if (!typeKey) throw new Error('메뉴 내부 키가 없습니다.');
  if (!label) throw new Error('메뉴 이름을 입력해 주세요.');
  const result = await supabase
    .from('cooking_order_types')
    .upsert({ company_id: companyId, type_key: typeKey, label, short_label: shortLabel || label, detail, price_per_set: pricePerSet, sort_order: sortOrder, enabled: payload?.enabled !== false }, { onConflict: 'company_id,type_key' })
    .select('company_id,type_key,label,short_label,detail,price_per_set,sort_order,enabled')
    .single();
  return unwrap(result, '요리 주문 메뉴를 저장하지 못했습니다.');
}

export async function setCookingOrderTypeEnabled(companyId, typeKey, enabled) {
  assertClient();
  const result = await supabase
    .from('cooking_order_types')
    .update({ enabled: Boolean(enabled) })
    .eq('company_id', companyId)
    .eq('type_key', String(typeKey || '').trim())
    .select('company_id,type_key,label,short_label,detail,price_per_set,sort_order,enabled')
    .single();
  return unwrap(result, '요리 주문 메뉴 상태를 변경하지 못했습니다.');
}

export async function getCookingDiscordConfig(companyId) {
  assertClient();
  const result = await supabase
    .from('cooking_discord_config')
    .select('company_id,channel_id,help_message_id,dashboard_message_id,is_open,enabled,schedule_text,set_guide,extra_guide,max_active_orders,updated_by_membership_id,updated_at')
    .eq('company_id', companyId)
    .maybeSingle();
  return unwrap(result, '요리 주문 안내 설정을 불러오지 못했습니다.');
}

export async function saveCookingDiscordGuide(companyId, payload, membershipId) {
  assertClient();
  const scheduleText = String(payload?.scheduleText || '').trim().slice(0, 200);
  const extraGuide = String(payload?.extraGuide || '').trim().slice(0, 1000);
  const result = await supabase
    .from('cooking_discord_config')
    .update({
      schedule_text: scheduleText,
      extra_guide: extraGuide,
      updated_by_membership_id: membershipId || null,
    })
    .eq('company_id', companyId)
    .select('company_id,channel_id,help_message_id,dashboard_message_id,is_open,enabled,schedule_text,set_guide,extra_guide,max_active_orders,updated_by_membership_id,updated_at')
    .maybeSingle();
  const data = unwrap(result, '요리 주문 안내 설정을 저장하지 못했습니다.');
  if (!data) throw new Error('Discord 요리 주문 채널 설정을 먼저 완료해 주세요.');
  return data;
}

export async function getCompanySettings(companyId) {
  assertClient();
  const result = await supabase
    .from('company_settings')
    .select('company_id,brand_name,locale,timezone,settings,updated_at')
    .eq('company_id', companyId)
    .single();
  return unwrap(result, '회사 설정을 불러오지 못했습니다.');
}

export async function updateCompanySettings(companyId, patch, userId) {
  assertClient();
  const result = await supabase
    .from('company_settings')
    .update({
      ...patch,
      updated_by: userId,
    })
    .eq('company_id', companyId)
    .select('company_id,brand_name,locale,timezone,settings,updated_at')
    .single();
  return unwrap(result, '회사 설정을 저장하지 못했습니다.');
}

export async function getDiscordConnection(companyId) {
  assertClient();
  const result = await supabase
    .from('discord_connections')
    .select('id,company_id,guild_id,guild_name,status,connected_at,updated_at')
    .eq('company_id', companyId)
    .maybeSingle();
  return unwrap(result, 'Discord 연결 상태를 불러오지 못했습니다.');
}


export async function getDiscordChannels(companyId) {
  assertClient();
  const result = await supabase
    .from('discord_guild_channels')
    .select('company_id,guild_id,channel_id,channel_name,channel_type,position,parent_id,is_text_based,is_voice_based,synced_at,updated_at')
    .eq('company_id', companyId)
    .order('position', { ascending: true })
    .order('channel_name', { ascending: true });
  return unwrap(result, 'Discord 채널 목록을 불러오지 못했습니다.') || [];
}

export async function getDiscordRoles(companyId) {
  assertClient();
  const result = await supabase
    .from('discord_guild_roles')
    .select('company_id,guild_id,role_id,role_name,position,color,managed,mentionable,hoist,permissions,synced_at,updated_at')
    .eq('company_id', companyId)
    .order('position', { ascending: false })
    .order('role_name', { ascending: true });
  return unwrap(result, 'Discord 역할 목록을 불러오지 못했습니다.') || [];
}

export async function getDiscordCompanyConfig(companyId) {
  assertClient();
  const result = await supabase
    .from('discord_company_config')
    .select('company_id,notification_channel_id,command_channel_id,admin_role_id,member_role_id,created_at,updated_at')
    .eq('company_id', companyId)
    .maybeSingle();
  return unwrap(result, 'Discord 회사 설정을 불러오지 못했습니다.');
}

export async function saveDiscordCompanyConfig(companyId, patch, userId) {
  assertClient();
  const result = await supabase
    .from('discord_company_config')
    .upsert(
      {
        company_id: companyId,
        notification_channel_id: patch.notification_channel_id || null,
        command_channel_id: patch.command_channel_id || null,
        admin_role_id: patch.admin_role_id || null,
        member_role_id: patch.member_role_id || null,
        updated_by: userId,
      },
      { onConflict: 'company_id' }
    )
    .select('company_id,notification_channel_id,command_channel_id,admin_role_id,member_role_id,created_at,updated_at')
    .single();

  return unwrap(result, 'Discord 회사 설정을 저장하지 못했습니다.');
}


export async function enqueueDiscordTestNotification(companyId) {
  assertClient();

  const result = await supabase.rpc('enqueue_discord_test_notification', {
    p_company_id: companyId,
  });

  const rows = unwrap(result, 'Discord 테스트 알림 요청을 만들지 못했습니다.') || [];
  const row = Array.isArray(rows) ? rows[0] : rows;

  if (!row?.job_id) {
    throw new Error('Discord 테스트 알림 요청 결과를 확인하지 못했습니다.');
  }

  return row;
}

export async function getRecentDiscordDeliveryJobs(companyId, limit = 5) {
  assertClient();

  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));

  const result = await supabase
    .from('discord_delivery_jobs')
    .select('id,company_id,guild_id,channel_id,job_type,status,attempt_count,last_error,created_at,claimed_at,completed_at,updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  return unwrap(result, 'Discord 전송 기록을 불러오지 못했습니다.') || [];
}

export async function getAuditEvents(companyId, limit = 50) {
  assertClient();
  const result = await supabase
    .from('audit_events')
    .select('id,company_id,actor_user_id,action,entity_type,entity_id,created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return unwrap(result, '감사 로그를 불러오지 못했습니다.') || [];
}

export async function createCompanyInvite(companyId, maxUses = 1, expiresInHours = 168) {
  assertClient();
  const result = await supabase.rpc('create_company_invite', {
    p_company_id: companyId,
    p_max_uses: maxUses,
    p_expires_in_hours: expiresInHours,
  });
  const data = unwrap(result, '초대코드를 생성하지 못했습니다.') || [];
  return Array.isArray(data) ? (data[0] || null) : data;
}

export async function listCompanyInvites(companyId) {
  assertClient();
  const result = await supabase.rpc('list_company_invites', {
    p_company_id: companyId,
  });
  return unwrap(result, '초대코드 목록을 불러오지 못했습니다.') || [];
}

export async function revokeCompanyInvite(companyId, inviteId) {
  assertClient();
  const result = await supabase.rpc('revoke_company_invite', {
    p_company_id: companyId,
    p_invite_id: inviteId,
  });
  return unwrap(result, '초대코드를 폐기하지 못했습니다.');
}

export async function redeemCompanyInvite(inviteCode) {
  assertClient();
  const result = await supabase.rpc('redeem_company_invite', {
    p_invite_code: inviteCode,
  });
  const data = unwrap(result, '초대코드로 회사에 참가하지 못했습니다.') || [];
  return Array.isArray(data) ? (data[0] || null) : data;
}



// ============================================================
// STAGE 4C — FUND WEB RPC CLIENT
// ============================================================
export async function getFundMyPeriods(companyId, limit = 24) {
  assertClient();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 24, 60));
  const result = await supabase.rpc('fund_get_my_periods', {
    p_company_id: companyId,
    p_limit: safeLimit,
  });
  return unwrap(result, '내 공금 현황을 불러오지 못했습니다.') || [];
}

export async function getFundAdminRequests(companyId, status = null, limit = 100) {
  assertClient();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const result = await supabase.rpc('fund_admin_list_requests', {
    p_company_id: companyId,
    p_status: status || null,
    p_limit: safeLimit,
  });
  return unwrap(result, '공금 납부 신청 목록을 불러오지 못했습니다.') || [];
}

export async function getFundAdminPeriodStatus(companyId, year, month, week) {
  assertClient();
  const result = await supabase.rpc('fund_admin_get_period_status', {
    p_company_id: companyId,
    p_year: Number(year),
    p_month: Number(month),
    p_week: Number(week),
  });
  return unwrap(result, '공금 주차별 현황을 불러오지 못했습니다.') || [];
}

export async function reviewFundRequest(companyId, requestId, action, reviewNote = '') {
  assertClient();
  const result = await supabase.rpc('fund_admin_review_request', {
    p_company_id: companyId,
    p_request_id: requestId,
    p_action: action,
    p_review_note: reviewNote || null,
  });
  const rows = unwrap(result, '공금 납부 신청을 처리하지 못했습니다.') || [];
  return Array.isArray(rows) ? (rows[0] || null) : rows;
}

export async function cancelFundApproval(companyId, requestId, reason) {
  assertClient();
  const safeReason = String(reason || '').trim();
  if (!safeReason) throw new Error('승인 취소 사유를 입력해 주세요.');
  const result = await supabase.rpc('fund_admin_cancel_approval', {
    p_company_id: companyId,
    p_request_id: requestId,
    p_reason: safeReason,
  });
  return unwrap(result, '공금 승인을 취소하지 못했습니다.');
}

export async function setFundFeeRule(companyId, year, month, week, weeklyFee, note = '') {
  assertClient();
  const result = await supabase.rpc('fund_admin_set_fee_rule', {
    p_company_id: companyId,
    p_start_year: Number(year),
    p_start_month: Number(month),
    p_start_week: Number(week),
    p_weekly_fee: Number(weeklyFee),
    p_note: note || null,
  });
  return unwrap(result, '공금 기준액을 저장하지 못했습니다.');
}


// ============================================================
// STAGE 4D — FUND EVIDENCE STORAGE + MEMBER SUBMISSION
// ============================================================
const FUND_EVIDENCE_BUCKET = 'axe-fund-evidence';
const FUND_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
const FUND_EVIDENCE_MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function uploadFundEvidence(companyId, userId, file) {
  assertClient();

  if (!(file instanceof File)) throw new Error('공금 증빙 이미지를 선택해 주세요.');
  if (!companyId || !userId) throw new Error('증빙 업로드 사용자 정보를 확인하지 못했습니다.');
  if (!FUND_EVIDENCE_MIME_TO_EXT[file.type]) {
    throw new Error('증빙은 JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
  }
  if (!file.size || file.size > FUND_EVIDENCE_MAX_BYTES) {
    throw new Error('증빙 이미지는 10MB 이하만 업로드할 수 있습니다.');
  }

  const ext = FUND_EVIDENCE_MIME_TO_EXT[file.type];
  const objectName = `${companyId}/${userId}/${crypto.randomUUID()}.${ext}`;
  const result = await supabase.storage
    .from(FUND_EVIDENCE_BUCKET)
    .upload(objectName, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  unwrap(result, '공금 증빙 이미지를 업로드하지 못했습니다.');
  return objectName;
}

export async function removeUnclaimedFundEvidence(objectName) {
  assertClient();
  if (!objectName) return;

  const result = await supabase.storage
    .from(FUND_EVIDENCE_BUCKET)
    .remove([objectName]);

  if (result.error) throw result.error;
}

export async function getFundEvidenceSignedUrl(objectName, expiresInSeconds = 300) {
  assertClient();
  if (!objectName) throw new Error('증빙 파일 경로가 없습니다.');

  const safeExpires = Math.max(60, Math.min(Number(expiresInSeconds) || 300, 900));
  const result = await supabase.storage
    .from(FUND_EVIDENCE_BUCKET)
    .createSignedUrl(objectName, safeExpires);

  const data = unwrap(result, '공금 증빙 이미지를 열지 못했습니다.');
  if (!data?.signedUrl) throw new Error('증빙 이미지 임시 주소를 만들지 못했습니다.');
  return data.signedUrl;
}

export async function submitFundRequest(companyId, payload) {
  assertClient();

  const result = await supabase.rpc('fund_submit_request', {
    p_company_id: companyId,
    p_year: Number(payload.year),
    p_month: Number(payload.month),
    p_week: Number(payload.week),
    p_payment_mode: payload.paymentMode,
    p_public_amount: payload.publicAmount == null ? null : Number(payload.publicAmount),
    p_company_amount: payload.companyAmount == null ? null : Number(payload.companyAmount),
    p_evidence_path: payload.evidencePath,
    p_memo: payload.memo || null,
    p_client_request_id: payload.clientRequestId || null,
  });

  return unwrap(result, '공금 납부 신청을 등록하지 못했습니다.');
}


async function authenticatedProductApi(path, init = {}) {
  const session = await getSession();
  const accessToken = session?.access_token;
  if (!accessToken) throw new Error('로그인이 필요합니다.');

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || '서버 요청에 실패했습니다.');
  }

  return data;
}

export async function startDiscordConnection(companyId) {
  const data = await authenticatedProductApi('/api/discord/start', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId }),
  });

  if (!data?.authorize_url) {
    throw new Error('Discord 인증 주소를 받지 못했습니다.');
  }

  return data;
}

export async function completeDiscordConnection(linkToken) {
  const data = await authenticatedProductApi('/api/discord/complete', {
    method: 'POST',
    body: JSON.stringify({ link_token: linkToken }),
  });

  if (!data?.connection?.company_id) {
    throw new Error('Discord 연결 결과를 받지 못했습니다.');
  }

  return data.connection;
}


export async function createGuidedSetupChannels(companyId, categoryName, channels = []) {
  return authenticatedProductApi('/api/discord/setup/channels', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId, category_name: categoryName, channels }),
  });
}

export async function listGuidedSetupMembers(companyId, roleId) {
  const data = await authenticatedProductApi('/api/discord/setup/members', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId, role_id: roleId }),
  });
  return data || { members: [] };
}

export async function bulkRegisterDiscordMembers(companyId, roleId, discordUserIds = [], role = 'member') {
  const ids = [...new Set((Array.isArray(discordUserIds) ? discordUserIds : [])
    .map((value) => String(value || '').trim())
    .filter((value) => /^\d{15,22}$/.test(value)))];
  if (!ids.length) return { inserted: [], skipped: [], rejected_count: 0 };
  return authenticatedProductApi('/api/discord/setup/register-members', {
    method: 'POST',
    body: JSON.stringify({
      company_id: companyId,
      role_id: String(roleId || ''),
      discord_user_ids: ids,
      target_role: role === 'admin' ? 'admin' : 'member',
    }),
  });
}

export async function getCompanyOnboardingStatus(companyId) {
  assertClient();
  const result = await supabase.rpc('web_get_company_onboarding_status', {
    p_company_id: companyId,
  });
  return unwrap(result, '회사 온보딩 상태를 불러오지 못했습니다.') || null;
}

export async function requestCompanyDiscordReconnect(companyId) {
  assertClient();
  const result = await supabase.rpc('request_company_discord_reconnect', {
    p_company_id: companyId,
  });
  const jobId = unwrap(result, 'Discord 연결 다시 설정 요청을 만들지 못했습니다.');
  if (!jobId) throw new Error('Discord 연결 다시 설정 작업 ID를 받지 못했습니다.');
  return String(jobId);
}

// ============================================================
// STAGE 5C / AMMO
// ============================================================
export async function getAmmoSettings(companyId) {
  assertClient();
  const result = await supabase.rpc('ammo_get_product_config', { p_company_id: companyId });
  return unwrap(result, '총알 설정을 불러오지 못했습니다.') || {};
}

export async function getAmmoRounds(companyId, limit = 30) {
  assertClient();
  const result = await supabase.rpc('ammo_get_rounds', {
    p_company_id: companyId,
    p_limit: Number(limit),
  });
  return unwrap(result, '총알 회차를 불러오지 못했습니다.') || [];
}

export async function getAmmoRoundOrders(companyId, roundId, includeHistory = false) {
  assertClient();
  const result = await supabase.rpc('ammo_get_round_orders', {
    p_company_id: companyId,
    p_round_id: roundId,
    p_include_history: Boolean(includeHistory),
  });
  return unwrap(result, '총알 신청 목록을 불러오지 못했습니다.') || [];
}

export async function getAmmoRoundMakers(companyId, roundId, includeHistory = false) {
  assertClient();
  const result = await supabase.rpc('ammo_get_round_makers', {
    p_company_id: companyId,
    p_round_id: roundId,
    p_include_history: Boolean(includeHistory),
  });
  return unwrap(result, '총알 제작 참여자를 불러오지 못했습니다.') || [];
}

export async function submitAmmoOrder(companyId, roundId, requestedSets) {
  assertClient();
  const result = await supabase.rpc('ammo_submit_order', {
    p_company_id: companyId,
    p_round_id: roundId,
    p_requested_sets: Number(requestedSets),
    p_client_request_id: crypto.randomUUID(),
  });
  return unwrap(result, '총알 신청을 등록하지 못했습니다.');
}

export async function updateMyAmmoOrder(companyId, orderId, requestedSets) {
  assertClient();
  const result = await supabase.rpc('ammo_update_my_order', {
    p_company_id: companyId,
    p_order_id: orderId,
    p_requested_sets: Number(requestedSets),
  });
  return unwrap(result, '총알 신청을 수정하지 못했습니다.');
}

export async function cancelMyAmmoOrder(companyId, orderId, reason = '') {
  assertClient();
  const result = await supabase.rpc('ammo_cancel_my_order', {
    p_company_id: companyId,
    p_order_id: orderId,
    p_reason: reason || null,
  });
  return unwrap(result, '총알 신청을 취소하지 못했습니다.');
}

export async function setMyAmmoMaker(companyId, roundId, join) {
  assertClient();
  const result = await supabase.rpc('ammo_set_my_maker', {
    p_company_id: companyId,
    p_round_id: roundId,
    p_join: Boolean(join),
  });
  return unwrap(result, '총알 제작 참여 상태를 변경하지 못했습니다.');
}

export async function completeAmmoOrder(companyId, orderId) {
  assertClient();
  const result = await supabase.rpc('ammo_complete_order', {
    p_company_id: companyId,
    p_order_id: orderId,
  });
  return unwrap(result, '총알 배분 완료 처리에 실패했습니다.');
}

export async function undoAmmoCompletion(companyId, orderId) {
  assertClient();
  const result = await supabase.rpc('ammo_undo_completion', {
    p_company_id: companyId,
    p_order_id: orderId,
  });
  return unwrap(result, '총알 배분 완료 취소에 실패했습니다.');
}

export async function setAmmoSettings(companyId, payload) {
  assertClient();
  const result = await supabase.rpc('ammo_admin_save_product_config', {
    p_company_id: companyId,
    p_event_weekdays: payload.eventWeekdays,
    p_line_sets: Number(payload.lineSets),
    p_half_sets: Number(payload.halfSets),
    p_max_order_sets: Number(payload.maxOrderSets),
    p_keep_minutes: Number(payload.keepMinutes),
    p_enabled_ammo_keys: payload.enabledAmmoKeys,
    p_default_ammo_key: payload.defaultAmmoKey,
    p_aliases: payload.aliases || {},
  });
  return unwrap(result, '총알 설정 저장에 실패했습니다.');
}

export async function openAmmoRound(companyId, eventDate, sessionType) {
  assertClient();
  const result = await supabase.rpc('ammo_admin_open_round', {
    p_company_id: companyId,
    p_event_date: eventDate,
    p_session_type: sessionType,
  });
  return unwrap(result, '총알 회차를 열지 못했습니다.');
}

export async function closeAmmoRound(companyId, roundId) {
  assertClient();
  const result = await supabase.rpc('ammo_admin_close_round', {
    p_company_id: companyId,
    p_round_id: roundId,
  });
  return unwrap(result, '총알 회차를 닫지 못했습니다.');
}

export async function cancelAmmoRound(companyId, roundId, reason) {
  assertClient();
  const result = await supabase.rpc('ammo_admin_cancel_round', {
    p_company_id: companyId,
    p_round_id: roundId,
    p_reason: reason,
  });
  return unwrap(result, '총알 회차를 취소하지 못했습니다.');
}

export async function resetAmmoRound(companyId, roundId, reason = '') {
  assertClient();
  const result = await supabase.rpc('ammo_admin_reset_round', {
    p_company_id: companyId,
    p_round_id: roundId,
    p_reason: reason || null,
  });
  return unwrap(result, '총알 회차를 초기화하지 못했습니다.');
}


// ============================================================
// AXE PRODUCT WEB OPERATIONS BRIDGE v1.7.37
// Authenticated browser-safe RPCs. Never pass BOT runtime keys.
// ============================================================
export async function getFundTreasurySnapshot(companyId, year = null, month = null, limit = 120) {
  assertClient();
  const result = await supabase.rpc('fund_admin_get_treasury_snapshot', {
    p_company_id: companyId,
    p_year: year,
    p_month: month,
    p_limit: limit,
  });
  return unwrap(result, '공금 원장을 불러오지 못했습니다.') || {};
}

export async function saveFundLedgerEntry(companyId, payload = {}) {
  assertClient();
  const result = await supabase.rpc('fund_admin_save_ledger_entry', {
    p_company_id: companyId,
    p_entry_id: payload.entryId || null,
    p_direction: payload.direction || null,
    p_amount: payload.amount == null ? null : Number(payload.amount),
    p_account: payload.account || '공용계좌',
    p_category: payload.category || null,
    p_membership_id: payload.membershipId || null,
    p_memo: payload.memo || null,
    p_ledger_date: payload.ledgerDate || null,
  });
  return unwrap(result, '공금 내역을 저장하지 못했습니다.');
}

export async function cancelFundLedgerEntry(companyId, entryId, reason = '') {
  assertClient();
  const normalizedReason = String(reason || '').trim();
  if (!normalizedReason) throw new Error('취소 사유를 입력해 주세요.');
  const result = await supabase.rpc('fund_admin_cancel_ledger_entry', {
    p_company_id: companyId,
    p_entry_id: entryId,
    p_reason: normalizedReason,
  });
  return unwrap(result, '공금 내역을 취소하지 못했습니다.');
}

export async function getWebAssetsSnapshot(companyId) {
  assertClient();
  const result = await supabase.rpc('web_assets_admin_snapshot', {
    p_company_id: companyId,
  });
  return unwrap(result, '자산 현황을 불러오지 못했습니다.') || {};
}

export async function saveWebAsset(companyId, payload = {}) {
  assertClient();
  const result = await supabase.rpc('web_assets_admin_save', {
    p_company_id: companyId,
    p_asset_id: payload.assetId || null,
    p_legacy_no: payload.legacyNo || null,
    p_membership_id: payload.membershipId || null,
    p_owner_name: payload.ownerName || null,
    p_asset_category: payload.category || null,
    p_asset_name: payload.name || null,
    p_acquisition_method: payload.acquisitionMethod || null,
    p_acquired_at: payload.acquiredAt || null,
    p_personal_cost: payload.personalCost == null || payload.personalCost === '' ? null : Number(payload.personalCost),
    p_status: payload.status || null,
    p_note: payload.note || null,
    p_clear_acquired_at: Boolean(payload.clearAcquiredAt),
    p_clear_personal_cost: Boolean(payload.clearPersonalCost),
  });
  return unwrap(result, '자산을 저장하지 못했습니다.');
}

export async function manageWebAsset(companyId, assetId, action, note = '') {
  assertClient();
  const result = await supabase.rpc('web_assets_admin_manage', {
    p_company_id: companyId,
    p_asset_id: assetId,
    p_action: action,
    p_note: note || null,
  });
  return unwrap(result, '자산 상태를 변경하지 못했습니다.');
}

export async function getWebAccountsSnapshot(companyId) {
  assertClient();
  const result = await supabase.rpc('web_accounts_admin_snapshot', {
    p_company_id: companyId,
  });
  return unwrap(result, '계좌 현황을 불러오지 못했습니다.') || {};
}

export async function submitWebAccountRequest(companyId, account, note = '') {
  assertClient();
  const result = await supabase.rpc('web_accounts_submit_request', {
    p_company_id: companyId,
    p_account: account,
    p_note: note || null,
  });
  return unwrap(result, '계좌 등록·변경 신청을 제출하지 못했습니다.');
}

export async function reviewWebAccountRequest(companyId, requestId, action, reviewNote = '') {
  assertClient();
  const result = await supabase.rpc('web_accounts_review_request', {
    p_company_id: companyId,
    p_request_id: requestId,
    p_action: action,
    p_review_note: reviewNote || null,
  });
  return unwrap(result, '계좌 신청을 처리하지 못했습니다.');
}

export async function submitProductFeedback(companyId, category, title, detail, contact = '') {
  assertClient();
  const result = await supabase.rpc('submit_product_feedback', {
    p_company_id: companyId,
    p_category: category,
    p_title: title,
    p_detail: detail,
    p_contact: contact || null,
  });
  return unwrap(result, '피드백을 전송하지 못했습니다.');
}

export async function updateMembershipStatus(membershipId, status) {
  assertClient();
  const result = await supabase
    .from('company_memberships')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
    .select('id,status')
    .single();
  return unwrap(result, '멤버 상태를 변경하지 못했습니다.');
}

export async function updateCompanyModuleSettings(companyId, moduleKey, settings, userId) {
  assertClient();
  const result = await supabase
    .from('company_modules')
    .update({ settings: settings || {}, updated_by: userId })
    .eq('company_id', companyId)
    .eq('module_key', moduleKey)
    .select('company_id,module_key,enabled,settings,updated_at')
    .single();
  return unwrap(result, '기능 설정을 저장하지 못했습니다.');
}

// ============================================================
// AXE PRODUCT 3.21.0 — PLATFORM OWNER + LEDGER EVIDENCE
// ============================================================
export async function isPlatformAdmin() {
  assertClient();
  const result = await supabase.rpc('platform_is_admin');
  return Boolean(unwrap(result, '플랫폼 관리자 권한을 확인하지 못했습니다.'));
}

export async function getPlatformCompanies() {
  assertClient();
  const result = await supabase.rpc('platform_admin_list_companies');
  return unwrap(result, '플랫폼 회사 목록을 불러오지 못했습니다.') || [];
}

export async function getCompanySubscription(companyId) {
  assertClient();
  const result = await supabase.rpc('platform_get_company_subscription', { p_company_id: companyId });
  const rows = unwrap(result, '구독 상태를 불러오지 못했습니다.') || [];
  return Array.isArray(rows) ? (rows[0] || null) : rows;
}

export async function updatePlatformSubscription(companyId, payload = {}) {
  assertClient();
  const result = await supabase.rpc('platform_admin_update_subscription', {
    p_company_id: companyId,
    p_plan: payload.plan || 'standard',
    p_status: payload.status || 'active',
    p_starts_at: payload.startsAt || null,
    p_ends_at: payload.endsAt || null,
    p_grace_until: payload.graceUntil || null,
    p_memo: payload.memo || null,
  });
  return unwrap(result, '구독 정보를 저장하지 못했습니다.');
}

export async function getFundLedgerAttachments(companyId, entryId = null) {
  assertClient();
  const result = await supabase.rpc('fund_admin_list_ledger_attachments', {
    p_company_id: companyId,
    p_entry_id: entryId || null,
  });
  return unwrap(result, '공금 첨부파일을 불러오지 못했습니다.') || [];
}

export async function attachFundLedgerEvidence(companyId, entryId, payload = {}) {
  assertClient();
  const result = await supabase.rpc('fund_admin_attach_ledger_evidence', {
    p_company_id: companyId,
    p_entry_id: entryId,
    p_storage_path: payload.storagePath,
    p_file_name: payload.fileName || null,
    p_mime_type: payload.mimeType || null,
    p_size_bytes: payload.sizeBytes == null ? null : Number(payload.sizeBytes),
  });
  return unwrap(result, '공금 첨부파일을 연결하지 못했습니다.');
}
