import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const checks = [
  ['desktop frame marker', css.includes('DESKTOP APP FRAME R1')],
  ['near-full browser frame', css.includes('width:calc(100vw - 24px)')],
  ['standalone tighter frame', css.includes('width:calc(100vw - 12px)')],
  ['full-width inner shell', css.includes('width:calc(100% - 32px)')],
  ['workspace surface', css.includes('radial-gradient(circle at 88% 16%')],
  ['main workspace fills viewport', css.includes('min-height:calc(100vh - 112px)')],
  ['header account content rail', css.includes('width:668px')],
  ['settings account content rail', css.includes('width:712px')],
  ['mobile frame reset', css.includes('@media(max-width:760px)') && css.includes('border-radius:0')],
  ['service worker cache bumped', sw.includes("axe-product-pwa-3.18.1-r1")],
];
let pass = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (ok) pass++;
}
console.log(`Desktop App Frame: ${pass}/${checks.length} PASS`);
if (pass !== checks.length) process.exit(1);
