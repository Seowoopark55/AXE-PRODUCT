import fs from 'node:fs';

const render=fs.readFileSync('src/ui/render.js','utf8');
const mgmt=fs.readFileSync('src/styles/management.css','utf8');
const fund=fs.readFileSync('src/styles/fund.css','utf8');

const checks=[
  ['account helper exists', render.includes('function accountBadge(v)')],
  ['account renderer still calls helper', render.includes('accountBadge(r.status)')],
  ['account semantic table exists', render.includes('ops-account-table')],
  ['member semantic table exists', render.includes('ops-member-table')],
  ['asset semantic table exists', render.includes('ops-asset-table')],
  ['fund semantic table exists', render.includes('axe-fund-table')],
  ['fund is constrained, not full workspace width', fund.includes('width:min(780px,100%)') && fund.includes('max-width:780px')],
  ['management boards are content-sized', mgmt.includes('width:min(650px,100%)') && mgmt.includes('width:min(700px,100%)')],
  ['table typography uses stable standard weights', mgmt.includes('font-weight:800') && fund.includes('font-weight:800')],
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log(`table-r2-regression-check: ${checks.length}/${checks.length} PASS`);
