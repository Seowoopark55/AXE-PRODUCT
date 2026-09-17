import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles/fund.css', import.meta.url), 'utf8');
const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mainJs = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const stylesCss = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const tokens = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

const checks = [
  ['636px standard rail token value preserved', /--ops-rail-standard:636px;/],
  ['FUND ledger uses standard rail token', /3\.26\.13[\s\S]*?\.main--fund \.axe-fund-ledger[\s\S]*?width:var\(--ops-rail-standard\)/],
  ['header and row keep one identical 8-column grid', /grid-template-columns:72px 56px 62px minmax\(108px,1fr\) 90px 82px 52px 52px/],
  ['semantic center-axis selector exists', /\.main--fund \.axe-fund-ledger-columns>span,[\s\S]*?\.main--fund \.axe-fund-ledger-row>\[data-label\][\s\S]*?justify-content:center;[\s\S]*?text-align:center;/],
  ['legacy nth-child axis patch retired', /^(?![\s\S]*axe-fund-ledger-columns>span:nth-child)[\s\S]*$/],
  ['source index still uses Vite entrypoint', /<script type="module" src="\/src\/main\.js"><\/script>/],
  ['main still imports source stylesheet', /import '\.\/styles\.css';/],
  ['stylesheet still imports fund.css', /@import '\.\/styles\/fund\.css';/],
];

let failed = 0;
for (const [name, re] of checks) {
  const haystack = name.includes('token value') ? tokens : name.includes('entrypoint') ? indexHtml : name.includes('main still') ? mainJs : name.includes('stylesheet still') ? stylesCss : css;
  const ok = re.test(haystack);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`FUND LEDGER AXIS SPECIFICITY CHECK PASS (${checks.length}/${checks.length})`);
