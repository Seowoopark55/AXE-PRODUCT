import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const checks = [
  ['desktop frame marker', css.includes('AXE AMBIENT BRAND SHELL R1')],
  ['intentional side breathing room', css.includes('width:min(1480px,calc(100vw - 160px))')],
  ['standalone side breathing room', css.includes('width:min(1560px,calc(100vw - 56px))')],
  ['body ambient background asset', css.includes("url('/brand/axe-ambient-shell-wide.png')")],
  ['full-width inner shell', css.includes('width:calc(100% - 40px)')],
  ['main workspace fills viewport', css.includes('min-height:calc(100vh - 136px)')],
  ['header account content rail', css.includes('width:668px')],
  ['settings account content rail', css.includes('width:712px')],
  ['quiet workspace overlay disabled', css.includes('display:none !important') && css.includes('content:none !important')],
  ['service worker cache bumped', sw.includes("axe-product-pwa-3.18.4-r1")],
];
let pass = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (ok) pass++;
}
console.log(`Desktop App Frame: ${pass}/${checks.length} PASS`);
if (pass !== checks.length) process.exit(1);
