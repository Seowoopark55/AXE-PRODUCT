import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const checks=[
 ['marker exists',css.includes('GUIDED CHANNEL BUILDER PREVIEW R1')],
 ['quick and direct modes exist',render.includes('빠른 설정')&&render.includes('직접 연결')],
 ['fund uses one dashboard channel',render.includes("['fund','공금 관리','공금현황판'")&&!render.includes('공금-납부')],
 ['category name editable',render.includes('data-setup-category-name')&&main.includes("matches('[data-setup-category-name]')")],
 ['generated channel names editable',render.includes('data-setup-generated-channel')&&main.includes("matches('[data-setup-generated-channel]')")],
 ['custom category default exists',main.includes("categoryName:'AXE PRODUCT'")],
 ['generation simulation action exists',render.includes('이 구성으로 생성 체험')&&main.includes("action==='setup-demo-generate-channels'")],
 ['generation is preview only',render.includes('실제 Discord에는 아무것도 생성되지 않았습니다.')],
 ['direct existing channel mode preserved',render.includes('기존 채널을 그대로 연결할 수도 있습니다.')],
 ['module changes invalidate generated preview',main.includes('state.setupDemo.channelsGenerated=false')],
 ['responsive builder styles exist',css.includes('.setup-demo-channel-mode')&&css.includes('.setup-demo-create-row')&&css.includes('@media(max-width:760px)')],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Guided Channel Builder: ${pass}/${checks.length} PASS`);if(pass!==checks.length)process.exit(1);
