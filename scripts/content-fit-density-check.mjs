import fs from 'node:fs';

const management=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../src/styles/layout.css',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8');

const checks=[
  ['fund frame remains 636px', fund, /main--fund[\s\S]*?width:636px/],
  ['members inherits 636px FUND frame', management, /main--members \.ops-mgmt-page[\s\S]*?width:636px/],
  ['assets inherits 636px FUND frame', management, /main--assets \.ops-mgmt-page[\s\S]*?width:636px/],
  ['accounts inherits 636px FUND frame', management, /main--accounts \.ops-mgmt-page[\s\S]*?width:636px/],
  ['members lanes fill shared frame', management, /grid-template-columns:240px 90px 105px 85px 70px/],
  ['assets lanes fill shared frame', management, /grid-template-columns:180px 190px 80px 70px 70px/],
  ['accounts lanes fill shared frame', management, /grid-template-columns:180px 250px 90px 77px/],
  ['assets tabs use FUND underline grammar', management, /main--assets \.ops-dense-tabs button\.is-active:after/],
  ['operational headers use FUND 32px title rhythm', management, /main--members \.page-header h1[\s\S]*?font-size:32px/],
  ['operational summaries use FUND 17px metric rhythm', management, /main--members \.ops-mgmt-summary strong[\s\S]*?font-size:17px/],
  ['header identity is aligned inside content rail', layout, /\.global-account\{[\s\S]*?width:636px;[\s\S]*?justify-self:start;[\s\S]*?justify-content:flex-end/],
  ['runtime app carries current page class', render, /runtime-app runtime-app--\$\{esc\(state\.page\|\|'fund'\)\}/],
  ['company banner is restored only for settings', render, /state\.page==='settings'\?renderCompanyBanner\(state\):''/],
  ['company settings gold page width remains untouched', settings, /\.ops-settings-page\{width:100%;margin:0\}/],
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
