import { HUB_CONTENT } from '../platform/catalog.js';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

const ASSETS = '/hub/';

function contentCard({title,description,image,tag,tagType='',action='',disabled=false,footnote=''}) {
  const stateClass=tagType ? ` hub-feature__tag--${tagType}` : '';
  // Each available card is ONE native button. The arrow is decorative and never
  // the only click target; upcoming services are not advertised as working links.
  const active=Boolean(action && !disabled);
  const open=active ? `<button type="button" class="hub-feature hub-feature--interactive" data-action="${esc(action)}" aria-label="${esc(title)} ${action==='open-company-start'?'이용 안내':'열기'}">` : `<article class="hub-feature hub-feature--pending">`;
  const close=active ? '</button>' : '</article>';
  return `${open}<span class="hub-feature__visual"><img src="${ASSETS}${image}" alt="" loading="eager" decoding="async"><span class="hub-feature__tag${stateClass}">${esc(tag)}</span></span>
    <span class="hub-feature__content"><span><strong class="hub-feature__name">${esc(title)}</strong><span class="hub-feature__description">${esc(description)}</span>${footnote?`<small>${esc(footnote)}</small>`:''}</span>${active?'<span class="hub-feature__enter" aria-hidden="true">→</span>':'<span class="hub-feature__pending" aria-hidden="true">준비 중</span>'}</span>${close}`;
}

export function renderHubHome(state) {
  const companies = state.companies || [];
  const current = companies.find(company => company.id === state.companyId) || null;
  const metadata = state.session?.user?.user_metadata || {};
  const displayName = esc(metadata.full_name || metadata.name || metadata.global_name || 'Discord 사용자');
  const owner = state.platformAdmin === true;
  const canCreate = state.canCreateCompany === true;
  const companyAction = current ? 'open-company-console' : 'open-company-start';
  const companyLabel = current ? '회사 관리 열기' : '회사 등록 · 가입 안내';
  const companiesMenu = companies.length > 1 ? `<div class="hub-company-menu"><span>회사 변경</span>${companies.map(company => `<button type="button" data-action="switch-company" data-company-id="${esc(company.id)}" ${company.id === state.companyId ? 'aria-current="true"' : ''}>${esc(company.name)}</button>`).join('')}</div>` : '';
  return `<div class="hub-home">
    <header class="hub-topbar"><div class="hub-topbar__inner">
      <span class="hub-wordmark"><img src="${ASSETS}mark.png" alt="" width="32" height="32"><strong>LAC HUB</strong></span>
      <nav class="hub-nav" aria-label="통합 플랫폼"><span class="hub-nav__current" aria-current="page">홈</span><button type="button" data-action="${companyAction}">내 회사</button></nav>
      <div class="hub-account"><span class="hub-account__name">${displayName}</span>${owner?'<button type="button" class="hub-admin-link" data-action="open-platform-admin">관리 센터</button>':''}<button type="button" class="hub-logout" data-action="logout">로그아웃</button></div>
    </div></header>
    <main class="hub-body">
      <section class="hub-hero" aria-labelledby="hub-headline"><div class="hub-hero__shade"></div><div class="hub-hero__copy"><span class="hub-kicker">LAC HUB</span><h1 id="hub-headline">LAC를 즐기는<br><em>더 편리한 방법</em></h1><p>게임 정보와 다양한 편의 기능을<br>LAC HUB에서 만나보세요.</p><div class="hub-hero__actions"><button type="button" class="hub-cta hub-cta--primary" data-action="${companyAction}">${current?'내 회사로 이동':'회사 등록 · 가입'} <span aria-hidden="true">→</span></button></div></div></section>
      <div class="hub-toolbar"><div class="hub-toolbar__lead"><span class="hub-toolbar__eyebrow">MY SPACE</span><strong>${current?esc(current.name):'내 회사'}</strong><span class="hub-toolbar__hint">${current?'선택된 회사':'회사에 가입하지 않아도 무료 콘텐츠를 이용할 수 있어요.'}</span></div><div class="hub-toolbar__actions">${companiesMenu}<button type="button" class="hub-small-button hub-small-button--primary" data-action="${companyAction}">${companyLabel} →</button>${canCreate?'<button type="button" class="hub-small-button" data-action="open-create-company">+ 새 회사</button>':''}</div></div>
      <section class="hub-contents" id="hub-contents" aria-labelledby="hub-contents-title"><div class="hub-contents__title"><div><span class="hub-kicker">EXPLORE LAC HUB</span><h2 id="hub-contents-title">콘텐츠</h2></div><p>나에게 필요한 서비스를 선택해 보세요.</p></div>
        <div class="hub-features">
          ${contentCard({title:HUB_CONTENT.company.name,description:HUB_CONTENT.company.description,image:'company.webp',tag:current?'이용 가능':'회사 선택 필요',tagType:current?'available':'neutral',action:companyAction})}
          ${contentCard({title:'게임 정보',description:'게임과 관련된 정보와 자료를 확인하세요.',image:'game.webp',tag:current?'회사 멤버 이용':'회사 선택 필요',tagType:current?'available':'neutral',action:current?'open-hub-game-info':'open-company-start',footnote:current?'기존 회사별 정보 권한 유지':'현재 회사 가입 후 이용'})}
          ${contentCard({title:HUB_CONTENT.build.name,description:HUB_CONTENT.build.description,image:'build.webp',tag:'무료',tagType:'free',disabled:true,footnote:'HUB 연결 준비 중 · 기존 독립 사이트 유지'})}
          ${contentCard({title:HUB_CONTENT.cook.name,description:HUB_CONTENT.cook.description,image:'cook.webp',tag:'통합 예정',tagType:'neutral',disabled:true,footnote:'서비스 준비 중'})}
        </div>
      </section>
      <footer class="hub-footer"><span>LAC HUB · PLAY TOGETHER</span><span>회사 관리 · 게임 정보 · LAC BUILD · LAC COOK</span></footer>
    </main>
  </div>`;
}
