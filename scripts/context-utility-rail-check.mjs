import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js', import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css', import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../public/sw.js', import.meta.url),'utf8');
const tests=[
  ['utility renderer exists',render.includes('function renderUtilityRail(state)')],
  ['utility rendered in main',render.includes('renderUtilityRail(state)')],
  ['fund utility context',render.includes("kicker='FUND'" )],
  ['asset quick action',render.includes('data-action="open-asset"')],
  ['account quick action',render.includes('data-action="open-account-request"')],
  ['desktop rail breakpoint',css.includes('@media(min-width:1280px)')],
  ['main two-column workspace',css.includes('grid-template-columns:636px minmax(280px,1fr)')],
  ['settings rail width',css.includes('grid-template-columns:680px minmax(280px,1fr)')],
  ['utility context zone',css.includes('.app-utility-zone') && css.includes('border-left:1px solid')],
  ['sw cache bumped',sw.includes('axe-product-pwa-3.18.2-r1')]
];
let pass=0; for(const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${name}`); if(ok)pass++;}
console.log(`CONTEXT UTILITY RAIL CHECK ${pass}/${tests.length}`); if(pass!==tests.length)process.exit(1);
