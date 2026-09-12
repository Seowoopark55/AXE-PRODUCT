import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('src/styles.css'),index=read('index.html'),main=read('src/main.js'),render=read('src/ui/render.js');
const checks=[
 ['root-cause marker',css.includes('ROOT-CAUSE BRANDED SHARED CONSOLE R1')],
 ['inline app root transparent',index.includes('#app{background:transparent}')],
 ['runtime app root transparent',css.includes('#app{min-height:100%;background:transparent!important')],
 ['ambient viewport layer visible',css.includes("url('/brand/axe-ambient-shell-wide-v2.png')")&&css.includes('brightness(1.18) saturate(1.24) contrast(1.05)')],
 ['centered equal shell preserved',css.includes('width:min(1120px,calc(100vw - 240px))')&&css.includes('margin:18px auto')],
 ['stronger shared brand border',css.includes('rgba(213,163,67,.16)')],
 ['company banner UI removed',!render.includes('name="company_banner"')&&!render.includes('회사 배너')],
 ['company banner web wiring removed',!main.includes('uploadCompanyBanner')&&!main.includes('removeCompanyBanner')&&!main.includes('companyBannerUrl')],
 ['pwa update/install absent',!render.includes('새 버전 적용')&&!render.includes('앱으로 설치')],
 ['legacy pwa cleanup retained',main.includes('cleanupLegacyPwa')&&main.includes('registration.unregister()')],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}console.log(`Root Cause Brand Shell: ${pass}/${checks.length} PASS`);if(pass!==checks.length)process.exit(1);
