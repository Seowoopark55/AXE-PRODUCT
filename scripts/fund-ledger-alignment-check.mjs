import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const expectedHeader='<span>날짜</span><span>이름</span><span>계좌</span><span>내역</span><span>구분</span><span>금액</span><span>증빙</span><span>관리</span>';
const expectedGrid='grid-template-columns:82px 78px 72px minmax(110px,1fr) 96px 88px 50px 50px;';
const checks=[
  ['web package version',pkg.version==='1.7.41-web-ui.73'],
  ['ledger keeps eight semantic columns',render.includes(expectedHeader)],
  ['ledger header and row share one eight-column track definition',fund.includes(expectedGrid)],
  ['fund parent rail allows full ledger width',fund.includes('.main--fund .axe-fund{\n    width:min(760px,100%);')],
  ['ledger remains bounded by available width',fund.includes('.main--fund .axe-fund-ledger{\n    width:760px;\n    max-width:100%;')],
  ['legacy header centering is explicitly reset',fund.includes('.main--fund .axe-fund-ledger-columns>span{\n    min-width:0;\n    text-align:left;')],
  ['money header uses row-aligned right edge',fund.includes('.main--fund .axe-fund-ledger-columns>span:nth-child(6){\n    text-align:right;')],
  ['evidence and management headers are centered',fund.includes('.main--fund .axe-fund-ledger-columns>span:nth-child(7),\n  .main--fund .axe-fund-ledger-columns>span:nth-child(8){\n    text-align:center;')],
];
let passed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`FUND ledger alignment: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
