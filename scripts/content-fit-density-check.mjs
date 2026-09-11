import fs from 'node:fs';

const management = fs.readFileSync(new URL('../src/styles/management.css', import.meta.url), 'utf8');
const fund = fs.readFileSync(new URL('../src/styles/fund.css', import.meta.url), 'utf8');
const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');

const checks = [
  ['members board is content-fit', management, /ops-mgmt-page--members \.ops-mgmt-board\{width:520px/],
  ['members lanes use fixed useful widths', management, /grid-template-columns:172px 72px 88px 68px 56px/],
  ['assets board is content-fit', management, /ops-mgmt-page--assets \.ops-mgmt-board\{width:570px/],
  ['assets lanes use fixed useful widths', management, /grid-template-columns:158px 174px 74px 68px 56px/],
  ['accounts board is content-fit', management, /ops-mgmt-page--accounts \.ops-mgmt-board,[\s\S]*width:540px/],
  ['accounts lanes use fixed useful widths', management, /grid-template-columns:150px 184px 72px 56px/],
  ['fund page uses left anchored visual rail', fund, /\.main--fund \.company-hero,[\s\S]*\.main--fund \.axe-fund\{[\s\S]*width:min\(900px,100%\);[\s\S]*margin-left:0;[\s\S]*margin-right:auto/],
  ['fund ledger stays content-fit and left anchored', fund, /\.main--fund \.axe-fund-ledger\{[\s\S]*width:636px;[\s\S]*margin-left:0;[\s\S]*margin-right:auto/],
  ['fund lanes fill ledger with flexible detail lane', fund, /grid-template-columns:70px 92px minmax\(0,1fr\) 96px 58px 56px/],
  ['fund amount shares header center axis', fund, /\.main--fund \.axe-fund-ledger-columns>span,[\s\S]*\.main--fund \.axe-fund-ledger-money\{[\s\S]*text-align:center/],
  ['fund approval badge is removed from ledger row', render, /axe-fund-ledger-entry"><div><strong>\$\{esc\(title\)\}<\/strong><\/div><small>/],
  ['fund management always occupies edit control slot', render, /const editControl=r\.can_edit[\s\S]*data-action="edit-ledger"[\s\S]*disabled title="현재 DB에서 직접 수정이 제한된 연동 내역입니다\."/],
  ['dense rows are 48px', management, /ops-mgmt-page--members \.ops-lane-row,[\s\S]*min-height:48px/],
  ['mobile keeps full width fallback', management, /@media\(max-width:760px\)[\s\S]*\.ops-mgmt-workspace,\.ops-mgmt-board/],
];
let pass = 0;
for (const [name, source, re] of checks) {
  const ok = re.test(source);
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
  if (ok) pass++;
}
console.log(`Content-fit density: ${pass}/${checks.length} PASS`);
if (pass !== checks.length) process.exit(1);
