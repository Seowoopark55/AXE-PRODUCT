import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../src/lib/productApi.js',import.meta.url),'utf8');
const checks=[
 ['login headline updated',render.includes('회사를 움직이는 하나의 콘솔.')],
 ['login subcopy updated',render.includes('Discord 기반의 회사 운영을 더 간결하고 체계적으로.')],
 ['invite join UI removed',!render.includes('초대코드로 참가')&&!render.includes('JOIN COMPANY')],
 ['discord registration guidance exists',render.includes('AXE 멤버 등록')],
 ['preview launch exists',render.includes('초기설정 체험')&&main.includes("action==='open-setup-demo'")],
 ['preview is non destructive copy',render.includes('실제 데이터 변경 없음')&&render.includes('실제 회사 설정에 저장되지 않았습니다.')],
 ['quest steps exist',render.includes('QUEST 01')&&render.includes('QUEST 02')&&render.includes('QUEST 03')&&render.includes('QUEST 04')],
 ['preview state exists',main.includes('setupDemo: null')&&main.includes("action==='setup-demo-toggle-module'")],
 ['real create company preserved',main.includes("type==='create-company'")&&api.includes("rpc('create_company'")],
 ['invite backend untouched for compatibility',api.includes('createCompanyInvite')&&api.includes('redeemCompanyInvite')],
 ['responsive preview styles exist',css.includes('GUIDED SETUP PREVIEW R1')&&css.includes('.setup-demo-shell')&&css.includes('@media(max-width:760px)')],
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Guided Setup Preview: ${pass}/${checks.length} PASS`); if(pass!==checks.length)process.exit(1);
