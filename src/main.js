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
  getAuditEvents,
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
  auditEvents: [],
  view: 'overview',
  showCreateCompany: false,
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
  state.auditEvents = [];
}

async function loadCompanyData() {
  if (!state.companyId) {
    clearCompanyState();
    return;
  }

  const [memberships, moduleCatalog, modules, settings, discord] = await Promise.all([
    getMemberships(state.companyId),
    getModuleCatalog(),
    getCompanyModules(state.companyId),
    getCompanySettings(state.companyId),
    getDiscordConnection(state.companyId),
  ]);

  state.memberships = memberships;
  state.moduleCatalog = moduleCatalog;
  state.modules = modules;
  state.companySettings = settings;
  state.discordConnection = discord;

  state.auditEvents = canAdmin()
    ? await getAuditEvents(state.companyId, 50)
    : [];
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

    if (action === 'logout') {
      await signOut();
      state.session = null;
      state.companies = [];
      state.companyId = null;
      clearCompanyState();
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
  } catch (error) {
    setError(error);
  }
});

root.addEventListener('change', async (event) => {
  try {
    if (event.target.matches('[data-action="switch-company"]')) {
      state.companyId = event.target.value;
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
      setNotice('새 회사가 생성됐다.');
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
  } catch (error) {
    state.loading = false;
    setError(error);
  }
});

boot();
