import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const checks = [
  ['marker exists', css.includes('DIAMOND BRAND SIDES R1')],
  ['diamond tile asset used', css.includes("url('/brand/axe-side-tile-diamond.png')")],
  ['diamond lattice exists', css.includes('linear-gradient(45deg') && css.includes('linear-gradient(-45deg')],
  ['side-only mask exists', css.includes('mask-image:linear-gradient(90deg,#000 0 22%')],
  ['stronger visibility opacity', css.includes('opacity:.58')],
  ['central app width preserved', css.includes('width:min(1120px,calc(100vw - 240px))')],
  ['desktop centered margin', css.includes('margin:18px auto')],
  ['mobile ambient disabled', css.includes('body::before,body::after{display:none}')],
  ['company banner upload removed', !render.includes('회사 배너')],
  ['old dramatic wallpaper removed from active block', !css.includes("axe-ambient-shell-wide-v2.png")],
];
let pass = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (ok) pass++; }
console.log(`Diamond Brand Sides: ${pass}/${checks.length} PASS`);
if (pass !== checks.length) process.exit(1);
