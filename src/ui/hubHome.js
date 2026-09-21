import { HUB_CONTENT } from '../platform/catalog.js';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function renderHubHome(state) {
  const companies = state.companies || [];
  const current = companies.find(company => company.id === state.companyId) || null;
  const metadata = state.session?.user?.user_metadata || {};
  const displayName = esc(metadata.full_name || metadata.name || metadata.global_name || 'Discord 사용자');
  const owner = state.platformAdmin === true;
  const canCreate = state.canCreateCompany === true;
  return `<div class="hub-home">
    <header class="hub-topbar">
      <span class="hub-wordmark"><strong>LAC HUB</strong><small>통합 플랫폼</small></span>
      <div class="hub-account"><span>${displayName}</span>${owner ? '<span class="hub-owner">서비스 운영자</span>' : ''}<button type="button" data-action="logout">로그아웃</button></div>
    </header>
    <main class="hub-body">
      <section class="hub-intro"><span class="hub-eyebrow">YOUR WORKSPACE</span><h1>필요한 기능을 한곳에서</h1><p>Discord 계정으로 콘텐츠를 이용하고, 회사 운영 공간을 관리할 수 있습니다.</p></section>
      <section class="hub-company" aria-label="회사 선택 및 등록">
        <div><span class="hub-section-label">회사 공간</span><h2>${current ? esc(current.name) : '소속 회사 없음'}</h2><p>${current ? '선택한 회사의 운영 공간입니다.' : '회사에 소속되지 않아도 HUB 메인을 이용할 수 있습니다.'}</p></div>
        <div class="hub-company-actions">
          ${companies.length > 1 || (companies.length && !current) ? `<div class="hub-company-list" aria-label="회사 변경">${companies.map(company => `<button type="button" data-action="switch-company" data-company-id="${esc(company.id)}" ${company.id === state.companyId ? 'aria-current="true"' : ''}>${esc(company.name)}</button>`).join('')}</div>` : ''}
          ${!companies.length ? '<button type="button" class="hub-btn hub-btn--secondary" data-action="open-company-start">회사 등록 · 가입 안내</button>' : ''}
          ${canCreate ? '<button type="button" class="hub-btn hub-btn--secondary" data-action="open-create-company">+ 새 회사</button>' : ''}
          ${owner ? '<button type="button" class="hub-btn hub-btn--secondary" data-action="open-platform-admin">서비스 관리</button>' : ''}
        </div>
      </section>
      <div class="hub-row-heading"><div><span class="hub-section-label">CONTENTS</span><h2>콘텐츠</h2></div><span>이용 가능한 서비스와 연결 예정인 서비스를 확인하세요.</span></div>
      <section class="hub-cards" aria-label="콘텐츠 목록">
        <article class="hub-content-card"><span class="hub-card-index">01 · OPERATIONS</span><div class="hub-card-status">기존 서비스</div><h3>${HUB_CONTENT.company.name}</h3><p>${HUB_CONTENT.company.description}</p><div class="hub-card-footer"><span>${current ? '선택 회사로 이동' : '회사 등록 또는 가입 필요'}</span>${current ? '<button type="button" class="hub-btn hub-btn--primary" data-action="open-company-console">회사 관리 열기 →</button>' : '<button type="button" class="hub-btn hub-btn--secondary" data-action="open-company-start">회사 안내 보기 →</button>'}</div></article>
        <article class="hub-content-card"><span class="hub-card-index">02 · BUILDER</span><div class="hub-card-status hub-card-status--free">무료 이용 정책 확정</div><h3>${HUB_CONTENT.build.name}</h3><p>${HUB_CONTENT.build.description}</p><div class="hub-card-footer"><span>회사 가입 없이 이용 · 연결 준비 중</span><span class="hub-btn hub-btn--disabled" aria-label="LAC BUILD 연결 준비 중">연결 준비 중</span></div></article>
        <article class="hub-content-card"><span class="hub-card-index">03 · COOKING</span><div class="hub-card-status hub-card-status--planned">통합 예정</div><h3>${HUB_CONTENT.cook.name}</h3><p>${HUB_CONTENT.cook.description}</p><div class="hub-card-footer"><span>이용 정책 추후 결정</span><span class="hub-btn hub-btn--disabled">준비 중</span></div></article>
      </section>
      <section class="hub-license" aria-label="이용권 등록 상태"><div><span class="hub-section-label">ACCESS PASS</span><h2>회사별 콘텐츠 이용권</h2><p>회사 관리 이용권 등록은 다음 단계에서 연결합니다. 이용권 등록은 HUB 메인에서 제공될 예정입니다.</p></div><span class="hub-license-pending">등록 기능 준비 중</span></section>
    </main>
  </div>`;
}
