import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const management=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../src/styles/layout.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[
  ['web package version',pkg.version==='1.7.41-web-ui.71'],
  ['header identity role is inline badge',render.includes('runtime-account-trigger__identity')&&layout.includes('.runtime-account-trigger em{')],
  ['single-page range footer is hidden',render.includes('paged.totalPages<=1)return')],
  ['multi-page footer uses compact total copy',render.includes('· 총 ${paged.total}${esc(noun)}')],
  ['member role is inline badge',render.includes('ops-member-identity')&&render.includes('ops-role-badge')],
  ['member board is four lanes',render.includes('<span>이름</span><span>입사일</span><span>상태</span><span>관리</span>')&&management.includes('grid-template-columns:300px 110px 90px 75px')],
  ['unfiltered member result strip is suppressed',render.includes('const memberFiltered=Boolean(')],
  ['asset metadata is inline tag',render.includes('ops-asset-identity')&&render.includes('ops-inline-tag')],
  ['account role is inline badge',render.includes('ops-lane-row--account')&&render.includes('ops-member-identity')],
  ['cooking generic placeholder detail is hidden',render.includes("!['설명','상세 설명'].includes(detail)")],
  ['cooking order is compact badge',render.includes('ops-cooking-order-badge')&&settings.includes('.ops-cooking-order-badge{')],
  ['cooking price is single-line per SET',render.includes('<em>/SET</em>')],
  ['fund date is one line',render.includes('${y}.${m}.${d}')&&!render.includes('<strong>${m}.${d}</strong><span>${y}</span>')],
  ['fund account/type/direction use inline tags',render.includes('axe-fund-ledger-tag is-account')&&render.includes("axe-fund-ledger-tag ${r.direction==='수입'?'is-income':'is-expense'}")],
  ['fund ledger compact row styling exists',fund.includes('.axe-fund-ledger-meta{')&&fund.includes('.axe-fund-ledger-note{')],
];
let passed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`List visual cleanup: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
