// WEB presentation/entry rules. These do not replace RLS, RPC authorization, or protected server delivery.
export const WEB_CONTENT_KEYS = Object.freeze(['company_management','game_info','lac_build','lac_cook']);
export function contentPolicy(state,key){
  if(!state?.contentPoliciesLoaded)return null;
  return (state.contentPolicies||[]).find(row=>row.content_key===key)||null;
}
export function contentIsVisible(state,key){return contentPolicy(state,key)?.is_published===true;}
export function hasCompany(state){return Boolean(state?.companyId&&(state.companies||[]).some(c=>c.id===state.companyId));}
export function hasUnifiedPass(state){
  return hasCompany(state) && state.companyAccess?.company_id===state.companyId && state.companyAccess?.can_use===true;
}
export function canOpenWebContent(state,key){
  if(!state?.session?.user||!contentIsVisible(state,key))return false;
  if(key==='company_management')return hasUnifiedPass(state); // free flag NEVER exposes private company records.
  if(['game_info','lac_build','lac_cook'].includes(key))return contentPolicy(state,key)?.is_free===true||hasUnifiedPass(state);
  return false;
}
export function contentCardStatus(state,key){
  if(!contentIsVisible(state,key))return null;
  if(key!=='company_management'&&contentPolicy(state,key)?.is_free===true)return '자유 이용';
  if(!hasCompany(state))return '회사 등록 후';
  if(hasUnifiedPass(state))return '이용 가능';
  if(state.companyAccess?.company_id===state.companyId && state.companyAccess?.entitlement_enabled===true)return '이용 제한';
  return '이용 신청';
}
