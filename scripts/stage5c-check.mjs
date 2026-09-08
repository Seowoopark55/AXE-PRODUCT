import fs from 'node:fs';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../src/lib/productApi.js',import.meta.url),'utf8');
const checks=[
 ['ammo nav',render.includes("navItem('ammo', '총알'")],
 ['ammo module guard',main.includes("module_key === 'ammo'")],
 ['ammo read RPCs',api.includes("ammo_get_rounds")&&api.includes("ammo_get_round_orders")&&api.includes("ammo_get_round_makers")],
 ['ammo submit edit cancel',api.includes('ammo_submit_order')&&api.includes('ammo_update_my_order')&&api.includes('ammo_cancel_my_order')],
 ['maker complete undo',api.includes('ammo_set_my_maker')&&api.includes('ammo_complete_order')&&api.includes('ammo_undo_completion')],
 ['admin reset without SQL',api.includes('ammo_admin_reset_round')&&render.includes('회차 초기화')],
 ['web UI has order and maker actions',render.includes('내 신청')&&render.includes('제작 참여')&&render.includes('신청 · 배분 현황')],
 ['no raw ammo table access',!main.includes(".from('ammo_")&&!api.includes(".from('ammo_" )],
];
let fail=0; for(const [n,ok] of checks){console.log(ok?'PASS':'FAIL',n); if(!ok)fail++;}
if(fail)process.exit(1); console.log('ALL PASS');
