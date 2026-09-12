import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const checks = [
  ['ambient marker', css.includes('AXE AMBIENT BRAND SHELL R1')],
  ['body before exists', css.includes('body::before')],
  ['body after exists', css.includes('body::after')],
  ['ambient asset referenced', css.includes("url('/brand/axe-ambient-shell-wide.png')")],
  ['runtime app is centered', css.includes('margin:24px auto')],
  ['desktop width reduced from full-window shell', css.includes('calc(100vw - 160px)')],
  ['standalone still keeps side margin', css.includes('calc(100vw - 56px)')],
  ['main pseudo rail disabled', css.includes('.runtime-app .main::before') && css.includes('display:none !important')],
  ['ambient asset precached', sw.includes("'/brand/axe-ambient-shell-wide.png'")],
  ['service worker cache bumped', sw.includes('axe-product-pwa-3.18.4-r1')],
];
let pass = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (ok) pass++;
}
console.log(`Ambient Brand Shell: ${pass}/${checks.length} PASS`);
if (pass !== checks.length) process.exit(1);
