// Presentation/entry policy only. PRIVATE data access is enforced by Supabase RLS and RPCs.
// This module must NEVER grant access to another company's private records.
export const WEB_CONTENT_KEYS = Object.freeze(['company_management','game_info','lac_build','lac_cook']);

export function contentPolicy(state, key) {
  if (!state?.contentPoliciesLoaded) return null;
  return (state.contentPolicies || []).find(row => row.content_key === key) || null;
}
export function contentIsVisible(state, key) {
  const policy=contentPolicy(state,key);
  return policy?.is_published === true;
}
export function hasCompany(state) {
  return Boolean(state?.companyId && (state.companies || []).some(c => c.id === state.companyId));
}
export function canOpenWebContent(state,key) {
  if (!state?.session?.user || !contentIsVisible(state,key)) return false;
  if (key==='company_management') return hasCompany(state); // Never expose a real company's data just because is_free=true.
  if (key==='game_info' || key==='lac_cook') return contentPolicy(state,key)?.is_free === true || hasCompany(state);
  if (key==='lac_build') return contentPolicy(state,key)?.is_free === true || hasCompany(state);
  return false;
}
export function contentCardStatus(state,key){
  if (!contentIsVisible(state,key)) return null;
  if (key==='company_management') return hasCompany(state)?'이용 가능':'회사 등록 후';
  return contentPolicy(state,key)?.is_free===true?'자유 이용':hasCompany(state)?'이용 가능':'회사 등록 후';
}
