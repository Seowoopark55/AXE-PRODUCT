import fs from 'node:fs';
const render=fs.readFileSync('src/ui/render.js','utf8');
const mgmt=fs.readFileSync('src/styles/management.css','utf8');
const fund=fs.readFileSync('src/styles/fund.css','utf8');
const base=fs.readFileSync('src/styles.css','utf8');
const checks=[
  ['external invite button removed',!render.includes('>외부 초대<')],
  ['discord registration guidance present',render.includes('Discord에서 대상 우클릭 → 앱 → AXE 멤버 등록')],
  ['member board compact width',mgmt.includes('width:min(570px,100%)')],
  ['asset board compact width',mgmt.includes('width:min(620px,100%)')],
  ['account board compact width',mgmt.includes('width:min(620px,100%)')],
  ['fund ledger compact width',fund.includes('width:min(650px,100%)')],
  ['fund compact fixed columns',fund.includes('grid-template-columns:220px 112px 88px 80px')],
  ['member label exact alignment',base.includes('.member-profile-name-field{grid-template-rows:16px 38px 28px')],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok)failed++;}
if(failed)process.exit(1);
