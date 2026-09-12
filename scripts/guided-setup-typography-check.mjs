import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const checks=[
 ['marker exists',css.includes('GUIDED SETUP TYPOGRAPHY R1')],
 ['hero title enlarged',css.includes('.setup-demo-hero h2,.setup-demo-quest h2,.setup-demo-complete h2{font-size:29px}')],
 ['body copy enlarged',css.includes('.setup-demo-hero p,.setup-demo-quest>p,.setup-demo-complete>p{font-size:13px')],
 ['rail labels enlarged',css.includes('.setup-demo-step strong{font-size:11px}')],
 ['field labels enlarged',css.includes('.setup-demo-field>span{font-size:11px}')],
 ['select text enlarged',css.includes('.setup-demo-field select{font-size:12.5px}')],
 ['module titles enlarged',css.includes('.setup-demo-module strong{font-size:12px}')],
 ['module descriptions enlarged',css.includes('.setup-demo-module small{font-size:9.5px}')],
 ['buttons enlarged',css.includes('.setup-demo-back,.setup-demo-restart,.setup-demo-primary{font-size:11px}')],
 ['mobile title preserved',css.includes('font-size:25px')],
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Guided Setup Typography: ${pass}/${checks.length} PASS`);if(pass!==checks.length)process.exit(1);
