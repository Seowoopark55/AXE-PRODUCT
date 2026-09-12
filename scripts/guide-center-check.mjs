import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../src/styles/layout.css',import.meta.url),'utf8');
const pages=fs.readFileSync(new URL('../src/styles/pages.css',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const checks=[
  ['default home remains dashboard',/page:\s*'dashboard'/.test(main)],
  ['full header home zone present',/class=\"global-home-zone\"[^>]*data-action=\"go-dashboard\"/.test(render)],
  ['account controls stay separate',/global-account/.test(render)&&/pointer-events:none/.test(layout)&&/global-account>div/.test(layout)],
  ['guide has dedicated shell header',/axe-guide-shell-head/.test(render)&&/운영 가이드/.test(render)],
  ['guide exits to dashboard',/axe-guide-shell-actions/.test(render)&&/data-action=\"go-dashboard\"/.test(render)],
  ['guide hides normal sidebar',/runtime-app--guide \.sidebar\{display:none\}/.test(pages)],
  ['guide uses expanded workspace',/runtime-app--guide \.workspace-shell/.test(pages)&&/1180px/.test(layout)],
  ['guide has dedicated module rail',/axe-guide-nav-list/.test(render)&&/TUTORIAL/.test(render)],
  ['guide typography enlarged',/axe-guide-feature-head h2\{[^}]*font-size:27px/.test(pages)&&/axe-guide-card li span\{[^}]*font-size:10.5px/.test(pages)],
  ['guide responsive fallback',/@media\(max-width:900px\)/.test(pages)&&/axe-guide-nav-list\{grid-template-columns:repeat\(3/.test(pages)],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)pass++;}
console.log(`GUIDE_CENTER ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
