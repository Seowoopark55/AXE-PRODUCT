import fs from 'node:fs';
const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/styles/management.css', import.meta.url), 'utf8');
const fund = fs.readFileSync(new URL('../src/styles/fund.css', import.meta.url), 'utf8');
const checks = [
  ['member semantic table', render.includes('ops-member-table') && render.includes('<thead><tr><th>이름</th><th>역할</th><th>입사일</th><th>상태</th><th>관리</th>')],
  ['asset semantic table', render.includes('ops-asset-table') && render.includes('<th>보유자</th><th>자산</th><th>분류</th><th>상태</th><th>관리</th>')],
  ['account semantic table', render.includes('ops-account-table') && render.includes('function accountBadge(')],
  ['shared workspace width', css.includes('width:min(860px,100%)')],
  ['left aligned shared workspace', css.includes('margin-left:0;margin-right:0')],
  ['no 3.16.7 tiny table widths', !css.includes('width:min(650px,100%)') && !css.includes('width:min(660px,100%)') && !css.includes('width:min(700px,100%)')],
  ['redundant member labels removed', !render.includes('<small>역할</small>') && !render.includes('<small>입사일</small>')],
  ['redundant asset labels removed', !render.includes('<small>현재 보유자</small>') && !render.includes('<small>자산명</small>')],
  ['redundant account label removed', !render.includes('<small>플리카 계좌</small>')],
  ['fund entry is dominant column', fund.includes('col.is-entry{width:35%}')],
  ['fund text headers match body alignment', fund.includes('thead th:nth-child(2)') && fund.includes('text-align:left')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} · ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
console.log(`workspace table check: ${checks.length}/${checks.length} PASS`);
