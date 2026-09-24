function escapeHtml(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
// A shared view for company management and LAC COOK: one company, one request.
export function renderCompanyPassNotice(view){
  const error=view.companyAccessError||view.companyPassRequestError;
  const access=view.companyAccess;
  const request=view.companyPassRequest;
  const naturallyExpired=access?.subscription_status==='expired';
  const entitled=access?.entitlement_enabled===true&&!naturallyExpired;
  const paused=['paused','pending','unassigned'].includes(access?.subscription_status);
  let heading='통합 이용권으로 우리 회사의 모든 콘텐츠를 이용하세요';
  let detail='한 번 신청하면 운영자 승인 후 회사 멤버에게 함께 적용됩니다.';
  let phase='이용권 신청';
  let icon='🎟️';
  let action='';
  if(error){
    phase='상태 확인 필요';icon='⚠️';
    heading='이용권 상태를 확인하지 못했어요';
    detail='잠시 후 다시 접속해 주세요. 확인 전에는 콘텐츠 이용과 신청이 제한됩니다.';
  }else if(entitled && paused){
    phase='현재 이용 제한';icon='🔒';
    heading='이용권이 발급되었지만 이용이 제한돼요';
    detail='회사 구독이 일시정지·만료 또는 시작 대기 중입니다. 대표·관리자에게 문의해 주세요.';
  }else if(entitled){
    phase='발급 완료';icon='✅';
    heading='우리 회사의 이용권이 발급되었어요';
    detail='HUB에서 원하는 콘텐츠를 선택해 주세요.';
  }else if(request?.status==='pending'){
    phase='신청 접수 완료';icon='⏳';
    heading='이용권 승인 대기 중이에요';
    detail='운영자가 신청을 확인하고 있습니다. 승인되면 회사 멤버에게 함께 적용됩니다.';
    action='<span class="lac-pass-application__pending" role="status">⏳ 승인 대기 중</span>';
  }else{
    if(naturallyExpired){heading='이용권이 만료되었어요';detail='새 이용권을 신청하면 운영자 승인 후 새 발급 시각부터 기간이 시작됩니다.';}
    if(access?.subscription_status==='paused')detail='승인 후 이용권이 발급됩니다. 현재 회사 일시정지는 별도 해제가 필요합니다.';
    if(request?.status==='rejected'){
      heading='이전 신청이 반려되었어요';
      detail=view.platformAdmin?'재신청 제한 없이 테스트할 수 있습니다.':'다시 신청할 수 있어요. 일반 계정은 반려 후 30분간 재신청이 제한됩니다.';
    }
    action='<button type="button" class="lac-pass-application__submit" data-action="submit-company-pass-request"><span aria-hidden="true">✉️</span><span>이용권 신청하기</span><span class="lac-pass-application__arrow" aria-hidden="true">→</span></button>';
  }
  return `<section class="lac-company-pass-guide lac-pass-application" aria-label="통합 이용권 신청"><div class="lac-pass-application__icon" aria-hidden="true">${icon}</div><div class="lac-pass-application__body"><span class="lac-pass-application__phase">${escapeHtml(phase)} <span aria-hidden="true">·</span> 회사 통합 이용권</span><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(detail)}</p>${action}</div></section>`;
}
