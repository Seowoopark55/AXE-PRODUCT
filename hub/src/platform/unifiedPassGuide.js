function escapeHtml(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
// Both company management and COOK render the same application component.
export function renderCompanyPassNotice(view){
  const error=view.companyAccessError||view.companyPassRequestError;
  const access=view.companyAccess;
  const request=view.companyPassRequest;
  const entitled=access?.entitlement_enabled===true;
  const status=access?.subscription_status;
  const paused=['paused','expired','pending','unassigned'].includes(status);
  let heading='통합 이용권 등록 후 사용할 수 있어요';
  let detail='신청 후 운영자가 승인하면 우리 회사의 모든 멤버에게 이용권이 적용됩니다.';
  let action='';
  if(error){
    heading='이용권 상태를 확인하지 못했어요';
    detail='잠시 후 페이지를 새로 열어 주세요. 확인 전에는 신청과 콘텐츠 이용이 제한됩니다.';
  }else if(entitled && paused){
    heading='이용권이 발급되었지만 현재 이용이 제한돼요';
    detail='회사의 기존 구독이 일시정지·만료 또는 시작 대기 중입니다. 대표·관리자에게 운영자 확인을 요청해 주세요.';
  }else if(entitled){
    heading='회사 이용권이 발급되었습니다';
    detail='HUB에서 원하는 콘텐츠를 선택해 주세요.';
  }else if(request?.status==='pending'){
    heading='🎟️ 이용권 신청이 접수되었어요';
    detail='운영자가 확인 중입니다. 승인되면 회사 멤버 모두에게 적용됩니다.';
    action='<span class="lac-pass-application__pending" role="status">⏳ 승인 대기 중</span>';
  }else{
    if(status==='paused')detail='이용권 신청 후 운영자가 승인하면 발급됩니다. 회사의 기존 일시정지 해제 후 실제로 이용할 수 있습니다.';
    if(request?.status==='rejected')detail='이전 신청이 반려되었습니다. 일정 시간 후 다시 신청할 수 있습니다.';
    action='<button type="button" class="lac-pass-application__submit" data-action="submit-company-pass-request">✉️ 이용권 신청하기 <span aria-hidden="true">→</span></button>';
  }
  return `<section class="lac-company-pass-guide lac-pass-application" aria-label="통합 이용권 신청"><div class="lac-pass-application__icon" aria-hidden="true">🎟️</div><div class="lac-pass-application__body"><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(detail)}</p>${action}</div></section>`;
}
