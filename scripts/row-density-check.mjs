import fs from 'node:fs';
const render=fs.readFileSync('src/ui/render.js','utf8');
const mgmt=fs.readFileSync('src/styles/management.css','utf8');
const fund=fs.readFileSync('src/styles/fund.css','utf8');
const checks=[
  ['member table fixed layout',render.includes('ops-member-table')&&mgmt.includes('.ops-data-table{')&&mgmt.includes('table-layout:fixed')],
  ['asset table fixed layout',render.includes('ops-asset-table')&&mgmt.includes('.ops-asset-table col.is-asset{width:29%}')],
  ['account table fixed layout',render.includes('ops-account-table')&&mgmt.includes('.ops-account-table col.is-account{width:36%}')],
  ['fund table fixed layout',render.includes('axe-fund-table')&&fund.includes('.axe-fund-table{')&&fund.includes('table-layout:fixed')],
  ['asset change date absent',!render.includes('fmtDate(a.updated_at,true)} 변경')],
  ['desktop table row height stable',mgmt.includes('height:58px')&&fund.includes('height:60px')],
  ['mobile table becomes card rows',mgmt.includes('.ops-data-table colgroup,.ops-data-table thead{display:none}')&&fund.includes('.axe-fund-table colgroup,.axe-fund-table thead{display:none}')],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log(`row-density-check: ${checks.length}/${checks.length} PASS`);
