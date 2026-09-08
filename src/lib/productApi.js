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

export async function signInWithDiscord() {
  assertClient();
  const result = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
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
    .select('id,company_id,user_id,role,status,display_name,discord_user_id,joined_at,created_at,updated_at')
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

// ============================================================
// STAGE 5C / AMMO
// ============================================================
export async function getAmmoSettings(companyId) {
  assertClient();
  const result = await supabase.rpc('ammo_get_settings', { p_company_id: companyId });
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
  const result = await supabase.rpc('ammo_admin_set_settings', {
    p_company_id: companyId,
    p_timezone: payload.timezone,
    p_event_weekdays: payload.eventWeekdays,
    p_afternoon_enabled: Boolean(payload.afternoonEnabled),
    p_afternoon_hour: Number(payload.afternoonHour),
    p_afternoon_minute: Number(payload.afternoonMinute),
    p_night_enabled: Boolean(payload.nightEnabled),
    p_night_hour: Number(payload.nightHour),
    p_night_minute: Number(payload.nightMinute),
    p_line_sets: Number(payload.lineSets),
    p_half_sets: Number(payload.halfSets),
    p_max_order_sets: Number(payload.maxOrderSets),
    p_keep_minutes: Number(payload.keepMinutes),
    p_allow_member_edit: Boolean(payload.allowMemberEdit),
    p_allow_member_cancel: Boolean(payload.allowMemberCancel),
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
