import fs from 'node:fs';
const render=fs.readFileSync('src/ui/render.js','utf8');
const mgmt=fs.readFileSync('src/styles/management.css','utf8');
const fund=fs.readFileSync('src/styles/fund.css','utf8');
const checks=[
  ['member row fills width',mgmt.includes('grid-template-columns:minmax(0,1.35fr) minmax(0,.82fr) minmax(0,.68fr) minmax(58px,.56fr) 54px')],
  ['asset row fills width',mgmt.includes('grid-template-columns:minmax(0,1.35fr) minmax(0,.9fr) minmax(74px,.62fr) 54px')],
  ['account row fills width',mgmt.includes('grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(78px,.62fr) 54px')],
  ['fund row fills width',fund.includes('grid-template-columns:minmax(0,1.35fr) minmax(92px,.78fr) minmax(84px,.68fr) 92px')],
  ['asset change date absent',!render.includes('fmtDate(a.updated_at,true)} 변경')],
  ['status badge harmonized',mgmt.includes('height:26px')&&mgmt.includes('font-size:10.3px')],
  ['detail action harmonized',mgmt.includes('height:30px')&&mgmt.includes('font-size:10.5px')],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
