import fs from 'node:fs';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles/pages.css',import.meta.url),'utf8');
const checks=[
  ['default page is dashboard',/page:\s*'dashboard'/.test(main)],
  ['guide is valid page',/validPages\s*=\s*\[[^\]]*'guide'/.test(main)],
  ['brand routes dashboard',/data-action="go-dashboard"/.test(render)&&/action==='go-dashboard'/.test(main)],
  ['guide nav present',/사용 가이드/.test(render)&&/navItem\(state,'guide'/.test(render)],
  ['guide route renders before admin lock',/state\.page === 'guide'\) return renderGuide/.test(render)],
  ['guide sections include core modules',/\['fund','공금'/.test(render)&&/\['ammo','총알'/.test(render)&&/\['modbook','개조서'/.test(render)&&/\['cooking','요리'/.test(render)],
  ['ammo examples documented',/1줄 3세트/.test(render)&&/'반'/.test(render)&&/'취소'/.test(render)],
  ['modbook examples documented',/신속한 30000/.test(render)],
  ['member context-menu tutorial documented',/AXE 멤버 등록/.test(render)],
  ['dashboard links guide',/data-page="guide"/.test(render)],
  ['guide styling present',/\.axe-guide-page/.test(css)&&/\.product-brand--home/.test(css)],
];
let pass=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)pass++;}
console.log(`HOME_GUIDE ${pass}/${checks.length}`);
if(pass!==checks.length)process.exit(1);
