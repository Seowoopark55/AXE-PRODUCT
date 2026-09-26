// Platform-only game-information editor. This module renders no ordinary viewer content.
// Server-side authorization is enforced independently in lac_admin_save_game_info().
const e = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export const MODBOOK_CATEGORY_CHOICES = Object.freeze(['SMG','피스톨','라이플','저격소총','머신건','근접무기','벌목','채광','채집','낚시','요리','제련','제작','감정','절도','체력','이동속도']);
export const MODBOOK_PART_CHOICES = Object.freeze(['겉옷/단독상의','상의','하의','신발','근접무기','피스톨','SMG','라이플','저격소총','머신건']);
const multiChoiceType=(values,max=2)=>`multi-choice:${max}:${values.join('|')}`;

export const GAME_ADMIN_SCHEMAS = Object.freeze({
  info_crafts:{label:'제작법', title:'item_name', fields:[
    ['item_name','아이템 이름','text',true],['category','제작 분류','text',true],
    ['success_rate','성공률 (%)','integer'],['craft_rank','제작 등급'],['obtain_place','획득 장소'],['note','비고','textarea'],['sort_order','표시 순서','integer']
  ]},
  info_material_recipes:{label:'무기부품·재료',title:'item_name',fields:[
    ['item_name','결과 아이템 이름','text',true],...Array.from({length:8},(_,index)=>[['input'+(index+1),`재료 ${index+1}`],['input'+(index+1)+'_qty',`재료 ${index+1} 수량`,'number']]).flat(),['note','비고','textarea'],['sort_order','표시 순서','integer']
  ]},
  info_processes:{label:'가공·재련',title:'item_name',fields:[
    ['item_name','결과 아이템 이름','text',true],['job','직업','text',true],['process_type','작업 종류','text',true],
    ...Array.from({length:4},(_,index)=>[['input'+(index+1),`투입 재료 ${index+1}`],['input'+(index+1)+'_qty',`투입 수량 ${index+1}`,'number']]).flat(),
    ['output_qty','생산 수량','number'],['quest_qty','별도 납품 수량','number'],['reward_money','보상 금액','integer'],['reward_xp','보상 경험치','integer'],['rank','등급'],['note','비고','textarea'],['sort_order','표시 순서','integer']
  ]},
  info_quests:{label:'퀘스트',title:'item_name',fields:[
    ['item_name','납품 아이템·퀘스트 이름','text',true],['job','직업','text',true],['required_qty','납품 수량','number'],['reward_money','보상 금액','integer'],['reward_xp','보상 경험치','integer'],['rank','등급'],['note','비고','textarea'],['sort_order','표시 순서','integer']
  ]},
  info_skill_ranks:{label:'스킬',title:'skill',fields:[
    ['skill','스킬 이름','text',true],['rank','등급','text',true],['required_point','필요 포인트','number'],['point_type','포인트 종류'],['note','비고','textarea'],['sort_order','표시 순서','integer']
  ]},
  modbook_catalog:{label:'개조서',title:'name',fields:[
    ['name','개조서 이름','text',true],['type','개조 위치','choice:접두|접미',true],
    ['category','분류',multiChoiceType(MODBOOK_CATEGORY_CHOICES,2),true],
    ['parts','적용 가능 부위',multiChoiceType(MODBOOK_PART_CHOICES,2),true],
    ['option1','옵션 1'],['option2','옵션 2'],['option3','옵션 3'],['success_rate','성공률 (%)','integer'],['note','비고','textarea'],['sort_order','표시 순서','integer']
  ]}
});
export const GAME_ADMIN_TABLES = Object.freeze(Object.keys(GAME_ADMIN_SCHEMAS));
export const GAME_ADMIN_IMAGE_TABLES = Object.freeze(['info_crafts','info_material_recipes','info_processes','info_quests','info_skill_ranks']);

const str = value => value === undefined || value === null ? '' : String(value);
const normalized = value => str(value).trim().toLocaleLowerCase('ko-KR');
const labelFor = (table,row) => str(row?.[GAME_ADMIN_SCHEMAS[table]?.title] || '이름 없음');
const searchTextFor = (table,row) => normalized([labelFor(table,row),row?.job,row?.category,row?.rank,row?.process_type,row?.point_type].filter(Boolean).join(' '));

function field(table,row,[key,label,type='text',required=false]) {
  const value = str(row?.[key]);
  const attrs = `name="${key}" id="lac-ga-${key}" ${required?'required':''}`;
  let control;
  if(type==='textarea') control = `<textarea ${attrs} rows="3" maxlength="2000">${e(value)}</textarea>`;
  else if(type.startsWith('choice:')) control=`<select ${attrs}>${type.slice(7).split('|').map(item=>`<option value="${e(item)}" ${item===value?'selected':''}>${e(item)}</option>`).join('')}</select>`;
  else if(type.startsWith('multi-choice:')){
    const [,maxRaw,choicesRaw]=type.split(':');
    const max=Math.max(1,Number(maxRaw)||2);
    const choices=String(choicesRaw||'').split('|').filter(Boolean);
    const selected=new Set(value.split(/[,，、]/u).map(item=>item.trim()).filter(Boolean));
    const validSelected=choices.filter(item=>selected.has(item));
    const summary=validSelected.length?validSelected.join(' · '):'선택해 주세요';
    control=`<details class="lac-ga__multi" data-ga-multi data-ga-multi-max="${max}" data-ga-multi-label="${e(label)}"><summary><span data-ga-multi-summary>${e(summary)}</span><small>최대 ${max}개</small></summary><div class="lac-ga__multi-menu">${choices.map(item=>`<label><input type="checkbox" name="${e(key)}" value="${e(item)}" ${selected.has(item)?'checked':''}><span>${e(item)}</span></label>`).join('')}</div></details>`;
  }
  else control = `<input ${attrs} type="${type==='integer'||type==='number'?'number':type}" ${type==='integer'?'step="1" min="0"':type==='number'?'step="any" min="0"':''} ${type==='text'?'maxlength="160"':''} value="${e(value)}" autocomplete="off">`;
  if(type.startsWith('multi-choice:')) return `<div class="lac-ga__field lac-ga__field--multi"><span>${e(label)}${required?' <i>필수</i>':''}</span>${control}</div>`;
  return `<label class="lac-ga__field" for="lac-ga-${e(key)}"><span>${e(label)}${required?' <i>필수</i>':''}</span>${control}</label>`;
}

function materialRow(material={},index=0) {
  return `<div class="lac-ga__material" data-ga-material>
    <label><span>재료 이름</span><input name="material_name" maxlength="160" value="${e(material.material_name)}" required placeholder="아이템 이름"></label>
    <label><span>필요 수량</span><input name="quantity" type="number" min="0.000001" step="any" value="${e(material.quantity??1)}" required></label>
    <button type="button" class="lac-ga__quiet" data-game-admin-action="remove-material" aria-label="재료 ${index+1} 삭제">제거</button>
  </div>`;
}
function materialEditor(state,selected) {
  const materials = selected ? (state.info?.data?.info_craft_materials||[]).filter(item=>String(item.craft_id)===String(selected.id)&&item.is_active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)) : [];
  return `<section class="lac-ga__materials"><div class="lac-ga__section-head"><div><strong>필요 재료</strong><p>이름과 수량을 입력하고 원하는 만큼 재료를 추가하세요.</p></div><button type="button" class="lac-ga__quiet" data-game-admin-action="add-material">+ 재료 추가</button></div><div data-ga-material-list>${materials.length?materials.map(materialRow).join(''):materialRow()}</div></section>`;
}
function historyPanel(state) {
  const admin = state.gameAdmin||{};
  const rows = admin.history||[];
  if(!admin.showHistory)return '';
  return `<section class="lac-ga__history"><div class="lac-ga__section-head"><strong>최근 변경 기록</strong><button class="lac-ga__quiet" type="button" data-game-admin-action="history-refresh">새로고침</button></div><p>누가, 언제, 어떤 항목을 수정했는지 확인할 수 있습니다. 이전 값은 DB 변경 기록에 보존됩니다.</p>${admin.historyError?`<p class="lac-ga__error">${e(admin.historyError)}</p>`:''}${rows.length?rows.map(row=>`<div class="lac-ga__history-row"><b>${e(GAME_ADMIN_SCHEMAS[row.table_name]?.label||row.table_name)} · ${e(row.action==='create'?'신규 등록':row.action==='delete'?'삭제':'정보 수정')}</b><span>${e(row.after_data?.item_name||row.after_data?.skill||row.after_data?.name||row.record_id)}</span><small>${e(row.created_at?new Date(row.created_at).toLocaleString('ko-KR'):'')} · 운영자 ${e(String(row.actor_id||'').slice(0,8))}</small></div>`).join(''):'<p>표시할 변경 기록이 없습니다.</p>'}</section>`;
}


function requestDate(value){
  if(!value)return '';
  try{return new Date(value).toLocaleString('ko-KR');}catch{return str(value);}
}
const splitChoiceList=value=>str(value).split(/[,，、]/u).map(item=>item.trim()).filter(Boolean);
function requestReviewEditor(state,request,masterRows){
  if(!request)return `<div class="lac-ga__empty lac-ga__empty--editor"><strong>검수할 신청을 선택해 주세요</strong><p>왼쪽 승인 대기 목록에서 신청을 선택하세요.</p></div>`;
  const schema=GAME_ADMIN_SCHEMAS.modbook_catalog;
  const draft={...request,active:true,sort_order:''};
  const imageUrl=str(request.source_image_url).trim();
  const categoryValues=splitChoiceList(request.category);
  const partValues=splitChoiceList(request.parts);
  const originalValid=['접두','접미'].includes(str(request.type).trim())
    && categoryValues.length>=1&&categoryValues.length<=2&&categoryValues.every(value=>MODBOOK_CATEGORY_CHOICES.includes(value))
    && partValues.length>=1&&partValues.length<=2&&partValues.every(value=>MODBOOK_PART_CHOICES.includes(value));
  return `<form class="lac-ga__form lac-ga__request-form" data-ga-request-form data-request-id="${e(request.id)}">
    <div class="lac-ga__form-head"><div><span>등록 신청 검수</span><h3>${e(request.name||'개조서 신청')}</h3><p>${e(request.company_name||'회사')} · ${e(request.member_display_name||'신청자')} · ${e(requestDate(request.created_at))}</p></div><span class="lac-ga__id">REQUEST · ${e(request.id)}</span></div>
    <div class="lac-ga__request-source"><div><b>신청 정보</b><span>회사 · ${e(request.company_name||'—')}</span><span>신청자 · ${e(request.member_display_name||'—')}</span></div>${imageUrl?`<a href="${e(imageUrl)}" target="_blank" rel="noopener noreferrer">원본 크게 열기</a>`:'<span>원본 이미지는 Discord DM에서 확인해 주세요.</span>'}</div>
    <div class="lac-ga__request-compare"><section class="lac-ga__request-photo"><div class="lac-ga__request-photo-head"><strong>원본 사진</strong><small>사진을 기준으로 오른쪽 추출값을 확인하세요.</small></div>${imageUrl?`<a class="lac-ga__request-image" href="${e(imageUrl)}" target="_blank" rel="noopener noreferrer"><img src="${e(imageUrl)}" alt="등록 신청 원본 이미지" loading="lazy" referrerpolicy="no-referrer"></a><small class="lac-ga__request-image-note">Discord 원본 주소가 만료된 경우 신청 알림 DM의 첨부 이미지를 확인해 주세요.</small>`:'<div class="lac-ga__request-image-missing">저장된 원본 이미지 주소가 없습니다.<br>신청 알림 DM의 첨부 이미지를 확인해 주세요.</div>'}</section><section class="lac-ga__request-values"><div class="lac-ga__request-photo-head"><strong>인식된 정보</strong><small>틀린 항목만 수정한 뒤 승인하면 됩니다.</small></div><div class="lac-ga__fields">${schema.fields.map(def=>field('modbook_catalog',draft,def)).join('')}</div></section></div>
    <label class="lac-ga__field lac-ga__review-note"><span>검수 메모</span><textarea name="review_note" rows="2" maxlength="500" placeholder="반려 사유나 내부 메모가 필요한 경우 입력"></textarea></label>
    <section class="lac-ga__merge"><div class="lac-ga__section-head"><div><strong>기존 개조서와 병합</strong><p>같은 개조서가 이미 있다면 새로 만들지 않고 기존 항목과 연결합니다.</p></div></div><div class="lac-ga__merge-row"><select name="merge_modbook_id"><option value="">기존 공통 개조서 선택</option>${masterRows.map(row=>`<option value="${e(row.id)}">${e(row.name)} · ${e(row.type||'')}</option>`).join('')}</select><button type="button" class="lac-ga__quiet" data-game-admin-action="modbook-request-merge">선택 항목과 병합</button></div></section>
    ${originalValid?'':`<div class="lac-ga__request-warning"><strong>분류 또는 적용 가능 부위를 확인해 주세요.</strong><span>OCR 값이 공통 선택값과 맞지 않아 원본 그대로 승인은 잠겨 있습니다. 오른쪽에서 올바른 값을 선택한 뒤 수정 후 승인하세요.</span></div>`}<div class="lac-ga__request-actions"><button type="button" class="lac-ga__danger" data-game-admin-action="modbook-request-reject">반려</button><span></span><button type="button" class="lac-ga__quiet" data-game-admin-action="modbook-request-approve-original" ${originalValid?'':'disabled'}>원본 그대로 승인</button><button type="button" class="lac-ga__approve" data-game-admin-action="modbook-request-approve-edit">수정 후 승인</button></div>
  </form>`;
}
function requestWorkspace(state,admin,masterRows,{platformCenter=false}={}){
  const requests=Array.isArray(admin.requests)?admin.requests:[];
  const selected=requests.find(row=>String(row.id)===String(admin.requestSelectedId||''))||null;
  const headerAction=platformCenter
    ? '<button type="button" class="lac-ga__quiet" data-game-admin-action="requests-refresh">새로고침</button>'
    : '<button type="button" data-game-admin-action="requests-close">공통 목록</button>';
  return `<div class="lac-ga__layout lac-ga__layout--review"><aside class="lac-ga__list"><div class="lac-ga__list-top"><strong>승인 대기 <small>${requests.length}건</small></strong>${headerAction}</div><p class="lac-ga__company">회사에서 이미지 또는 수동 입력으로 신청한 개조서입니다. 원본 사진과 추출값을 비교한 뒤 필요한 부분만 수정해 승인하세요.</p>${admin.requestsLoading?'<div class="lac-ga__empty">신청 목록을 불러오는 중…</div>':admin.requestsError?`<div class="lac-ga__empty lac-ga__error">${e(admin.requestsError)}<br><button type="button" class="lac-ga__quiet" data-game-admin-action="requests-refresh">다시 불러오기</button></div>`:`<div class="lac-ga__items">${requests.map(row=>`<button type="button" class="lac-ga__item ${String(selected?.id)===String(row.id)?'is-active':''}" data-game-admin-action="request-select" data-request-id="${e(row.id)}"><strong>${e(row.name||'이름 없음')}</strong><span>${e(row.company_name||'회사')} · ${e(row.member_display_name||'신청자')}</span></button>`).join('')||'<div class="lac-ga__empty">현재 승인 대기 신청이 없습니다.</div>'}</div>`}</aside><div class="lac-ga__editor">${requestReviewEditor(state,selected,masterRows)}</div></div>`;
}

export function renderPlatformModbookReview(state){
  if(!state.platformAdmin)return '';
  const admin=state.gameAdmin||{};
  const masterRows=state.info?.data?.modbook_catalog||[];
  const pending=Array.isArray(admin.requests)?admin.requests.length:0;
  return `<section class="lac-ga lac-ga--platform-review" aria-label="개조서 등록 검수"><div class="lac-ga__top"><div><span class="lac-ga__eyebrow">PLATFORM ADMIN · MODBOOK REVIEW</span><h2>개조서 검수</h2><p>Discord에서 접수된 신청의 원본 사진과 추출 정보를 비교한 뒤 승인합니다. 승인된 정보는 모든 회사의 공통 개조서에 반영됩니다.</p></div><div class="lac-ga__review-count"><span>검수 대기</span><strong>${pending}</strong></div></div>${requestWorkspace(state,admin,masterRows,{platformCenter:true})}</section>`;
}

export function renderGameInfoAdmin(state) {
  if(!state.platformAdmin)return '';
  const admin=state.gameAdmin||{};
  const table=GAME_ADMIN_SCHEMAS[admin.table]?admin.table:'info_crafts';
  const schema=GAME_ADMIN_SCHEMAS[table];
  const rows=state.info?.data?.[table]||[];
  const selected=admin.selectedId?rows.find(row=>String(row.id)===String(admin.selectedId)):null;
  const isNew=admin.mode==='new';
  const editing=isNew||Boolean(selected);
  const activeKey=table==='modbook_catalog'?'active':'is_active';
  const query=normalized(admin.query||'');
  const visible=rows.filter(row=>admin.showInactive||row[activeKey]!==false);
  const matchesQuery=row=>!query||searchTextFor(table,row).includes(query);
  const matchCount=visible.filter(matchesQuery).length;
  const imageKey=table==='info_skill_ranks'&&selected?.skill?'skill:'+String(selected.skill).trim():selected?.item_name?.trim();
  const image=(state.info?.data?.info_images||[]).find(i=>i.item_key===imageKey);
  const requestCount=Array.isArray(admin.requests)?admin.requests.length:0;
  const workspace=table==='modbook_catalog'&&admin.requestMode?requestWorkspace(state,admin,rows):`<div class="lac-ga__layout"><aside class="lac-ga__list"><div class="lac-ga__list-top"><strong>${e(schema.label)} <small>${matchCount}건</small></strong><div class="lac-ga__list-actions">${table==='modbook_catalog'?`<button type="button" class="lac-ga__pending-btn" data-game-admin-action="requests-open">승인 대기 ${requestCount}</button>`:''}<button type="button" data-game-admin-action="new">+ 새로 등록</button></div></div><label class="lac-ga__search"><span class="sr-only">자료 이름 검색</span><input type="search" data-game-admin-search placeholder="이름으로 검색" value="${e(admin.query||'')}"></label><label class="lac-ga__inactive"><input type="checkbox" data-game-admin-inactive ${admin.showInactive?'checked':''}> 비활성 정보 포함</label>
    ${table==='modbook_catalog'?'<p class="lac-ga__company">승인된 공통 개조서를 관리합니다. 회사별 최근 거래가는 각 회사 Discord에서 별도로 관리됩니다.</p>':''}
    <div class="lac-ga__items">${visible.map(row=>`<button type="button" class="lac-ga__item ${String(selected?.id)===String(row.id)&&!isNew?'is-active':''}" data-game-admin-action="select" data-game-admin-id="${e(row.id)}" data-ga-search-text="${e(searchTextFor(table,row))}" ${matchesQuery(row)?'':'hidden'}><strong>${e(labelFor(table,row))}</strong><span>${e([row.job,row.category,row.rank].filter(Boolean).join(' · '))}${row[activeKey]===false?' · 비활성':''}</span></button>`).join('')||'<div class="lac-ga__empty">등록된 자료가 없습니다.</div>'}</div></aside>
    <div class="lac-ga__editor">${!editing?`<div class="lac-ga__empty lac-ga__empty--editor"><strong>관리할 항목을 선택해 주세요</strong><p>왼쪽 목록에서 정보를 선택하거나 새로 등록하세요.</p></div>`:`<form data-form="game-admin-save" class="lac-ga__form" data-ga-form><div class="lac-ga__form-head"><div><span>${isNew?'새 정보 등록':'기존 정보 수정'}</span><h3>${e(isNew?'새 '+schema.label:labelFor(table,selected))}</h3></div>${selected?`<span class="lac-ga__id">ID · ${e(selected.id)}</span>`:''}</div>
    <div class="lac-ga__fields">${schema.fields.map(def=>field(table,selected,def)).join('')}</div>
    ${table==='info_crafts'?materialEditor(state,selected):''}
    ${GAME_ADMIN_IMAGE_TABLES.includes(table)?`<section class="lac-ga__upload"><div class="lac-ga__section-head"><div><strong>대표 이미지</strong><p>${table==='info_skill_ranks'?'같은 스킬의 모든 등급에 적용됩니다.':'같은 아이템 이름에 연결됩니다.'} JPG·PNG·WebP, 최대 2MB</p></div></div>${image?'<p class="lac-ga__current-image">현재 등록된 이미지가 있습니다. 새 파일을 선택하면 교체합니다.</p>':''}<input type="file" name="game_image" accept="image/png,image/jpeg,image/webp" data-ga-image><div class="lac-ga__image-preview" data-ga-image-preview>${image?`<span>현재 이미지</span><img src="${e(image.url||'')}" alt="현재 대표 이미지">`: '이미지를 선택하면 여기에 미리보기가 표시됩니다.'}</div></section>`:''}
    <label class="lac-ga__status"><input type="checkbox" name="${activeKey}" ${selected?.[activeKey]===false?'':'checked'}><span><b>사용 중</b><small>끄면 일반 사용자 목록에서 숨겨집니다. 기존 데이터는 삭제하지 않습니다.</small></span></label>
    <div class="lac-ga__bottom"><p>저장 전에 변경 내용을 한 번 더 확인합니다.</p><div class="lac-ga__bottom-actions">${table==='modbook_catalog'&&!isNew&&selected?.active!==false?'<button type="button" class="lac-ga__danger" data-game-admin-action="delete-modbook">개조서 삭제</button>':''}<button type="submit" data-ga-save-button>${isNew?'새 정보 등록하기':'변경 내용 저장하기'}</button></div></div></form>`}</div></div>`;
  return `<section class="lac-ga" aria-label="게임정보 관리자"><div class="lac-ga__top"><div><span class="lac-ga__eyebrow">PLATFORM ADMIN · CONTENT MANAGER</span><h2>게임정보 관리</h2><p>자료를 선택해 수정하거나 새로운 정보를 등록하세요. 저장한 내용은 게임정보 페이지에 반영됩니다.</p></div><button type="button" class="lac-ga__quiet" data-game-admin-action="toggle-history">${admin.showHistory?'변경 기록 닫기':'변경 기록'}</button></div>
    <nav class="lac-ga__tabs" aria-label="관리 카테고리">${GAME_ADMIN_TABLES.map(key=>`<button type="button" class="${key===table?'is-active':''}" data-game-admin-action="table" data-game-admin-table="${key}" aria-pressed="${key===table}">${e(GAME_ADMIN_SCHEMAS[key].label)}${key==='modbook_catalog'&&requestCount?` <small>${requestCount}</small>`:''}</button>`).join('')}</nav>
    ${historyPanel(state)}${workspace}</section>`;
}
