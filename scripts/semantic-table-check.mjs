import fs from 'node:fs';
const render=fs.readFileSync('src/ui/render.js','utf8');
const mgmt=fs.readFileSync('src/styles/management.css','utf8');
const fund=fs.readFileSync('src/styles/fund.css','utf8');
const checks=[
  ['members use real table',render.includes('<table class="ops-data-table ops-member-table">')],
  ['assets use real table',render.includes('<table class="ops-data-table ops-asset-table">')],
  ['returns use real table',render.includes('<table class="ops-data-table ops-return-table">')],
  ['accounts use real table',render.includes('<table class="ops-data-table ops-account-table">')],
  ['fund uses real table',render.includes('<table class="axe-fund-table">')],
  ['desktop fixed table layout',mgmt.includes('table-layout:fixed')&&fund.includes('table-layout:fixed')],
  ['header body same column model',render.includes('<colgroup>')&&mgmt.includes('col.is-manage')&&fund.includes('col.is-entry')],
  ['cell vertical centering',mgmt.includes('vertical-align:middle')&&fund.includes('vertical-align:middle')],
  ['nowrap ellipsis prevents squeeze',mgmt.includes('text-overflow:ellipsis')&&fund.includes('text-overflow:ellipsis')],
  ['mobile responsive cards',mgmt.includes('content:attr(data-label)')&&fund.includes('content:attr(data-label)')],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log(`semantic-table-check: ${checks.length}/${checks.length} PASS`);
