import fs from 'node:fs';

const render = fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

const checks = [
  ['utility renderer removed', !render.includes('renderUtilityRail(')],
  ['utility zone markup removed', !render.includes('app-utility-zone')],
  ['duplicate utility actions removed', !render.includes('QUICK ACTIONS')],
  ['main returns to block layout', styles.includes('.runtime-app .main{') && styles.includes('display:block')],
  ['passive workspace field exists', styles.includes('.runtime-app .main::before')],
  ['passive signature exists', styles.includes('.runtime-app .main::after')],
  ['workspace field has no pointer events', styles.includes('pointer-events:none')],
  ['ambient field only on wide screens', styles.includes('@media(min-width:1280px)')],
  ['ambient field hidden below threshold', styles.includes('@media(max-width:1279px)')],
  ['service worker cache bumped', sw.includes('axe-product-pwa-3.18.3-r1')],
];

let fail = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) fail++;
}
console.log(`Quiet Workspace: ${checks.length - fail}/${checks.length} PASS`);
if (fail) process.exit(1);
