// Platform-only game-information editor. This module renders no ordinary viewer content.
// Server-side authorization is enforced independently in lac_admin_save_game_info().
const e = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

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
    ['name','개조서 이름','text',true],['type','종류','choice:접두|접미',true],['category','적용 분야','text',true],['parts','필요 부품'],['option1','옵션 1'],['option2','옵션 2'],['option3','옵션 3'],['success_rate','성공률 (%)','integer'],['recent_price','최근 거래가','integer'],['recent_date','최근 거래일','date'],['price_note','가격 비고','textarea'],['note','비고','textarea'],['sort_order','표시 순서','integer']
  ]}
});
export const GAME_ADMIN_TABLES = Object.freeze(Object.keys(GAME_ADMIN_SCHEMAS));
export const GAME_ADMIN_IMAGE_TABLES = Object.freeze(['info_crafts','info_material_recipes','info_processes','info_quests','info_skill_ranks']);

const str = value => value === undefined || value === null ? '' : String(value);
const normalized = value => str(value).trim().toLocaleLowerCase('ko-KR');
const labelFor = (table,row) => str(row?.[GAME_ADMIN_SCHEMAS[table]?.title] || '이름 없음');

function field(table,row,[key,label,type='text',required=false]) {
  const value = str(row?.[key]);
  const attrs = `name="${key}" id="lac-ga-${key}" ${required?'required':''}`;
  let control;
  if(type==='textarea') control = `<textarea ${attrs} rows="3" maxlength="2000">${e(value)}</textarea>`;
  else if(type.startsWith('choice:')) control=`<select ${attrs}>${type.slice(7).split('|').map(item=>`<option value="${e(item)}" ${item===value?'selected':''}>${e(item)}</option>`).join('')}</select>`;
  else control = `<input ${attrs} type="${type==='integer'||type==='number'?'number':type}" ${type==='integer'?'step="1" min="0"':type==='number'?'step="any" min="0"':''} ${type==='text'?'maxlength="160"':''} value="${e(value)}" autocomplete="off">`;
  return `<label class="lac-ga__field" for="lac-ga-${key}"><span>${e(label)}${required?' <i>필수</i>':''}</span>${control}</label>`;
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
  return `<section class="lac-ga__history"><div class="lac-ga__section-head"><strong>최근 변경 기록</strong><button class="lac-ga__quiet" type="button" data-game-admin-action="history-refresh">새로고침</button></div><p>누가, 언제, 어떤 항목을 수정했는지 확인할 수 있습니다. 이전 값은 DB 변경 기록에 보존됩니다.</p>${admin.historyError?`<p class="lac-ga__error">${e(admin.historyError)}</p>`:''}${rows.length?rows.map(row=>`<div class="lac-ga__history-row"><b>${e(GAME_ADMIN_SCHEMAS[row.table_name]?.label||row.table_name)} · ${e(row.action==='create'?'신규 등록':'정보 수정')}</b><span>${e(row.after_data?.item_name||row.after_data?.skill||row.after_data?.name||row.record_id)}</span><small>${e(row.created_at?new Date(row.created_at).toLocaleString('ko-KR'):'')} · 운영자 ${e(String(row.actor_id||'').slice(0,8))}</small></div>`).join(''):'<p>표시할 변경 기록이 없습니다.</p>'}</section>`;
}

export function renderGameInfoAdmin(state) {
  if(!state.platformAdmin)return '';
  const admin=state.gameAdmin||{};
  const table=GAME_ADMIN_SCHEMAS[admin.table]?admin.table:'info_crafts';
  const schema=GAME_ADMIN_SCHEMAS[table];
  const rows=table==='modbook_catalog'&&!state.companyId?[]:(state.info?.data?.[table]||[]);
  const selected=admin.selectedId?rows.find(row=>String(row.id)===String(admin.selectedId)):null;
  const isNew=admin.mode==='new';
  const editing=isNew||Boolean(selected);
  const visible=rows.filter(row=>admin.showInactive||row[table==='modbook_catalog'?'active':'is_active']!==false);
  const activeKey=table==='modbook_catalog'?'active':'is_active';
  const imageKey=table==='info_skill_ranks'&&selected?.skill?'skill:'+String(selected.skill).trim():selected?.item_name?.trim();
  const image=(state.info?.data?.info_images||[]).find(i=>i.item_key===imageKey);
  const canAdd=table!=='modbook_catalog'||Boolean(state.companyId);
  return `<section class="lac-ga" aria-label="게임정보 관리자"><div class="lac-ga__top"><div><span class="lac-ga__eyebrow">PLATFORM ADMIN · CONTENT MANAGER</span><h2>게임정보 관리</h2><p>자료를 선택해 수정하거나 새로운 정보를 등록하세요. 저장한 내용은 게임정보 페이지에 반영됩니다.</p></div><button type="button" class="lac-ga__quiet" data-game-admin-action="toggle-history">${admin.showHistory?'변경 기록 닫기':'변경 기록'}</button></div>
    <nav class="lac-ga__tabs" aria-label="관리 카테고리">${GAME_ADMIN_TABLES.map(key=>`<button type="button" class="${key===table?'is-active':''}" data-game-admin-action="table" data-game-admin-table="${key}" aria-pressed="${key===table}">${e(GAME_ADMIN_SCHEMAS[key].label)}</button>`).join('')}</nav>
    ${historyPanel(state)}
    <div class="lac-ga__layout"><aside class="lac-ga__list"><div class="lac-ga__list-top"><strong>${e(schema.label)} <small>${visible.length}건</small></strong><button type="button" data-game-admin-action="new" ${canAdd?'':'disabled'}>+ 새로 등록</button></div><label class="lac-ga__search"><span class="sr-only">자료 이름 검색</span><input type="search" data-game-admin-search placeholder="이름으로 검색" value="${e(admin.query||'')}"></label><label class="lac-ga__inactive"><input type="checkbox" data-game-admin-inactive ${admin.showInactive?'checked':''}> 비활성 정보 포함</label>
    ${table==='modbook_catalog'?`<p class="lac-ga__company">${state.companyId?'현재 선택한 회사의 개조서만 관리합니다.':'개조서를 관리하려면 HUB에서 회사를 선택해 주세요.'}</p>`:''}
    <div class="lac-ga__items">${visible.map(row=>`<button type="button" class="lac-ga__item ${String(selected?.id)===String(row.id)&&!isNew?'is-active':''}" data-game-admin-action="select" data-game-admin-id="${e(row.id)}" data-ga-search-text="${e(normalized([labelFor(table,row),row.job,row.category,row.rank].join(' ')))}"><strong>${e(labelFor(table,row))}</strong><span>${e([row.job,row.category,row.rank].filter(Boolean).join(' · '))}${row[activeKey]===false?' · 비활성':''}</span></button>`).join('')||'<div class="lac-ga__empty">등록된 자료가 없습니다.</div>'}</div></aside>
    <div class="lac-ga__editor">${!editing?`<div class="lac-ga__empty lac-ga__empty--editor"><strong>관리할 항목을 선택해 주세요</strong><p>왼쪽 목록에서 정보를 선택하거나 새로 등록하세요.</p></div>`:`<form data-form="game-admin-save" class="lac-ga__form" data-ga-form><div class="lac-ga__form-head"><div><span>${isNew?'새 정보 등록':'기존 정보 수정'}</span><h3>${e(isNew?'새 '+schema.label:labelFor(table,selected))}</h3></div>${selected?`<span class="lac-ga__id">ID · ${e(selected.id)}</span>`:''}</div>
    <div class="lac-ga__fields">${schema.fields.map(def=>field(table,selected,def)).join('')}</div>
    ${table==='info_crafts'?materialEditor(state,selected):''}
    ${GAME_ADMIN_IMAGE_TABLES.includes(table)?`<section class="lac-ga__upload"><div class="lac-ga__section-head"><div><strong>대표 이미지</strong><p>${table==='info_skill_ranks'?'같은 스킬의 모든 등급에 적용됩니다.':'같은 아이템 이름에 연결됩니다.'} JPG·PNG·WebP, 최대 2MB</p></div></div>${image?'<p class="lac-ga__current-image">현재 등록된 이미지가 있습니다. 새 파일을 선택하면 교체합니다.</p>':''}<input type="file" name="game_image" accept="image/png,image/jpeg,image/webp" data-ga-image><div class="lac-ga__image-preview" data-ga-image-preview>${image?`<span>현재 이미지</span><img src="${e(image.url||'')}" alt="현재 대표 이미지">`: '이미지를 선택하면 여기에 미리보기가 표시됩니다.'}</div></section>`:''}
    <label class="lac-ga__status"><input type="checkbox" name="${activeKey}" ${selected?.[activeKey]===false?'':'checked'}><span><b>사용 중</b><small>끄면 일반 사용자 목록에서 숨겨집니다. 기존 데이터는 삭제하지 않습니다.</small></span></label>
    <div class="lac-ga__bottom"><p>저장 전에 변경 내용을 한 번 더 확인합니다.</p><button type="submit" data-ga-save-button>${isNew?'새 정보 등록하기':'변경 내용 저장하기'}</button></div></form>`}</div></div></section>`;
}
