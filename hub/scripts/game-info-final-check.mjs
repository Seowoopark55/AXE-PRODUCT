import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const hubRoot=path.resolve(here,'..');
const repoRoot=path.resolve(hubRoot,'..');
const read=rel=>fs.readFileSync(path.join(hubRoot,rel),'utf8');
const ok=(condition,message)=>{assert.ok(condition,message);console.log(`PASS · ${message}`);};

const info=read('src/ui/infoPage.js');
const admin=read('src/ui/gameInfoAdmin.js');
const api=read('src/lib/productApi.js');
const main=read('src/main.js');
const styles=read('src/styles.css');

ok(/const TOP_TABS=\[\['info_crafts','제작법'\],\['info_processes','가공·재련'\],\['info_quests','퀘스트'\],\['info_skill_ranks','스킬'\],\['modbook_catalog','개조서'\]\]/.test(info),'현재 사용자용 게임정보 5개 탭 유지');
ok(/export const GAME_ADMIN_TABLES = Object\.freeze\(Object\.keys\(GAME_ADMIN_SCHEMAS\)\)/.test(admin),'관리자 카테고리는 스키마 기준으로 단일 관리');
for(const table of ['info_crafts','info_material_recipes','info_processes','info_quests','info_skill_ranks','modbook_catalog']) ok(admin.includes(`${table}:`),`관리 스키마 포함: ${table}`);
ok(main.includes("data-game-admin-action") && main.includes('renderGameInfoAdmin(state)'),'플랫폼 관리자 UI 연결 유지');
ok(main.includes("state.platformAdmin") && main.includes("gameAdminOpen"),'관리 화면 클라이언트 가드 유지');
ok(api.includes("supabase.rpc('lac_admin_save_game_info'"),'게임정보 저장은 관리자 검증 RPC 사용');
ok(!/\.from\(['"]info_(?:crafts|craft_materials|material_recipes|processes|quests|skill_ranks)['"]\)\s*\.(?:insert|update|delete|upsert)/s.test(api),'브라우저에서 공통 게임정보 직접 쓰기 없음');
ok(api.includes('const INFO_PAGE_SIZE = 500') && api.includes('.range(offset, offset + INFO_PAGE_SIZE - 1)'),'공통 게임정보 페이지네이션 적용');
ok(api.includes("activeCraftIds") && api.includes("data.info_craft_materials = data.info_craft_materials.filter"),'비활성 제작법의 재료 노출 차단 유지');
ok(api.includes(".from('modbook_catalog')") && api.includes('.range(offset, offset + 499)'),'회사별 개조서 페이지네이션 유지');
ok(api.includes(".from('info_images')") && api.includes(".range(offset, offset + INFO_PAGE_SIZE - 1)"),'관리자 이미지 매핑 페이지네이션 적용');
ok(api.includes("cacheControl:'31536000'"),'UUID 관리자 이미지 장기 캐시 적용');
ok(main.includes('function gameAdminImageKey') && main.includes('Renaming an item/skill without choosing a new file keeps the existing art'),'이름 변경 시 기존 대표 이미지 연결 보존');
ok(main.includes('gameAdminRefreshList()') && main.includes('gameAdminApplyListSearch()'),'관리자 비활성 포함·검색 목록 갱신 로직 적용');

const gameCenterAt=styles.indexOf("@import './styles/game-center.css';");
const gameAdminAt=styles.indexOf("@import './styles/game-info-admin.css';");
ok(gameCenterAt>=0 && gameAdminAt>gameCenterAt,'관리자 CSS가 승인된 게임정보 CSS 뒤에서 분리 적용');

const skillMarker=info.indexOf("'낚시':'fishing.png'");
ok(skillMarker>0,'스킬 PNG 영역 확인');
const itemArtCode=info.slice(0,skillMarker);
ok(!itemArtCode.includes('.png'),'아이템·퀘스트 정적 아트 참조를 WebP로 통일');
const refs=[...itemArtCode.matchAll(/["']([A-Za-z0-9_.-]+\.webp)["']/g)].map(m=>m[1]);
const uniqueRefs=[...new Set(refs)];
ok(uniqueRefs.length>=70,'정적 아이템/퀘스트 WebP 매핑 수 확인');
for(const file of uniqueRefs){
  ok(fs.existsSync(path.join(hubRoot,'public/hub/game-info/items',file)),`정적 이미지 존재: ${file}`);
}
const staticPngs=fs.readdirSync(path.join(hubRoot,'public/hub/game-info/items')).filter(name=>name.endsWith('.png'));
ok(staticPngs.length===0,'아이템 디렉터리의 구형 PNG 잔존 없음');

for(const stale of ['README_LAC_HUB_ADMIN_FULL_REPLACE.txt','hub/README_GAME_INFO_ADMIN_HUB4_WEB_RESTORE.txt','hub/README_WEB_RESTORE.txt']){
  ok(!fs.existsSync(path.join(repoRoot,stale)),`임시 배포 문서 제거: ${stale}`);
}

// Render smoke checks exercise the current public/admin templates without a browser.
const {renderInfoPage}=await import(pathToFileURL(path.join(hubRoot,'src/ui/infoPage.js')).href);
const {renderGameInfoAdmin}=await import(pathToFileURL(path.join(hubRoot,'src/ui/gameInfoAdmin.js')).href);
const fixture={
  platformAdmin:true,companyId:'company-test',companies:[{id:'company-test'}],
  info:{loaded:true,loading:false,error:'',modbookError:'',table:'info_crafts',craftGroup:'총기류',modbookCategory:'',query:'',selectedId:'craft-test',filterPrimary:'__all__',filterSecondary:'__all__',companyId:'company-test',data:{
    info_crafts:[{id:'craft-test',category:'PISTOL',item_name:'피스톨',success_rate:80,sort_order:1,is_active:true}],
    info_craft_materials:[{id:1,craft_id:'craft-test',material_name:'고철',quantity:2,sort_order:1,is_active:true}],
    info_material_recipes:[],info_processes:[],info_quests:[],info_skill_ranks:[],modbook_catalog:[],info_images:[]
  }},
  gameAdminOpen:true,gameAdmin:{table:'info_crafts',selectedId:'craft-test',mode:'edit',query:'',showInactive:false,dirty:false,showHistory:false,history:[],historyError:''}
};
const viewerHtml=renderInfoPage(fixture,{standalone:true});
ok(viewerHtml.includes('제작법')&&viewerHtml.includes('가공·재련')&&viewerHtml.includes('퀘스트')&&viewerHtml.includes('스킬')&&viewerHtml.includes('개조서'),'현재 공개 게임정보 탭 렌더링');
ok(viewerHtml.includes('/hub/game-info/items/pistol.webp'),'공개 상세 화면 WebP 대표 이미지 렌더링');
const adminHtml=renderGameInfoAdmin(fixture);
ok(adminHtml.includes('게임정보 관리')&&adminHtml.includes('비활성 정보 포함')&&adminHtml.includes('변경 내용 저장하기'),'관리자 편집 화면 렌더링');

console.log(`\nGame Info final check PASS · static item refs ${uniqueRefs.length}개`);
