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
  const fundEnabled = (state.modules || []).some((m) => m.module_key === 'fund' && Boolean(m.enabled));
  const ammoEnabled = (state.modules || []).some((m) => m.module_key === 'ammo' && Boolean(m.enabled));

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
        ${!user ? renderLogin(state) : renderAuthed(state, company, myMembership, canAdmin, canOwn, fundEnabled, ammoEnabled)}
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

function renderAuthed(state, company, myMembership, canAdmin, canOwn, fundEnabled, ammoEnabled) {
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
          ${navItem('fund', '공금', state.view, !fundEnabled, 'OFF')}
          ${navItem('ammo', '총알', state.view, !ammoEnabled, 'OFF')}
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
        ${state.view === 'fund' ? renderFund(state, canAdmin, fundEnabled) : ''}
        ${state.view === 'ammo' ? renderAmmo(state, canAdmin, ammoEnabled) : ''}
        ${state.view === 'members' ? renderMembers(state, myMembership, canAdmin, canOwn) : ''}
        ${state.view === 'modules' ? renderModules(state, canAdmin) : ''}
        ${state.view === 'settings' ? renderSettings(state, canAdmin) : ''}
        ${state.view === 'audit' ? renderAudit(state, canAdmin) : ''}
      </section>
    </section>
  `;
}

function navItem(key, label, active, disabled = false, disabledHint = 'ADMIN') {
  return `
    <button class="nav-item ${active === key ? 'is-active' : ''}" data-view="${key}" ${disabled ? 'disabled' : ''}>
      <span>${esc(label)}</span>
      ${disabled ? `<small>${esc(disabledHint)}</small>` : ''}
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

function fmtWon(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return `${esc(value)}원`;
  return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
}

function fundStatusClass(status) {
  const map = {
    '완료': 'is-good',
    '면제': 'is-exempt',
    '검수대기': 'is-pending',
    '보류': 'is-hold',
    '미납': 'is-bad',
    '예정': 'is-muted',
    '공금제외': 'is-muted',
    '가입 전': 'is-muted',
  };
  return map[status] || 'is-muted';
}

function requestStatusLabel(status) {
  const map = {
    pending: '검수대기',
    hold: '보류',
    approved: '승인',
    rejected: '반려',
    cancelled: '승인취소',
    deleted: '삭제',
  };
  return map[status] || status || '-';
}

function safeEvidence(value) {
  const raw = String(value || '').trim();
  if (!raw) return '<span class="muted-text">없음</span>';
  if (/^https?:\/\//i.test(raw)) {
    return `<a class="fund-evidence-link" href="${esc(raw)}" target="_blank" rel="noopener noreferrer">증빙 열기</a>`;
  }
  return `<button class="btn btn-compact btn-ghost fund-evidence-open" type="button" data-action="fund-open-evidence" data-evidence-path="${esc(raw)}">증빙 보기</button>`;
}

function renderFund(state, canAdmin, fundEnabled) {
  if (!fundEnabled) {
    return `
      <div class="panel">
        <div class="panel-title">
          <div>
            <div class="eyebrow">FUND</div>
            <h3>공금 모듈</h3>
          </div>
          <span class="muted-chip">OFF</span>
        </div>
        <div class="info-banner info-banner--muted">모듈 관리에서 공금 기능을 먼저 켜야 한다.</div>
      </div>
    `;
  }

  const myPeriods = state.fundMyPeriods || [];
  const myCompleted = myPeriods.filter((row) => row.status === '완료').length;
  const myUnpaid = myPeriods.filter((row) => row.status === '미납').length;
  const myPending = myPeriods.filter((row) => ['검수대기', '보류'].includes(row.status)).length;

  return `
    <div class="grid-cards fund-metrics">
      ${metricCard('MY PERIODS', myPeriods.length, '최근 공금 주차')}
      ${metricCard('PAID', myCompleted, '납부 완료')}
      ${metricCard('UNPAID', myUnpaid, '현재 미납')}
      ${metricCard('IN REVIEW', myPending, '검수대기 · 보류')}
    </div>

    ${state.fundError ? `<div class="global-alert global-alert--error fund-inline-alert">${esc(state.fundError)}</div>` : ''}
    ${state.fundLoading ? `<div class="fund-loading"><div class="spinner"></div><span>공금 정보를 불러오는 중…</span></div>` : ''}

    ${renderMyFundPeriods(myPeriods)}
    ${renderFundSubmission(myPeriods)}
    ${canAdmin ? renderFundAdmin(state) : ''}
  `;
}

function renderMyFundPeriods(rows) {
  const body = rows.map((row) => `
    <tr>
      <td><strong>${esc(row.year)}년 ${esc(row.month)}월 ${esc(row.week)}주차</strong><small class="table-sub">${esc(row.period_start)} ~ ${esc(row.period_end)}</small></td>
      <td>${fmtWon(row.weekly_fee)}</td>
      <td><span class="fund-status ${fundStatusClass(row.status)}">${esc(row.status)}</span></td>
      <td>${fmtWon(row.paid_amount)}</td>
      <td>${row.exemption_reason ? esc(row.exemption_reason) : '-'}</td>
    </tr>
  `).join('');

  return `
    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">MY FUND</div>
          <h3>내 공금 현황</h3>
        </div>
        <span class="pass-chip">MEMBER SAFE</span>
      </div>
      <div class="table-wrap fund-table-wrap">
        <table>
          <thead><tr><th>주차</th><th>기준액</th><th>상태</th><th>납부액</th><th>면제 사유</th></tr></thead>
          <tbody>${body || '<tr><td colspan="5">조회할 공금 주차가 없다.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderFundSubmission(rows) {
  const eligible = (rows || []).filter((row) => row.status === '미납' && Number(row.weekly_fee) > 0);
  const options = eligible.map((row) => `
    <option value="${esc(row.year)}-${esc(row.month)}-${esc(row.week)}">
      ${esc(row.year)}년 ${esc(row.month)}월 ${esc(row.week)}주차 · ${fmtWon(row.weekly_fee)}
    </option>
  `).join('');

  return `
    <div class="panel fund-submit-panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">PAYMENT REQUEST</div>
          <h3>공금 납부 신청</h3>
        </div>
        <span class="pass-chip">PRIVATE EVIDENCE</span>
      </div>

      ${eligible.length ? `
        <form data-form="fund-submit" class="fund-submit-form">
          <label class="fund-submit-period">
            <span class="field-label">납부 주차</span>
            <select class="select" name="period" required>${options}</select>
          </label>
          <label>
            <span class="field-label">납부 방식</span>
            <select class="select" name="payment_mode" data-fund-payment-mode required>
              <option value="공용계좌" selected>공용계좌</option>
              <option value="회사잔고">회사잔고</option>
              <option value="분할납부">분할납부</option>
            </select>
          </label>
          <div class="fund-submit-evidence">
            <span class="field-label">납부 증빙</span>
            <div class="fund-evidence-zone" data-fund-evidence-zone tabindex="0" role="group" aria-label="납부 증빙 이미지 선택 또는 붙여넣기">
              <div class="fund-evidence-paste-hint">
                <strong>캡처 이미지 Ctrl+V 붙여넣기</strong>
                <small>이 영역을 클릭한 뒤 붙여넣거나 파일을 선택해도 된다.</small>
              </div>
              <input class="input fund-file-input" name="evidence" type="file" accept="image/jpeg,image/png,image/webp" data-fund-evidence-input />
              <div class="fund-evidence-preview" data-fund-evidence-preview hidden>
                <img data-fund-evidence-image alt="선택한 공금 증빙 미리보기" />
                <div class="fund-evidence-preview-meta">
                  <strong data-fund-evidence-name></strong>
                  <small data-fund-evidence-source></small>
                </div>
                <button class="btn btn-secondary btn-compact" type="button" data-action="fund-clear-evidence">제거</button>
              </div>
            </div>
          </div>
          <label class="fund-submit-memo">
            <span class="field-label">메모</span>
            <input class="input" name="memo" maxlength="1000" placeholder="선택 입력" />
          </label>

          <div class="fund-split-fields" data-fund-split-fields hidden>
            <label>
              <span class="field-label">공용계좌 금액</span>
              <input class="input" name="public_amount" type="number" min="1" step="1" value="0" disabled />
            </label>
            <label>
              <span class="field-label">회사잔고 금액</span>
              <input class="input" name="company_amount" type="number" min="1" step="1" value="0" disabled />
            </label>
          </div>

          <div class="fund-submit-actions">
            <p class="help-text">JPG · PNG · WEBP / 최대 10MB. 파일 선택 또는 캡처 후 Ctrl+V 붙여넣기 가능. 증빙은 비공개 Storage에 저장되고 같은 회사의 OWNER·ADMIN만 검수할 수 있다.</p>
            <button class="btn btn-primary" type="submit">납부 신청</button>
          </div>
        </form>
      ` : `
        <div class="info-banner info-banner--muted">현재 웹에서 납부 신청할 수 있는 미납 주차가 없다.</div>
      `}
    </div>
  `;
}

function renderFundAdmin(state) {
  const year = Number(state.fundSelectedYear || new Date().getFullYear());
  const month = Number(state.fundSelectedMonth || new Date().getMonth() + 1);
  const week = Number(state.fundSelectedWeek || 1);
  const statuses = state.fundPeriodStatus || [];
  const requests = state.fundRequests || [];

  const completeCount = statuses.filter((row) => row.status === '완료').length;
  const unpaidCount = statuses.filter((row) => row.status === '미납').length;
  const exemptCount = statuses.filter((row) => row.status === '면제').length;
  const reviewCount = requests.filter((row) => ['pending', 'hold'].includes(row.status)).length;
  const expectedFee = statuses.find((row) => Number(row.expected_amount) >= 0)?.expected_amount ?? 0;

  const statusRows = statuses.map((row) => `
    <tr>
      <td><strong>${esc(row.display_name)}</strong><small class="table-sub">${esc((row.member_role || '').toUpperCase())}</small></td>
      <td>${fmtWon(row.expected_amount)}</td>
      <td><span class="fund-status ${fundStatusClass(row.status)}">${esc(row.status)}</span></td>
      <td>${fmtWon(row.paid_amount)}</td>
      <td>${row.exemption_reason ? esc(row.exemption_reason) : '-'}</td>
    </tr>
  `).join('');

  const requestRows = requests.map((row) => {
    const open = ['pending', 'hold'].includes(row.status);
    return `
      <tr>
        <td><strong>${esc(row.member_display_name)}</strong><small class="table-sub">${esc(row.year)}.${esc(row.month)} / ${esc(row.week)}주차</small></td>
        <td>${fmtWon(row.amount)}<small class="table-sub">${esc(row.payment_mode)}</small></td>
        <td><span class="fund-status ${row.status === 'approved' ? 'is-good' : row.status === 'rejected' ? 'is-bad' : row.status === 'cancelled' ? 'is-muted' : row.status === 'hold' ? 'is-hold' : 'is-pending'}">${esc(requestStatusLabel(row.status))}</span></td>
        <td>${safeEvidence(row.evidence_path)}</td>
        <td>${row.memo ? esc(row.memo) : '-'}</td>
        <td>${esc(fmtDate(row.created_at))}</td>
        <td>
          ${open ? `
            <div class="fund-review-box">
              <input class="input fund-review-note" data-fund-review-note="${esc(row.request_id)}" maxlength="1000" placeholder="검수 메모 (선택)" />
              <div class="fund-review-actions">
                <button class="btn btn-compact fund-btn-approve" type="button" data-action="fund-review" data-request-id="${esc(row.request_id)}" data-review-action="approve">승인</button>
                <button class="btn btn-compact btn-ghost" type="button" data-action="fund-review" data-request-id="${esc(row.request_id)}" data-review-action="hold">보류</button>
                <button class="btn btn-compact btn-danger" type="button" data-action="fund-review" data-request-id="${esc(row.request_id)}" data-review-action="reject">반려</button>
              </div>
            </div>
          ` : row.status === 'approved' ? `
            <div class="fund-review-box">
              <input class="input fund-review-note" data-fund-cancel-reason="${esc(row.request_id)}" maxlength="1000" placeholder="승인 취소 사유" />
              <button class="btn btn-compact btn-danger" type="button" data-action="fund-cancel-approval" data-request-id="${esc(row.request_id)}">승인 취소</button>
            </div>
          ` : `<small class="table-sub">${row.status === 'cancelled' ? '원장과 신청 이력을 보존한 채 승인 취소됨' : (row.review_note ? esc(row.review_note) : '처리 완료')}</small>`}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="panel fund-admin-panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">FUND ADMIN</div>
          <h3>주차별 공금 현황</h3>
        </div>
        <span class="pass-chip">OWNER / ADMIN</span>
      </div>

      <form data-form="fund-period" class="fund-period-form">
        <label><span class="field-label">연도</span><input class="input" name="year" type="number" min="2020" max="2200" value="${esc(year)}" required /></label>
        <label><span class="field-label">월</span><input class="input" name="month" type="number" min="1" max="12" value="${esc(month)}" required /></label>
        <label><span class="field-label">주차</span><select class="select" name="week">${[1,2,3,4,5].map((n) => `<option value="${n}" ${n === week ? 'selected' : ''}>${n}주차</option>`).join('')}</select></label>
        <button class="btn btn-primary" type="submit">현황 조회</button>
      </form>

      <div class="fund-summary-strip">
        <div><span>기준액</span><strong>${fmtWon(expectedFee)}</strong></div>
        <div><span>완료</span><strong>${completeCount}</strong></div>
        <div><span>미납</span><strong>${unpaidCount}</strong></div>
        <div><span>면제</span><strong>${exemptCount}</strong></div>
        <div><span>검수 필요</span><strong>${reviewCount}</strong></div>
      </div>

      <div class="table-wrap fund-table-wrap">
        <table>
          <thead><tr><th>멤버</th><th>기준액</th><th>상태</th><th>납부액</th><th>면제 사유</th></tr></thead>
          <tbody>${statusRows || '<tr><td colspan="5">해당 주차의 멤버 현황이 없다.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">FEE RULE</div>
          <h3>주간 공금액 설정</h3>
        </div>
        <span class="muted-chip">해당 주차부터 적용</span>
      </div>
      <form data-form="fund-fee-rule" class="fund-fee-form">
        <label><span class="field-label">시작 연도</span><input class="input" name="year" type="number" min="2020" max="2200" value="${esc(year)}" required /></label>
        <label><span class="field-label">시작 월</span><input class="input" name="month" type="number" min="1" max="12" value="${esc(month)}" required /></label>
        <label><span class="field-label">시작 주차</span><select class="select" name="week">${[1,2,3,4,5].map((n) => `<option value="${n}" ${n === week ? 'selected' : ''}>${n}주차</option>`).join('')}</select></label>
        <label><span class="field-label">주간 공금액</span><input class="input" name="weekly_fee" type="number" min="0" step="1" value="${esc(Number(expectedFee || 0))}" required /></label>
        <label class="fund-fee-note"><span class="field-label">메모</span><input class="input" name="note" maxlength="1000" placeholder="예: 9월부터 주 20,000원" /></label>
        <button class="btn btn-primary" type="submit">기준액 저장</button>
      </form>
      <p class="help-text">과거 원장을 덮어쓰지 않고, 선택한 시작 주차부터 적용되는 기준 규칙을 저장한다.</p>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>
          <div class="eyebrow">REVIEW QUEUE</div>
          <h3>납부 신청 검수</h3>
        </div>
        <span class="${reviewCount ? 'pass-chip' : 'muted-chip'}">${reviewCount} OPEN</span>
      </div>
      <div class="table-wrap fund-request-table">
        <table>
          <thead><tr><th>멤버 / 주차</th><th>금액</th><th>상태</th><th>증빙</th><th>메모</th><th>신청일</th><th>검수</th></tr></thead>
          <tbody>${requestRows || '<tr><td colspan="7">납부 신청 기록이 없다.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}


function ammoRoundLabel(round) {
  if (!round) return '-';
  const session = round.session_type === 'afternoon' ? '3시' : round.session_type === 'night' ? '10시' : round.session_type;
  return `${round.event_date || ''} ${session}${Number(round.revision || 1) > 1 ? ` · R${round.revision}` : ''}`;
}

function ammoStatusLabel(status) {
  return ({ open: 'OPEN', closed: 'CLOSED', cancelled: 'CANCELLED', active: '신청', completed: '배분완료' })[status] || status || '-';
}

function renderAmmo(state, canAdmin, ammoEnabled) {
  if (!ammoEnabled) {
    return `
      <div class="panel">
        <div class="panel-head"><div><div class="eyebrow">AMMO</div><h3>총알 모듈</h3></div></div>
        <div class="info-banner info-banner--muted">모듈 관리에서 총알 기능을 먼저 켜야 한다.</div>
      </div>`;
  }

  const settings = state.ammoSettings || {};
  const rounds = state.ammoRounds || [];
  const selected = rounds.find((r) => r.round_id === state.ammoSelectedRoundId) || null;
  const orders = state.ammoOrders || [];
  const makers = state.ammoMakers || [];
  const openRounds = rounds.filter((r) => r.round_status === 'open');
  const activeOrders = orders.filter((o) => o.order_status === 'active');
  const completedOrders = orders.filter((o) => o.order_status === 'completed');
  const myOrder = selected?.my_order_id ? {
    order_id: selected.my_order_id,
    requested_sets: Number(selected.my_requested_sets || 0),
    status: selected.my_order_status,
  } : null;
  const lineSets = Number(settings.line_sets || 8);
  const halfSets = Number(settings.half_sets || 4);
  const maxSets = Number(settings.max_order_sets || 800);

  const roundButtons = rounds.slice(0, 20).map((r) => `
    <button type="button" class="ammo-round-card ${r.round_id === state.ammoSelectedRoundId ? 'is-active' : ''}" data-ammo-action="select-round" data-round-id="${esc(r.round_id)}">
      <strong>${esc(ammoRoundLabel(r))}</strong>
      <span>${esc(ammoStatusLabel(r.round_status))} · 신청 ${Number(r.total_requested_sets || 0).toLocaleString('ko-KR')}세트 · 제작 ${Number(r.active_maker_count || 0)}명</span>
    </button>
  `).join('');

  const orderRows = orders.map((o) => `
    <tr>
      <td><strong>${esc(o.member_display_name || '멤버')}</strong></td>
      <td>${Number(o.requested_sets || 0).toLocaleString('ko-KR')}세트</td>
      <td><span class="fund-status ${o.order_status === 'completed' ? 'is-good' : 'is-pending'}">${esc(ammoStatusLabel(o.order_status))}</span></td>
      <td>${esc(o.completed_by_name || '-')}</td>
      <td>
        ${selected?.i_am_maker && o.order_status === 'active' ? `<button class="btn btn-compact btn-primary" type="button" data-ammo-action="complete-order" data-order-id="${esc(o.order_id)}">배분 완료</button>` : ''}
        ${selected?.i_am_maker && o.order_status === 'completed' ? `<button class="btn btn-compact btn-secondary" type="button" data-ammo-action="undo-order" data-order-id="${esc(o.order_id)}">완료 취소</button>` : ''}
      </td>
    </tr>
  `).join('');

  const makerNames = makers.length ? makers.map((m) => esc(m.member_display_name || '멤버')).join(' · ') : '현재 제작 참여자 없음';

  return `
    <div class="grid-cards fund-metrics">
      ${metricCard('OPEN ROUNDS', openRounds.length, '현재 열린 회차')}
      ${metricCard('REQUESTED', selected ? Number(selected.total_requested_sets || 0).toLocaleString('ko-KR') : 0, '선택 회차 총 신청 세트')}
      ${metricCard('ACTIVE', activeOrders.length, '배분 대기')}
      ${metricCard('DONE', completedOrders.length, '배분 완료')}
    </div>

    ${state.ammoError ? `<div class="global-alert global-alert--error fund-inline-alert">${esc(state.ammoError)}</div>` : ''}
    ${state.ammoLoading ? `<div class="fund-loading"><div class="spinner"></div><span>총알 정보를 불러오는 중…</span></div>` : ''}

    <div class="panel ammo-rounds-panel">
      <div class="panel-head"><div><div class="eyebrow">ROUNDS</div><h3>총알 회차</h3></div><span class="head-badge">1줄 ${lineSets} · 반 ${halfSets}</span></div>
      <div class="ammo-round-grid">${roundButtons || '<div class="info-banner info-banner--muted">아직 생성된 총알 회차가 없다.</div>'}</div>
    </div>

    ${selected ? `
      <div class="panel">
        <div class="panel-head">
          <div><div class="eyebrow">MY ORDER</div><h3>${esc(ammoRoundLabel(selected))}</h3></div>
          <span class="head-badge">${esc(ammoStatusLabel(selected.round_status))}</span>
        </div>
        <div class="ammo-action-grid">
          <div class="ammo-action-box">
            <h4>내 신청</h4>
            ${selected.round_status !== 'open' ? '<p>닫힌 회차는 신청을 변경할 수 없다.</p>' : myOrder?.status === 'completed' ? `<p><strong>${myOrder.requested_sets}세트</strong> · 배분 완료</p>` : myOrder ? `
              <form data-form="ammo-order-edit" class="inline-form">
                <input type="hidden" name="order_id" value="${esc(myOrder.order_id)}" />
                <input class="input" type="number" name="requested_sets" min="1" max="${maxSets}" value="${myOrder.requested_sets}" required />
                <button class="btn btn-primary" type="submit">수정</button>
                <button class="btn btn-danger" type="button" data-ammo-action="cancel-order" data-order-id="${esc(myOrder.order_id)}">신청 취소</button>
              </form>` : `
              <form data-form="ammo-order" class="inline-form">
                <input type="hidden" name="round_id" value="${esc(selected.round_id)}" />
                <input class="input" type="number" name="requested_sets" min="1" max="${maxSets}" value="${lineSets}" required />
                <button class="btn btn-primary" type="submit">신청</button>
                <small>반줄 ${halfSets} · 1줄 ${lineSets}세트</small>
              </form>`}
          </div>
          <div class="ammo-action-box">
            <h4>제작 참여</h4>
            <p>${makerNames}</p>
            ${selected.round_status === 'open' ? `<button class="btn ${selected.i_am_maker ? 'btn-secondary' : 'btn-primary'}" type="button" data-ammo-action="${selected.i_am_maker ? 'maker-leave' : 'maker-join'}" data-round-id="${esc(selected.round_id)}">${selected.i_am_maker ? '제작 참여 해제' : '제작 참여'}</button>` : ''}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><div><div class="eyebrow">DISTRIBUTION</div><h3>신청 · 배분 현황</h3></div><span class="head-badge">제작자 ${makers.length}명</span></div>
        <div class="table-wrap"><table><thead><tr><th>멤버</th><th>신청</th><th>상태</th><th>완료자</th><th>처리</th></tr></thead><tbody>${orderRows || '<tr><td colspan="5">현재 신청이 없다.</td></tr>'}</tbody></table></div>
      </div>
    ` : ''}

    ${canAdmin ? `
      <div class="panel">
        <div class="panel-head"><div><div class="eyebrow">AMMO ADMIN</div><h3>회차 관리</h3></div><span class="head-badge">OWNER / ADMIN</span></div>
        <form data-form="ammo-round-open" class="ammo-admin-form">
          <label><span class="field-label">날짜</span><input class="input" name="event_date" type="date" required /></label>
          <label><span class="field-label">회차</span><select class="select" name="session_type"><option value="afternoon">3시</option><option value="night">10시</option></select></label>
          <button class="btn btn-primary" type="submit">회차 열기</button>
          ${selected?.round_status === 'open' ? `<button class="btn btn-secondary" type="button" data-ammo-action="reset-round" data-round-id="${esc(selected.round_id)}">회차 초기화</button><button class="btn btn-ghost" type="button" data-ammo-action="close-round" data-round-id="${esc(selected.round_id)}">회차 닫기</button><button class="btn btn-danger" type="button" data-ammo-action="cancel-round" data-round-id="${esc(selected.round_id)}">회차 취소</button>` : ''}
        </form>
      </div>

      <div class="panel">
        <div class="panel-head"><div><div class="eyebrow">SETTINGS</div><h3>총알 운영 설정</h3></div></div>
        <form data-form="ammo-settings" class="ammo-settings-form">
          <label><span class="field-label">Timezone</span><input class="input" name="timezone" value="${esc(settings.timezone || 'Asia/Seoul')}" required /></label>
          <label><span class="field-label">운영 요일 (0=일)</span><input class="input" name="event_weekdays" value="${esc((settings.event_weekdays || [0,3,5,6]).join(','))}" /></label>
          <label><span class="field-label">1줄 세트</span><input class="input" name="line_sets" type="number" value="${lineSets}" min="2" /></label>
          <label><span class="field-label">반줄 세트</span><input class="input" name="half_sets" type="number" value="${halfSets}" min="1" /></label>
          <label><span class="field-label">최대 신청</span><input class="input" name="max_order_sets" type="number" value="${maxSets}" min="${lineSets}" /></label>
          <label><span class="field-label">유지 시간(분)</span><input class="input" name="keep_minutes" type="number" value="${Number(settings.keep_minutes || 60)}" min="0" max="360" /></label>
          <input type="hidden" name="afternoon_hour" value="${Number(settings.afternoon_hour || 15)}" /><input type="hidden" name="afternoon_minute" value="${Number(settings.afternoon_minute || 0)}" />
          <input type="hidden" name="night_hour" value="${Number(settings.night_hour || 22)}" /><input type="hidden" name="night_minute" value="${Number(settings.night_minute || 0)}" />
          <label class="check-line"><input type="checkbox" name="afternoon_enabled" ${settings.afternoon_enabled !== false ? 'checked' : ''} /> 3시 회차 사용</label>
          <label class="check-line"><input type="checkbox" name="night_enabled" ${settings.night_enabled !== false ? 'checked' : ''} /> 10시 회차 사용</label>
          <label class="check-line"><input type="checkbox" name="allow_member_edit" ${settings.allow_member_edit !== false ? 'checked' : ''} /> 멤버 신청 수정 허용</label>
          <label class="check-line"><input type="checkbox" name="allow_member_cancel" ${settings.allow_member_cancel !== false ? 'checked' : ''} /> 멤버 신청 취소 허용</label>
          <button class="btn btn-primary" type="submit">총알 설정 저장</button>
        </form>
      </div>
    ` : ''}
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

function discordDeliveryStatusLabel(status) {
  const labels = {
    pending: '대기',
    processing: '처리 중',
    sent: '전송 완료',
    failed: '실패',
  };
  return labels[status] || status || '-';
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
              <div class="discord-config-actions discord-config-actions--split">
                <button
                  class="btn btn-secondary"
                  type="button"
                  data-action="send-discord-test-notification"
                  ${config.notification_channel_id ? '' : 'disabled'}
                  title="${config.notification_channel_id ? '저장된 알림 채널로 테스트 메시지를 보낸다.' : '알림 채널을 먼저 저장해 주세요.'}"
                >
                  테스트 알림 보내기
                </button>
                <button class="btn btn-primary" type="submit">Discord 설정 저장</button>
              </div>
            ` : ''}
          </form>

          ${(state.discordDeliveryJobs || []).length ? `
            <div class="discord-delivery-history">
              <div class="field-label">최근 테스트 알림</div>
              ${(state.discordDeliveryJobs || []).slice(0, 3).map((job) => `
                <div class="discord-delivery-row">
                  <span>${esc(discordDeliveryStatusLabel(job.status))}</span>
                  <strong>${esc(fmtDate(job.created_at))}</strong>
                  ${job.last_error ? `<small>${esc(job.last_error)}</small>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
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
