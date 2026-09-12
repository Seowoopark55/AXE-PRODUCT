const ROLE_LABEL = { owner: 'OWNER', admin: 'ADMIN', manager: 'MANAGER', member: 'MEMBER' };
const ROLE_KO = { owner: '대표', admin: '관리자', manager: '매니저', member: '멤버' };

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function icon(name) {
  const icons = {
    fund:'<path d="M7 3v18M3 7h8M4 11h7M6 7v8M3 15h8"/>',
    members:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    assets:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4h8v2M3 10h18"/>',
    accounts:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 14h4"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2v-4h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 20.4 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7 1.6z"/>',
    feedback:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/>',
    refresh:'<path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    save:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h8"/><path d="M8 17h8"/><path d="M9 9h6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    power:'<path d="M12 2v10"/><path d="M18.4 6.6a8 8 0 1 1-12.8 0"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h7v18h-7"/>',
    upload:'<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 21h14"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.settings}</svg>`;
}

function money(value) {
  const n = Number(value || 0);
  return `${Math.abs(n).toLocaleString('ko-KR')}원`;
}
function signedMoney(value) {
  const n = Number(value || 0);
  if (!n) return '0원';
  return `${n > 0 ? '+' : '-'}${Math.abs(n).toLocaleString('ko-KR')}원`;
}
function fmtDate(value, short = false) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('ko-KR', short ? { year:'numeric', month:'2-digit', day:'2-digit' } : {
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'
  }).format(d);
}
function dateKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value || '').slice(0,10);
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function currentCompany(state) { return (state.companies || []).find(c => c.id === state.companyId) || null; }
function currentMembership(state) { return (state.memberships || []).find(m => m.user_id === state.session?.user?.id) || null; }
function canAdmin(state) { return ['owner','admin'].includes(currentMembership(state)?.role); }
function moduleEnabled(state, key) { return (state.modules || []).some(m => m.module_key === key && Boolean(m.enabled)); }
function moduleRow(state, key) { return (state.modules || []).find(m => m.module_key === key) || null; }
function companyDisplayName(state) { return currentCompany(state)?.name || '회사'; }
function userDisplayName(state) {
  const m = currentMembership(state);
  return m?.display_name || state.session?.user?.user_metadata?.full_name || state.session?.user?.user_metadata?.name || '사용자';
}

export function renderShell(root, state) {
  const user = state.session?.user;
  root.innerHTML = `
    ${state.error ? `<div class="runtime-banner runtime-banner--error"><span>${esc(state.error)}</span><button data-action="dismiss-error">×</button></div>` : ''}
    ${state.notice ? `<div class="runtime-banner runtime-banner--notice">${esc(state.notice)}</div>` : ''}
    ${!state.envReady ? renderEnvironmentMissing() : !user ? renderLogin(state) : !state.ready ? renderStartupLoading() : !state.companies?.length ? renderOnboarding(state) : renderAuthed(state)}
  `;
}

function renderStartupLoading() {
  return `<section class="runtime-auth runtime-auth--startup"><div class="runtime-startup-card"><span class="runtime-startup-spinner" aria-hidden="true"></span><div><strong>AXE PRODUCT</strong><p>회사 정보를 불러오는 중입니다.</p></div></div></section>`;
}

function renderOfflineLoading() {
  return `<section class="runtime-auth runtime-auth--startup"><div class="runtime-startup-card runtime-startup-card--offline"><span class="runtime-offline-dot" aria-hidden="true"></span><div><strong>AXE PRODUCT</strong><p>네트워크 연결이 없습니다. 운영 데이터는 오프라인에 저장하지 않습니다.</p></div><button class="runtime-btn-ghost" data-action="refresh">다시 연결</button></div></section>`;
}

function renderEnvironmentMissing() {
  return `<section class="runtime-auth"><div class="runtime-auth-card"><strong>AXE PRODUCT</strong><h1>STAGING 환경 설정이 필요합니다.</h1><p>VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY를 Vercel 환경변수에 설정해 주세요.</p></div></section>`;
}

function renderLogin(state) {
  return `<section class="runtime-auth"><div class="runtime-auth-card">
    <div class="product-brand product-brand--login"><div><strong>AXE PRODUCT</strong><small>OPERATIONS CONSOLE</small></div></div>
    <h1>회사를 움직이는 하나의 콘솔.</h1><p>Discord 기반의 회사 운영을 더 간결하고 체계적으로.</p>
    <button class="runtime-login-button" data-action="discord-login" ${state.loading ? 'disabled' : ''}>Discord로 로그인</button>
  </div></section>`;
}

function renderOnboarding(state) {
  return `<section class="runtime-auth runtime-auth--onboarding"><div class="runtime-onboarding runtime-onboarding--single">
    <div class="runtime-onboarding-card runtime-onboarding-card--primary"><span>NEW COMPANY</span><h2>새 회사 시작</h2><p>회사를 처음 등록하는 OWNER라면 여기서 운영 공간을 만듭니다.</p>
      <form data-form="create-company"><label>회사 이름<input name="name" maxlength="80" required></label><label>Slug <small>선택</small><input name="slug" maxlength="63"></label><button class="runtime-login-button" type="submit">회사 시작하기</button></form>
    </div>
    <div class="runtime-onboarding-note"><strong>이미 회사 멤버인가요?</strong><span>회사 관리자가 Discord에서 대상 우클릭 → 앱 → AXE 멤버 등록을 완료하면, 다음 로그인부터 소속 회사가 자동으로 표시됩니다.</span></div>
  </div></section>`;
}

function renderAuthed(state) {
  const company = currentCompany(state);
  const membership = currentMembership(state);
  const connected = state.discordConnection?.status === 'connected';
  return `<div class="runtime-app runtime-app--${esc(state.page||'fund')}">
    <header class="global-header"><div class="global-header__inner">
      <div class="product-brand"><div><strong>AXE PRODUCT</strong><small>OPERATIONS CONSOLE</small></div></div>
      <div class="global-account"><div><strong>${esc(userDisplayName(state))}</strong><small>${esc(ROLE_LABEL[membership?.role] || '-')}</small></div><button class="icon-button" data-action="logout" aria-label="로그아웃" title="로그아웃">${icon('logout')}</button></div>
    </div></header>
    <div class="workspace-shell">
      <aside class="sidebar">
        <section class="company-switcher"><span class="overline">현재 회사</span>
          <div class="runtime-company-picker ${state.companyMenuOpen?'is-open':''}">
            <button type="button" class="runtime-company-trigger" data-action="toggle-company-menu" aria-expanded="${state.companyMenuOpen?'true':'false'}" aria-haspopup="listbox">
              <span><strong>${esc(company?.name||'회사')}</strong><small>${(state.companies||[]).length}개 회사</small></span><b>⌄</b>
            </button>
            ${state.companyMenuOpen?`<div class="runtime-company-menu" role="listbox">${(state.companies||[]).map(c=>`<button type="button" class="${c.id===state.companyId?'is-current':''}" data-action="switch-company" data-company-id="${esc(c.id)}"><span>${esc(c.name)}</span>${c.id===state.companyId?'<em>현재</em>':''}</button>`).join('')}</div>`:''}
          </div>
          <div class="company-quick-actions company-quick-actions--single"><button class="accent-action" data-action="open-create-company">+ 새 회사</button></div>
        </section>
        <nav class="sidebar-nav"><span class="sidebar-nav__label">회사 운영</span>
          ${navItem(state,'fund','공금 관리')}${navItem(state,'members','멤버 관리')}${navItem(state,'assets','자산 관리')}${navItem(state,'accounts','계좌 관리')}
          <span class="sidebar-nav__label spaced">설정</span>${navItem(state,'settings','회사 설정')}
          <span class="sidebar-nav__label spaced">지원</span><button class="nav-item nav-item--support" data-action="open-feedback"><span class="nav-item__icon">${icon('feedback')}</span><span>피드백 · 제보</span></button>
        </nav>
        <footer class="sidebar-footer">
          <div class="connection-status ${connected?'':'is-off'}"><i></i><div><strong>Discord ${connected?'연결됨':'미연결'}</strong><small>${esc(state.discordConnection?.guild_name || '연결 필요')}</small></div></div>
        </footer>
      </aside>
      <main class="main main--${esc(state.page||'fund')}">${state.loading && !state.ready ? '<div class="runtime-loading">불러오는 중…</div>' : renderPage(state)}</main>
    </div>
    ${renderModal(state)}
  </div>`;
}

function navItem(state,key,label){ return `<button class="nav-item ${state.page===key?'is-active':''}" data-page="${key}"><span class="nav-item__icon">${icon(key)}</span><span>${label}</span></button>`; }
function pageHeader(kicker,title,desc,action=''){ return `<header class="page-header"><div><span class="page-eyebrow">${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>${action?`<div class="page-header__actions">${action}</div>`:''}</header>`; }
function summary(items){ return `<section class="ops-mgmt-summary">${items.map(([label,value,sub,tone])=>`<article><span>${label}</span><strong class="${tone||''}">${value}</strong><small>${esc(sub)}</small></article>`).join('')}</section>`; }
function empty(text){ return `<div class="ops-mgmt-empty">${esc(text)}</div>`; }

function renderPage(state) {
  if (!canAdmin(state)) return renderPermission(state);
  if (state.page === 'members') return renderMembers(state);
  if (state.page === 'assets') return renderAssets(state);
  if (state.page === 'accounts') return renderAccounts(state);
  if (state.page === 'settings') return renderSettings(state);
  return renderFund(state);
}
function renderPermission(state){ return `<div class="ops-mgmt-page">${pageHeader('OPERATIONS','관리자 콘솔','OWNER 또는 ADMIN 권한이 있는 회사에서 사용할 수 있습니다.')}<section class="runtime-permission"><strong>관리 권한이 필요합니다.</strong><span>현재 역할: ${esc(ROLE_LABEL[currentMembership(state)?.role]||'-')}</span></section></div>`; }

// ============================================================
// FUND
// ============================================================
function renderFund(state) {
  const snap = state.fundSnapshot || {};
  const balance = Number(snap.balance?.public || 0);
  const pending = Number(snap.pending_review_count || 0);
  return `<section class="axe-fund">
    <header class="axe-fund-header"><div class="axe-fund-header-copy"><span>FUND</span><h1>공금 관리</h1><p>회사 자금의 수입·지출·납부·잔액을 한곳에서 관리합니다.</p></div></header>
    <section class="axe-fund-summary"><article class="axe-fund-metric"><span>현재 계산 잔액</span><strong>${money(balance)}</strong><small>공용계좌 기준</small></article><article class="axe-fund-metric"><span>이번 달 수입</span><strong class="is-income">+${money(snap.month_income)}</strong><small>승인 + 직접 등록</small></article><article class="axe-fund-metric"><span>이번 달 지출</span><strong class="is-expense">-${money(snap.month_expense)}</strong><small>회사 운영 지출</small></article></section>
    <nav class="axe-fund-tabs">${[['ledger','공금 내역'],['weekly','납부 현황'],['review','납부 검수'],['balance','잔액 점검'],['settings','공금 설정']].map(([k,l])=>`<button class="${state.fundTab===k?'is-active':''}" data-fund-tab="${k}"><span>${l}</span>${k==='review'&&pending?`<em>${pending}</em>`:''}</button>`).join('')}</nav>
    <div class="axe-fund-view">${state.fundTab==='weekly'?renderFundWeekly(state):state.fundTab==='review'?renderFundReview(state):state.fundTab==='balance'?renderFundBalance(state):state.fundTab==='settings'?renderFundSettings(state):renderFundLedger(state)}</div>
  </section>`;
}

function monthOptions(selected, count=12) {
  const base = new Date();
  return Array.from({length:count},(_,i)=>{ const d=new Date(base.getFullYear(),base.getMonth()-i,1); const v=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return `<option value="${v}" ${v===selected?'selected':''}>${d.getFullYear()}년 ${d.getMonth()+1}월</option>`; }).join('');
}

function monthOptionsAround(selected, past=6, future=6) {
  const base = new Date();
  const rows=[];
  for(let offset=future; offset>=-past; offset--){
    const d=new Date(base.getFullYear(),base.getMonth()+offset,1);
    const v=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    rows.push(`<option value="${v}" ${v===selected?'selected':''}>${d.getFullYear()}년 ${d.getMonth()+1}월</option>`);
  }
  return rows.join('');
}

function renderFundLedger(state) {
  const ledger = Array.isArray(state.fundSnapshot?.ledger) ? state.fundSnapshot.ledger : [];
  const q = state.fundFilters || {person:'all',type:'all',account:'all'};
  let rows = ledger.slice();
  if(q.person!=='all') rows=rows.filter(r=>(r.member_display_name||'')===q.person);
  if(q.type==='approval') rows=rows.filter(r=>r.request_id); else if(q.type==='manual') rows=rows.filter(r=>!r.request_id); else if(q.type==='income') rows=rows.filter(r=>r.direction==='수입'); else if(q.type==='expense') rows=rows.filter(r=>r.direction==='지출');
  if(q.account!=='all') rows=rows.filter(r=>r.account===q.account);
  const people=[...new Set(ledger.map(r=>r.member_display_name).filter(Boolean))]; const accounts=[...new Set(ledger.map(r=>r.account).filter(Boolean))];
  const body=rows.length?rows.map(r=>renderLedgerRow(r,state)).join(''):`<div class="axe-fund-ledger-empty">조건에 맞는 공금내역이 없습니다.</div>`;
  return `<section class="axe-fund-ledger"><header class="axe-fund-ledger-head"><div><h2>공금내역</h2><p>필요한 정보만 빠르게 확인하고, 상세 작업은 행에서 바로 처리합니다.</p></div><div class="axe-fund-ledger-head-actions"><select class="axe-fund-history-select axe-fund-history-select--month" data-fund-ledger-month>${monthOptions(state.fundMonth,12)}</select><button class="axe-fund-primary axe-fund-primary--ledger" data-action="open-ledger">수입·지출 등록</button></div></header><section class="axe-fund-ledger-board"><div class="axe-fund-ledger-toolbar"><div class="axe-fund-ledger-filters"><select class="axe-fund-history-select" data-fund-filter="person"><option value="all">전체 이름</option>${people.map(v=>`<option ${q.person===v?'selected':''}>${esc(v)}</option>`).join('')}</select><select class="axe-fund-history-select" data-fund-filter="type"><option value="all">전체 구분</option><option value="approval" ${q.type==='approval'?'selected':''}>승인반영</option><option value="manual" ${q.type==='manual'?'selected':''}>직접기입</option><option value="income" ${q.type==='income'?'selected':''}>수입</option><option value="expense" ${q.type==='expense'?'selected':''}>지출</option></select><select class="axe-fund-history-select" data-fund-filter="account"><option value="all">전체 계좌</option>${accounts.map(v=>`<option ${q.account===v?'selected':''}>${esc(v)}</option>`).join('')}</select><button class="axe-fund-history-reset" data-action="reset-fund-filter">필터 초기화</button></div><span class="axe-fund-ledger-count">${rows.length}건</span></div><div class="axe-fund-ledger-columns"><span>날짜</span><span>이름</span><span>내역</span><span>금액</span><span>증빙</span><span>관리</span></div><div class="axe-fund-ledger-list">${body}</div></section></section>`;
}
function renderLedgerRow(r,state){
  const amount=Number(r.amount||0); const isWeeklyPayment=r.entry_type==='payment'; const title=isWeeklyPayment?'주간공금':(r.category||'기타');
  const sub=[isWeeklyPayment?'공금납부':r.ledger_type,r.direction,r.memo].filter(Boolean).join(' · ');
  const current=(state.memberships||[]).find(m=>m.id===r.membership_id); const who=current?.display_name||r.member_display_name||'—';
  const key=dateKey(r.ledger_date); const [y,m,d]=key.split('-');
  const editControl=r.can_edit
    ? `<button class="axe-fund-history-action" data-action="edit-ledger" data-entry-id="${esc(r.id)}">수정</button>`
    : `<button class="axe-fund-history-action is-disabled" type="button" disabled title="현재 DB에서 직접 수정이 제한된 연동 내역입니다.">수정</button>`;
  return `<article class="axe-fund-ledger-row"><div class="axe-fund-ledger-date"><strong>${m}.${d}</strong><span>${y}</span></div><div class="axe-fund-ledger-person"><strong>${esc(who)}</strong><span>${esc(r.account||'—')}</span></div><div class="axe-fund-ledger-entry"><div><strong>${esc(title)}</strong></div><small>${esc(sub||'—')}</small></div><div class="axe-fund-ledger-money ${amount<0?'is-expense':'is-income'}">${signedMoney(amount)}</div><div class="axe-fund-ledger-action">${r.evidence_path?`<button class="axe-fund-history-action is-evidence" data-action="open-evidence" data-evidence-path="${esc(r.evidence_path)}">증빙</button>`:'<span>—</span>'}</div><div class="axe-fund-ledger-action">${editControl}</div></article>`;
}

function renderFundWeekly(state) {
  const rows=state.fundMonthlyRows||[]; const [y,m]=state.fundWeeklyMonth.split('-'); const fee=state.fundWeeklyFee || state.fundSnapshot?.fee_rules?.[0]?.weekly_fee || 0;
  return `<section class="axe-fund-card axe-fund-subview axe-fund-subview--weekly"><header class="axe-fund-card-head axe-fund-card-head--weekly"><div><h2>${y}년 ${Number(m)}월 납부 현황</h2><p>주간 공금 ${money(fee)} · 과거 월을 선택해 납부 이력을 확인할 수 있습니다.</p></div><div class="axe-fund-week-actions"><select class="axe-fund-select axe-fund-month-select" data-fund-weekly-month>${monthOptions(state.fundWeeklyMonth,12)}</select><span class="axe-fund-chip ${state.fundWeeklyMonth===state.currentMonth?'':'is-history'}">${state.fundWeeklyMonth===state.currentMonth?'현재 월':'과거 내역'}</span></div></header><div class="axe-fund-week-scroll"><div class="axe-fund-week-grid"><div class="axe-fund-week-row axe-fund-week-row--head"><span>멤버</span>${[1,2,3,4,5].map(n=>`<b>${n}주</b>`).join('')}</div>${state.fundWeeklyLoading?'<div class="runtime-inline-loading">납부 현황을 불러오는 중…</div>':rows.length?rows.map(r=>`<div class="axe-fund-week-row"><span><strong>${esc(r.name)}</strong><small>${esc(r.role)}</small></span>${r.weeks.map(s=>`<b class="${weekClass(s)}" title="${esc(s)}">${weekSymbol(s)}</b>`).join('')}</div>`).join(''):'<div class="runtime-inline-loading">해당 월의 납부 기록이 없습니다.</div>'}</div></div></section>`;
}
function weekClass(v){return ({'완료':'is-ok','미납':'is-bad','면제':'is-skip','검수대기':'is-pending','보류':'is-pending','예정':'is-future','가입 전':'is-future'})[v]||'is-future';} function weekSymbol(v){return ({'완료':'✓','미납':'×','면제':'–','검수대기':'•','보류':'•','예정':'·','가입 전':'·'})[v]||'·';}

function renderFundReview(state) {
  const open=(state.fundRequests||[]).filter(r=>['pending','hold'].includes(r.status));
  return `<section class="axe-fund-card axe-fund-subview axe-fund-subview--review"><header class="axe-fund-card-head"><div><h2>납부 검수</h2><p>Discord에서 제출된 주간 공금 납부 신청만 검수합니다.</p></div></header><div class="axe-fund-review-list">${open.length?open.map(r=>`<article class="axe-fund-review-row"><div class="axe-fund-person"><div><strong>${esc(r.member_display_name||'멤버')}</strong><small>${esc(r.year)}년 ${esc(r.month)}월 ${esc(r.week)}주차 · ${money(r.amount)} · ${esc(r.payment_mode||'')}</small></div></div><span class="axe-fund-review-state ${r.status==='hold'?'is-hold':''}">${r.status==='hold'?'보류':'대기'}</span>${r.evidence_path?`<button class="axe-fund-tool-button axe-fund-tool-button--compact" data-action="open-evidence" data-evidence-path="${esc(r.evidence_path)}">증빙 보기</button>`:'<span></span>'}<div class="axe-fund-review-actions"><button data-action="fund-review" data-request-id="${esc(r.request_id)}" data-review-action="approve">승인</button><button data-action="fund-review" data-request-id="${esc(r.request_id)}" data-review-action="hold">보류</button><button class="danger" data-action="fund-review" data-request-id="${esc(r.request_id)}" data-review-action="reject">반려</button></div></article>`).join(''):empty('현재 검수할 납부 신청이 없습니다.')}</div></section>`;
}
function renderFundBalance(state) {
  const current=Number(state.fundSnapshot?.balance?.public||0); const check=state.companySettings?.settings?.fund_balance_check||{}; const diff=check.game_balance==null?null:Number(check.game_balance)-current;
  return `<div class="axe-fund-subview axe-fund-subview--balance axe-fund-balance-layout"><section class="axe-fund-card"><header class="axe-fund-card-head"><div><h2>공용계좌 잔액 점검</h2><p>웹 계산 잔액과 게임 내 실제 잔액을 비교합니다.</p></div></header><form class="axe-fund-form-stack" data-form="fund-balance"><label class="axe-fund-field"><span>웹 계산 잔액</span><input value="${money(current)}" disabled></label><label class="axe-fund-field"><span>게임 내 공용계좌 잔액</span><input name="game_balance" type="number" value="${esc(check.game_balance??'')}" placeholder="현재 잔액 입력"></label><label class="axe-fund-field"><span>메모</span><textarea name="note" placeholder="차이가 있다면 이유를 적어주세요.">${esc(check.note||'')}</textarea></label><div class="axe-fund-form-actions"><button class="axe-fund-primary" type="submit">점검 저장</button></div></form></section><section class="axe-fund-card axe-fund-card--compact"><header class="axe-fund-card-head"><div><h2>최근 점검</h2><p>${check.checked_at?fmtDate(check.checked_at,true):'아직 점검 기록이 없습니다.'}</p></div>${diff===0?'<span class="axe-fund-status axe-fund-status--ok">일치</span>':''}</header><dl class="axe-fund-kv"><div><dt>웹 계산 잔액</dt><dd>${money(current)}</dd></div><div><dt>게임 내 잔액</dt><dd>${check.game_balance==null?'—':money(check.game_balance)}</dd></div><div><dt>차액</dt><dd class="${diff===0?'is-income':diff==null?'':'is-expense'}">${diff==null?'—':signedMoney(diff)}</dd></div></dl></section></div>`;
}
function renderFundSettings(state){
  const rule=(state.fundSnapshot?.fee_rules||[]).find(r=>r.enabled)||(state.fundSnapshot?.fee_rules||[])[0]||{};
  const selectedMonth=state.fundMonth||state.currentMonth;
  const [y,m]=selectedMonth.split('-');
  const defaultAccount=state.companySettings?.settings?.fund_default_account||'공용계좌';
  const selectedWeek=Number(rule.week||rule.start_week||1);
  return `<section class="axe-fund-card axe-fund-subview axe-fund-subview--settings">
    <header class="axe-fund-card-head"><div><h2>공금 설정</h2><p>월별 주간 공금 기준과 기본 등록 계좌를 관리합니다.</p></div></header>
    <form class="axe-fund-settings-list" data-form="fund-fee-rule">
      <div class="axe-fund-setting">
        <div><strong>적용 월</strong><span>공금 기준을 적용할 월을 선택</span></div>
        <select class="axe-fund-select axe-fund-select--month" name="fee_month" data-fund-ledger-month>${monthOptionsAround(selectedMonth,6,6)}</select>
      </div>
      <div class="axe-fund-setting">
        <div><strong>주간 공금 기준</strong><span>선택한 주차부터 적용되는 납부 금액</span></div>
        <div class="runtime-fee-controls">
          <select class="axe-fund-select axe-fund-select--week" name="week">${[1,2,3,4,5].map(n=>`<option value="${n}" ${selectedWeek===n?'selected':''}>${n}주차부터</option>`).join('')}</select>
          <div class="axe-fund-money-control"><input name="weekly_fee" type="number" min="0" step="1000" value="${esc(rule.weekly_fee||0)}"><span>원</span></div>
        </div>
      </div>
      <div class="axe-fund-setting">
        <div><strong>납부 대상</strong><span>활동 중인 멤버를 기본 포함</span></div>
        <button type="button" class="axe-fund-tool-button axe-fund-tool-button--compact" data-page="members">멤버 관리</button>
      </div>
      <div class="axe-fund-setting">
        <div><strong>기본 계좌</strong><span>직접 수입·지출 등록 시 기본값</span></div>
        <select class="axe-fund-select axe-fund-select--account" name="default_account"><option ${defaultAccount==='공용계좌'?'selected':''}>공용계좌</option><option ${defaultAccount==='회사잔고'?'selected':''}>회사잔고</option></select>
      </div>
      <div class="runtime-settings-save"><button class="axe-fund-primary axe-fund-primary--settings" type="submit">공금 설정 저장</button></div>
    </form>
  </section>`;
}

function renderMembers(state){
  const all=state.memberships||[];
  const active=all.filter(m=>m.status==='active');
  const left=all.filter(m=>m.status==='left');
  const admins=active.filter(m=>['owner','admin'].includes(m.role));
  let rows=all.filter(m=>state.memberFilter==='active'?m.status==='active':state.memberFilter==='left'?m.status==='left':true);
  if(state.memberRole) rows=rows.filter(m=>m.role===state.memberRole);
  const q=(state.memberQuery||'').toLowerCase();
  if(q) rows=rows.filter(m=>`${m.display_name||''} ${m.discord_display_name||''} ${m.alias_name||''} ${ROLE_KO[m.role]||m.role||''} ${memberStatus(m.status)||''}`.toLowerCase().includes(q));
  const memberRows=rows.length?rows.map(m=>{
    const hire=m.employment_started_on?fmtDate(m.employment_started_on,true):'미설정';
    return `<article class="ops-lane-row ops-lane-row--member">
      <div class="ops-lane-cell ops-lane-copy"><strong>${esc(m.display_name||'멤버')}</strong><span>${m.alias_name?'회사 별칭 사용':'Discord 표시명'}</span></div>
      <div class="ops-lane-cell"><span class="ops-lane-value">${esc(ROLE_KO[m.role]||m.role)}</span></div>
      <div class="ops-lane-cell"><span class="ops-lane-value ${hire==='미설정'?'is-muted':''}">${esc(hire)}</span></div>
      <div class="ops-lane-cell is-center"><span class="ops-mgmt-badge ${m.status==='active'?'is-green':m.status==='left'?'is-red':'is-amber'}">${memberStatus(m.status)}</span></div>
      <div class="ops-lane-cell is-center"><button class="ops-mgmt-action" data-action="edit-member" data-membership-id="${esc(m.id)}">상세</button></div>
    </article>`;
  }).join(''):empty('조건에 맞는 멤버가 없습니다.');
  return `<div class="ops-mgmt-page ops-mgmt-page--members">${pageHeader('MEMBERS','멤버 관리','회사 구성원의 역할·활동 상태·실제 입사일을 관리합니다.','')}${summary([['전체 멤버',`${all.length}명`,'누적 등록',''],['활동 중',`${active.length}명`,'현재 회사','is-positive'],['관리 권한',`${admins.length}명`,'대표 · 관리자','is-warning'],['퇴사',`${left.length}명`,'기록 유지','']])}<div class="ops-mgmt-workspace"><div class="ops-mgmt-section-head ops-mgmt-section-head--solo"><div><strong>멤버 현황</strong><span>멤버 등록은 Discord에서 대상 우클릭 → 앱 → AXE 멤버 등록으로 처리합니다.</span></div></div><section class="ops-mgmt-board"><div class="ops-mgmt-toolbar"><div class="ops-mgmt-segments">${segment(state,'all','전체',all.length)}${segment(state,'active','활동',active.length)}${segment(state,'left','퇴사',left.length,true)}</div><div class="ops-mgmt-filters"><select class="ops-mgmt-select" data-member-role><option value="">역할 전체</option>${['owner','admin','manager','member'].map(r=>`<option value="${r}" ${state.memberRole===r?'selected':''}>${ROLE_KO[r]}</option>`).join('')}</select><label class="ops-mgmt-search">${icon('search')}<input data-member-query value="${esc(state.memberQuery||'')}" placeholder="이름 · 별칭 · 역할 검색" autocomplete="off"></label></div></div><div class="ops-mgmt-meta"><span><strong>${rows.length}</strong>명 표시</span><span>활동 상태 · 역할 기준</span></div><div class="ops-lane-head ops-lane-head--member"><span>이름</span><span>역할</span><span>입사일</span><span>상태</span><span>관리</span></div><div class="ops-mgmt-list">${memberRows}</div></section></div></div>`;
}
function segment(state,key,label,count,left=false){ return `<button class="${state.memberFilter===key?'is-active':''} ${left?'is-left':''}" data-member-filter="${key}">${label}<em>${count}</em></button>`; } function memberStatus(v){return ({active:'활동',left:'퇴사',suspended:'중지',invited:'초대'})[v]||v;}

// ============================================================
// ASSETS
// ============================================================
function renderAssets(state){
  const snap=state.assetsSnapshot||{}; const assets=snap.assets||[]; const returns=snap.returns||[];
  const assigned=assets.filter(a=>a.membership_id).length; const unassigned=assets.filter(a=>!a.membership_id).length;
  return `<div class="ops-mgmt-page ops-mgmt-page--assets ${state.assetTab==='returns'?'is-returns':'is-assets'}">${pageHeader('ASSETS','자산 관리','회사 자산의 배정 상태와 반납 이력을 빠르게 확인합니다.','')}${summary([['전체 자산',`${assets.length}개`,'등록 자산',''],['사용 중',`${assigned}개`,'멤버 배정','is-positive'],['미배정',`${unassigned}개`,'배정 필요','is-warning'],['반납 기록',`${returns.length}건`,'이력 보존','']])}<div class="ops-mgmt-tabs-row"><div class="ops-dense-tabs"><button class="${state.assetTab==='assets'?'is-active':''}" data-asset-tab="assets">자산 현황</button><button class="${state.assetTab==='returns'?'is-active':''}" data-asset-tab="returns">반납 내역</button></div><button class="ops-action-primary" data-action="open-asset">${icon('plus')}<span>자산 추가</span></button></div>${state.assetTab==='returns'?renderReturns(state):renderAssetBoard(state)}</div>`;
}
function renderAssetBoard(state){
  let rows=(state.assetsSnapshot?.assets||[]).slice();
  const q=(state.assetQuery||'').toLowerCase();
  if(state.assetCategory)rows=rows.filter(a=>a.asset_category===state.assetCategory);
  if(state.assetStatus)rows=rows.filter(a=>(a.membership_id?'사용중':'미배정')===state.assetStatus);
  if(q)rows=rows.filter(a=>`${a.asset_name||''} ${a.owner_name||''} ${a.asset_category||''}`.toLowerCase().includes(q));
  const cats=[...new Set((state.assetsSnapshot?.assets||[]).map(a=>a.asset_category).filter(Boolean))];
  const body=rows.length?rows.map(a=>`<article class="ops-lane-row ops-lane-row--asset"><div class="ops-lane-cell ops-lane-copy"><strong>${esc(a.owner_name||'미배정')}</strong><span>${a.membership_id?'현재 보유자':'배정 대기'}</span></div><div class="ops-lane-cell ops-lane-copy"><strong>${esc(a.asset_name)}</strong><span>${esc(a.acquisition_method||'회사 자산')}</span></div><div class="ops-lane-cell"><span class="ops-lane-value">${esc(a.asset_category||'기타')}</span></div><div class="ops-lane-cell is-center"><span class="ops-mgmt-badge ${a.membership_id?'is-green':'is-amber'}">${a.membership_id?'사용중':'미배정'}</span></div><div class="ops-lane-cell is-center"><button class="ops-mgmt-action ${a.membership_id?'':'is-assign'}" data-action="edit-asset" data-asset-id="${esc(a.id)}">${a.membership_id?'상세':'배정'}</button></div></article>`).join(''):empty('조건에 맞는 자산이 없습니다.');
  return `<section class="ops-mgmt-board"><div class="ops-mgmt-toolbar"><div class="ops-mgmt-filters"><label class="ops-mgmt-search">${icon('search')}<input data-asset-query value="${esc(state.assetQuery||'')}" placeholder="자산명 · 보유자 검색"></label><select class="ops-mgmt-select" data-asset-category><option value="">분류 전체</option>${cats.map(c=>`<option ${state.assetCategory===c?'selected':''}>${esc(c)}</option>`).join('')}</select><select class="ops-mgmt-select" data-asset-status><option value="">상태 전체</option><option ${state.assetStatus==='사용중'?'selected':''}>사용중</option><option ${state.assetStatus==='미배정'?'selected':''}>미배정</option></select></div></div><div class="ops-mgmt-meta"><span><strong>${rows.length}</strong>개 표시</span><span>퇴사자 자산은 자동 미배정</span></div><div class="ops-lane-head ops-lane-head--asset"><span>보유자</span><span>자산</span><span>분류</span><span>상태</span><span>관리</span></div><div class="ops-mgmt-list">${body}</div></section>`;
}
function renderReturns(state){
  const rows=state.assetsSnapshot?.returns||[];
  const body=rows.length?rows.map(r=>`<article class="ops-lane-row ops-lane-row--return"><div class="ops-lane-cell ops-lane-copy"><strong>${esc(r.asset_name)}</strong><span>이전 보유자 ${esc(r.owner_name)}</span></div><div class="ops-lane-cell ops-lane-copy"><strong>${r.note?'수동 반납':'반납 처리'}</strong><span>${esc(r.note||'기록 보존')}</span></div><div class="ops-lane-cell ops-lane-copy"><strong>${esc(r.checker_name||'SYSTEM')}</strong><span>${esc(r.processed_at||fmtDate(r.created_at,true))}</span></div></article>`).join(''):empty('반납 기록이 없습니다.');
  return `<section class="ops-mgmt-board"><div class="ops-mgmt-board-head"><div><h2>반납 내역</h2><p>퇴사 자동반납과 수동 반납 이력을 기록으로 보존합니다.</p></div><span>${rows.length}건</span></div><div class="ops-lane-head ops-lane-head--return"><span>자산</span><span>처리</span><span>확인자</span></div><div class="ops-mgmt-list">${body}</div></section>`;
}

// ============================================================
// ACCOUNTS
// ============================================================
function accountRecords(state){ const snap=state.accountsSnapshot||{}; const reqs=snap.requests||[]; return (snap.accounts||[]).filter(a=>a.member_status==='active').map(a=>{ const pending=reqs.find(r=>r.membership_id===a.membership_id&&r.status==='pending'); return {...a,pending,status:pending?(a.account?'변경 대기':'등록 대기'):a.account&&a.enabled?'승인':'미등록'};}); }
function renderAccounts(state){
  const records=accountRecords(state); const approved=records.filter(r=>r.status==='승인').length; const pending=records.filter(r=>['변경 대기','등록 대기'].includes(r.status)); const missing=records.filter(r=>r.status==='미등록').length;
  let rows=records.slice(); if(state.accountStatus)rows=rows.filter(r=>r.status===state.accountStatus);
  const q=(state.accountQuery||'').toLowerCase(); if(q)rows=rows.filter(r=>`${r.display_name} ${r.account||''}`.toLowerCase().includes(q));
  const my=currentMembership(state); const myRow=records.find(r=>r.membership_id===my?.id);
  const body=rows.length?rows.map(r=>`<article class="ops-lane-row ops-lane-row--account ${r.pending?'is-attention':''}"><div class="ops-lane-cell ops-lane-copy"><strong>${esc(r.display_name)}</strong><span>${esc(ROLE_KO[r.role]||r.role)}</span></div><div class="ops-lane-cell"><span class="ops-lane-value ${r.account?'':'is-muted'}">${r.account?esc(r.account):'등록된 계좌 없음'}</span></div><div class="ops-lane-cell is-center">${accountBadge(r.status)}</div><div class="ops-lane-cell is-center"><button class="ops-mgmt-action" ${r.pending?`data-action="account-review" data-request-id="${esc(r.pending.id)}" data-review-action="approve"`:'disabled'}>${r.pending?'검수':'—'}</button></div></article>`).join(''):empty('조건에 맞는 계좌가 없습니다.');
  return `<div class="ops-mgmt-page ops-mgmt-page--accounts">${pageHeader('ACCOUNTS','계좌 관리','멤버별 플리카 계좌 등록 상태와 변경 신청을 별도로 관리합니다.','')}${summary([['전체 대상',`${records.length}명`,'활동 멤버',''],['등록 완료',`${approved}명`,'승인 계좌','is-positive'],['검수 필요',`${pending.length}건`,'등록 · 변경','is-warning'],['미등록',`${missing}명`,'등록 필요','is-negative']])}<div class="ops-mgmt-workspace"><div class="ops-mgmt-section-head"><div><strong>계좌 현황</strong><span>등록 상태와 변경 요청을 한곳에서 확인합니다.</span></div><button class="ops-action-secondary" data-action="open-account-request">${icon('accounts')}<span>${myRow?.account?'내 계좌 변경':'내 계좌 등록'}</span></button></div>${pending.length?`<section class="ops-account-review"><div class="ops-account-review-head"><div><strong>검수 필요</strong><span>등록·변경 요청을 우선 처리합니다.</span></div><em>${pending.length}</em></div>${pending.map(r=>`<article><div><strong>${esc(r.display_name)}</strong><span>${esc(r.status)} · ${esc(r.pending?.account||'')}</span></div><span class="ops-mgmt-badge is-amber">${esc(r.status)}</span><div class="ops-account-review-actions"><button data-action="account-review" data-request-id="${esc(r.pending.id)}" data-review-action="reject">반려</button><button class="is-primary" data-action="account-review" data-request-id="${esc(r.pending.id)}" data-review-action="approve">승인</button></div></article>`).join('')}</section>`:''}<section class="ops-mgmt-board"><div class="ops-mgmt-toolbar"><div class="ops-mgmt-filters"><label class="ops-mgmt-search">${icon('search')}<input data-account-query value="${esc(state.accountQuery||'')}" placeholder="멤버 · 계좌 검색"></label><select class="ops-mgmt-select" data-account-status><option value="">상태 전체</option>${['승인','등록 대기','변경 대기','미등록'].map(v=>`<option ${state.accountStatus===v?'selected':''}>${v}</option>`).join('')}</select></div><span class="ops-mgmt-toolbar-note">계좌 변경은 신청 → 검수 방식</span></div><div class="ops-mgmt-meta"><span><strong>${rows.length}</strong>명 표시</span><span>활동 멤버 기준</span></div><div class="ops-lane-head ops-lane-head--account"><span>이름</span><span>계좌번호</span><span>상태</span><span>관리</span></div><div class="ops-mgmt-list">${body}</div></section></div></div>`;
}
function accountBadge(v){ if(v==='승인')return '<span class="ops-mgmt-badge is-green">승인</span>'; if(v==='미등록')return '<span class="ops-mgmt-badge is-red">미등록</span>'; return `<span class="ops-mgmt-badge is-amber">${esc(v)}</span>`; }

// ============================================================
// SETTINGS
// ============================================================
const MODULE_ORDER = ['fund','ammo','outlaw','modbook','cooking','assets'];
const MODULE_UI = {
  fund:{name:'공금',desc:'납부 현황 · 검수 · 공금 관리',channels:[['status_channel_id','공금 현황 채널']]},
  ammo:{name:'총알',desc:'3시 · 10시 주문 / 제작 / 배분',channels:[['three_channel_id','3시 채널'],['ten_channel_id','10시 채널']]},
  outlaw:{name:'무법지대 전적',desc:'스크린샷 OCR · 랭킹 · 기록',channels:[['record_channel_id','전적 등록 채널']]},
  modbook:{name:'개조서',desc:'조회 · 등록 신청 · 검수',channels:[]},
  cooking:{name:'요리 주문',desc:'주문 · 변경 · 영업 관리',channels:[['order_channel_id','요리 주문 채널']]},
  assets:{name:'자산 · 계좌 관리',desc:'회사 자산 · 반납 · 멤버 계좌 관리',channels:[]},
};
function settingsSaveLabel(state,resetBusy,catalogPending=false){
  if(resetBusy)return '정리 중';
  if(catalogPending&&state.settingsTab==='basic')return '정보 불러오는 중';
  const phase=String(state.onboardingStatus?.status||''); const step=String(state.onboardingStatus?.current_step||'');
  if(phase==='onboarding'&&state.settingsTab==='basic'&&step==='roles')return '저장하고 다음';
  if(phase==='onboarding'&&state.settingsTab==='modules'&&step==='modules')return '설정 완료';
  return '설정 저장';
}
function renderSettings(state){
  const visibleModules=(state.modules||[]).filter(m=>MODULE_UI[m.module_key]).sort((a,b)=>MODULE_ORDER.indexOf(a.module_key)-MODULE_ORDER.indexOf(b.module_key));
  const enabled=visibleModules.filter(m=>m.enabled).length; const channels=(state.discordChannels||[]).filter(c=>c.is_text_based); const roles=(state.discordRoles||[]).filter(r=>!r.managed&&r.role_name!=='@everyone');
  const resetBusy=['reset_requested','resetting'].includes(String(state.onboardingStatus?.status||'')); const catalogPending=state.discordConnection?.status==='connected'&&state.onboardingStatus?.catalog_ready===false;
  const saveLabel=settingsSaveLabel(state,resetBusy,catalogPending); const cookingAvailable=Boolean(moduleRow(state,'cooking')); const cookingTab=state.settingsTab==='cooking'&&cookingAvailable;
  const tabs=`<nav class="ops-settings-tabs ${cookingAvailable?'has-cooking':''}" aria-label="회사 설정 하위 메뉴"><button class="${state.settingsTab==='basic'?'is-active':''}" data-settings-tab="basic"><strong>기본 정보</strong><span>회사·Discord 공통 값</span></button><button class="${state.settingsTab==='modules'?'is-active':''}" data-settings-tab="modules" ${catalogPending?'disabled':''}><strong>기능 설정</strong><span>기능별 채널 · 사용 여부</span></button>${cookingAvailable?`<button class="${cookingTab?'is-active':''}" data-settings-tab="cooking"><strong>요리 메뉴</strong><span>회사별 주문 품목 · 가격</span></button>`:''}</nav>`;
  const action=cookingTab?'':`<button class="ops-settings-save-action" form="settings-active-form" type="submit" ${resetBusy||(catalogPending&&state.settingsTab==='basic')?'disabled':''}>${icon('save')}<span>${esc(saveLabel)}</span></button>`;
  const view=cookingTab?renderCookingMenuSettings(state):state.settingsTab==='modules'?renderModuleSettings(state,channels):renderBasicSettings(state,roles,catalogPending);
  const previewAction=`<button type="button" class="ops-setup-demo-launch" data-action="open-setup-demo"><span>GUIDED SETUP</span><strong>초기설정 체험</strong></button>`; return `<div class="ops-settings-page">${pageHeader('COMPANY SETTINGS','회사 설정','회사 기본 정보와 Discord 기능 연결을 관리합니다.',previewAction)}<section class="ops-settings-overview"><article><span>현재 회사</span><strong>${esc(companyDisplayName(state))}</strong><small>회사 단위 설정</small></article><article><span>Discord</span><strong class="${state.discordConnection?.status==='connected'?'is-positive':''}">${resetBusy?'정리 중':state.discordConnection?.status==='connected'?'연결됨':'미연결'}</strong><small>${esc(state.discordConnection?.guild_name||'연결 필요')}</small></article><article><span>사용 기능</span><strong class="is-warning">${enabled} / ${visibleModules.length}</strong><small>활성 기능</small></article><article><span>관리 역할</span><strong>${esc(roleName(state.discordCompanyConfig?.admin_role_id,roles)||'미설정')}</strong><small>Discord 관리자 역할</small></article></section>${renderOnboardingProgress(state)}<div class="ops-settings-nav-row">${tabs}${action}</div><div class="ops-settings-view">${view}</div></div>`;
}

function renderCookingMenuSettings(state){
  const rows=[...(state.cookingOrderTypes||[])].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.type_key).localeCompare(String(b.type_key)));
  const admin=canAdmin(state); const active=rows.filter(x=>x.enabled!==false).length; const config=state.cookingDiscordConfig||null;
  const guideDisabled=!admin||!config;
  const guideHint=config?'Discord 안내판에 표시되는 문구입니다. 저장 후 BOT이 자동으로 갱신합니다.':'Discord 요리 주문 채널을 먼저 설정하면 안내 문구를 편집할 수 있습니다.';
  const guide=`<form data-form="cooking-guide" class="ops-cooking-guide-card"><div class="ops-cooking-guide-head"><div><strong>Discord 주문 안내</strong><span>${esc(guideHint)}</span></div><button type="submit" class="ops-compact-save" ${guideDisabled?'disabled':''}>${icon('save')}<span>안내 저장</span></button></div><div class="ops-cooking-guide-grid ops-cooking-guide-grid--simple"><label><span>정기 주문일</span><input name="schedule_text" maxlength="200" value="${esc(config?.schedule_text||'')}" placeholder="예: 매주 화요일 / 목요일 / 토요일" ${guideDisabled?'disabled':''}></label><label><span>안내 문구</span><textarea name="extra_guide" maxlength="1000" rows="1" placeholder="예: 주문 전 확인할 내용이나 재료 관련 안내" ${guideDisabled?'disabled':''}>${esc(config?.extra_guide||'')}</textarea></label></div></form>`;
  const menuRows=rows.length?rows.map(row=>`<article class="ops-cooking-menu-row ${row.enabled===false?'is-disabled':''}"><div class="ops-cooking-menu-main"><strong>${esc(row.label||row.type_key)}</strong><span>${esc(row.short_label||row.label||row.type_key)}${row.detail?` · ${esc(row.detail)}`:''}</span></div><div class="ops-cooking-menu-price"><strong>${money(Number(row.price_per_set||0))}</strong><span>SET당</span></div><div class="ops-cooking-menu-order"><strong>${Number(row.sort_order||0)}</strong><span>순서</span></div><button type="button" class="runtime-power ${row.enabled===false?'is-off':'is-on'}" data-action="toggle-cooking-menu" data-type-key="${esc(row.type_key)}" ${!admin?'disabled':''}>${icon('power')}<span>${row.enabled===false?'OFF':'ON'}</span></button><button type="button" class="ops-mgmt-action" data-action="edit-cooking-menu" data-type-key="${esc(row.type_key)}" ${!admin?'disabled':''}>수정</button></article>`).join(''):`<div class="ops-cooking-menu-empty"><strong>등록된 요리 메뉴가 없습니다.</strong><span>${admin?'오른쪽 메뉴 추가 버튼으로 첫 주문 품목을 등록해 주세요.':'회사 관리자가 메뉴를 등록하면 여기에 표시됩니다.'}</span></div>`;
  return `<div class="ops-cooking-settings">${guide}<section class="ops-settings-board ops-cooking-menu-board"><div class="ops-settings-board-head ops-cooking-menu-head"><div><h2>요리 주문 메뉴</h2><p>활성 메뉴만 Discord 주문창에 표시됩니다.</p></div><div class="ops-cooking-menu-tools"><span class="ops-cooking-menu-count"><strong>${active}</strong> / ${rows.length} 사용 중</span><button type="button" class="ops-cooking-add" data-action="open-cooking-menu" ${!admin?'disabled':''}>${icon('plus')}<span>메뉴 추가</span></button></div></div><div class="ops-cooking-menu-list">${menuRows}</div><div class="ops-settings-module-foot"><strong>BOT 자동 반영</strong><span>안내와 메뉴 변경은 다음 요리 snapshot부터 Discord에 반영됩니다.</span></div></section></div>`;
}

function renderOnboardingProgress(state){
  const status=state.onboardingStatus||{}; const current=String(status.current_step||'discord'); const phase=String(status.status||'onboarding');
  if(phase==='error')return `<section class="ops-onboarding-strip is-error"><div><strong>Discord 연결 정리에 실패했습니다.</strong><span>${esc(status.last_error||'잠시 후 다시 시도해 주세요.')}</span></div></section>`;
  if(['reset_requested','resetting'].includes(phase))return `<section class="ops-onboarding-strip is-resetting"><div class="ops-onboarding-spinner"></div><div><strong>기존 Discord 연결을 안전하게 정리 중입니다.</strong><span>패널과 Discord 설정만 정리하며 공금·멤버·자산·주문·전적 데이터는 보존됩니다.</span></div></section>`;
  const catalogPending=status.discord_connected===true&&status.catalog_ready===false;
  const catalogStrip=catalogPending?`<section class="ops-onboarding-strip is-catalog"><div class="ops-onboarding-spinner"></div><div><strong>Discord 역할·채널 정보를 불러오는 중입니다.</strong><span>연결은 완료됐습니다. 목록 동기화가 끝나면 역할 선택이 자동으로 활성화됩니다.</span></div></section>`:'';
  const order=['discord','roles','modules','complete']; const activeIndex=Math.max(0,order.indexOf(current)); const labels=[['discord','1','Discord 서버'],['roles','2','역할'],['modules','3','기능 · 채널'],['complete','✓','완료']];
  const guide=phase==='ready'?'현재 회사의 Discord 연결과 필수 설정이 준비됐습니다.':current==='roles'?'역할을 선택한 뒤 기능 설정으로 이동하면 현재 입력값이 자동 저장됩니다.':current==='modules'?'기능과 채널을 설정한 뒤 설정 완료를 누르면 초기 설정이 끝납니다.':'순서대로 설정하면 같은 화면에서 바로 운영을 시작할 수 있습니다.';
  return `${catalogStrip}<section class="ops-onboarding-progress"><div class="ops-onboarding-progress__copy"><strong>${phase==='ready'?'초기 설정 완료':'초기 설정'}</strong><span>${esc(guide)}</span></div><div class="ops-onboarding-steps">${labels.map(([key,no,label],i)=>`<span class="${i<activeIndex||phase==='ready'?'is-done':i===activeIndex?'is-current':''}"><b>${i<activeIndex||phase==='ready'?'✓':no}</b>${label}</span>`).join('')}</div></section>`;
}
function roleName(id,roles){return roles.find(r=>r.role_id===id)?.role_name||'';}
function renderBasicSettings(state,roles,catalogPending=false){ const cfg=state.discordCompanyConfig||{}; const connected=state.discordConnection?.status==='connected'; const resetBusy=['reset_requested','resetting'].includes(String(state.onboardingStatus?.status||'')); const discordAction=resetBusy?'':connected?'open-discord-reconnect':'connect-discord'; const discordLabel=resetBusy?'정리 중':connected?'다시 설정':'연결'; const roleDisabled=resetBusy||!connected||catalogPending; const emptyRoleLabel=catalogPending?'Discord 정보 불러오는 중...':'선택 안 함'; return `<form id="settings-active-form" data-form="settings-basic" class="ops-settings-board ops-settings-basic"><div class="ops-settings-board-head"><div><h2>기본 정보</h2><p>공유 운영 콘솔에서 사용하는 회사명과 Discord 역할을 관리합니다.</p></div></div>${settingRow('회사 이름','AXE PRODUCT와 Discord에서 동일하게 사용하는 회사명',`<input name="company_name" maxlength="80" value="${esc(companyDisplayName(state))}" ${resetBusy?'disabled':''}>`,'company')}${settingRow('관리자 역할','공금 · 멤버 · 자산 · 설정 관리',`<select name="admin_role_id" ${roleDisabled?'disabled':''}><option value="">${emptyRoleLabel}</option>${roles.map(r=>`<option value="${esc(r.role_id)}" ${cfg.admin_role_id===r.role_id?'selected':''}>${esc(r.role_name)}</option>`).join('')}</select>`,'role')}${settingRow('일반 멤버 역할','회사 기능을 사용하는 일반 멤버',`<select name="member_role_id" ${roleDisabled?'disabled':''}><option value="">${emptyRoleLabel}</option>${roles.map(r=>`<option value="${esc(r.role_id)}" ${cfg.member_role_id===r.role_id?'selected':''}>${esc(r.role_name)}</option>`).join('')}</select>`,'role')}${settingRow('Discord 서버',connected?'현재 연결된 서버 · 필요하면 안전하게 다시 설정할 수 있습니다.':'BOT을 사용할 Discord 서버를 연결합니다.',`<div class="ops-settings-discord ${connected?'is-connected':'is-disconnected'} ${resetBusy?'is-busy':''}"><i></i><strong>${esc(state.discordConnection?.guild_name||'미연결')}</strong><button type="button" ${discordAction?`data-action="${discordAction}"`: 'disabled'}>${discordLabel}</button></div>`,'discord')}</form>`; }
function settingRow(title,desc,control,kind){return `<div class="ops-settings-row ops-settings-row--${kind}"><div><strong>${title}</strong><span>${desc}</span></div><div class="ops-settings-control">${control}</div></div>`;}
function renderModuleSettings(state,channels){ const visible=(state.modules||[]).filter(m=>MODULE_UI[m.module_key]).sort((a,b)=>MODULE_ORDER.indexOf(a.module_key)-MODULE_ORDER.indexOf(b.module_key)); const resetBusy=['reset_requested','resetting'].includes(String(state.onboardingStatus?.status||'')); return `<form id="settings-active-form" data-form="settings-modules" class="ops-settings-board ops-settings-modules"><div class="ops-settings-board-head"><div><h2>기능 설정</h2><p>기능 하나에서 사용 여부와 필요한 Discord 채널 설정까지 끝냅니다.</p></div><span><strong>${visible.filter(m=>m.enabled).length}</strong> / ${visible.length} 사용 중</span></div><div class="ops-settings-module-list runtime-module-list">${visible.map(m=>renderModuleRow(m,channels,resetBusy)).join('')}</div><div class="ops-settings-module-foot"><strong>BOT 자동 반영 연결됨</strong><span>저장한 기능·채널 설정은 STAGING BOT이 자동으로 반영하고 패널을 생성·갱신합니다.</span></div></form>`; }
function renderModuleRow(m,channels,disabled=false){ const ui=MODULE_UI[m.module_key]; const settings=m.settings||{}; const controls=ui.channels.length?`<div class="ops-settings-channels">${ui.channels.map(([key,label])=>`<label><span>${label}</span><select name="module_${m.module_key}_${key}" ${disabled?'disabled':''}><option value="">채널 선택</option>${channels.map(c=>`<option value="${esc(c.channel_id)}" ${settings[key]===c.channel_id?'selected':''}>#${esc(c.channel_name)}</option>`).join('')}</select></label>`).join('')}</div>`:'<div class="ops-settings-no-channel">별도 채널 설정 없음</div>'; return `<article class="ops-settings-module ops-settings-module--channels-${ui.channels.length} ${m.enabled?'is-enabled':''} ${disabled?'is-disabled':''}"><div class="ops-settings-module-copy"><strong>${esc(ui.name)}</strong><small>${esc(ui.desc)}</small></div>${controls}<button type="button" class="runtime-power ${m.enabled?'is-on':'is-off'}" data-action="toggle-module" data-module-key="${esc(m.module_key)}" ${disabled?'disabled':''}>${icon('power')}<span>${m.enabled?'ON':'OFF'}</span></button></article>`; }

function renderModal(state){ const m=state.modal; if(!m)return ''; if(m.type==='setup-demo')return setupGuidePreview(state); if(m.type==='feedback')return feedbackModal(state); if(m.type==='ledger')return ledgerModal(state,m); if(m.type==='member')return memberModal(state,m); if(m.type==='asset')return assetModal(state,m); if(m.type==='account')return accountModal(state); if(m.type==='create-company')return companyModal(); if(m.type==='discord-reconnect')return discordReconnectModal(state); if(m.type==='cooking-menu')return cookingMenuModal(state,m); return ''; }
function modalShell(title,desc,body,wide=false){return `<div class="runtime-modal-backdrop" data-modal-backdrop><section class="runtime-modal ${wide?'is-wide':''}" role="dialog" aria-modal="true"><header><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><button type="button" data-action="close-modal">×</button></header>${body}</section></div>`;}
function feedbackModal(state){return modalShell('피드백 · 제보','서비스 개선 제안이나 오류를 운영자에게 전달합니다.',`<form data-form="feedback" class="runtime-modal-form"><label>유형<select name="category"><option value="improvement">개선 제안</option><option value="bug">오류 제보</option><option value="other">기타</option></select></label><label>제목<input name="title" maxlength="120" required></label><label class="is-full">내용<textarea name="detail" maxlength="4000" required></textarea></label><label class="is-full">회신 Discord <small>선택</small><input name="contact" maxlength="160" placeholder="예: @닉네임"></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">보내기</button></footer></form>`);}
function ledgerModal(state,m){ const row=(state.fundSnapshot?.ledger||[]).find(r=>r.id===m.entryId)||{}; const direction=row.direction||'수입'; const account=row.account||state.companySettings?.settings?.fund_default_account||'공용계좌'; const actorId=row.id?(row.membership_id||''):(currentMembership(state)?.id||''); const actor=(state.memberships||[]).find(x=>x.id===actorId); const actorName=actor?.display_name||row.member_display_name||userDisplayName(state); return modalShell(row.id?'공금 내역 수정':'수입·지출 등록','등록자는 로그인한 관리자 기준으로 자동 기록됩니다.',`<form data-form="ledger" class="runtime-modal-form"><input type="hidden" name="entry_id" value="${esc(row.id||'')}"><input type="hidden" name="membership_id" value="${esc(actorId)}"><label>날짜<input name="ledger_date" type="date" value="${esc(row.ledger_date?dateKey(row.ledger_date):dateKey(new Date()))}" required></label><label>구분<select name="direction"><option ${direction==='수입'?'selected':''}>수입</option><option ${direction==='지출'?'selected':''}>지출</option></select></label><label>항목<input name="category" value="${esc(row.category||'')}" placeholder="예: 재료 구입" autocomplete="off" required></label><label>금액<input name="amount" type="number" min="1" value="${esc(Math.abs(Number(row.amount||0))||'')}" required></label><label>계좌<select name="account"><option ${account==='공용계좌'?'selected':''}>공용계좌</option><option ${account==='회사잔고'?'selected':''}>회사잔고</option></select></label><label>등록자<input value="${esc(actorName)}" readonly class="is-readonly"></label><label class="is-full">메모<textarea name="memo" placeholder="여러 사람이 관련된 내역이라면 여기에 기록해 주세요." autocomplete="off">${esc(row.memo||'')}</textarea></label><footer>${row.id?`<button type="button" class="runtime-btn-danger" data-action="cancel-ledger" data-entry-id="${esc(row.id)}">내역 취소</button>`:'<span></span>'}<div><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">${row.id?'수정 저장':'내역 등록'}</button></div></footer></form>`,true);}
function memberModal(state,m){
  const row=(state.memberships||[]).find(x=>x.id===m.membershipId);
  if(!row)return '';
  const discordName=row.discord_display_name||'';
  const alias=row.alias_name||'';
  const note=row.member_note||'';
  return modalShell('멤버 관리',row.display_name||discordName||'멤버',`<form data-form="member" class="runtime-modal-form member-profile-form" autocomplete="off">
    <input type="hidden" name="membership_id" value="${esc(row.id)}">
    <label class="member-profile-name-field"><span class="member-profile-label">Discord 표시명</span><input value="${esc(discordName||'아직 동기화되지 않음')}" readonly class="is-readonly" autocomplete="off"><small>해당 Discord 서버에서 확인된 이름입니다.</small></label>
    <label class="member-profile-name-field"><span class="member-profile-label">별칭 <em>선택</em></span><input name="alias_name" value="${esc(alias)}" placeholder="비우면 Discord 표시명 사용" maxlength="120" autocomplete="off"><small>회사에서 따로 부를 이름이 있을 때만 입력합니다.</small></label>
    <div class="member-profile-inline is-full">
      <label>역할<select name="role">${['owner','admin','manager','member'].map(r=>`<option value="${r}" ${row.role===r?'selected':''}>${ROLE_KO[r]}</option>`).join('')}</select></label>
      <label>상태<select name="status"><option value="active" ${row.status==='active'?'selected':''}>활동</option><option value="suspended" ${row.status==='suspended'?'selected':''}>중지</option><option value="left" ${row.status==='left'?'selected':''}>퇴사</option></select></label>
      <label>입사일<input name="employment_started_on" type="date" value="${esc(row.employment_started_on||'')}"></label>
    </div>
    <label class="is-full">메모 <small>선택</small><textarea name="member_note" maxlength="1000" placeholder="업무 참고사항이나 내부 메모를 입력하세요." autocomplete="off">${esc(note)}</textarea><small>회사 내부 운영 참고용 메모입니다.</small></label>
    <footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">저장</button></footer>
  </form>`);
}
function assetModal(state,m){ const row=(state.assetsSnapshot?.assets||[]).find(x=>x.id===m.assetId)||{}; const status=row.membership_id?'보유':'미배정'; return modalShell(row.id?(row.membership_id?'자산 수정':'자산 배정'):'자산 추가','보유자와 상태를 운영 흐름에 맞게 관리합니다.',`<form data-form="asset" class="runtime-modal-form"><input type="hidden" name="asset_id" value="${esc(row.id||'')}"><label>자산명<input name="asset_name" value="${esc(row.asset_name||'')}" required></label><label>분류<input name="asset_category" value="${esc(row.asset_category||'기타')}" required></label><label>보유자<select name="membership_id" data-asset-holder><option value="">미배정</option>${(state.assetsSnapshot?.members||[]).filter(x=>x.status==='active').map(x=>`<option value="${esc(x.id)}" ${row.membership_id===x.id?'selected':''}>${esc(x.display_name)}</option>`).join('')}</select></label><label>상태<select name="status" data-asset-modal-status><option value="보유" ${status==='보유'?'selected':''}>보유</option><option value="미배정" ${status==='미배정'?'selected':''}>미배정</option></select></label><label class="is-full">취득 방식<input name="acquisition_method" value="${esc(row.acquisition_method||'')}" placeholder="선택"></label><label class="is-full">메모<textarea name="note">${esc(row.note||'')}</textarea></label><div class="runtime-modal-hint is-full">퇴사 처리된 멤버의 자산은 자동으로 미배정됩니다. 미배정 자산은 여기서 다른 활동 멤버에게 바로 배정할 수 있습니다.</div><footer>${row.id&&row.membership_id?`<button type="button" class="runtime-btn-danger" data-action="return-asset" data-asset-id="${esc(row.id)}">반납 처리</button>`:'<span></span>'}<div><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">저장</button></div></footer></form>`,true);}
function accountModal(state){ const mine=accountRecords(state).find(r=>r.membership_id===currentMembership(state)?.id); return modalShell(mine?.account?'내 계좌 변경 신청':'내 계좌 등록 신청','계좌 변경은 관리자 검수 후 반영됩니다.',`<form data-form="account-request" class="runtime-modal-form"><label class="is-full">플리카 계좌<input name="account" value="${esc(mine?.account||'')}" inputmode="numeric" maxlength="20" required></label><label class="is-full">메모<textarea name="note" placeholder="변경 사유 등"></textarea></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">신청 제출</button></footer></form>`);}
function companyModal(){ return modalShell('새 회사 시작','생성자는 OWNER가 됩니다.',`<form data-form="create-company" class="runtime-modal-form"><label>회사 이름<input name="name" maxlength="80" required></label><label>Slug <small>선택</small><input name="slug" maxlength="63"></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">회사 시작</button></footer></form>`);}

function setupGuidePreview(state){
  const demo=state.setupDemo||{}; const step=Math.max(0,Math.min(6,Number(demo.step||0))); const connected=Boolean(demo.connected);
  const steps=[['WELCOME','시작'],['DISCORD','서버 연결'],['ROLES','역할'],['MODULES','기능'],['CHANNELS','채널'],['MEMBERS','멤버'],['READY','완료']];
  const rail=steps.map(([k,label],i)=>`<button type="button" class="setup-demo-step ${i<step?'is-done':i===step?'is-current':''}" data-action="setup-demo-jump" data-step="${i}" ${i>step?'disabled':''}><b>${i<step?'✓':String(i+1).padStart(2,'0')}</b><span><small>${k}</small><strong>${label}</strong></span></button>`).join('');
  const modules=demo.modules||{};
  const moduleCard=(key,name,desc)=>`<button type="button" class="setup-demo-module ${modules[key]?'is-on':''}" data-action="setup-demo-toggle-module" data-module-key="${key}"><span class="setup-demo-check">${modules[key]?'✓':''}</span><div><strong>${name}</strong><small>${desc}</small></div><em>${modules[key]?'ON':'OFF'}</em></button>`;
  const channelSelect=(key,label,value)=>`<label class="setup-demo-field"><span>${label}</span><select data-setup-channel="${key}"><option value="#${key}" ${value===`#${key}`?'selected':''}>#${key}</option><option value="#운영-${key}" ${value===`#운영-${key}`?'selected':''}>#운영-${key}</option><option value="#axe-${key}" ${value===`#axe-${key}`?'selected':''}>#axe-${key}</option></select></label>`;
  const generated=demo.generatedChannels||{};
  const channelPlan=[];
  if(modules.fund)channelPlan.push(['fund','공금 관리','공금현황판',generated.fund||'공금현황판','공금현황판']);
  if(modules.ammo){channelPlan.push(['ammo3','총알 관리 · 3시','3시-총알',generated.ammo3||'3시-총알','3시']);channelPlan.push(['ammo10','총알 관리 · 10시','10시-총알',generated.ammo10||'10시-총알','10시']);}
  if(modules.outlaw)channelPlan.push(['outlaw','무법지대 전적','전적-등록',generated.outlaw||'전적-등록','전적 등록']);
  if(modules.cooking)channelPlan.push(['cooking','요리 주문','요리-주문',generated.cooking||'요리-주문','요리 주문']);
  const generatedRow=([key,label,placeholder,value,linkLabel])=>`<label class="setup-demo-create-row"><span class="setup-demo-create-copy"><strong>${label}</strong><small>생성 후 ${linkLabel} 기능에 자동 연결</small></span><span class="setup-demo-channel-input"><b>#</b><input type="text" maxlength="90" value="${esc(value)}" placeholder="${esc(placeholder)}" data-setup-generated-channel="${key}"></span><em>AUTO</em></label>`;

  const memberRole=demo.memberRole||'회사원'; const adminRole=demo.adminRole||'대표';
  const memberGroups={
    member:[{id:'m1',name:'Nova',tag:'nova_01'},{id:'m2',name:'Mika',tag:'mika_02'},{id:'m3',name:'Sena',tag:'sena_03'},{id:'m4',name:'Haru',tag:'haru_04'},{id:'m5',name:'Jin',tag:'jin_05'},{id:'m6',name:'Raven',tag:'raven_06'}],
    admin:[{id:'a1',name:'Orion',tag:'orion_admin'},{id:'a2',name:'Lynx',tag:'lynx_admin'}],
    guest:[{id:'g1',name:'Guest 01',tag:'guest_01'},{id:'g2',name:'Guest 02',tag:'guest_02'},{id:'g3',name:'Guest 03',tag:'guest_03'},{id:'g4',name:'Guest 04',tag:'guest_04'},{id:'g5',name:'Guest 05',tag:'guest_05'},{id:'g6',name:'Guest 06',tag:'guest_06'},{id:'g7',name:'Guest 07',tag:'guest_07'},{id:'g8',name:'Guest 08',tag:'guest_08'},{id:'g9',name:'Guest 09',tag:'guest_09'},{id:'g10',name:'Guest 10',tag:'guest_10'}]
  };
  const filter=memberGroups[demo.memberFilter]?demo.memberFilter:'member'; const visibleMembers=memberGroups[filter]; const selectedMembers=new Set(demo.memberSelected||[]); const allVisibleSelected=visibleMembers.length>0&&visibleMembers.every(m=>selectedMembers.has(m.id));
  const roleLabel=filter==='admin'?adminRole:filter==='guest'?'손님':memberRole; const targetRole=demo.memberTargetRole==='admin'?'관리자':'일반 멤버';
  const memberRows=visibleMembers.map(m=>`<label class="setup-demo-member-row ${selectedMembers.has(m.id)?'is-selected':''}"><input type="checkbox" data-setup-member-select="${m.id}" ${selectedMembers.has(m.id)?'checked':''}><span class="setup-demo-member-avatar">${esc(m.name.slice(0,1).toUpperCase())}</span><span class="setup-demo-member-copy"><strong>${esc(m.name)}</strong><small>@${esc(m.tag)}</small></span><em>${esc(roleLabel)}</em></label>`).join('');

  let body=''; let nextLabel='다음';
  if(step===0){ body=`<div class="setup-demo-hero"><span class="setup-demo-kicker">AXE PRODUCT SETUP GUIDE</span><h2>처음 설정도, 순서대로 하면 어렵지 않습니다.</h2><p>필요한 것만 하나씩 안내하고 완료된 단계는 자동으로 확인합니다. 지금 체험하는 내용은 실제 회사 설정에 저장되지 않습니다.</p><div class="setup-demo-facts"><span><b>약 2–3분</b> 예상 소요시간</span><span><b>6단계</b> 핵심 설정만 진행</span><span><b>0건</b> 실제 데이터 변경</span></div></div>`; nextLabel='체험 시작'; }
  if(step===1){ body=connected?`<div class="setup-demo-quest"><span class="setup-demo-quest-no">QUEST 01</span><h2>Discord 서버 연결 완료</h2><p>연결된 서버를 확인했습니다. 역할과 채널 목록도 자동으로 가져오는 흐름입니다.</p><div class="setup-demo-discord-card is-connected"><i></i><div><strong>AXE TEST SERVER</strong><span>Discord 연결됨 · 체험 데이터</span></div><b>연결 완료</b></div><div class="setup-demo-tip"><strong>자동으로 처리되는 것</strong><span>서버 확인 → 역할 목록 → 채널 목록 동기화</span></div></div>`:`<div class="setup-demo-quest"><span class="setup-demo-quest-no">QUEST 01</span><h2>운영할 Discord 서버를 연결합니다.</h2><p>실제 연결에서는 Discord 서버 선택 화면으로 이동합니다. 이 체험에서는 연결 동작만 시뮬레이션합니다.</p><button type="button" class="setup-demo-discord-connect" data-action="setup-demo-connect"><span>Discord</span><strong>테스트 서버 연결하기</strong><small>실제 Discord 권한 요청 없음</small></button></div>`; nextLabel=connected?'다음':'연결 먼저 하기'; }
  if(step===2){ body=`<div class="setup-demo-quest"><span class="setup-demo-quest-no">QUEST 02</span><h2>누가 운영하고, 누가 사용하는지 정합니다.</h2><p>Discord 역할을 기준으로 관리자와 일반 멤버 권한을 나눕니다.</p><div class="setup-demo-role-grid"><label class="setup-demo-field"><span>관리자 역할</span><select data-setup-role="adminRole"><option ${demo.adminRole==='대표'?'selected':''}>대표</option><option ${demo.adminRole==='운영진'?'selected':''}>운영진</option><option ${demo.adminRole==='관리자'?'selected':''}>관리자</option></select><small>멤버 · 공금 · 자산 · 회사 설정 관리</small></label><label class="setup-demo-field"><span>일반 멤버 역할</span><select data-setup-role="memberRole"><option ${demo.memberRole==='회사원'?'selected':''}>회사원</option><option ${demo.memberRole==='직원'?'selected':''}>직원</option><option ${demo.memberRole==='크루'?'selected':''}>크루</option></select><small>회사 기능을 사용하는 일반 구성원</small></label></div><div class="setup-demo-tip"><strong>현재 선택</strong><span>${esc(demo.adminRole||'대표')} → 관리자 / ${esc(demo.memberRole||'회사원')} → 일반 멤버</span></div></div>`; }
  if(step===3){ body=`<div class="setup-demo-quest"><span class="setup-demo-quest-no">QUEST 03</span><h2>회사에서 사용할 기능만 선택합니다.</h2><p>켜지 않은 기능은 다음 단계에서도 묻지 않습니다.</p><div class="setup-demo-module-grid">${moduleCard('fund','공금 관리','현황판 · 납부 · 검수 · 원장')}${moduleCard('ammo','총알 관리','3시 · 10시 주문/제작')}${moduleCard('outlaw','무법지대 전적','등록 · 랭킹 · 기록')}${moduleCard('cooking','요리 주문','주문 · 변경 · 영업')}${moduleCard('assets','자산 · 계좌','배정 · 반납 · 계좌')}</div></div>`; }
  if(step===4){
    const mode=demo.channelMode||'quick';
    const modePicker=`<div class="setup-demo-channel-mode"><button type="button" class="${mode==='quick'?'is-active':''}" data-action="setup-demo-channel-mode" data-mode="quick"><b>⚡</b><span><strong>빠른 설정</strong><small>필요한 채널을 추천하고 AXE가 만들어줍니다.</small></span></button><button type="button" class="${mode==='direct'?'is-active':''}" data-action="setup-demo-channel-mode" data-mode="direct"><b>↗</b><span><strong>직접 연결</strong><small>이미 사용 중인 Discord 채널을 선택합니다.</small></span></button></div>`;
    if(mode==='quick'){
      const category=demo.categoryName||'AXE PRODUCT';
      const builder=channelPlan.length?`<div class="setup-demo-builder"><div class="setup-demo-builder-head"><div><strong>추천 구성</strong><span>생성 전에 이름을 자유롭게 바꿀 수 있습니다.</span></div><em>${channelPlan.length}개 채널</em></div><label class="setup-demo-category-row"><span><strong>카테고리</strong><small>채널을 묶어둘 Discord 카테고리</small></span><input type="text" maxlength="90" value="${esc(category)}" data-setup-category-name></label><div class="setup-demo-create-list">${channelPlan.map(generatedRow).join('')}</div>${demo.channelsGenerated?`<div class="setup-demo-generation-result"><div class="setup-demo-generation-title"><i>✓</i><span><strong>생성 체험 완료</strong><small>실제 Discord에는 아무것도 생성되지 않았습니다.</small></span></div><ul><li><b>✓</b><span><strong>${esc(category)}</strong><small>카테고리 생성</small></span></li>${channelPlan.map(([,label,,value])=>`<li><b>✓</b><span><strong>#${esc(value)}</strong><small>${esc(label)}에 자동 연결</small></span></li>`).join('')}</ul></div>`:`<div class="setup-demo-builder-note"><b>PREVIEW</b><span>아래 <strong>이 구성으로 생성 체험</strong>을 누르면 생성 과정을 미리 볼 수 있습니다.</span></div>`}</div>`:`<div class="setup-demo-empty"><strong>자동 생성이 필요한 채널이 없습니다.</strong><span>자산 · 계좌 기능은 별도 Discord 채널이 필요하지 않습니다.</span></div>`;
      body=`<div class="setup-demo-quest setup-demo-quest--channels"><span class="setup-demo-quest-no">QUEST 04</span><h2>채널도 AXE가 준비할 수 있습니다.</h2><p>추천 구성을 그대로 사용하거나, 카테고리와 채널명을 회사 스타일에 맞게 바꾼 뒤 생성합니다.</p>${modePicker}${builder}</div>`;
    }else{
      const rows=[]; if(modules.fund)rows.push(channelSelect('공금현황판','공금 현황판',demo.channels?.fund)); if(modules.ammo){rows.push(channelSelect('3시-총알','3시 총알 채널',demo.channels?.ammo3));rows.push(channelSelect('10시-총알','10시 총알 채널',demo.channels?.ammo10));} if(modules.outlaw)rows.push(channelSelect('전적-등록','무법 전적 등록 채널',demo.channels?.outlaw)); if(modules.cooking)rows.push(channelSelect('요리-주문','요리 주문 채널',demo.channels?.cooking));
      body=`<div class="setup-demo-quest setup-demo-quest--channels"><span class="setup-demo-quest-no">QUEST 04</span><h2>기존 채널을 그대로 연결할 수도 있습니다.</h2><p>이미 서버 구조가 잡혀 있다면 새 채널을 만들지 않고 기존 채널을 기능에 연결합니다.</p>${modePicker}<div class="setup-demo-channel-list">${rows.length?rows.join(''):`<div class="setup-demo-empty"><strong>채널 설정이 필요한 기능이 없습니다.</strong><span>바로 다음 단계로 진행할 수 있습니다.</span></div>`}</div><div class="setup-demo-tip"><strong>직접 연결</strong><span>기존 서버 구조는 그대로 유지하고 AXE 기능만 연결합니다.</span></div></div>`;
    }
  }
  if(step===5){
    const selectedVisible=visibleMembers.filter(m=>selectedMembers.has(m.id)).length;
    body=`<div class="setup-demo-quest setup-demo-quest--members"><span class="setup-demo-quest-no">QUEST 05</span><h2>멤버도 한 번에 등록할 수 있습니다.</h2><p>서버 인원이 많아도 Discord 역할로 먼저 걸러낸 뒤, 필요한 사람만 선택해서 AXE 권한을 일괄 부여합니다.</p><div class="setup-demo-member-toolbar"><label><span>Discord 역할로 대상 찾기</span><select data-setup-member-filter><option value="member" ${filter==='member'?'selected':''}>${esc(memberRole)} · 일반 멤버 역할 (6)</option><option value="admin" ${filter==='admin'?'selected':''}>${esc(adminRole)} · 관리자 역할 (2)</option><option value="guest" ${filter==='guest'?'selected':''}>손님 · 게스트 (10)</option></select><small>게스트가 많은 서버에서도 실제 회사 인원만 빠르게 찾습니다.</small></label><label><span>AXE에서 부여할 권한</span><select data-setup-member-target-role><option value="member" ${demo.memberTargetRole!=='admin'?'selected':''}>일반 멤버</option><option value="admin" ${demo.memberTargetRole==='admin'?'selected':''}>관리자</option></select><small>필터는 대상을 찾는 기준이고, 이 권한이 실제 AXE 멤버 권한입니다.</small></label></div><div class="setup-demo-member-summary"><div><strong>${esc(roleLabel)} 역할</strong><span>서버 전체 18명 중 ${visibleMembers.length}명 표시</span></div><button type="button" data-action="setup-demo-select-visible-members">${allVisibleSelected?'현재 목록 선택 해제':'현재 목록 전체 선택'}</button></div><div class="setup-demo-member-list">${memberRows}</div>${demo.memberImportDone?demo.memberImportSkipped?`<div class="setup-demo-member-result is-skipped"><i>→</i><div><strong>멤버 등록은 나중에 진행합니다.</strong><span>운영 중에는 Discord 우클릭 → 앱 → AXE 멤버 등록으로 한 명씩 추가할 수 있습니다.</span></div></div>`:`<div class="setup-demo-member-result"><i>✓</i><div><strong>${selectedMembers.size}명 등록 체험 완료</strong><span>선택한 멤버에게 <b>${esc(targetRole)}</b> 권한을 부여하는 흐름입니다.</span></div></div>`:`<div class="setup-demo-member-actions"><span><b>${selectedVisible}명 선택됨</b> · 현재 화면은 체험 데이터입니다.</span><button type="button" data-action="setup-demo-skip-members">나중에 개별 등록</button></div>`}</div>`;
  }
  if(step===6){ const memberDone=demo.memberImportDone&&!demo.memberImportSkipped; body=`<div class="setup-demo-complete"><div class="setup-demo-complete-mark">✓</div><span class="setup-demo-kicker">SETUP COMPLETE</span><h2>운영 준비가 완료되었습니다.</h2><p>실제 초기설정에서는 여기까지 완료되면 운영 콘솔로 자연스럽게 이동합니다.</p><div class="setup-demo-next-task"><span>${memberDone?'MEMBERS':'NEXT'}</span><div><strong>${memberDone?`${selectedMembers.size}명 멤버 등록 준비 완료`:'추가 멤버는 언제든 등록할 수 있습니다.'}</strong><small>${memberDone?`${esc(targetRole)} 권한으로 일괄 등록하는 흐름을 확인했습니다.`:'Discord에서 대상 우클릭 → 앱 → AXE 멤버 등록'}</small></div></div><div class="setup-demo-safe"><b>체험 모드</b><span>지금 선택한 역할·기능·채널·멤버는 실제 회사 설정에 저장되지 않았습니다.</span></div></div>`; nextLabel='체험 종료'; }
  const needsGeneration=step===4&&(demo.channelMode||'quick')==='quick'&&channelPlan.length>0&&!demo.channelsGenerated;
  const needsMemberImport=step===5&&!demo.memberImportDone;
  const primary=step===1&&!connected?`<button type="button" class="setup-demo-primary" data-action="setup-demo-connect">Discord 연결 체험</button>`:needsGeneration?`<button type="button" class="setup-demo-primary setup-demo-primary--generate" data-action="setup-demo-generate-channels">이 구성으로 생성 체험</button>`:needsMemberImport?`<button type="button" class="setup-demo-primary setup-demo-primary--members" data-action="setup-demo-import-members" ${(demo.memberSelected||[]).length?'':'disabled'}>선택 멤버 등록 체험</button>`:step===6?`<button type="button" class="setup-demo-primary" data-action="setup-demo-finish">체험 종료</button>`:`<button type="button" class="setup-demo-primary" data-action="setup-demo-next">${nextLabel}</button>`;
  const scrollStep=step===4||step===5;
  return `<div class="setup-demo-backdrop"><section class="setup-demo-shell" role="dialog" aria-modal="true" aria-label="초기설정 가이드 체험"><aside class="setup-demo-rail"><div class="setup-demo-brand"><strong>AXE PRODUCT</strong><small>GUIDED SETUP · PREVIEW</small></div><div class="setup-demo-preview-badge"><i></i><span>테스트 설정</span><small>실제 데이터 변경 없음</small></div><nav>${rail}</nav><button type="button" class="setup-demo-exit" data-action="close-modal">체험 닫기</button></aside><main class="setup-demo-main"><header><div><span>초기설정 가이드 체험</span><strong>${step+1} / ${steps.length}</strong></div><button type="button" data-action="close-modal" aria-label="닫기">×</button></header><div class="setup-demo-content ${scrollStep?'is-scroll-step':''}">${body}</div><footer>${step>0&&step<6?`<button type="button" class="setup-demo-back" data-action="setup-demo-back">이전</button>`:'<span></span>'}<div><button type="button" class="setup-demo-restart" data-action="setup-demo-restart">처음부터</button>${primary}</div></footer></main></section></div>`;
}

function discordReconnectModal(state){ const guild=state.discordConnection?.guild_name||'현재 Discord 서버'; return modalShell('Discord 연결 다시 설정','기존 연결을 안전하게 정리한 뒤 같은 서버도 처음부터 다시 연결할 수 있습니다.',`<form data-form="reconnect-discord" class="runtime-modal-form runtime-reconnect-form"><div class="runtime-reconnect-summary"><span>현재 연결</span><strong>${esc(guild)}</strong></div><div class="runtime-reconnect-warning"><strong>삭제되는 항목</strong><p>Discord 서버 연결 · 관리자/멤버 역할 선택 · 기능별 채널 연결 · BOT 상시 패널</p></div><div class="runtime-reconnect-safe"><strong>그대로 보존되는 항목</strong><p>멤버 · 공금 원장 · 자산/계좌 · 총알 주문 · 무법 전적 · 요리 주문 등 회사 운영 데이터</p></div><label class="runtime-reconnect-confirm is-full"><input type="checkbox" name="confirm" value="yes" required><span>위 내용을 확인했고 Discord 연결 설정만 처음부터 다시 진행합니다.</span></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-danger" type="submit">연결 다시 설정</button></footer></form>`);}
function cookingMenuModal(state,m){ const row=(state.cookingOrderTypes||[]).find(x=>String(x.type_key)===String(m.typeKey||''))||null; const editing=Boolean(row); const nextSort=editing?Number(row.sort_order||0):((state.cookingOrderTypes||[]).reduce((max,x)=>Math.max(max,Number(x.sort_order||0)),0)+1); return modalShell(editing?'요리 메뉴 수정':'요리 메뉴 추가','회사별 Discord 주문창에 표시할 메뉴를 설정합니다.',`<form data-form="cooking-menu" class="runtime-modal-form"><input type="hidden" name="type_key" value="${esc(row?.type_key||'')}"><label>메뉴 이름<input name="label" maxlength="100" value="${esc(row?.label||'')}" placeholder="예: 멧돼지 스튜" required></label><label>짧은 이름<input name="short_label" maxlength="60" value="${esc(row?.short_label||'')}" placeholder="예: 멧돼지"></label><label class="is-full">설명<input name="detail" maxlength="160" value="${esc(row?.detail||'')}" placeholder="Discord 선택창에 보일 설명"></label><label>SET당 가격<input name="price_per_set" type="number" min="0" max="1000000000" step="1" value="${esc(Number(row?.price_per_set||0))}" required></label><label>노출 순서<input name="sort_order" type="number" min="0" step="1" value="${esc(nextSort)}" required></label><label class="runtime-modal-toggle is-full"><input name="enabled" type="checkbox" ${row?.enabled===false?'':'checked'}><span><strong>Discord 주문창에 사용</strong><small>OFF로 바꾸면 기존 주문 기록은 유지하고 신규 선택지만 숨깁니다.</small></span></label>${editing?`<div class="runtime-modal-readonly is-full"><span>내부 키</span><strong>${esc(row.type_key)}</strong><small>기존 주문 연결을 위해 생성 후에는 변경하지 않습니다.</small></div>`:''}<footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">${editing?'저장':'메뉴 추가'}</button></footer></form>`,true);}


export { esc, icon, money, signedMoney, fmtDate, currentMembership, canAdmin, moduleEnabled, moduleRow, companyDisplayName, userDisplayName };
