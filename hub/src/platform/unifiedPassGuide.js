function escapeHtml(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
export function companyPassRequestText(view, contentName='LAC HUB'){
  const company=(view.companies||[]).find(c=>c.id===view.companyId);
  const role=(view.memberships||[]).find(m=>m.user_id===view.session?.user?.id && m.company_id===view.companyId)?.role;
  return (role==='owner'||role==='admin'?'LAC HUB 운영자에게 통합 이용권 신청':'회사 대표·관리자에게 통합 이용권 신청 요청')+`\n회사: ${company?.name||'확인 필요'}\n요청 콘텐츠: ${contentName}\n통합 이용권 확인 및 이용 안내를 부탁드립니다.`;
}
export function renderCompanyPassNotice(view,contentName,forCook=false){
  const role=(view.memberships||[]).find(m=>m.user_id===view.session?.user?.id && m.company_id===view.companyId)?.role;
  const owner=role==='owner'||role==='admin';
  const status=view.companyAccess?.subscription_status;
  const paused=status==='paused'||status==='expired';
  const missing=view.companyAccessError;
  const explanation=missing?'이용권 상태를 확인하지 못했습니다. 잠시 후 새로고침해 주세요.':paused?'현재 회사의 통합 이용권이 일시정지 또는 만료된 상태입니다. 회사 대표·관리자가 운영자에게 문의해 주세요.':view.companyAccess?.entitlement_enabled?'이용권 상태를 확인 중입니다. 회사 대표·관리자가 운영자에게 문의해 주세요.':'회사 소속은 확인됐지만 통합 이용권이 아직 부여되지 않았습니다.';
  return `<section class="lac-company-pass-guide" aria-label="통합 이용권 이용 안내"><div class="lac-company-pass-guide__status"><span>통합 이용권 · 이용 신청</span><strong>${escapeHtml(contentName)} 이용 안내</strong><p>${explanation}</p></div><div class="lac-company-pass-guide__steps"><strong>${owner?'운영자에게 이용권 신청하기':'대표·관리자에게 이용 요청하기'}</strong><p>${owner?'아래 요청 문구를 복사해 LAC HUB 운영자에게 전달하세요. 운영자가 회사의 통합 이용권을 부여하면 소속 멤버에게 함께 적용됩니다.':'회사 대표 또는 관리자에게 통합 이용권 신청을 부탁해 주세요. 멤버 개인에게 별도의 이용권 등록 코드를 요구하지 않습니다.'}</p><button type="button" data-action="copy-company-pass-request" ${missing?'disabled':''}>${owner?'운영자에게 보낼 요청 복사':'대표에게 보낼 요청 복사'}</button>${forCook?'':'<button type="button" data-action="refresh-company-pass">이용권 상태 새로고침</button>'}</div></section>`;
}
