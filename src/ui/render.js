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
          <button class="btn btn-ghost btn-full sidebar-secondary" data-action="open-join-company">초대코드로 참가</button>
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
        ${state.showJoinCompany ? renderJoinCompanyModal() : ''}

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
      <div class="onboarding-grid">
        <div class="panel onboarding-panel">
          <div class="eyebrow">CREATE TENANT</div>
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

        <div class="panel onboarding-panel">
          <div class="eyebrow">JOIN TENANT</div>
          <h2>초대코드로 참가한다.</h2>
          <p>
            회사 OWNER 또는 ADMIN에게 받은 유효한 초대코드가 있어야 MEMBER로 가입할 수 있다.
          </p>
          ${renderRedeemInviteForm(state)}
        </div>
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


function renderJoinCompanyModal() {
  return `
    <div class="modal-backdrop" data-action="close-join-company">
      <div class="modal" data-modal-stop>
        <div class="modal-head">
          <div>
            <div class="eyebrow">JOIN TENANT</div>
            <h3>초대코드로 회사 참가</h3>
          </div>
          <button class="icon-btn" data-action="close-join-company" aria-label="닫기">×</button>
        </div>
        ${renderRedeemInviteForm({ loading: false })}
      </div>
    </div>
  `;
}

function renderRedeemInviteForm(state) {
  return `
    <form data-form="redeem-invite" class="form-grid invite-redeem-form">
      <label>
        <span class="field-label">초대코드</span>
        <input
          class="input invite-code-input"
          name="invite_code"
          maxlength="40"
          autocomplete="off"
          spellcheck="false"
          placeholder="AXE-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          required
        />
      </label>
      <button class="btn btn-primary" type="submit" ${state.loading ? 'disabled' : ''}>회사 참가</button>
      <p class="help-text">코드가 만료·폐기·사용완료 상태면 가입이 차단된다.</p>
    </form>
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
      ${metricCard('DISCORD', discord?.status?.toUpperCase() || 'NOT LINKED', discord?.guild_name || '회사 설정에서 연결')}
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
        ${canAdmin ? '<span class="pass-chip">INVITE GATE ACTIVE</span>' : '<span class="muted-chip">MEMBER</span>'}
      </div>

      <div class="info-banner">
        신규 사용자는 로그인만으로 회사에 들어올 수 없다. OWNER / ADMIN이 발급한 유효한 초대코드를 사용해야 MEMBER로 가입된다.
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

    ${canAdmin ? renderInviteManagement(state) : ''}
  `;
}

function renderInviteManagement(state) {
  const fresh = state.freshInviteCode;
  const rows = (state.invites || []).map((invite) => {
    const canRevoke = ['active'].includes(invite.status);
    return `
      <tr>
        <td><code>••••-${esc(invite.code_hint)}</code></td>
        <td><span class="invite-status invite-status--${esc(invite.status)}">${esc(invite.status.toUpperCase())}</span></td>
        <td>${esc(invite.use_count)} / ${esc(invite.max_uses)}</td>
        <td>${esc(fmtDate(invite.expires_at))}</td>
        <td>${esc(fmtDate(invite.created_at))}</td>
        <td>
          ${canRevoke ? `<button class="btn btn-danger btn-compact" data-action="revoke-invite" data-invite-id="${esc(invite.invite_id)}">폐기</button>` : '-'}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">SECURE INVITATION</div>
          <h3>초대코드 발급 · 관리</h3>
        </div>
        <span class="pass-chip">OWNER / ADMIN</span>
      </div>

      <div class="info-banner">
        초대코드 원문은 생성 직후 이 화면에서 한 번만 보여준다. DB에는 SHA-256 해시만 저장된다.
      </div>

      <form data-form="create-invite" class="invite-create-grid">
        <label>
          <span class="field-label">사용 가능 횟수</span>
          <input class="input" name="max_uses" type="number" min="1" max="500" value="1" required />
        </label>
        <label>
          <span class="field-label">유효시간</span>
          <select class="select" name="expires_in_hours">
            <option value="24">24시간</option>
            <option value="72">3일</option>
            <option value="168" selected>7일</option>
            <option value="336">14일</option>
            <option value="720">30일</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">초대코드 생성</button>
      </form>

      ${fresh ? `
        <div class="fresh-invite">
          <div>
            <span>방금 생성한 초대코드 · 이 화면에서 복사해 둬야 한다.</span>
            <code>${esc(fresh.invite_code)}</code>
          </div>
          <button class="btn btn-soft" data-action="copy-invite-code">코드 복사</button>
        </div>
      ` : ''}

      <div class="table-wrap invite-table-wrap">
        <table>
          <thead>
            <tr>
              <th>코드 힌트</th>
              <th>상태</th>
              <th>사용</th>
              <th>만료</th>
              <th>생성</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">발급된 초대코드 없음</td></tr>'}</tbody>
        </table>
      </div>
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
              autocomplete="off"
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

function renderDiscordSelect(name, selectedValue, items, idKey, labelKey, emptyLabel, disabled) {
  return `
    <select class="select" name="${esc(name)}" ${disabled ? 'disabled' : ''}>
      <option value="">${esc(emptyLabel)}</option>
      ${(items || []).map((item) => `
        <option
          value="${esc(item[idKey])}"
          ${String(selectedValue || '') === String(item[idKey]) ? 'selected' : ''}
        >
          ${esc(item[labelKey])}
        </option>
      `).join('')}
    </select>
  `;
}

function renderSettings(state, canAdmin) {
  const s = state.companySettings || {};
  const discord = state.discordConnection;
  const connected = discord?.status === 'connected';
  const config = state.discordCompanyConfig || {};

  const textChannels = (state.discordChannels || [])
    .filter((channel) => channel.is_text_based);

  const assignableRoles = (state.discordRoles || [])
    .filter((role) => !role.managed && role.role_name !== '@everyone');

  const lastChannelSync = (state.discordChannels || [])
    .map((channel) => channel.synced_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  const lastRoleSync = (state.discordRoles || [])
    .map((role) => role.synced_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  const lastCatalogSync = [lastChannelSync, lastRoleSync]
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  const catalogReady = connected && (textChannels.length > 0 || assignableRoles.length > 0);

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

    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">DISCORD INTEGRATION</div>
          <h3>Discord 서버 연결</h3>
        </div>
        ${connected
          ? '<span class="pass-chip">CONNECTED</span>'
          : '<span class="muted-chip">NOT LINKED</span>'}
      </div>

      <div class="info-banner">
        OWNER / ADMIN이 Discord 인증 화면에서 서버를 선택하면 연결 정보가 회사에 자동 등록된다.
      </div>

      <div class="discord-link-card">
        <div>
          <span class="field-label">현재 연결</span>
          <strong>${esc(discord?.guild_name || '연결된 Discord 서버 없음')}</strong>
          <p>${connected
            ? `상태 ${esc(discord.status)} · 연결 ${esc(fmtDate(discord.connected_at))}`
            : '회사별로 하나의 Discord 서버를 연결할 수 있다.'}</p>
        </div>

        ${canAdmin ? `
          <button class="btn btn-primary" data-action="connect-discord">
            ${connected ? 'Discord 다시 연결' : 'Discord 서버 연결'}
          </button>
        ` : ''}
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">DISCORD CATALOG</div>
          <h3>채널 · 역할 설정</h3>
        </div>
        ${catalogReady
          ? '<span class="pass-chip">SYNCED</span>'
          : '<span class="muted-chip">WAITING</span>'}
      </div>

      ${connected ? `
        <div class="discord-catalog-summary">
          <div>
            <span>텍스트 채널</span>
            <strong>${esc(textChannels.length)}</strong>
          </div>
          <div>
            <span>설정 가능 역할</span>
            <strong>${esc(assignableRoles.length)}</strong>
          </div>
          <div>
            <span>최근 동기화</span>
            <strong>${esc(lastCatalogSync ? fmtDate(lastCatalogSync) : '-')}</strong>
          </div>
          <button class="btn btn-secondary" data-action="refresh-discord-catalog">
            목록 새로고침
          </button>
        </div>

        ${catalogReady ? `
          <form data-form="discord-config" class="discord-config-grid">
            <label>
              <span class="field-label">알림 채널</span>
              ${renderDiscordSelect(
                'notification_channel_id',
                config.notification_channel_id,
                textChannels,
                'channel_id',
                'channel_name',
                '선택 안 함',
                !canAdmin
              )}
              <small>공금·신청·처리 결과 같은 자동 알림을 보낼 기본 채널.</small>
            </label>

            <label>
              <span class="field-label">명령 채널</span>
              ${renderDiscordSelect(
                'command_channel_id',
                config.command_channel_id,
                textChannels,
                'channel_id',
                'channel_name',
                '선택 안 함',
                !canAdmin
              )}
              <small>향후 AXE PRODUCT 명령어 사용을 기본 허용할 채널.</small>
            </label>

            <label>
              <span class="field-label">관리자 역할</span>
              ${renderDiscordSelect(
                'admin_role_id',
                config.admin_role_id,
                assignableRoles,
                'role_id',
                'role_name',
                '선택 안 함',
                !canAdmin
              )}
              <small>회사 관리자와 연결할 Discord 역할.</small>
            </label>

            <label>
              <span class="field-label">멤버 역할</span>
              ${renderDiscordSelect(
                'member_role_id',
                config.member_role_id,
                assignableRoles,
                'role_id',
                'role_name',
                '선택 안 함',
                !canAdmin
              )}
              <small>일반 회사 멤버와 연결할 Discord 역할.</small>
            </label>

            ${canAdmin ? `
              <div class="discord-config-actions">
                <button class="btn btn-primary" type="submit">Discord 설정 저장</button>
              </div>
            ` : ''}
          </form>
        ` : `
          <div class="info-banner info-banner--muted">
            봇이 Discord 서버의 채널·역할을 동기화 중이다. 잠시 후 ‘목록 새로고침’을 누르면 자동으로 표시된다.
          </div>
        `}
      ` : `
        <div class="info-banner info-banner--muted">
          Discord 서버를 먼저 연결하면 채널과 역할을 자동으로 불러온다.
        </div>
      `}
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
