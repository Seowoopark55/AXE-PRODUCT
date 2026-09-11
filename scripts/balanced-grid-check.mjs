import fs from 'node:fs';

const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const mgmt = fs.readFileSync(new URL('../src/styles/management.css', import.meta.url), 'utf8');
const fund = fs.readFileSync(new URL('../src/styles/fund.css', import.meta.url), 'utf8');

const checks = [
  ['member semantic table', render.includes('ops-member-table') && render.includes('<th>이름</th><th>역할</th><th>입사일</th><th>상태</th><th>관리</th>')],
  ['member order role before hire', render.indexOf('data-label="역할"') < render.indexOf('data-label="입사일"')],
  ['asset semantic table', render.includes('ops-asset-table') && render.includes('<th>보유자</th><th>자산</th><th>분류</th><th>상태</th><th>관리</th>')],
  ['asset category own column', render.includes('data-label="분류"')],
  ['account semantic table', render.includes('ops-account-table') && render.includes('<th>이름</th><th>계좌번호</th><th>상태</th><th>관리</th>')],
  ['account row removes recent-change date', !render.includes('최근 변경 ${fmtDate(r.updated_at,true)}')],
  ['fund six-column table', render.includes('axe-fund-table') && render.includes('<th>날짜</th><th>이름</th><th>내역</th><th>금액</th><th>증빙</th><th>관리</th>')],
  ['fund current member mapping', render.includes("current=(state.memberships||[]).find(m=>m.id===r.membership_id)")],
  ['fund dedicated evidence/manage cells', render.includes('data-label="증빙"') && render.includes('data-label="관리"')],
  ['management colgroup tracks', mgmt.includes('.ops-member-table col.is-name{width:30%}') && mgmt.includes('.ops-asset-table col.is-asset{width:29%}')],
  ['fund colgroup tracks', fund.includes('.axe-fund-table col.is-entry{width:32%}') && fund.includes('.axe-fund-table col.is-money{width:16%}')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log(`balanced-grid-check: ${checks.length}/${checks.length} PASS`);
