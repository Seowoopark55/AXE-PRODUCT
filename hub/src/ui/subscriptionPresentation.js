// Display-only subscription descriptions. Never infer an unlimited grant from a null end date.
export const COMPANY_PLAN_NAMES = Object.freeze({
  trial:'7일 체험', standard:'30일 이용', pro:'90일 이용', internal:'무제한', legacy:'무제한',
});
export const COMPANY_STATUS_NAMES = Object.freeze({
  trial:'체험', active:'사용중', paused:'정지', expired:'만료', lifetime:'무제한',
});
export function companyPlanName(plan) {
  return COMPANY_PLAN_NAMES[String(plan || '')] || (plan ? String(plan) : '플랜 미설정');
}
export function companyStatusName(row) {
  if (!row) return '조회 정보 없음';
  const status = row.effective_status || row.subscription_status || row.status;
  return COMPANY_STATUS_NAMES[String(status || '')] || (status ? String(status) : '상태 미설정');
}
export function isUnlimitedCompanySubscription(row) {
  if (!row || row.ends_at) return false;
  return ['internal','legacy'].includes(String(row.plan || ''))
    || ['lifetime'].includes(String(row.subscription_status || row.status || ''));
}
export function companySubscriptionEnd(row, formatDate) {
  if (!row) return '조회 정보 없음';
  if (row.ends_at) return formatDate(row.ends_at);
  return isUnlimitedCompanySubscription(row) ? '무제한' : '종료일 미설정';
}
export function companySubscriptionPeriod(row, formatDate) {
  if (!row) return '조회 정보 없음';
  if (!row.ends_at) return companySubscriptionEnd(row, formatDate);
  const days = row.days_remaining;
  if (days === null || days === undefined || !Number.isFinite(Number(days))) return companySubscriptionEnd(row, formatDate);
  const remaining = Number(days) < 0 ? `${Math.abs(Number(days))}일 초과` : `D-${Number(days)}`;
  return `${companySubscriptionEnd(row, formatDate)} · ${remaining}`;
}
