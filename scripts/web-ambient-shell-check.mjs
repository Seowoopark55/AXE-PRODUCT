import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('src/styles.css');
const index=read('index.html');
const main=read('src/main.js');
const render=read('src/ui/render.js');
const checks=[
  ['web-only shell marker',css.includes('CENTERED AMBIENT WEB SHELL R1')],
  ['ambient asset visible',css.includes("url('/brand/axe-ambient-shell-wide.png')") && css.includes('opacity:.84')],
  ['centered compact frame',css.includes('width:min(1120px,calc(100vw - 240px))') && css.includes('margin:18px auto')],
  ['equal auto margins',css.includes('margin-left:auto') && css.includes('margin-right:auto')],
  ['manifest removed',!index.includes('manifest.webmanifest')],
  ['pwa install UI removed',!render.includes('앱으로 설치') && !render.includes('AXE PRODUCT 앱 설치')],
  ['pwa update UI removed',!render.includes('새 버전 적용')],
  ['pwa setup removed',!main.includes('setupPwaExperience') && !main.includes('beforeinstallprompt')],
  ['legacy pwa cleanup present',main.includes('cleanupLegacyPwa') && main.includes('registration.unregister()')],
  ['mobile ambient disabled',css.includes('body::before,\n  body::after{display:none}')],
];
let pass=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Web Ambient Shell: ${pass}/${checks.length} PASS`);
if(pass!==checks.length)process.exit(1);
