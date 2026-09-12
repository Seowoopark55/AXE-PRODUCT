import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const checks = [
  ['marker exists', css.includes('GENERATED AMBIENT SHELL R1')],
  ['generated image used', css.includes("url('/brand/axe-shell-generated-v1.png')")],
  ['cover background used', css.includes('center center/cover no-repeat')],
  ['central app width preserved', css.includes('width:min(1120px,calc(100vw - 240px))')],
  ['desktop centered margin', css.includes('margin:18px auto')],
  ['body overlay exists', css.includes('radial-gradient(circle at center')],
  ['company banner upload removed', !render.includes('회사 배너')],
  ['mobile ambient disabled', css.includes('body::before,body::after{display:none}')],
  ['old staggered pattern inactive', !css.includes("axe-side-pattern-staggered.png")],
  ['old diamond tile inactive', !css.includes("axe-side-tile-diamond.png")],
];
let pass=0;
for (const [name, ok] of checks){console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if(ok) pass++;}
console.log(`Generated Ambient Shell: ${pass}/${checks.length} PASS`);
if(pass!==checks.length) process.exit(1);
