import './styles.css';
import { envReady } from './lib/supabase.js';
import {
  getSession,
  signInWithDiscord,
  signOut,
  onAuthStateChange,
  listCompanies,
  createCompany,
  getMemberships,
  updateMembershipRole,
  getModuleCatalog,
  getCompanyModules,
  setCompanyModule,
  getCompanySettings,
  updateCompanySettings,
  getDiscordConnection,
  getDiscordChannels,
  getDiscordRoles,
  getDiscordCompanyConfig,
  saveDiscordCompanyConfig,
  getAuditEvents,
  createCompanyInvite,
  listCompanyInvites,
  revokeCompanyInvite,
  redeemCompanyInvite,
  startDiscordConnection,
  completeDiscordConnection,
} from './lib/productApi.js';
import { renderShell } from './ui/render.js';

const root = document.querySelector('#app');

const state = {
  session: null,
  companies: [],
  companyId: localStorage.getItem('axe_product_company_id') || null,
  memberships: [],
  moduleCatalog: [],
  modules: [],
  companySettings: null,
  discordConnection: null,
  discordChannels: [],
  discordRoles: [],
  discordCompanyConfig: null,
  auditEvents: [],
  invites: [],
  freshInviteCode: null,
  view: (() => {
    const saved = sessionStorage.getItem('axe_product_view');
    return ['overview', 'members', 'modules', 'settings', 'audit'].includes(saved)
      ? saved
      : 'overview';
  })(),
  showCreateCompany: false,
  showJoinCompany: false,
  loading: false,
  ready: false,
  error: '',
  notice: '',
};

const moduleMutationLocks = new Set();

let noticeTimer = null;

function render() {
  renderShell(root, state);
}

function setError(error) {
  state.error = error ? String(error.message || error) : '';
  render();
}

function setNotice(message) {
  state.notice = String(message || '');
  render();

  if (noticeTimer) clearTimeout(noticeTimer);
  if (state.notice) {
    noticeTimer = setTimeout(() => {
      state.notice = '';
      render();
    }, 3500);
  }
}

function currentMembership() {
  return state.memberships.find((m) => m.user_id === state.session?.user?.id) || null;
}

function canAdmin() {
  return ['owner', 'admin'].includes(currentMembership()?.role);
}

function discordOAuthErrorMessage(code) {
  const messages = {
    access_denied: 'Discord 서버 연결이 취소됐습니다.',
    invalid_request: 'Discord 인증 요청이 올바르지 않습니다.',
    temporarily_unavailable: 'Discord 인증 서비스를 잠시 사용할 수 없습니다.',
    token_exchange_failed: 'Discord 인증 코드 교환에 실패했습니다.',
    guild_not_returned: '선택한 Discord 서버 정보를 확인하지 못했습니다.',
    oauth_validation_failed: 'Discord 인증 보안 검증에 실패했습니다.',
    missing_oauth_response: 'Discord 인증 결과가 비어 있습니다.',
    method_not_allowed: 'Discord 인증 콜백 방식이 올바르지 않습니다.',
    oauth_failed: 'Discord 서버 연결에 실패했습니다.',
  };
  return messages[code] || 'Discord 서버 연결에 실패했습니다.';
}

async function handleDiscordOAuthReturn() {
  const rawHash = String(window.location.hash || '').replace(/^#/, '');
  if (!rawHash) return;

  const params = new URLSearchParams(rawHash);
  const linkToken = params.get('discord_link');
  const errorCode = params.get('discord_error');

  if (!linkToken && !errorCode) return;

  history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}`
  );

  if (errorCode) {
    throw new Error(discordOAuthErrorMessage(errorCode));
  }

  if (!state.session?.user) {
    throw new Error('Discord 서버 연결을 완료하려면 다시 로그인해 주세요.');
  }

  state.loading = true;
  render();

  try {
    const connection = await completeDiscordConnection(linkToken);

    state.companyId = connection.company_id;
    localStorage.setItem('axe_product_company_id', state.companyId);

    await loadCompanies();
    await loadCompanyData();

    state.view = 'settings';
    sessionStorage.setItem('axe_product_view', state.view);
    setNotice(`Discord 서버 ${connection.guild_name || ''} 연결이 완료됐다.`);
  } finally {
    state.loading = false;
    render();
  }
}

async function loadCompanies() {
  state.companies = await listCompanies();

  if (!state.companies.length) {
    state.companyId = null;
    localStorage.removeItem('axe_product_company_id');
    clearCompanyState();
    return;
  }

  const stillVisible = state.companies.some((c) => c.id === state.companyId);
  if (!stillVisible) state.companyId = state.companies[0].id;

  localStorage.setItem('axe_product_company_id', state.companyId);
}

function clearCompanyState() {
  state.memberships = [];
  state.modules = [];
  state.companySettings = null;
  state.discordConnection = null;
  state.discordChannels = [];
  state.discordRoles = [];
  state.discordCompanyConfig = null;
  state.auditEvents = [];
  state.invites = [];
  state.freshInviteCode = null;
}

async function loadCompanyData() {
  if (!state.companyId) {
    clearCompanyState();
    return;
  }

  const [
    memberships,
    moduleCatalog,
    modules,
    settings,
    discord,
    discordChannels,
    discordRoles,
    discordCompanyConfig,
  ] = await Promise.all([
    getMemberships(state.companyId),
    getModuleCatalog(),
    getCompanyModules(state.companyId),
    getCompanySettings(state.companyId),
    getDiscordConnection(state.companyId),
    getDiscordChannels(state.companyId),
    getDiscordRoles(state.companyId),
    getDiscordCompanyConfig(state.companyId),
  ]);

  state.memberships = memberships;
  state.moduleCatalog = moduleCatalog;
  state.modules = modules;
  state.companySettings = settings;
  state.discordConnection = discord;
  state.discordChannels = discordChannels;
  state.discordRoles = discordRoles;
  state.discordCompanyConfig = discordCompanyConfig;

  if (canAdmin()) {
    const [auditEvents, invites] = await Promise.all([
      getAuditEvents(state.companyId, 50),
      listCompanyInvites(state.companyId),
    ]);
    state.auditEvents = auditEvents;
    state.invites = invites;
  } else {
    state.auditEvents = [];
    state.invites = [];
  }
}

async function refreshAll() {
  if (!state.session?.user) {
    state.ready = true;
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();

  try {
    await loadCompanies();
    await loadCompanyData();
    state.ready = true;
  } catch (error) {
    state.error = error.message || String(error);
  } finally {
    state.loading = false;
    render();
  }
}

async function boot() {
  if (!envReady) {
    state.ready = true;
    state.error = 'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 환경변수를 먼저 설정해 주세요.';
    render();
    return;
  }

  try {
    state.session = await getSession();
  } catch (error) {
    state.error = error.message || String(error);
  }

  render();
  await refreshAll();

  try {
    await handleDiscordOAuthReturn();
  } catch (error) {
    state.loading = false;
    setError(error);
  }

  onAuthStateChange(async (_event, session) => {
    const before = state.session?.user?.id || null;
    const after = session?.user?.id || null;
    state.session = session;

    if (before !== after) {
      state.ready = false;
      state.error = '';
      await refreshAll();
    }
  });
}

root.addEventListener('click', async (event) => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton && !viewButton.disabled) {
    state.view = viewButton.dataset.view;
    sessionStorage.setItem('axe_product_view', state.view);
    render();
    return;
  }

  const moduleInput = event.target.closest('input[data-module-key]');
  if (moduleInput) {
    event.preventDefault();

    const moduleKey = moduleInput.dataset.moduleKey;
    if (!moduleKey || moduleMutationLocks.has(moduleKey)) return;

    const currentModule = state.modules.find((m) => m.module_key === moduleKey);
    if (!currentModule) {
      setError(new Error('모듈 정보를 찾지 못했습니다.'));
      return;
    }

    const next = !Boolean(currentModule.enabled);
    moduleMutationLocks.add(moduleKey);
    moduleInput.disabled = true;

    try {
      const saved = await setCompanyModule(
        state.companyId,
        moduleKey,
        next,
        state.session.user.id
      );

      if (Boolean(saved?.enabled) !== next) {
        throw new Error('모듈 저장 결과가 요청값과 일치하지 않습니다.');
      }

      await loadCompanyData();

      const confirmed = state.modules.find((m) => m.module_key === moduleKey);
      if (!confirmed || Boolean(confirmed.enabled) !== next) {
        throw new Error('모듈 저장 확인에 실패했습니다.');
      }

      setNotice(`${moduleKey} 모듈을 ${next ? '켰다' : '껐다'}.`);
    } catch (error) {
      try {
        await loadCompanyData();
      } catch {
        // Preserve the original mutation error.
      }
      setError(error);
    } finally {
      moduleMutationLocks.delete(moduleKey);
      render();
    }
    return;
  }

  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  try {
    if (action === 'discord-login') {
      state.loading = true;
      render();
      await signInWithDiscord();
      return;
    }

    if (action === 'connect-discord') {
      if (!canAdmin()) throw new Error('Discord 서버를 연결할 권한이 없습니다.');
      if (!state.companyId) throw new Error('연결할 회사를 찾지 못했습니다.');

      state.loading = true;
      render();

      const started = await startDiscordConnection(state.companyId);
      window.location.assign(started.authorize_url);
      return;
    }

    if (action === 'refresh-discord-catalog') {
      if (!state.companyId) throw new Error('회사를 찾지 못했습니다.');

      actionEl.disabled = true;
      await loadCompanyData();
      setNotice(
        `Discord 목록을 새로 불러왔다. 채널 ${state.discordChannels.length}개 · 역할 ${state.discordRoles.length}개`
      );
      return;
    }

    if (action === 'logout') {
      await signOut();
      state.session = null;
      state.companies = [];
      state.companyId = null;
      clearCompanyState();
      state.view = 'overview';
      sessionStorage.setItem('axe_product_view', state.view);
      state.ready = true;
      render();
      return;
    }

    if (action === 'open-create-company') {
      state.showCreateCompany = true;
      render();
      return;
    }

    if (action === 'close-create-company') {
      if (event.target.closest('[data-modal-stop]') && !event.target.closest('.icon-btn')) return;
      state.showCreateCompany = false;
      render();
      return;
    }

    if (action === 'open-join-company') {
      state.showJoinCompany = true;
      render();
      return;
    }

    if (action === 'close-join-company') {
      if (event.target.closest('[data-modal-stop]') && !event.target.closest('.icon-btn')) return;
      state.showJoinCompany = false;
      render();
      return;
    }

    if (action === 'copy-invite-code') {
      const code = state.freshInviteCode?.invite_code;
      if (!code) throw new Error('복사할 초대코드가 없습니다.');
      await navigator.clipboard.writeText(code);
      setNotice('초대코드를 복사했다.');
      return;
    }

    if (action === 'revoke-invite') {
      if (!canAdmin()) throw new Error('초대코드를 폐기할 권한이 없습니다.');
      const inviteId = actionEl.dataset.inviteId;
      if (!inviteId) throw new Error('초대코드 ID를 찾지 못했습니다.');

      actionEl.disabled = true;
      await revokeCompanyInvite(state.companyId, inviteId);
      state.invites = await listCompanyInvites(state.companyId);
      if (state.freshInviteCode?.invite_id === inviteId) state.freshInviteCode = null;
      setNotice('초대코드를 폐기했다.');
      return;
    }
  } catch (error) {
    state.loading = false;
    setError(error);
  }
});

root.addEventListener('change', async (event) => {
  try {
    if (event.target.matches('[data-action="switch-company"]')) {
      state.companyId = event.target.value;
      state.freshInviteCode = null;
      localStorage.setItem('axe_product_company_id', state.companyId);
      state.loading = true;
      state.error = '';
      render();

      try {
        await loadCompanyData();
      } finally {
        state.loading = false;
        render();
      }
      return;
    }

    if (event.target.matches('[data-role-membership]')) {
      const select = event.target;
      const previous = select.dataset.currentRole;
      const next = select.value;

      if (next === previous) return;

      select.disabled = true;
      try {
        await updateMembershipRole(select.dataset.roleMembership, next);
        await loadCompanyData();
        setNotice(`역할을 ${next.toUpperCase()}로 변경했다.`);
      } catch (error) {
        select.value = previous;
        throw error;
      } finally {
        select.disabled = false;
      }
      return;
    }

  } catch (error) {
    setError(error);
  }
});

root.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  event.preventDefault();
  state.error = '';

  try {
    if (form.dataset.form === 'create-company') {
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const slug = String(data.get('slug') || '').trim();

      if (!name) throw new Error('회사 이름을 입력해 주세요.');

      state.loading = true;
      render();

      const companyId = await createCompany(name, slug);
      state.companyId = companyId;
      localStorage.setItem('axe_product_company_id', companyId);
      state.showCreateCompany = false;

      await loadCompanies();
      await loadCompanyData();

      state.loading = false;
      state.ready = true;
      state.view = 'overview';
      sessionStorage.setItem('axe_product_view', state.view);
      setNotice('새 회사가 생성됐다.');
      return;
    }

    if (form.dataset.form === 'create-invite') {
      if (!canAdmin()) throw new Error('초대코드를 생성할 권한이 없습니다.');

      const data = new FormData(form);
      const maxUses = Number(data.get('max_uses') || 1);
      const expiresHours = Number(data.get('expires_in_hours') || 168);

      if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 500) {
        throw new Error('사용 가능 횟수는 1~500 사이여야 합니다.');
      }
      if (!Number.isInteger(expiresHours) || expiresHours < 1 || expiresHours > 2160) {
        throw new Error('유효시간은 1~2160시간 사이여야 합니다.');
      }

      const created = await createCompanyInvite(state.companyId, maxUses, expiresHours);
      if (!created?.invite_code) throw new Error('생성된 초대코드를 받지 못했습니다.');

      state.freshInviteCode = created;
      state.invites = await listCompanyInvites(state.companyId);
      setNotice('새 초대코드를 생성했다. 지금 화면에서 코드를 복사해 둬야 한다.');
      return;
    }

    if (form.dataset.form === 'redeem-invite') {
      const data = new FormData(form);
      const inviteCode = String(data.get('invite_code') || '').trim();
      if (!inviteCode) throw new Error('초대코드를 입력해 주세요.');

      state.loading = true;
      render();

      const joined = await redeemCompanyInvite(inviteCode);
      if (!joined?.company_id) throw new Error('가입된 회사 정보를 받지 못했습니다.');

      state.companyId = joined.company_id;
      localStorage.setItem('axe_product_company_id', state.companyId);
      state.showJoinCompany = false;
      state.freshInviteCode = null;

      await loadCompanies();
      await loadCompanyData();

      state.loading = false;
      state.ready = true;
      state.view = 'overview';
      sessionStorage.setItem('axe_product_view', state.view);
      setNotice(joined.result === 'already_member' ? '이미 가입된 회사로 이동했다.' : `${joined.company_name || '회사'}에 MEMBER로 가입했다.`);
      return;
    }

    if (form.dataset.form === 'company-settings') {
      if (!canAdmin()) throw new Error('설정을 변경할 권한이 없습니다.');

      const data = new FormData(form);
      await updateCompanySettings(
        state.companyId,
        {
          brand_name: String(data.get('brand_name') || '').trim(),
          locale: String(data.get('locale') || '').trim() || 'ko-KR',
          timezone: String(data.get('timezone') || '').trim() || 'Asia/Seoul',
        },
        state.session.user.id
      );

      await loadCompanyData();
      setNotice('회사 설정을 저장했다.');
    }


    if (form.dataset.form === 'discord-config') {
      if (!canAdmin()) throw new Error('Discord 설정을 변경할 권한이 없습니다.');
      if (state.discordConnection?.status !== 'connected') {
        throw new Error('Discord 서버를 먼저 연결해 주세요.');
      }

      const data = new FormData(form);
      const notificationChannelId = String(data.get('notification_channel_id') || '').trim();
      const commandChannelId = String(data.get('command_channel_id') || '').trim();
      const adminRoleId = String(data.get('admin_role_id') || '').trim();
      const memberRoleId = String(data.get('member_role_id') || '').trim();

      const textChannelIds = new Set(
        (state.discordChannels || [])
          .filter((channel) => channel.is_text_based)
          .map((channel) => channel.channel_id)
      );

      const assignableRoleIds = new Set(
        (state.discordRoles || [])
          .filter((role) => !role.managed && role.role_name !== '@everyone')
          .map((role) => role.role_id)
      );

      for (const [label, value] of [
        ['알림 채널', notificationChannelId],
        ['명령 채널', commandChannelId],
      ]) {
        if (value && !textChannelIds.has(value)) {
          throw new Error(`${label}이 현재 Discord 채널 목록에 없습니다.`);
        }
      }

      for (const [label, value] of [
        ['관리자 역할', adminRoleId],
        ['멤버 역할', memberRoleId],
      ]) {
        if (value && !assignableRoleIds.has(value)) {
          throw new Error(`${label}이 현재 Discord 역할 목록에 없습니다.`);
        }
      }

      await saveDiscordCompanyConfig(
        state.companyId,
        {
          notification_channel_id: notificationChannelId || null,
          command_channel_id: commandChannelId || null,
          admin_role_id: adminRoleId || null,
          member_role_id: memberRoleId || null,
        },
        state.session.user.id
      );

      await loadCompanyData();
      setNotice('Discord 채널 · 역할 설정을 저장했다.');
      return;
    }
  } catch (error) {
    state.loading = false;
    setError(error);
  }
});

boot();
