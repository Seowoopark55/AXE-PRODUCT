import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const checks = [
  ['marker exists', css.includes('DIAMOND STAGGERED LOGO SIDES R1')],
  ['staggered pattern asset used', css.includes("url('/brand/axe-side-pattern-staggered.png')")],
  ['old diamond tile removed from active block', !css.includes("url('/brand/axe-side-tile-diamond.png')")],
  ['diamond lattice exists', css.includes('linear-gradient(45deg') && css.includes('linear-gradient(-45deg')],
  ['side-only mask exists', css.includes('mask-image:linear-gradient(90deg,#000 0 20%')],
  ['single repeated pattern layer', css.includes("background:url('/brand/axe-side-pattern-staggered.png') 0 0/360px 240px repeat")],
  ['visibility tuned', css.includes('opacity:.52')],
  ['central app width preserved', css.includes('width:min(1120px,calc(100vw - 240px))')],
  ['company banner upload removed', !render.includes('회사 배너')],
  ['mobile ambient disabled', css.includes('body::before,body::after{display:none}')],
];
let pass=0;
for (const [name, ok] of checks){ console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if(ok) pass++; }
console.log(`Staggered Brand Sides: ${pass}/${checks.length} PASS`);
if(pass!==checks.length) process.exit(1);
