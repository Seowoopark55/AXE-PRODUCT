import fs from 'node:fs';

const management = fs.readFileSync(new URL('../src/styles/management.css', import.meta.url), 'utf8');
const fund = fs.readFileSync(new URL('../src/styles/fund.css', import.meta.url), 'utf8');
const checks = [
  ['members board is content-fit', /ops-mgmt-page--members \.ops-mgmt-board\{width:520px/],
  ['members lanes use fixed useful widths', /grid-template-columns:172px 72px 88px 68px 56px/],
  ['assets board is content-fit', /ops-mgmt-page--assets \.ops-mgmt-board\{width:570px/],
  ['assets lanes use fixed useful widths', /grid-template-columns:158px 174px 74px 68px 56px/],
  ['accounts board is content-fit', /ops-mgmt-page--accounts \.ops-mgmt-board,[\s\S]*width:540px/],
  ['accounts lanes use fixed useful widths', /grid-template-columns:150px 184px 72px 56px/],
  ['fund ledger is content-fit', /axe-fund-ledger\{width:636px/],
  ['fund lanes use fixed useful widths', /grid-template-columns:70px 92px 174px 92px 54px 50px/],
  ['fund headers are centered to lane axes', /axe-fund-ledger-columns>span\{text-align:center\}/],
  ['fund row values are centered to lane axes', /axe-fund-ledger-person,\.axe-fund-ledger-entry,\.axe-fund-ledger-money\{text-align:center\}[\s\S]*axe-fund-ledger-entry>div\{justify-content:center\}/],
  ['dense rows are 48px', /ops-mgmt-page--members \.ops-lane-row,[\s\S]*min-height:48px/],
  ['mobile keeps full width fallback', /@media\(max-width:760px\)[\s\S]*\.ops-mgmt-workspace,\.ops-mgmt-board/],
];
let pass = 0;
for (const [name, re] of checks) {
  const ok = re.test(name.startsWith('fund') ? fund : management);
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
  if (ok) pass++;
}
console.log(`Content-fit density: ${pass}/${checks.length} PASS`);
if (pass !== checks.length) process.exit(1);
