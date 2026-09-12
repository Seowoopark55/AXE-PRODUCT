import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('src/styles.css');
const index=read('index.html');
const main=read('src/main.js');
const render=read('src/ui/render.js');
const checks=[
  ['visible ambient marker',css.includes('VISIBLE AMBIENT SIDES R1')],
  ['ambient asset on body background',css.includes("background-image:url('/brand/axe-ambient-shell-wide-v2.png')")],
  ['pseudo opacity filter removed',!css.includes("filter:brightness(.82) saturate(.92) contrast(1.04)")],
  ['centered compact frame',css.includes('width:min(1120px,calc(100vw - 240px))') && css.includes('margin:18px auto')],
  ['equal auto margins',css.includes('margin-left:auto') && css.includes('margin-right:auto')],
  ['manifest removed',!index.includes('manifest.webmanifest')],
  ['pwa install UI removed',!render.includes('앱으로 설치') && !render.includes('AXE PRODUCT 앱 설치')],
  ['pwa update UI removed',!render.includes('새 버전 적용')],
  ['pwa setup removed',!main.includes('setupPwaExperience') && !main.includes('beforeinstallprompt')],
  ['legacy pwa cleanup present',main.includes('cleanupLegacyPwa') && main.includes('registration.unregister()')],
];
let pass=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Web Ambient Shell: ${pass}/${checks.length} PASS`);
if(pass!==checks.length)process.exit(1);
