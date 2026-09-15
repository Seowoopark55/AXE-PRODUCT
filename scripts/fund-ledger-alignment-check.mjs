import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const expectedHeader='<span>날짜</span><span>이름</span><span>계좌</span><span>내역</span><span>구분</span><span>금액</span><span>증빙</span><span>관리</span>';
const expectedGrid='grid-template-columns:72px 56px 62px minmax(108px,1fr) 90px 82px 52px 52px;';
const checks=[
  ['web package version',pkg.version==='1.7.41-web-ui.74'],
  ['ledger keeps eight semantic columns',render.includes(expectedHeader)],
  ['ledger header and row share one compact eight-column grid',fund.includes(expectedGrid)],
  ['fund ledger returns to 636px reference rail',fund.includes('.main--fund .axe-fund-ledger{\n    width:636px;')],
  ['fund summary and ledger share the same rail rule',fund.includes('.main--fund .axe-fund-summary,\n  .main--fund .axe-fund-tabs,\n  .main--fund .axe-fund-ledger{\n    width:636px;')],
  ['ledger row is compact',fund.includes('.main--fund .axe-fund-ledger-row{\n    min-height:40px;')],
  ['date/evidence/manage header and cells share centered alignment',fund.includes('.main--fund .axe-fund-ledger-row>.axe-fund-ledger-action:nth-child(8){\n    text-align:center;\n    justify-content:center;')],
  ['money header and value share right edge',fund.includes('.main--fund .axe-fund-ledger-row>.axe-fund-ledger-money{\n    text-align:right;\n    justify-content:flex-end;')],
];
let passed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`FUND ledger alignment: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
