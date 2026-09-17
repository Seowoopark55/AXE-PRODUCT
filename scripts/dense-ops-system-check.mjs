import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const mgmt=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const tokens=fs.readFileSync(new URL('../src/styles/tokens.css',import.meta.url),'utf8');
const checks=[
  ['settings-scale workspace',mgmt.includes('.ops-mgmt-workspace{width:min(680px,100%)')],
  ['single compact board contract',mgmt.includes('.ops-mgmt-board{width:min(680px,100%)')],
  ['member fixed lanes',render.includes('<div class="ops-lane-head ops-lane-head--member"><span>이름</span><span>Discord</span><span>역할</span><span>입사일</span><span>상태</span><span>관리</span>')&&render.includes('ops-lane-row ops-lane-row--member')&&mgmt.includes('.main--members .ops-lane-head--member,\n  .main--members .ops-lane-row--member{\n    grid-template-columns:minmax(0,.90fr) minmax(0,1.10fr) minmax(0,.90fr) minmax(0,.86fr) minmax(0,.72fr) minmax(0,.58fr);')],
  ['asset fixed lanes',render.includes('<div class="ops-lane-head ops-lane-head--asset"><span>보유자</span><span>자산</span><span>취득 방식</span><span>분류</span><span>메모</span><span>상태</span><span>관리</span>')&&render.includes('ops-lane-row ops-lane-row--asset')&&mgmt.includes('.main--assets .ops-lane-head--asset,\n  .main--assets .ops-lane-row--asset{\n    grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr) minmax(0,.96fr) minmax(0,.72fr) minmax(0,1.02fr) minmax(0,.72fr) minmax(0,.58fr);')],
  ['account fixed lanes',render.includes('ops-lane-head--account')&&render.includes('ops-lane-row--account')&&mgmt.includes('.main--accounts .ops-lane-head--account,\n  .main--accounts .ops-lane-row--account{\n    grid-template-columns:minmax(0,.95fr) minmax(0,.78fr) minmax(0,1.38fr) minmax(0,.72fr) minmax(0,.58fr);')],
  ['returns fixed lanes',render.includes('<div class="ops-lane-head ops-lane-head--return"><span>자산</span><span>이전 보유자</span><span>처리</span><span>메모</span><span>확인자</span><span>처리일</span>')&&render.includes('ops-lane-row ops-lane-row--return')&&mgmt.includes('.main--assets .ops-lane-head--return,\n  .main--assets .ops-lane-row--return{\n    grid-template-columns:minmax(96px,1fr) 84px 70px minmax(98px,1.05fr) 76px 86px;')],
  ['no semantic management tables',!render.includes('ops-data-table')&&!render.includes('ops-member-table')&&!render.includes('ops-asset-table')&&!render.includes('ops-account-table')],
  ['fund dense lane board',render.includes('axe-fund-ledger-columns')&&render.includes('axe-fund-ledger-row')&&fund.includes('.axe-fund-ledger-row{')],
  ['fund no semantic table dependency',!render.includes('axe-fund-table')],
  ['company settings untouched',fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8').includes('.ops-settings-module{min-height:56px;display:grid;grid-template-columns:190px 330px 68px')],
  ['operational desktop row density 40px',tokens.includes('--ops-table-row-height:40px;')&&mgmt.includes('.main--members .ops-lane-row,')&&mgmt.includes('min-height:var(--ops-table-row-height);')],
  ['standard font weights',!mgmt.includes('font-weight:780')&&!mgmt.includes('font-weight:880')&&!mgmt.includes('font-weight:860')],
];
let fail=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++;}
if(fail){console.error(`dense operations system check: ${checks.length-fail}/${checks.length} PASS`);process.exit(1)}
console.log(`dense operations system check: ${checks.length}/${checks.length} PASS`);
