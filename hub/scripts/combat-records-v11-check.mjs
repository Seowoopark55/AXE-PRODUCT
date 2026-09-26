import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const main=read('src/main.js');
const render=read('src/ui/render.js');
const api=read('src/lib/productApi.js');
const styles=read('src/styles.css');
const combat=read('src/styles/combat.css');
const checks=[
  ['company sidebar uses combat record', render.includes("navItem(state,'combat','전투 기록')")],
  ['company sidebar no longer links info page', !render.includes("navItem(state,'info','게임 정보')")],
  ['standalone game information remains', render.includes('function renderStandaloneGameInfo') && render.includes('게임 정보</h1>')],
  ['combat page renderer wired', render.includes("if (state.page === 'combat') return renderCombat(state)") && render.includes('function renderCombat(state)')],
  ['combat overview RPC wired', api.includes("supabase.rpc('web_combat_overview_v1'")],
  ['combat member RPC wired', api.includes("supabase.rpc('web_combat_member_v1'")],
  ['combat state wired', main.includes("combat:{overview:null,detail:null")],
  ['combat loaders wired', main.includes('async function loadCombatOverview') && main.includes('async function loadCombatMember')],
  ['combat interactions wired', ['combat-select-member','combat-period','combat-rank-mode','refresh-combat'].every(x=>main.includes(`action==='${x}'`))],
  ['legacy company info route maps to combat', main.includes("if (target === 'info') return companyAvailable ? 'combat' : 'hub'")],
  ['game-info standalone loader remains separate', main.includes("state.page==='game-info' && canOpenWebContent(state,'game_info')")],
  ['combat stylesheet imported', styles.includes("@import './styles/combat.css';")],
  ['combat stylesheet has responsive mobile rules', combat.includes('@media(max-width:760px)')],
  ['period labels do not claim assists', render.includes('KDA가 아닌 K/D로 표시합니다.')],
  ['source image link supported', render.includes('source_image_url') && render.includes('target="_blank"')],
];
let failed=0;
for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} · ${label}`);if(!ok)failed++;}
if(failed){console.error(`Combat records V11 check failed: ${failed}/${checks.length}`);process.exit(1);}
console.log(`Combat records V11 check PASS · ${checks.length}/${checks.length}`);
