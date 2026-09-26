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
const adminStyles=read('src/styles/game-info-admin.css');

ok(/const TOP_TABS=\[\['info_crafts','제작법'\],\['info_processes','가공·재련'\],\['info_quests','퀘스트'\],\['info_skill_ranks','스킬'\],\['modbook_catalog','개조서'\]\]/.test(info),'현재 사용자용 게임정보 5개 탭 유지');
ok(/export const GAME_ADMIN_TABLES = Object\.freeze\(Object\.keys\(GAME_ADMIN_SCHEMAS\)\)/.test(admin),'관리자 카테고리는 스키마 기준으로 단일 관리');
for(const table of ['info_crafts','info_material_recipes','info_processes','info_quests','info_skill_ranks','modbook_catalog']) ok(admin.includes(`${table}:`),`관리 스키마 포함: ${table}`);
ok(main.includes("data-game-admin-action") && main.includes('renderGameInfoAdmin(state)'),'플랫폼 관리자 UI 연결 유지');
ok(main.includes("state.platformAdmin") && main.includes("gameAdminOpen"),'관리 화면 클라이언트 가드 유지');
ok(api.includes("supabase.rpc('lac_admin_save_game_info'"),'게임정보 저장은 관리자 검증 RPC 사용');
ok(!/\.from\(['"]info_(?:crafts|craft_materials|material_recipes|processes|quests|skill_ranks)['"]\)\s*\.(?:insert|update|delete|upsert)/s.test(api),'브라우저에서 공통 게임정보 직접 쓰기 없음');
ok(api.includes('const INFO_PAGE_SIZE = 500') && api.includes('.range(offset, offset + INFO_PAGE_SIZE - 1)'),'공통 게임정보 페이지네이션 적용');
ok(api.includes("activeCraftIds") && api.includes("data.info_craft_materials = data.info_craft_materials.filter"),'비활성 제작법의 재료 노출 차단 유지');
ok(api.includes(".from('modbook_master_catalog')") && api.includes('.range(offset, offset + INFO_PAGE_SIZE - 1)'),'공통 개조서 페이지네이션 적용');
ok(!api.includes(".eq('company_id', id)"),'게임정보 개조서는 회사 선택과 분리된 공통 카탈로그');
ok(api.includes("supabase.rpc('lac_admin_save_modbook_master_v1'"),'공통 개조서 저장은 플랫폼 관리자 RPC 사용');
ok(api.includes("platform_modbook_request_list_v1")&&api.includes("platform_modbook_request_review_v1"),'개조서 중앙 승인 RPC 연결');
ok(admin.includes('승인 대기')&&admin.includes('수정 후 승인')&&admin.includes('선택 항목과 병합'),'플랫폼 관리자 개조서 승인 UI 렌더 경로 포함');
ok(api.includes(".from('info_images')") && api.includes(".range(offset, offset + INFO_PAGE_SIZE - 1)"),'관리자 이미지 매핑 페이지네이션 적용');
ok(api.includes("cacheControl:'31536000'"),'UUID 관리자 이미지 장기 캐시 적용');
ok(main.includes('function gameAdminImageKey') && main.includes('Renaming an item/skill without choosing a new file keeps the existing art'),'이름 변경 시 기존 대표 이미지 연결 보존');
ok(main.includes('gameAdminRefreshList()') && main.includes('gameAdminApplyListSearch()'),'관리자 비활성 포함·검색 목록 갱신 로직 적용');

const gameCenterAt=styles.indexOf("@import './styles/game-center.css';");
const gameAdminAt=styles.indexOf("@import './styles/game-info-admin.css';");
ok(gameCenterAt>=0 && gameAdminAt>gameCenterAt,'관리자 CSS가 승인된 게임정보 CSS 뒤에서 분리 적용');
ok(main.includes("'game-center--admin'") || read('src/ui/render.js').includes("'game-center--admin'"),'관리자 전용 셸 클래스 적용');
ok(adminStyles.includes('.game-center--admin .game-center__body{'),'관리자 모드가 공개 화면 고정 그리드에서 분리됨');
ok(adminStyles.includes('.game-center--admin .lac-ga__editor{\n    overflow-x:hidden;\n    overflow-y:auto;'),'긴 관리자 편집 폼에 독립 세로 스크롤 적용');
ok(adminStyles.includes('.game-center--admin .lac-ga__bottom{\n    position:sticky;'),'관리자 저장 영역 하단 고정 적용');

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
const {renderGameInfoAdmin,renderPlatformModbookReview}=await import(pathToFileURL(path.join(hubRoot,'src/ui/gameInfoAdmin.js')).href);
const fixture={
  platformAdmin:true,companyId:'company-test',companies:[{id:'company-test'}],
  info:{loaded:true,loading:false,error:'',modbookError:'',table:'info_crafts',craftGroup:'총기류',modbookCategory:'',query:'',selectedId:'craft-test',filterPrimary:'__all__',filterSecondary:'__all__',companyId:'company-test',data:{
    info_crafts:[{id:'craft-test',category:'PISTOL',item_name:'피스톨',success_rate:80,sort_order:1,is_active:true}],
    info_craft_materials:[{id:1,craft_id:'craft-test',material_name:'고철',quantity:2,sort_order:1,is_active:true}],
    info_material_recipes:[],info_processes:[],info_quests:[],info_skill_ranks:[],modbook_catalog:[],info_images:[]
  }},
  gameAdminOpen:true,gameAdmin:{table:'info_crafts',selectedId:'craft-test',mode:'edit',query:'',showInactive:false,dirty:false,showHistory:false,history:[],historyError:'',requestMode:false,requests:[],requestsLoading:false,requestsError:'',requestSelectedId:''}
};
const viewerHtml=renderInfoPage(fixture,{standalone:true});
ok(viewerHtml.includes('제작법')&&viewerHtml.includes('가공·재련')&&viewerHtml.includes('퀘스트')&&viewerHtml.includes('스킬')&&viewerHtml.includes('개조서'),'현재 공개 게임정보 탭 렌더링');
ok(viewerHtml.includes('/hub/game-info/items/pistol.webp'),'공개 상세 화면 WebP 대표 이미지 렌더링');
const adminHtml=renderGameInfoAdmin(fixture);
ok(adminHtml.includes('게임정보 관리')&&adminHtml.includes('비활성 정보 포함')&&adminHtml.includes('변경 내용 저장하기'),'관리자 편집 화면 렌더링');

const modFixture={...fixture,companyId:null,companies:[],info:{...fixture.info,table:'modbook_catalog',selectedId:'mod-1',data:{...fixture.info.data,modbook_catalog:[{id:'mod-1',type:'접두',category:'SMG',name:'신속한',parts:'총기',option1:'이동속도 +5%',success_rate:20,sort_order:1,active:true,updated_at:new Date().toISOString()}]}},gameAdmin:{...fixture.gameAdmin,table:'modbook_catalog',selectedId:'mod-1',requests:[{id:'req-1',company_name:'테스트 회사',member_display_name:'신청자',type:'접두',category:'SMG',name:'신규 개조서',parts:'총기',option1:'효과',success_rate:10,status:'pending',created_at:new Date().toISOString()}]}};
const modViewer=renderInfoPage(modFixture,{standalone:true});
ok(modViewer.includes('신속한'),'회사 미선택 상태에서도 승인된 공통 개조서 렌더링');
const modAdmin=renderGameInfoAdmin(modFixture);
ok(modAdmin.includes('승인 대기 1'),'개조서 승인 대기 배지 렌더링');
const requestFixture={...modFixture,gameAdmin:{...modFixture.gameAdmin,requestMode:true,requestSelectedId:'req-1'}};
const requestAdmin=renderGameInfoAdmin(requestFixture);
ok(requestAdmin.includes('원본 그대로 승인')&&requestAdmin.includes('수정 후 승인')&&requestAdmin.includes('선택 항목과 병합')&&requestAdmin.includes('반려'),'개조서 중앙 승인 검수 화면 렌더링');


const platformReview=renderPlatformModbookReview(requestFixture);
ok(platformReview.includes('개조서 검수')&&platformReview.includes('원본 사진')&&platformReview.includes('인식된 정보'),'관리 센터 개조서 전용 검수 화면 렌더링');
ok(main.includes("state.page='platform';state.platformView='modbooks'")&&main.includes('pendingModbookReviewId()'),'DM 검수 링크가 게임정보 이용권 게이트가 아닌 플랫폼 검수 화면으로 연결');
ok(main.includes('MODBOOK_REVIEW_STORAGE_KEY')&&main.includes('clearPendingModbookReviewId'),'Discord 재로그인 뒤에도 검수 신청 ID 보존');
ok(read('src/ui/render.js').includes("'modbooks','개조서 검수'")&&read('src/ui/render.js').includes('data-platform-view="modbooks"'),'관리 센터 사이드바와 대시보드에 개조서 검수 진입점 포함');

console.log(`\nGame Info final check PASS · static item refs ${uniqueRefs.length}개`);
