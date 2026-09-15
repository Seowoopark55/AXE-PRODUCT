import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const headers=['날짜','이름','계좌','내역','구분','금액','증빙','관리'];
const checks=[
  ['web package version',pkg.version==='1.7.41-web-ui.76'],
  ['ledger uses one semantic table',render.includes('<table class="axe-fund-ledger-table">') && render.includes('<thead><tr>') && render.includes('<tbody>${body}</tbody>')],
  ['ledger has exactly eight headers',headers.every(v=>render.includes(`<th>${v}</th>`))],
  ['ledger rows use matching td cells',render.includes('<tr class="axe-fund-ledger-row">') && (render.match(/<td class="axe-fund-ledger-/g)||[]).length>=8],
  ['old parallel grid header removed',!render.includes('axe-fund-ledger-columns')],
  ['one canonical ledger css marker',(fund.match(/AXE ONE 3\.26\.15 · FUND ledger canonical table structure R1/g)||[]).length===1],
  ['legacy ledger grid templates removed',!fund.includes('.axe-fund-ledger-columns') && !/\.axe-fund-ledger-row\s*\{[^}]*grid-template-columns/s.test(fund)],
  ['table layout is fixed',fund.includes('.axe-fund-ledger-table{') && fund.includes('table-layout:fixed;')],
  ['all th and td share center alignment',fund.includes('.axe-fund-ledger-table th,\n.axe-fund-ledger-table td{') && fund.includes('text-align:center;')],
  ['ledger stays on 636px reference rail',fund.includes('.axe-fund-ledger{\n  width:636px;')],
];
let passed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`FUND ledger structure: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
