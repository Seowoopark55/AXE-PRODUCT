import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const tokens=fs.readFileSync(new URL('../src/styles/tokens.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const expectedHeader='<span>날짜</span><span>이름</span><span>계좌</span><span>내역</span><span>구분</span><span>금액</span><span>증빙</span><span>관리</span>';
const expectedGrid='grid-template-columns:72px 56px 62px minmax(108px,1fr) 90px 82px 52px 52px;';
const checks=[
  ['web package version',pkg.version==='1.7.41-web-ui.79'],
  ['ledger keeps eight semantic columns',render.includes(expectedHeader)],
  ['ledger header and row share one compact eight-column grid',fund.includes(expectedGrid)],
  ['fund ledger returns to 636px reference rail',tokens.includes('--ops-rail-standard:636px;')&&fund.includes('.main--fund .axe-fund-ledger{\n    width:var(--ops-rail-standard);')],
  ['fund summary and ledger share the same rail rule',fund.includes('.main--fund .axe-fund-summary,\n  .main--fund .axe-fund-tabs,\n  .main--fund .axe-fund-ledger{\n    width:var(--ops-rail-standard);')],
  ['ledger row uses 40px shared density token',tokens.includes('--ops-table-row-height:40px;')&&fund.includes('.main--fund .axe-fund-ledger-row{\n    min-height:var(--ops-table-row-height);')],
  ['all ledger headers and values share one center axis',fund.includes('.main--fund .axe-fund-ledger-columns>span,\n  .main--fund .axe-fund-ledger-row>[data-label]{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    text-align:center;') && !fund.includes('axe-fund-ledger-columns>span:nth-child')],
  ['money is centered under its header',fund.includes('.main--fund .axe-fund-ledger-money{width:100%;text-align:center}') && fund.includes('.main--fund .axe-fund-ledger-row>[data-label]{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    text-align:center;')],
];
let passed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`FUND ledger alignment: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
