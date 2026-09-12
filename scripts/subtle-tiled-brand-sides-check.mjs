import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const checks = [
  ['marker exists', css.includes('SUBTLE TILED BRAND SIDES R1')],
  ['full-bleed wallpaper removed', !css.includes('axe-ambient-shell-wide-v2.png')],
  ['tile asset used', css.includes("url('/brand/axe-side-tile.png')")],
  ['grid/check overlay exists', css.includes('repeating-linear-gradient(0deg') && css.includes('repeating-linear-gradient(90deg')],
  ['side-only mask exists', css.includes('mask-image:linear-gradient(90deg,#000 0 19%')],
  ['central app width preserved', css.includes('width:min(1120px,calc(100vw - 240px))')],
  ['desktop centered margin', css.includes('margin:18px auto')],
  ['mobile ambient disabled', css.includes('body::before,body::after{display:none}')],
  ['banner upload already removed in project', !fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8').includes('회사 배너')],
  ['subtle opacity level', css.includes('opacity:.36')],
];
let pass=0;
for (const [name, ok] of checks){ console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if(ok) pass++; }
console.log(`Subtle Tiled Brand Sides: ${pass}/${checks.length} PASS`);
if(pass!==checks.length) process.exit(1);
