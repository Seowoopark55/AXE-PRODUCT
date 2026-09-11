import fs from 'node:fs';

const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const mgmt = fs.readFileSync(new URL('../src/styles/management.css', import.meta.url), 'utf8');
const fund = fs.readFileSync(new URL('../src/styles/fund.css', import.meta.url), 'utf8');

const checks = [
  ['member column header', render.includes('ops-member-column-head') && render.includes('<span>이름</span><span>역할</span><span>입사일</span><span>상태</span><span>관리</span>')],
  ['member order role before hire', render.indexOf('ops-member-role') < render.indexOf('ops-member-hire')],
  ['asset column header', render.includes('ops-asset-column-head') && render.includes('<span>보유자</span><span>자산</span><span>분류</span><span>상태</span><span>관리</span>')],
  ['asset category own column', render.includes('ops-asset-category')],
  ['account column header', render.includes('ops-account-column-head') && render.includes('<span>이름</span><span>계좌번호</span><span>상태</span><span>관리</span>')],
  ['account row removes recent-change date', !render.includes('최근 변경 ${fmtDate(r.updated_at,true)}')],
  ['fund six-column header', render.includes('axe-fund-history-columns') && render.includes('<span>날짜</span><span>이름</span><span>내역</span><span>금액</span><span>증빙</span><span>관리</span>')],
  ['fund current member mapping', render.includes("current=(state.memberships||[]).find(m=>m.id===r.membership_id)")],
  ['fund dedicated evidence/manage cells', render.includes('axe-fund-history-evidence') && render.includes('axe-fund-history-manage')],
  ['management balanced tracks', mgmt.includes('3.16.5 balanced row grid') && mgmt.includes('.ops-mgmt-column-head')],
  ['fund balanced tracks', fund.includes('3.16.5 balanced ledger grid') && fund.includes('grid-template-columns:72px minmax(92px,.95fr) minmax(0,1.55fr) 104px 62px 62px')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log(`balanced-grid-check: ${checks.length}/${checks.length} PASS`);
