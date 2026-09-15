import fs from 'node:fs';

const management=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../src/styles/layout.css',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8');

const checks=[
  ['fund ledger uses compact 636px reference rail', fund, /main--fund \.axe-fund-ledger\{[\s\S]*?width:636px/],
  ['members use 760px operational rail', management, /main--members \.ops-mgmt-page,[\s\S]*?width:760px/],
  ['assets use 760px operational rail', management, /main--assets \.ops-mgmt-page,[\s\S]*?width:760px/],
  ['accounts use 760px operational rail', management, /main--accounts \.ops-mgmt-page,[\s\S]*?width:760px/],
  ['member lanes include role column', management, /grid-template-columns:minmax\(150px,1fr\) 88px 112px 82px 60px/],
  ['asset lanes include acquisition column', management, /grid-template-columns:120px minmax\(130px,1fr\) 96px 76px 82px 60px/],
  ['account lanes include role column', management, /grid-template-columns:minmax\(140px,1fr\) 82px minmax\(170px,1.35fr\) 82px 60px/],
  ['cooking uses explicit six-column lane', settings, /grid-template-columns:minmax\(120px,1fr\) minmax\(150px,1.25fr\) 90px 48px 72px 54px/],
  ['platform company table uses explicit eight-column lane', management, /grid-template-columns:110px 115px 44px 64px 82px 122px 94px 54px/],
  ['header identity is aligned inside content rail', layout, /\.global-account\{[\s\S]*?justify-self:start;[\s\S]*?justify-content:flex-end/],
  ['settings identity uses settings rail', layout, /runtime-app--settings \.global-account\{width:680px\}/],
  ['runtime app carries current page class', render, /runtime-app runtime-app--\$\{esc\(state\.page\|\|'fund'\)\}/],
  ['settings uses compact 680px left rail', settings, /main--settings \.ops-settings-page\{[\s\S]*?width:680px;[\s\S]*?margin-left:0/],
  ['fund subviews are left anchored', fund, /main--fund \.axe-fund-subview,[\s\S]*?margin-left:0;[\s\S]*?margin-right:auto/],
  ['mobile keeps full width fallback', management, /@media\(max-width:760px\)[\s\S]*?\.ops-mgmt-workspace,\.ops-mgmt-board,\.ops-mgmt-tabs-row,\.ops-account-review\{width:100%\}/],
];

let passed=0;
for(const [name,source,re] of checks){
  const ok=re.test(source);
  console.log(`${ok?'PASS':'FAIL'} - ${name}`);
  if(ok) passed++;
}
console.log(`Content-fit density: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
