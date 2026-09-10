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
function companyDisplayName(state) { return state.companySettings?.brand_name || currentCompany(state)?.name || '회사'; }
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

function renderEnvironmentMissing() {
  return `<section class="runtime-auth"><div class="runtime-auth-card"><strong>AXE PRODUCT</strong><h1>STAGING 환경 설정이 필요합니다.</h1><p>VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY를 Vercel 환경변수에 설정해 주세요.</p></div></section>`;
}

function renderLogin(state) {
  return `<section class="runtime-auth"><div class="runtime-auth-card">
    <div class="product-brand product-brand--login"><div><strong>AXE PRODUCT</strong><small>OPERATIONS CONSOLE</small></div></div>
    <span class="runtime-auth-kicker">PRODUCT STAGING</span>
    <h1>회사 운영을 한곳에서.</h1><p>Discord 계정으로 로그인해 소속 회사의 운영 콘솔에 접속합니다.</p>
    <button class="runtime-login-button" data-action="discord-login" ${state.loading ? 'disabled' : ''}>Discord로 로그인</button>
  </div></section>`;
}

function renderOnboarding(state) {
  return `<section class="runtime-auth runtime-auth--onboarding"><div class="runtime-onboarding">
    <div class="runtime-onboarding-card"><span>NEW COMPANY</span><h2>새 회사 생성</h2><p>생성자는 OWNER가 되고 회사 데이터는 다른 회사와 분리됩니다.</p>
      <form data-form="create-company"><label>회사 이름<input name="name" maxlength="80" required></label><label>Slug <small>선택</small><input name="slug" maxlength="63"></label><button class="runtime-login-button" type="submit">회사 생성</button></form>
    </div>
    <div class="runtime-onboarding-card"><span>JOIN COMPANY</span><h2>초대코드로 참가</h2><p>회사 관리자에게 받은 초대코드로 MEMBER로 참가합니다.</p>
      <form data-form="redeem-invite"><label>초대코드<input name="invite_code" required></label><button class="runtime-login-button runtime-login-button--ghost" type="submit">회사 참가</button></form>
    </div>
  </div></section>`;
}

function renderAuthed(state) {
  const company = currentCompany(state);
  const membership = currentMembership(state);
  const connected = state.discordConnection?.status === 'connected';
  return `<div class="runtime-app">
    <header class="global-header"><div class="global-header__inner">
      <div class="product-brand"><div><strong>AXE PRODUCT</strong><small>OPERATIONS CONSOLE</small></div></div>
      <div class="global-actions"><span class="environment-pill"><i></i>PRODUCT STAGING</span><button class="icon-button" data-action="refresh" aria-label="새로고침">${icon('refresh')}</button></div>
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
          <div class="company-quick-actions"><button class="accent-action" data-action="open-create-company">+ 새 회사</button><button data-action="open-join-company">초대코드 참가</button></div>
        </section>
        <nav class="sidebar-nav"><span class="sidebar-nav__label">회사 운영</span>
          ${navItem(state,'fund','공금 관리')}${navItem(state,'members','멤버 관리')}${navItem(state,'assets','자산 관리')}${navItem(state,'accounts','계좌 관리')}
          <span class="sidebar-nav__label spaced">설정</span>${navItem(state,'settings','회사 설정')}
          <span class="sidebar-nav__label spaced">지원</span><button class="nav-item nav-item--support" data-action="open-feedback"><span class="nav-item__icon">${icon('feedback')}</span><span>피드백 · 제보</span></button>
        </nav>
        <footer class="sidebar-footer"><div class="connection-status ${connected?'':'is-off'}"><i></i><div><strong>Discord ${connected?'연결됨':'미연결'}</strong><small>${esc(state.discordConnection?.guild_name || '연결 필요')}</small></div></div>
          <div class="account-summary"><div><strong>${esc(userDisplayName(state))}</strong><small>${esc(ROLE_LABEL[membership?.role] || '-')}</small></div><button class="mini-icon" data-action="logout" title="로그아웃">${icon('logout')}</button></div>
        </footer>
      </aside>
      <main class="main">${state.loading && !state.ready ? '<div class="runtime-loading">불러오는 중…</div>' : renderPage(state)}</main>
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
    <header class="axe-fund-header"><div class="axe-fund-header-copy"><span>FUND</span><h1>공금 관리</h1><p>회사 자금의 수입·지출·납부·잔액을 한곳에서 관리합니다.</p></div><div class="axe-fund-header-actions"><button class="axe-fund-tool-button" data-action="refresh-fund">${icon('refresh')}<span>새로고침</span></button></div></header>
    <section class="axe-fund-summary"><article class="axe-fund-metric"><span>현재 계산 잔액</span><strong>${money(balance)}</strong><small>공용계좌 기준</small></article><article class="axe-fund-metric"><span>이번 달 수입</span><strong class="is-income">+${money(snap.month_income)}</strong><small>승인 + 직접 등록</small></article><article class="axe-fund-metric"><span>이번 달 지출</span><strong class="is-expense">-${money(snap.month_expense)}</strong><small>회사 운영 지출</small></article><article class="axe-fund-metric"><span>검수 필요</span><strong class="is-warning">${pending}건</strong><small>대기 · 보류 포함</small></article></section>
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
  const groups=[]; for(const row of rows){ const key=dateKey(row.ledger_date); let g=groups.find(x=>x.date===key); if(!g){g={date:key,rows:[]};groups.push(g);} g.rows.push(row); }
  return `<section class="axe-fund-history"><header class="axe-fund-history-head"><div><h2>공금내역</h2><p>필요한 정보만 빠르게 확인하고, 상세 작업은 행에서 바로 처리합니다.</p></div><div class="axe-fund-history-head-actions"><select class="axe-fund-history-select axe-fund-history-select--month" data-fund-ledger-month>${monthOptions(state.fundMonth,12)}</select><button class="axe-fund-primary axe-fund-primary--ledger" data-action="open-ledger">수입·지출 등록</button></div></header>
    <section class="axe-fund-history-board"><div class="axe-fund-history-toolbar"><div class="axe-fund-history-filters"><select class="axe-fund-history-select" data-fund-filter="person"><option value="all">전체 이름</option>${people.map(v=>`<option ${q.person===v?'selected':''}>${esc(v)}</option>`).join('')}</select><select class="axe-fund-history-select" data-fund-filter="type"><option value="all">전체 구분</option><option value="approval" ${q.type==='approval'?'selected':''}>승인반영</option><option value="manual" ${q.type==='manual'?'selected':''}>직접기입</option><option value="income" ${q.type==='income'?'selected':''}>수입</option><option value="expense" ${q.type==='expense'?'selected':''}>지출</option></select><select class="axe-fund-history-select" data-fund-filter="account"><option value="all">전체 계좌</option>${accounts.map(v=>`<option ${q.account===v?'selected':''}>${esc(v)}</option>`).join('')}</select><button class="axe-fund-history-reset" data-action="reset-fund-filter">필터 초기화</button></div><div class="axe-fund-history-meta"><span>${rows.length}건</span></div></div>
    <div class="axe-fund-history-list">${groups.length?groups.map(g=>renderLedgerGroup(g)).join(''):'<div class="axe-fund-history-empty">조건에 맞는 공금내역이 없습니다.</div>'}</div></section></section>`;
}
function renderLedgerGroup(group){ const [y,m,d]=group.date.split('-'); return `<section class="axe-fund-history-day"><div class="axe-fund-history-date"><strong>${m}.${d}</strong><span>${y}</span></div><div class="axe-fund-history-day-rows">${group.rows.map(renderLedgerRow).join('')}</div></section>`; }
function renderLedgerRow(r){ const amount=Number(r.amount||0); const source=r.request_id?'승인':'직접'; const sub=[r.entry_type==='payment'?'공금납부':r.ledger_type,r.direction,r.memo].filter(Boolean).join(' · '); const who=r.member_display_name||'—'; return `<article class="axe-fund-history-row"><div class="axe-fund-history-entry"><div class="axe-fund-history-title"><strong>${esc(r.category||'기타')}</strong><span class="axe-fund-history-kind axe-fund-history-kind--${r.request_id?'approval':'manual'}">${source}</span></div><span>${esc(sub||'—')}</span></div><div class="axe-fund-history-who"><strong>${esc(who)}</strong><span>${esc(r.account||'—')}</span></div><div class="axe-fund-history-money ${amount<0?'is-expense':'is-income'}">${signedMoney(amount)}</div><div class="axe-fund-history-actions">${r.evidence_path?`<button class="axe-fund-history-action is-evidence" data-action="open-evidence" data-evidence-path="${esc(r.evidence_path)}">증빙</button>`:'<span class="axe-fund-history-no-evidence">—</span>'}${r.can_edit?`<button class="axe-fund-history-action" data-action="edit-ledger" data-entry-id="${esc(r.id)}">수정</button>`:'<span class="axe-fund-history-no-evidence">—</span>'}</div></article>`; }

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

function renderMembers(state){ const all=state.memberships||[]; const active=all.filter(m=>m.status==='active'); const left=all.filter(m=>m.status==='left'); const admins=active.filter(m=>['owner','admin'].includes(m.role)); let rows=all.filter(m=>state.memberFilter==='active'?m.status==='active':state.memberFilter==='left'?m.status==='left':true); if(state.memberRole) rows=rows.filter(m=>m.role===state.memberRole); const q=(state.memberQuery||'').toLowerCase(); if(q)rows=rows.filter(m=>`${m.display_name||''} ${m.discord_user_id||''}`.toLowerCase().includes(q));
  return `<div class="ops-mgmt-page ops-mgmt-page--members">${pageHeader('MEMBERS','멤버 관리','회사 구성원의 역할과 활동 상태를 빠르게 확인하고 관리합니다.','')}${summary([['전체 멤버',`${all.length}명`,'누적 등록',''],['활동 중',`${active.length}명`,'현재 회사','is-positive'],['관리 권한',`${admins.length}명`,'대표 · 관리자','is-warning'],['퇴사',`${left.length}명`,'기록 유지','']])}<div class="ops-mgmt-section-head"><div><strong>멤버 현황</strong><span>역할과 상태를 한곳에서 관리합니다.</span></div><button class="ops-action-primary" data-action="create-invite">${icon('plus')}<span>멤버 추가</span></button></div><section class="ops-mgmt-board"><div class="ops-mgmt-toolbar"><div class="ops-mgmt-segments">${segment(state,'all','전체',all.length)}${segment(state,'active','활동',active.length)}${segment(state,'left','퇴사',left.length,true)}</div><div class="ops-mgmt-filters"><select class="ops-mgmt-select" data-member-role><option value="">역할 전체</option>${['owner','admin','manager','member'].map(r=>`<option value="${r}" ${state.memberRole===r?'selected':''}>${ROLE_KO[r]}</option>`).join('')}</select><label class="ops-mgmt-search">${icon('search')}<input data-member-query value="${esc(state.memberQuery||'')}" placeholder="닉네임 · Discord 검색"></label></div></div><div class="ops-mgmt-meta"><span><strong>${rows.length}</strong>명 표시</span><span>활동 상태와 역할 기준</span></div><div class="ops-mgmt-list ops-mgmt-list--members">${rows.length?rows.map(m=>`<article class="ops-mgmt-row ops-member-row"><div class="ops-member-main"><strong>${esc(m.display_name||'멤버')}</strong><span>${m.discord_user_id?`Discord ${esc(m.discord_user_id)}`:'Discord 미연결'} · 입사 ${fmtDate(m.joined_at||m.created_at,true)}</span></div><div class="ops-member-role"><strong>${esc(ROLE_KO[m.role]||m.role)}</strong><span>회사 역할</span></div><div class="ops-member-state"><span class="ops-mgmt-badge ${m.status==='active'?'is-green':m.status==='left'?'is-red':'is-amber'}">${memberStatus(m.status)}</span></div><button class="ops-mgmt-action" data-action="edit-member" data-membership-id="${esc(m.id)}">상세</button></article>`).join(''):empty('조건에 맞는 멤버가 없습니다.')}</div></section></div>`; }
function segment(state,key,label,count,left=false){ return `<button class="${state.memberFilter===key?'is-active':''} ${left?'is-left':''}" data-member-filter="${key}">${label}<em>${count}</em></button>`; } function memberStatus(v){return ({active:'활동',left:'퇴사',suspended:'중지',invited:'초대'})[v]||v;}

// ============================================================
// ASSETS
// ============================================================
function renderAssets(state){ const snap=state.assetsSnapshot||{}; const assets=snap.assets||[]; const returns=snap.returns||[]; const assigned=assets.filter(a=>a.membership_id).length; const unassigned=assets.filter(a=>!a.membership_id).length; return `<div class="ops-mgmt-page ops-mgmt-page--assets ${state.assetTab==='returns'?'is-returns':'is-assets'}">${pageHeader('ASSETS','자산 관리','회사 자산의 배정 상태와 반납 이력을 빠르게 확인합니다.','')}${summary([['전체 자산',`${assets.length}개`,'등록 자산',''],['사용 중',`${assigned}개`,'멤버 배정','is-positive'],['미배정',`${unassigned}개`,'배정 필요','is-warning'],['반납 기록',`${returns.length}건`,'이력 보존','']])}<div class="ops-mgmt-tabs-row"><div class="ops-mgmt-tabs"><button class="${state.assetTab==='assets'?'is-active':''}" data-asset-tab="assets">자산 현황</button><button class="${state.assetTab==='returns'?'is-active':''}" data-asset-tab="returns">반납 내역</button></div><button class="ops-action-primary" data-action="open-asset">${icon('plus')}<span>자산 추가</span></button></div>${state.assetTab==='returns'?renderReturns(state):renderAssetBoard(state)}</div>`; }
function renderAssetBoard(state){ let rows=(state.assetsSnapshot?.assets||[]).slice(); const q=(state.assetQuery||'').toLowerCase(); if(state.assetCategory)rows=rows.filter(a=>a.asset_category===state.assetCategory); if(state.assetStatus)rows=rows.filter(a=>(a.membership_id?'사용중':'미배정')===state.assetStatus); if(q)rows=rows.filter(a=>`${a.asset_name} ${a.owner_name} ${a.legacy_no||''}`.toLowerCase().includes(q)); const cats=[...new Set((state.assetsSnapshot?.assets||[]).map(a=>a.asset_category).filter(Boolean))]; return `<section class="ops-mgmt-board"><div class="ops-mgmt-toolbar"><div class="ops-mgmt-filters"><label class="ops-mgmt-search">${icon('search')}<input data-asset-query value="${esc(state.assetQuery||'')}" placeholder="자산명 · 보유자 검색"></label><select class="ops-mgmt-select" data-asset-category><option value="">분류 전체</option>${cats.map(c=>`<option ${state.assetCategory===c?'selected':''}>${esc(c)}</option>`).join('')}</select><select class="ops-mgmt-select" data-asset-status><option value="">상태 전체</option><option ${state.assetStatus==='사용중'?'selected':''}>사용중</option><option ${state.assetStatus==='미배정'?'selected':''}>미배정</option></select></div></div><div class="ops-mgmt-meta"><span><strong>${rows.length}</strong>개 표시</span><span>배정 상태와 보유자 기준</span></div><div class="ops-mgmt-list">${rows.length?rows.map(a=>`<article class="ops-mgmt-row ops-asset-row"><div class="ops-asset-main"><strong>${esc(a.asset_name)}</strong><span>${esc(a.legacy_no||a.id.slice(0,8))} · ${esc(a.asset_category||'기타')}</span></div><div class="ops-asset-holder"><strong>${esc(a.owner_name||'미배정')}</strong><span>현재 보유자</span></div><div class="ops-asset-state"><span class="ops-mgmt-badge ${a.membership_id?'is-green':'is-amber'}">${a.membership_id?'사용중':'미배정'}</span><small>${fmtDate(a.updated_at,true)} 변경</small></div><button class="ops-mgmt-action" data-action="edit-asset" data-asset-id="${esc(a.id)}">상세</button></article>`).join(''):empty('조건에 맞는 자산이 없습니다.')}</div></section>`; }
function renderReturns(state){ const rows=state.assetsSnapshot?.returns||[]; return `<section class="ops-mgmt-board"><div class="ops-mgmt-board-head"><div><h2>반납 내역</h2><p>퇴사 자동반납과 수동 반납 이력을 기록으로 보존합니다.</p></div><span>${rows.length}건</span></div><div class="ops-mgmt-list">${rows.length?rows.map(r=>`<article class="ops-mgmt-row ops-return-row"><div class="ops-return-main"><strong>${esc(r.asset_name)}</strong><span>${esc(r.processed_at||fmtDate(r.created_at,true))} · 이전 보유자 ${esc(r.owner_name)}</span></div><div class="ops-return-reason"><strong>${r.note?'수동 반납':'반납 처리'}</strong><span>${esc(r.note||'기록 보존')}</span></div><div class="ops-return-actor"><strong>${esc(r.checker_name||'SYSTEM')}</strong><span>확인자</span></div></article>`).join(''):empty('반납 기록이 없습니다.')}</div></section>`; }

// ============================================================
// ACCOUNTS
// ============================================================
function accountRecords(state){ const snap=state.accountsSnapshot||{}; const reqs=snap.requests||[]; return (snap.accounts||[]).filter(a=>a.member_status==='active').map(a=>{ const pending=reqs.find(r=>r.membership_id===a.membership_id&&r.status==='pending'); return {...a,pending,status:pending?(a.account?'변경 대기':'등록 대기'):a.account&&a.enabled?'승인':'미등록'};}); }
function renderAccounts(state){ const records=accountRecords(state); const approved=records.filter(r=>r.status==='승인').length; const pending=records.filter(r=>['변경 대기','등록 대기'].includes(r.status)); const missing=records.filter(r=>r.status==='미등록').length; let rows=records.slice(); if(state.accountStatus)rows=rows.filter(r=>r.status===state.accountStatus); const q=(state.accountQuery||'').toLowerCase(); if(q)rows=rows.filter(r=>`${r.display_name} ${r.account||''}`.toLowerCase().includes(q)); const my=currentMembership(state); const myRow=records.find(r=>r.membership_id===my?.id);
  return `<div class="ops-mgmt-page ops-mgmt-page--accounts">${pageHeader('ACCOUNTS','계좌 관리','멤버별 플리카 계좌 등록 상태와 변경 신청을 별도로 관리합니다.','')}${summary([['전체 대상',`${records.length}명`,'활동 멤버',''],['등록 완료',`${approved}명`,'승인 계좌','is-positive'],['검수 필요',`${pending.length}건`,'등록 · 변경','is-warning'],['미등록',`${missing}명`,'등록 필요','is-negative']])}<div class="ops-mgmt-section-head ops-mgmt-section-head--accounts"><div><strong>계좌 현황</strong><span>등록 상태와 변경 요청을 한곳에서 확인합니다.</span></div><button class="ops-action-secondary" data-action="open-account-request">${icon('accounts')}<span>${myRow?.account?'내 계좌 변경':'내 계좌 등록'}</span></button></div>${pending.length?`<section class="ops-account-review"><div class="ops-account-review-head"><div><strong>검수 필요</strong><span>등록·변경 요청을 우선 처리합니다.</span></div><em>${pending.length}</em></div>${pending.map(r=>`<article><div><strong>${esc(r.display_name)}</strong><span>${esc(r.status)} · ${esc(r.pending?.account||'')}</span></div><span class="ops-mgmt-badge is-amber">${esc(r.status)}</span><div class="ops-account-review-actions"><button data-action="account-review" data-request-id="${esc(r.pending.id)}" data-review-action="reject">반려</button><button class="is-primary" data-action="account-review" data-request-id="${esc(r.pending.id)}" data-review-action="approve">승인</button></div></article>`).join('')}</section>`:''}<section class="ops-mgmt-board"><div class="ops-mgmt-toolbar"><div class="ops-mgmt-filters"><label class="ops-mgmt-search">${icon('search')}<input data-account-query value="${esc(state.accountQuery||'')}" placeholder="멤버 · 계좌 검색"></label><select class="ops-mgmt-select" data-account-status><option value="">상태 전체</option>${['승인','등록 대기','변경 대기','미등록'].map(v=>`<option ${state.accountStatus===v?'selected':''}>${v}</option>`).join('')}</select></div><span class="ops-mgmt-toolbar-note">계좌 변경은 신청 → 검수 방식</span></div><div class="ops-mgmt-meta"><span><strong>${rows.length}</strong>명 표시</span><span>멤버별 계좌 현황</span></div><div class="ops-mgmt-list">${rows.length?rows.map(r=>`<article class="ops-mgmt-row ops-account-row ${r.pending?'is-attention':''}"><div class="ops-account-main"><div><strong>${esc(r.display_name)}</strong><span>${esc(ROLE_KO[r.role]||r.role)} · ${r.updated_at?`최근 변경 ${fmtDate(r.updated_at,true)}`:'변경 기록 없음'}</span></div></div><div class="ops-account-number"><strong>${r.account?esc(r.account):'등록된 계좌 없음'}</strong><span>플리카 계좌</span></div><div class="ops-account-state">${accountBadge(r.status)}</div><button class="ops-mgmt-action" ${r.pending?`data-action="account-review" data-request-id="${esc(r.pending.id)}" data-review-action="approve"`:'disabled'}>${r.pending?'검수':'—'}</button></article>`).join(''):empty('조건에 맞는 계좌가 없습니다.')}</div></section></div>`; }
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
function renderSettings(state){ const visibleModules=(state.modules||[]).filter(m=>MODULE_UI[m.module_key]).sort((a,b)=>MODULE_ORDER.indexOf(a.module_key)-MODULE_ORDER.indexOf(b.module_key)); const enabled=visibleModules.filter(m=>m.enabled).length; const channels=(state.discordChannels||[]).filter(c=>c.is_text_based); const roles=(state.discordRoles||[]).filter(r=>!r.managed&&r.role_name!=='@everyone'); return `<div class="ops-settings-page">${pageHeader('COMPANY SETTINGS','회사 설정','회사 기본 정보와 Discord 기능 연결을 관리합니다.','')}<section class="ops-settings-overview"><article><span>현재 회사</span><strong>${esc(companyDisplayName(state))}</strong><small>회사 단위 설정</small></article><article><span>Discord</span><strong class="${state.discordConnection?.status==='connected'?'is-positive':''}">${state.discordConnection?.status==='connected'?'연결됨':'미연결'}</strong><small>${esc(state.discordConnection?.guild_name||'연결 필요')}</small></article><article><span>사용 기능</span><strong class="is-warning">${enabled} / ${visibleModules.length}</strong><small>활성 기능</small></article><article><span>관리 역할</span><strong>${esc(roleName(state.discordCompanyConfig?.admin_role_id,roles)||'미설정')}</strong><small>Discord 관리자 역할</small></article></section><div class="ops-settings-nav-row"><nav class="ops-settings-tabs" aria-label="회사 설정 하위 메뉴"><button class="${state.settingsTab==='basic'?'is-active':''}" data-settings-tab="basic"><strong>기본 정보</strong><span>회사·Discord 공통 값</span></button><button class="${state.settingsTab==='modules'?'is-active':''}" data-settings-tab="modules"><strong>기능 설정</strong><span>기능별 채널 · 사용 여부</span></button></nav><button class="ops-settings-save-action" form="settings-active-form" type="submit">${icon('save')}<span>설정 저장</span></button></div><div class="ops-settings-view">${state.settingsTab==='modules'?renderModuleSettings(state,channels):renderBasicSettings(state,roles)}</div></div>`; }
function roleName(id,roles){return roles.find(r=>r.role_id===id)?.role_name||'';}
function renderBasicSettings(state,roles){ const cfg=state.discordCompanyConfig||{}; return `<form id="settings-active-form" data-form="settings-basic" class="ops-settings-board ops-settings-basic"><div class="ops-settings-board-head"><div><h2>기본 정보</h2><p>회사와 Discord에서 공통으로 사용하는 핵심 값입니다.</p></div></div>${settingRow('회사 이름','서비스와 Discord 안내에 표시',`<input name="brand_name" value="${esc(companyDisplayName(state))}">`,'company')}${settingRow('관리자 역할','공금 · 멤버 · 자산 · 설정 관리',`<select name="admin_role_id"><option value="">선택 안 함</option>${roles.map(r=>`<option value="${esc(r.role_id)}" ${cfg.admin_role_id===r.role_id?'selected':''}>${esc(r.role_name)}</option>`).join('')}</select>`,'role')}${settingRow('일반 멤버 역할','회사 기능을 사용하는 일반 멤버',`<select name="member_role_id"><option value="">선택 안 함</option>${roles.map(r=>`<option value="${esc(r.role_id)}" ${cfg.member_role_id===r.role_id?'selected':''}>${esc(r.role_name)}</option>`).join('')}</select>`,'role')}${settingRow('Discord 서버','현재 연결된 서버',`<div class="ops-settings-discord"><i></i><strong>${esc(state.discordConnection?.guild_name||'미연결')}</strong><button type="button" data-action="connect-discord">관리</button></div>`,'discord')}</form>`; }
function settingRow(title,desc,control,kind){return `<div class="ops-settings-row ops-settings-row--${kind}"><div><strong>${title}</strong><span>${desc}</span></div><div class="ops-settings-control">${control}</div></div>`;}
function renderModuleSettings(state,channels){ const visible=(state.modules||[]).filter(m=>MODULE_UI[m.module_key]).sort((a,b)=>MODULE_ORDER.indexOf(a.module_key)-MODULE_ORDER.indexOf(b.module_key)); return `<form id="settings-active-form" data-form="settings-modules" class="ops-settings-board ops-settings-modules"><div class="ops-settings-board-head"><div><h2>기능 설정</h2><p>기능 하나에서 사용 여부와 필요한 Discord 채널 설정까지 끝냅니다.</p></div><span><strong>${visible.filter(m=>m.enabled).length}</strong> / ${visible.length} 사용 중</span></div><div class="ops-settings-module-list runtime-module-list">${visible.map(m=>renderModuleRow(m,channels)).join('')}</div><div class="ops-settings-module-foot"><strong>BOT 자동 반영 연결 예정</strong><span>현재는 웹 설정값 저장까지 적용됩니다. 패널 생성·갱신은 STAGING BOT bridge 단계에서 연결합니다.</span></div></form>`; }
function renderModuleRow(m,channels){ const ui=MODULE_UI[m.module_key]; const settings=m.settings||{}; const controls=ui.channels.length?`<div class="ops-settings-channels">${ui.channels.map(([key,label])=>`<label><span>${label}</span><select name="module_${m.module_key}_${key}"><option value="">채널 선택</option>${channels.map(c=>`<option value="${esc(c.channel_id)}" ${settings[key]===c.channel_id?'selected':''}>#${esc(c.channel_name)}</option>`).join('')}</select></label>`).join('')}</div>`:'<div class="ops-settings-no-channel">별도 채널 설정 없음</div>'; return `<article class="ops-settings-module ops-settings-module--channels-${ui.channels.length} ${m.enabled?'is-enabled':''}"><div class="ops-settings-module-copy"><strong>${esc(ui.name)}</strong><small>${esc(ui.desc)}</small></div>${controls}<button type="button" class="runtime-power ${m.enabled?'is-on':'is-off'}" data-action="toggle-module" data-module-key="${esc(m.module_key)}">${icon('power')}<span>${m.enabled?'ON':'OFF'}</span></button></article>`; }

function renderModal(state){ const m=state.modal; if(!m)return ''; if(m.type==='feedback')return feedbackModal(state); if(m.type==='ledger')return ledgerModal(state,m); if(m.type==='member')return memberModal(state,m); if(m.type==='asset')return assetModal(state,m); if(m.type==='account')return accountModal(state); if(m.type==='invite')return inviteModal(state,m); if(m.type==='create-company')return companyModal('create'); if(m.type==='join-company')return companyModal('join'); return ''; }
function modalShell(title,desc,body,wide=false){return `<div class="runtime-modal-backdrop" data-modal-backdrop><section class="runtime-modal ${wide?'is-wide':''}" role="dialog" aria-modal="true"><header><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><button type="button" data-action="close-modal">×</button></header>${body}</section></div>`;}
function feedbackModal(state){return modalShell('피드백 · 제보','서비스 개선 제안이나 오류를 운영자에게 전달합니다.',`<form data-form="feedback" class="runtime-modal-form"><label>유형<select name="category"><option value="improvement">개선 제안</option><option value="bug">오류 제보</option><option value="other">기타</option></select></label><label>제목<input name="title" maxlength="120" required></label><label class="is-full">내용<textarea name="detail" maxlength="4000" required></textarea></label><label class="is-full">회신 Discord <small>선택</small><input name="contact" maxlength="160" placeholder="예: @닉네임"></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">보내기</button></footer></form>`);}
function ledgerModal(state,m){ const row=(state.fundSnapshot?.ledger||[]).find(r=>r.id===m.entryId)||{}; const direction=row.direction||'수입'; const account=row.account||state.companySettings?.settings?.fund_default_account||'공용계좌'; return modalShell(row.id?'공금 내역 수정':'수입·지출 등록','회사의 수입·지출을 공금 원장에 기록합니다.',`<form data-form="ledger" class="runtime-modal-form"><input type="hidden" name="entry_id" value="${esc(row.id||'')}"><label>날짜<input name="ledger_date" type="date" value="${esc(row.ledger_date?dateKey(row.ledger_date):dateKey(new Date()))}" required></label><label>구분<select name="direction"><option ${direction==='수입'?'selected':''}>수입</option><option ${direction==='지출'?'selected':''}>지출</option></select></label><label>항목<input name="category" value="${esc(row.category||'')}" placeholder="예: 재료 구입" required></label><label>금액<input name="amount" type="number" min="1" value="${esc(Math.abs(Number(row.amount||0))||'')}" required></label><label>계좌<select name="account"><option ${account==='공용계좌'?'selected':''}>공용계좌</option><option ${account==='회사잔고'?'selected':''}>회사잔고</option></select></label><label>관련자<select name="membership_id"><option value="">관련자 없음</option>${(state.memberships||[]).filter(x=>x.status==='active').map(x=>`<option value="${esc(x.id)}" ${row.membership_id===x.id?'selected':''}>${esc(x.display_name||'멤버')}</option>`).join('')}</select></label><label class="is-full">메모<textarea name="memo">${esc(row.memo||'')}</textarea></label><footer>${row.id?`<button type="button" class="runtime-btn-danger" data-action="cancel-ledger" data-entry-id="${esc(row.id)}">내역 취소</button>`:'<span></span>'}<div><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">${row.id?'수정 저장':'내역 등록'}</button></div></footer></form>`,true);}
function memberModal(state,m){ const row=(state.memberships||[]).find(x=>x.id===m.membershipId); if(!row)return ''; return modalShell('멤버 관리',row.display_name||'멤버',`<form data-form="member" class="runtime-modal-form"><input type="hidden" name="membership_id" value="${esc(row.id)}"><label>역할<select name="role">${['owner','admin','manager','member'].map(r=>`<option value="${r}" ${row.role===r?'selected':''}>${ROLE_KO[r]}</option>`).join('')}</select></label><label>상태<select name="status"><option value="active" ${row.status==='active'?'selected':''}>활동</option><option value="suspended" ${row.status==='suspended'?'selected':''}>중지</option><option value="left" ${row.status==='left'?'selected':''}>퇴사</option></select></label><label class="is-full">Discord<input value="${esc(row.discord_user_id||'미연결')}" disabled></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">저장</button></footer></form>`);}
function assetModal(state,m){ const row=(state.assetsSnapshot?.assets||[]).find(x=>x.id===m.assetId)||{}; return modalShell(row.id?'자산 수정':'자산 추가','회사 자산과 현재 보유자를 관리합니다.',`<form data-form="asset" class="runtime-modal-form"><input type="hidden" name="asset_id" value="${esc(row.id||'')}"><label>자산명<input name="asset_name" value="${esc(row.asset_name||'')}" required></label><label>분류<input name="asset_category" value="${esc(row.asset_category||'기타')}" required></label><label>보유자<select name="membership_id"><option value="">미배정</option>${(state.assetsSnapshot?.members||[]).filter(x=>x.status==='active').map(x=>`<option value="${esc(x.id)}" ${row.membership_id===x.id?'selected':''}>${esc(x.display_name)}</option>`).join('')}</select></label><label>상태<input name="status" value="${esc(row.status||'')}" placeholder="보유 / 미배정"></label><label>기존 ID<input name="legacy_no" value="${esc(row.legacy_no||'')}" placeholder="선택"></label><label>취득 방식<input name="acquisition_method" value="${esc(row.acquisition_method||'')}" placeholder="선택"></label><label class="is-full">메모<textarea name="note">${esc(row.note||'')}</textarea></label><footer>${row.id&&row.membership_id?`<button type="button" class="runtime-btn-danger" data-action="return-asset" data-asset-id="${esc(row.id)}">반납 처리</button>`:'<span></span>'}<div><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">저장</button></div></footer></form>`,true);}
function accountModal(state){ const mine=accountRecords(state).find(r=>r.membership_id===currentMembership(state)?.id); return modalShell(mine?.account?'내 계좌 변경 신청':'내 계좌 등록 신청','계좌 변경은 관리자 검수 후 반영됩니다.',`<form data-form="account-request" class="runtime-modal-form"><label class="is-full">플리카 계좌<input name="account" value="${esc(mine?.account||'')}" inputmode="numeric" maxlength="20" required></label><label class="is-full">메모<textarea name="note" placeholder="변경 사유 등"></textarea></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">신청 제출</button></footer></form>`);}
function inviteModal(state,m){ return modalShell('멤버 초대','초대코드를 전달하면 상대가 MEMBER로 참가할 수 있습니다.',m.code?`<div class="runtime-invite-code"><span>초대코드</span><strong>${esc(m.code)}</strong><button data-action="copy-invite" data-invite-code="${esc(m.code)}">복사</button></div><div class="runtime-modal-simple-footer"><button class="runtime-btn-primary" data-action="close-modal">확인</button></div>`:`<form data-form="invite" class="runtime-modal-form"><label>사용 가능 횟수<input name="max_uses" type="number" min="1" max="500" value="1"></label><label>유효시간<input name="expires_in_hours" type="number" min="1" max="2160" value="168"></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">초대코드 생성</button></footer></form>`);}
function companyModal(type){ if(type==='create')return modalShell('새 회사 생성','생성자는 OWNER가 됩니다.',`<form data-form="create-company" class="runtime-modal-form"><label>회사 이름<input name="name" maxlength="80" required></label><label>Slug <small>선택</small><input name="slug" maxlength="63"></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">생성</button></footer></form>`); return modalShell('초대코드로 참가','회사 관리자에게 받은 초대코드를 입력합니다.',`<form data-form="redeem-invite" class="runtime-modal-form"><label class="is-full">초대코드<input name="invite_code" required></label><footer><button type="button" class="runtime-btn-ghost" data-action="close-modal">취소</button><button class="runtime-btn-primary" type="submit">참가</button></footer></form>`);}

export { esc, icon, money, signedMoney, fmtDate, currentMembership, canAdmin, moduleEnabled, moduleRow, companyDisplayName, userDisplayName };
