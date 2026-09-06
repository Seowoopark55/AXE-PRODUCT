const ROLE_LABEL = {
  owner: 'OWNER',
  admin: 'ADMIN',
  manager: 'MANAGER',
  member: 'MEMBER',
};

const ROLE_OPTIONS = ['owner', 'admin', 'manager', 'member'];

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtDate(value) {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function shortId(value) {
  const v = String(value || '');
  if (v.length <= 12) return v || '-';
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}

export function renderShell(root, state) {
  const user = state.session?.user;
  const companies = state.companies || [];
  const company = companies.find((c) => c.id === state.companyId) || null;
  const myMembership = (state.memberships || []).find((m) => m.user_id === user?.id);
  const canAdmin = ['owner', 'admin'].includes(myMembership?.role);
  const canOwn = myMembership?.role === 'owner';

  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-wrap">
          <div class="brand-mark">AXE</div>
          <div>
            <div class="brand-title">PRODUCT STAGING</div>
            <div class="brand-sub">MULTI-TENANT CORE</div>
          </div>
        </div>

        <div class="topbar-actions">
          ${user ? `
            <div class="user-pill">
              <span class="dot"></span>
              <span>${esc(user.user_metadata?.full_name || user.user_metadata?.name || user.email || shortId(user.id))}</span>
            </div>
            <button class="btn btn-ghost" data-action="logout">로그아웃</button>
          ` : ''}
        </div>
      </header>

      ${state.error ? `<div class="global-alert global-alert--error">${esc(state.error)}</div>` : ''}
      ${state.notice ? `<div class="global-alert">${esc(state.notice)}</div>` : ''}

      <main class="page">
        ${!user ? renderLogin(state) : renderAuthed(state, company, myMembership, canAdmin, canOwn)}
      </main>
    </div>
  `;
}

function renderLogin(state) {
  return `
    <section class="auth-stage">
      <div class="hero-card">
        <div class="eyebrow">AXE PRODUCT / STAGE 2</div>
        <h1>회사 운영 도구를<br>하나의 플랫폼으로.</h1>
        <p>
          이 화면은 상품화 STAGING 전용이다.
          기존 AXE HUB 화면과 코드는 사용하지 않는다.
        </p>
        <button class="btn btn-primary btn-large" data-action="discord-login" ${state.loading ? 'disabled' : ''}>
          Discord로 로그인
        </button>
        <div class="safe-note">
          같은 Supabase Auth 프로젝트를 사용하지만 상품화 권한은
          <strong>axe_product.company_memberships</strong>만 기준으로 판정한다.
        </div>
      </div>
    </section>
  `;
}

function renderAuthed(state, company, myMembership, canAdmin, canOwn) {
  if (state.loading && !state.ready) {
    return `<div class="center-state"><div class="spinner"></div><p>상품화 STAGING을 불러오는 중…</p></div>`;
  }

  if (!state.companies?.length) {
    return renderOnboarding(state);
  }

  return `
    <section class="workspace">
      <aside class="sidebar">
        <div class="sidebar-block">
          <label class="field-label" for="companySwitcher">현재 회사</label>
          <select id="companySwitcher" class="select" data-action="switch-company">
            ${state.companies.map((c) => `
              <option value="${esc(c.id)}" ${c.id === state.companyId ? 'selected' : ''}>
                ${esc(c.name)}
              </option>
            `).join('')}
          </select>
          <button class="btn btn-soft btn-full" data-action="open-create-company">+ 새 회사</button>
        </div>

        <nav class="nav">
          ${navItem('overview', '대시보드', state.view)}
          ${navItem('members', '멤버 · 권한', state.view)}
          ${navItem('modules', '모듈 관리', state.view)}
          ${navItem('settings', '회사 설정', state.view)}
          ${navItem('audit', 'Audit', state.view, !canAdmin)}
        </nav>

        <div class="sidebar-footer">
          <div class="status-row">
            <span>내 역할</span>
            <strong>${esc(ROLE_LABEL[myMembership?.role] || '-')}</strong>
          </div>
          <div class="status-row">
            <span>Tenant</span>
            <code>${esc(shortId(company?.id))}</code>
          </div>
        </div>
      </aside>

      <section class="content">
        <div class="content-head">
          <div>
            <div class="eyebrow">COMPANY</div>
            <h2>${esc(company?.name || '회사')}</h2>
            <p>${esc(company?.slug || '')}</p>
          </div>
          <div class="head-badge">${esc(company?.status || '-')}</div>
        </div>

        ${state.showCreateCompany ? renderCreateCompanyModal() : ''}

        ${state.view === 'overview' ? renderOverview(state, company, myMembership) : ''}
        ${state.view === 'members' ? renderMembers(state, myMembership, canAdmin, canOwn) : ''}
        ${state.view === 'modules' ? renderModules(state, canAdmin) : ''}
        ${state.view === 'settings' ? renderSettings(state, canAdmin) : ''}
        ${state.view === 'audit' ? renderAudit(state, canAdmin) : ''}
      </section>
    </section>
  `;
}

function navItem(key, label, active, disabled = false) {
  return `
    <button class="nav-item ${active === key ? 'is-active' : ''}" data-view="${key}" ${disabled ? 'disabled' : ''}>
      <span>${esc(label)}</span>
      ${disabled ? '<small>ADMIN</small>' : ''}
    </button>
  `;
}

function renderOnboarding(state) {
  return `
    <section class="onboarding">
      <div class="panel onboarding-panel">
        <div class="eyebrow">FIRST TENANT</div>
        <h2>첫 회사를 생성한다.</h2>
        <p>
          생성자는 자동으로 OWNER가 되고, 다른 회사 데이터와 RLS로 완전히 분리된다.
        </p>
        <form data-form="create-company" class="form-grid">
          <label>
            <span class="field-label">회사 이름</span>
            <input class="input" name="name" maxlength="80" placeholder="예: AXE" required />
          </label>
          <label>
            <span class="field-label">Slug <em>선택</em></span>
            <input class="input" name="slug" maxlength="63" placeholder="비우면 자동 생성" />
          </label>
          <button class="btn btn-primary" type="submit" ${state.loading ? 'disabled' : ''}>회사 생성</button>
        </form>
      </div>
    </section>
  `;
}

function renderCreateCompanyModal() {
  return `
    <div class="modal-backdrop" data-action="close-create-company">
      <div class="modal" data-modal-stop>
        <div class="modal-head">
          <div>
            <div class="eyebrow">NEW TENANT</div>
            <h3>새 회사 생성</h3>
          </div>
          <button class="icon-btn" data-action="close-create-company" aria-label="닫기">×</button>
        </div>
        <form data-form="create-company" class="form-grid">
          <label>
            <span class="field-label">회사 이름</span>
            <input class="input" name="name" maxlength="80" required />
          </label>
          <label>
            <span class="field-label">Slug <em>선택</em></span>
            <input class="input" name="slug" maxlength="63" placeholder="비우면 자동 생성" />
          </label>
          <button class="btn btn-primary" type="submit">생성</button>
        </form>
      </div>
    </div>
  `;
}

function renderOverview(state, company, myMembership) {
  const enabledCount = (state.modules || []).filter((m) => m.enabled).length;
  const memberCount = (state.memberships || []).filter((m) => m.status === 'active').length;
  const discord = state.discordConnection;

  return `
    <div class="grid-cards">
      ${metricCard('ACTIVE MEMBERS', memberCount, '현재 회사의 활성 멤버')}
      ${metricCard('ENABLED MODULES', enabledCount, `${state.modules?.length || 0}개 중 사용 중`)}
      ${metricCard('MY ROLE', ROLE_LABEL[myMembership?.role] || '-', '회사 기준 권한')}
      ${metricCard('DISCORD', discord?.status?.toUpperCase() || 'NOT LINKED', discord?.guild_name || 'STAGE 3에서 연결')}
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">ISOLATION</div>
          <h3>Tenant boundary</h3>
        </div>
        <span class="pass-chip">RLS ACTIVE</span>
      </div>
      <div class="tenant-info">
        <div><span>Company ID</span><code>${esc(company?.id)}</code></div>
        <div><span>Slug</span><code>${esc(company?.slug)}</code></div>
        <div><span>상태</span><strong>${esc(company?.status)}</strong></div>
      </div>
    </div>
  `;
}

function metricCard(label, value, hint) {
  return `
    <article class="metric-card">
      <div class="metric-label">${esc(label)}</div>
      <div class="metric-value">${esc(value)}</div>
      <div class="metric-hint">${esc(hint)}</div>
    </article>
  `;
}

function renderMembers(state, myMembership, canAdmin, canOwn) {
  const rows = (state.memberships || []).map((m) => {
    const isMe = m.user_id === state.session?.user?.id;
    const targetIsOwner = m.role === 'owner';
    const editable = canAdmin && (!targetIsOwner || canOwn);

    return `
      <tr>
        <td>
          <div class="member-name">
            <strong>${esc(m.display_name || (isMe ? '나' : shortId(m.user_id)))}</strong>
            ${isMe ? '<span class="me-chip">ME</span>' : ''}
          </div>
          <code>${esc(shortId(m.user_id))}</code>
        </td>
        <td>${esc(m.status)}</td>
        <td>
          ${editable ? `
            <select class="select select-compact" data-role-membership="${esc(m.id)}" data-current-role="${esc(m.role)}">
              ${ROLE_OPTIONS.map((role) => `
                <option value="${role}" ${role === m.role ? 'selected' : ''}>${ROLE_LABEL[role]}</option>
              `).join('')}
            </select>
          ` : `<span class="role-chip">${esc(ROLE_LABEL[m.role] || m.role)}</span>`}
        </td>
        <td>${esc(fmtDate(m.joined_at || m.created_at))}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">ACCESS</div>
          <h3>멤버 · 권한</h3>
        </div>
        <span class="muted-chip">초대 기능: STAGE 3</span>
      </div>

      <div class="info-banner">
        현재 단계에서는 기존 회사 멤버의 역할 변경을 검증한다.
        신규 멤버 초대/가입 흐름은 Discord 연결과 함께 다음 단계에서 붙인다.
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>멤버</th>
              <th>상태</th>
              <th>역할</th>
              <th>가입</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="4">멤버 없음</td></tr>'}</tbody>
        </table>
      </div>

      <p class="help-text">
        마지막 OWNER를 없애는 변경은 DB에서 자동 차단된다.
      </p>
    </div>
  `;
}

function renderModules(state, canAdmin) {
  const catalogByKey = Object.fromEntries((state.moduleCatalog || []).map((m) => [m.module_key, m]));
  const cards = (state.modules || [])
    .sort((a, b) => (catalogByKey[a.module_key]?.sort_order || 0) - (catalogByKey[b.module_key]?.sort_order || 0))
    .map((m) => {
      const meta = catalogByKey[m.module_key] || {};
      return `
        <article class="module-card ${m.enabled ? 'is-enabled' : ''}">
          <div>
            <div class="module-key">${esc(m.module_key)}</div>
            <h3>${esc(meta.display_name || m.module_key)}</h3>
            <p>${esc(meta.description || '')}</p>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              data-module-key="${esc(m.module_key)}"
              ${m.enabled ? 'checked' : ''}
              ${canAdmin ? '' : 'disabled'}
            />
            <span></span>
          </label>
        </article>
      `;
    }).join('');

  return `
    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">OPTIONAL MODULES</div>
          <h3>회사별 기능 ON / OFF</h3>
        </div>
        ${canAdmin ? '<span class="pass-chip">EDITABLE</span>' : '<span class="muted-chip">READ ONLY</span>'}
      </div>
      <div class="module-grid">${cards}</div>
    </div>
  `;
}

function renderSettings(state, canAdmin) {
  const s = state.companySettings || {};
  return `
    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">COMPANY SETTINGS</div>
          <h3>기본 설정</h3>
        </div>
        ${canAdmin ? '<span class="pass-chip">ADMIN</span>' : '<span class="muted-chip">READ ONLY</span>'}
      </div>

      <form data-form="company-settings" class="form-grid form-grid--wide">
        <label>
          <span class="field-label">표시 이름</span>
          <input class="input" name="brand_name" value="${esc(s.brand_name || '')}" ${canAdmin ? '' : 'disabled'} />
        </label>
        <label>
          <span class="field-label">Locale</span>
          <input class="input" name="locale" value="${esc(s.locale || 'ko-KR')}" ${canAdmin ? '' : 'disabled'} />
        </label>
        <label>
          <span class="field-label">Timezone</span>
          <input class="input" name="timezone" value="${esc(s.timezone || 'Asia/Seoul')}" ${canAdmin ? '' : 'disabled'} />
        </label>
        ${canAdmin ? '<button class="btn btn-primary" type="submit">설정 저장</button>' : ''}
      </form>
    </div>
  `;
}

function renderAudit(state, canAdmin) {
  if (!canAdmin) {
    return `<div class="panel"><p>OWNER / ADMIN만 Audit을 볼 수 있다.</p></div>`;
  }

  const rows = (state.auditEvents || []).map((e) => `
    <tr>
      <td>${esc(fmtDate(e.created_at))}</td>
      <td><span class="action-chip">${esc(e.action)}</span></td>
      <td>${esc(e.entity_type)}</td>
      <td><code>${esc(shortId(e.entity_id))}</code></td>
      <td><code>${esc(shortId(e.actor_user_id))}</code></td>
    </tr>
  `).join('');

  return `
    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">AUDIT</div>
          <h3>최근 변경 기록</h3>
        </div>
        <span class="muted-chip">${state.auditEvents?.length || 0} EVENTS</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>시간</th>
              <th>Action</th>
              <th>Entity</th>
              <th>ID</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5">Audit 기록 없음</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}
