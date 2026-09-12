import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const checks=[
 ['marker exists',css.includes('GUIDED MEMBER IMPORT + FIXED FOOTER R1')],
 ['footer clipping fix exists',css.includes('.setup-demo-main{min-height:0}')&&css.includes('.setup-demo-content{min-height:0}')&&css.includes('.setup-demo-main>footer{position:relative;z-index:5')],
 ['member quest exists',render.includes('QUEST 05')&&render.includes('멤버도 한 번에 등록할 수 있습니다.')],
 ['discord role filter exists',render.includes('Discord 역할로 대상 찾기')&&render.includes('data-setup-member-filter')],
 ['guest filter exists',render.includes('손님 · 게스트 (10)')],
 ['axe role assignment exists',render.includes('AXE에서 부여할 권한')&&render.includes('data-setup-member-target-role')],
 ['bulk member selection exists',render.includes('현재 목록 전체 선택')&&main.includes("action==='setup-demo-select-visible-members'")],
 ['bulk registration preview exists',render.includes('선택 멤버 등록 체험')&&main.includes("action==='setup-demo-import-members'")],
 ['later individual registration remains',render.includes('나중에 개별 등록')&&render.includes('Discord 우클릭 → 앱 → AXE 멤버 등록')],
 ['preview only state exists',main.includes('memberImportDone:false')&&render.includes('현재 화면은 체험 데이터입니다.')],
 ['step count extended safely',main.includes('Math.min(6,Number(state.setupDemo.step||0)+1)')&&render.includes("['MEMBERS','멤버']")],
 ['responsive member UI exists',css.includes('.setup-demo-member-toolbar')&&css.includes('@media(max-width:760px)')],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Guided Member Import: ${pass}/${checks.length} PASS`);if(pass!==checks.length)process.exit(1);
