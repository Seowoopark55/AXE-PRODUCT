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
