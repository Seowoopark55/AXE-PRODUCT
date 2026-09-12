import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const pages=fs.readFileSync(new URL('../src/styles/pages.css',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const checks=[
  ['default home remains dashboard',/page:\s*'dashboard'/.test(main)],
  ['guide opens without changing page',/if\(action==='open-guide'\)\{state\.modal=\{type:'guide'\}/.test(main)],
  ['guide uses modal backdrop',/axe-guide-dialog-backdrop[^>]*data-modal-backdrop/.test(render)],
  ['guide dialog identifies itself',/role="dialog" aria-modal="true" aria-label="AXE PRODUCT 사용 가이드"/.test(render)],
  ['guide has persistent left exit',/axe-guide-dialog-exit[^>]*data-action="close-modal"/.test(render)],
  ['guide has top right exit',/axe-guide-dialog-head[\s\S]*data-action="close-modal"[^>]*aria-label="가이드 닫기"/.test(render)],
  ['guide keeps dedicated module rail',/axe-guide-dialog-rail/.test(render)&&/axe-guide-nav-list/.test(render)],
  ['guide content uses large dialog area',/width:min\(1180px/.test(pages)&&/height:min\(790px/.test(pages)],
  ['guide typography stays readable',/axe-guide-dialog-scroll \.axe-guide-feature-head h2\{font-size:29px/.test(pages)&&/font-size:11px;line-height:1\.62/.test(pages)],
  ['guide actions close before navigation',/state\.modal\?\.type==='guide'\) state\.modal=null/.test(main)],
  ['guide responsive full screen mobile',/@media\(max-width:680px\)[\s\S]*axe-guide-dialog\{width:100%;height:100%/.test(pages)],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)pass++;}
console.log(`GUIDE_CENTER ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
