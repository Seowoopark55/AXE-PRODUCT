// AXE ONE shared information catalogue — read-only. Grouping is UI-only:
// original axe_product rows, craft IDs, material links and DB categories stay intact.
const CONFIG = Object.freeze({
  info_crafts: ['제작법','item_name',[['category','분류'],['success_rate','성공률'],['craft_rank','제작 등급'],['obtain_place','획득 장소'],['note','비고']]],
  info_craft_materials: ['제작 재료','material_name',[['craft_id','제작법 ID'],['quantity','필요 수량']]],
  info_material_recipes: ['재료 조합','item_name',Array.from({length:8},(_,i)=>[`input${i+1}`,`재료 ${i+1}`]).concat([['note','비고']])],
  info_processes: ['생산','item_name',[['job','직업'],['process_type','가공 종류'],['output_qty','생산 수량'],['quest_qty','퀘스트 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_quests: ['퀘스트','item_name',[['job','직업'],['required_qty','필요 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_skill_ranks: ['스킬 등급','skill',[['rank','등급'],['required_point','필요 포인트'],['point_type','포인트 종류'],['note','비고']]],
});
const TOP_TABS=[['info_crafts','제작법'],['info_processes','생산'],['info_quests','퀘스트'],['info_skill_ranks','스킬 등급']];
const ALL='__all__', UNSET='__unset__';
const escapeText=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const fieldValue=(row,key)=>row[key]===null||row[key]===undefined||row[key]===''?'—':String(row[key]);
const filterName=value=>value===null||value===undefined||String(value).trim()===''?UNSET:String(value).trim();
const showFilterName=value=>value===UNSET?'미지정':value;
const visibleRows=(data,table,info,owner)=>(data[table]||[]).filter(row=>(owner&&info.showInactive)||row.is_active!==false);
const distinct=values=>[...new Set(values)].sort((a,b)=>a.localeCompare(b,'ko'));

// The 19 imported ETC recipes are mapped by name only for presentation.
// Unrecognized additions remain findable in 기타, even if a new source category is introduced.
const ETC_GROUPS=Object.freeze({
 '조악한 무기부품':'부품·원재료','무난한 무기부품':'부품·원재료','고철':'부품·원재료',
 '화약':'부품·원재료','소형 탄피(20)':'부품·원재료',
 '의료용 붕대':'도구·소모품','기본 감정 키트(1)':'도구·소모품','기본 감정 키트(2)':'도구·소모품',
 '캠프 파이어 키트(1)':'도구·소모품','캠프 파이어 키트(2)':'도구·소모품','캠프 파이어 키트(3)':'도구·소모품',
 '종이':'도구·소모품','폭죽 시리즈 I':'도구·소모품','볼품없는 락픽':'도구·소모품','낡은 락픽':'도구·소모품',
 '9mm 탄약':'탄약','.45 ACP 탄약':'탄약','.50 AE 탄약':'탄약','.44 매그넘 탄약':'탄약',
});
const SKILL_GROUPS=Object.freeze({
 '생활':['벌목','채광','채집','낚시','요리','택배','보물찾기'],
 '생산':['목재 가공','재련'],
 '전투':['SMG 마스터리','피스톨 마스터리','돌진','전력질주','체력','컴뱃롤'],
 '기술':['감정','운전','차량 정비','전문가 치료(EMS)','몸 수색(경찰)','절도','제작','악기연주','작곡'],
});
const skillGroup=skill=>Object.entries(SKILL_GROUPS).find(([,names])=>names.includes(String(skill)))?.[0]||'기타';
const craftGroup=craft=>{
 const category=String(craft?.category||'').toUpperCase();
 if(category==='KNIFE')return '근접무기';
 if(['PISTOL','REVOLVER','SMG'].includes(category))return '총기류';
 if(category==='ETC'&&['조악한 무기부품','무난한 무기부품'].includes(String(craft.item_name)))return '무기부품';
 if(category==='ETC'&&ETC_GROUPS[String(craft.item_name)]==='부품·원재료')return '부품·원재료';
 return '기타 제작품';
};
const craftSubtype=craft=>{
 const category=String(craft?.category||'').toUpperCase();
 if(category==='KNIFE')return '나이프';
 if(['PISTOL','REVOLVER','SMG'].includes(category))return ({PISTOL:'피스톨',REVOLVER:'리볼버',SMG:'SMG'})[category];
 return ETC_GROUPS[String(craft?.item_name)]||'기타';
};
const itemName=(table,row,data)=>{
 if(table==='info_craft_materials'){
  const parent=(data.info_crafts||[]).find(c=>String(c.id)===String(row.craft_id));
  return parent?String(parent.item_name):String(row.material_name||'이름 없음');
 }
 if(table==='info_skill_ranks')return [row.skill,row.rank].filter(Boolean).join(' · ')||'이름 없음';
 return String(row[CONFIG[table][1]]||'이름 없음');
};
const searchText=(table,row,data)=>[itemName(table,row,data),...Object.values(row)].join(' ').toLowerCase();
const renderFields=fields=>fields.filter(([,value])=>value!=='—').map(([label,value])=>`<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join('');
const detailFields=(table,row,data,info,owner)=>{
 const fields=CONFIG[table][2].map(([key,label])=>[label,fieldValue(row,key)]);
 if(table==='info_material_recipes')for(let i=1;i<=8;i++){
  const name=row[`input${i}`]; if(name)fields.splice((i-1)*2+1,0,[`재료 ${i} 수량`,fieldValue(row,`input${i}_qty`)]);
 }
 if(table==='info_processes')for(let i=1;i<=4;i++){
  if(row[`input${i}`])fields.push([`투입 재료 ${i}`,`${row[`input${i}`]} × ${fieldValue(row,`input${i}_qty`)}`]);
 }
 if(table==='info_crafts'){
  const materials=visibleRows(data,'info_craft_materials',info,owner).filter(m=>String(m.craft_id)===String(row.id));
  if(materials.length)fields.push(['필요 재료',materials.map(m=>`${m.material_name} × ${m.quantity}`).join(' · ')]);
 }
 return renderFields(fields);
};
const chipRow=(title,field,values,selected,rows,valueOf,{showAll=true}={})=>{
 const choices=showAll?[ALL,...values]:values;
 const items=choices.map(value=>{
  const count=rows.filter(row=>value===ALL||valueOf(row)===value).length;
  return `<button type="button" data-info-filter="${field}" data-info-value="${escapeText(value)}" class="${selected===value?'is-active':''}" aria-pressed="${selected===value?'true':'false'}">${escapeText(value===ALL?'전체':showFilterName(value))}<small>${count}</small></button>`;
 }).join('');
 return `<div class="axe-info-subfilter"><span class="axe-info-subfilter__label">${escapeText(title)}</span><div class="axe-info-chips" role="group" aria-label="${escapeText(title)}">${items}</div></div>`;
};
const selectFilter=(title,field,values,selected,rows,valueOf)=>{
 const options=[ALL,...values].map(value=>`<option value="${escapeText(value)}"${selected===value?' selected':''}>${escapeText(value===ALL?'전체':showFilterName(value))} (${rows.filter(row=>value===ALL||valueOf(row)===value).length})</option>`).join('');
 return `<label class="axe-info-subfilter axe-info-subfilter--select"><span class="axe-info-subfilter__label">${escapeText(title)}</span><select data-info-filter-select="${field}" aria-label="${escapeText(title)}">${options}</select></label>`;
};
// Show weapon-part combination records under their own group. When a matching
// craft exists, its own recipe and linked ingredients also appear in details.
const weaponPartDetails=(recipe,data,info,owner)=>{
 const craft=visibleRows(data,'info_crafts',info,owner).find(row=>String(row.item_name)===String(recipe.item_name));
 const source=detailFields('info_material_recipes',recipe,data,info,owner);
 return craft?`${source}<div class="axe-info-detail__section"><dt>연결된 제작법</dt><dd>${escapeText(craft.item_name)}</dd></div>${detailFields('info_crafts',craft,data,info,owner)}`:source;
};
function categoryFilters(table,info,data,owner){
 const primary=String(info.filterPrimary||ALL),secondary=String(info.filterSecondary||ALL);
 let shown=visibleRows(data,table,info,owner),controls='',chosenSkill='',heading=CONFIG[table][0],countNote='';
 if(table==='info_crafts'||table==='info_craft_materials'||table==='info_material_recipes'){
  const groupNames=['근접무기','총기류','부품·원재료','무기부품','기타 제작품'];
  const group=groupNames.includes(info.craftGroup)?info.craftGroup:ALL;
  const craftRows=visibleRows(data,'info_crafts',info,owner);
  const recipes=visibleRows(data,'info_material_recipes',info,owner);
  const groupCount=key=>key==='무기부품'?recipes.length:craftRows.filter(row=>craftGroup(row)===key).length;
  const groupValues=[ALL,...groupNames];
  controls+=`<div class="axe-info-subfilter"><span class="axe-info-subfilter__label">제작 구분</span><div class="axe-info-chips" role="group" aria-label="제작 구분">${groupValues.map(value=>`<button type="button" data-info-filter="craftGroup" data-info-value="${escapeText(value)}" class="${group===value?'is-active':''}" aria-pressed="${group===value?'true':'false'}">${escapeText(value===ALL?'전체':value)}<small>${value===ALL?craftRows.length:groupCount(value)}</small></button>`).join('')}</div></div>`;
  if(group==='무기부품'){
   table='info_material_recipes'; shown=recipes; heading='무기부품 조합';
  }else{
   table='info_crafts';
   shown=craftRows.filter(craft=>group===ALL||craftGroup(craft)===group);
   if(['근접무기','총기류','기타 제작품'].includes(group)){
    const preferred=group==='근접무기'?['나이프']:group==='총기류'?['피스톨','리볼버','SMG']:['도구·소모품','탄약','기타'];
    const values=preferred.filter(value=>shown.some(craft=>craftSubtype(craft)===value));
    if(values.length>1){
     const chosen=[ALL,...values].includes(primary)?primary:ALL;
     controls+=chipRow('세부 분류','primary',values,chosen,shown,craftSubtype);
     shown=shown.filter(craft=>chosen===ALL||craftSubtype(craft)===chosen);
    }
   }
   heading=group===ALL?'제작법':group;
  }
 }else if(table==='info_processes'){
  const productionGroup=row=>row.job==='벌목'?'목재':row.job==='채광'?'재련':'기타';
  const types=['목재','재련','기타'].filter(type=>shown.some(row=>productionGroup(row)===type));
  const chosen=types.includes(primary)?primary:(types[0]||'목재');
  controls+=chipRow('생산 종류','primary',types,chosen,shown,productionGroup,{showAll:false});
  shown=shown.filter(row=>productionGroup(row)===chosen);
  heading=`생산 · ${chosen}`;
 }else if(table==='info_quests'){
  const jobOf=row=>filterName(row.job),jobs=distinct(shown.map(jobOf));
  const chosen=[ALL,...jobs].includes(primary)?primary:ALL;
  controls+=chipRow('직업','primary',jobs,chosen,shown,jobOf);
  shown=shown.filter(row=>chosen===ALL||jobOf(row)===chosen);
  const valueOf=row=>filterName(row.rank),types=distinct(shown.map(valueOf));
  if(types.length>1){
   const rank=[ALL,...types].includes(secondary)?secondary:ALL;
   controls+=chipRow('등급','secondary',types,rank,shown,valueOf);
   shown=shown.filter(row=>rank===ALL||valueOf(row)===rank);
  }
 }else if(table==='info_skill_ranks'){
  const types=distinct(shown.map(row=>skillGroup(row.skill)));
  const groups=['생활','생산','전투','기술','기타'].filter(group=>types.includes(group));
  const group=[ALL,...groups].includes(primary)?primary:ALL;
  controls+=chipRow('스킬 분야','primary',groups,group,shown,row=>skillGroup(row.skill));
  shown=shown.filter(row=>group===ALL||skillGroup(row.skill)===group);
  const skills=distinct(shown.map(row=>filterName(row.skill)));
  const chosen=[ALL,...skills].includes(secondary)?secondary:ALL;
  controls+=selectFilter('세부 스킬','secondary',skills,chosen,shown,row=>filterName(row.skill));
  shown=shown.filter(row=>chosen===ALL||filterName(row.skill)===chosen);
  chosenSkill=chosen===ALL?'':chosen;
 }
 return {rows:shown,controls,selectedSkill:chosenSkill,table,heading,countNote};
}
export function renderInfoPage(state){
 const info=state.info||{},data=info.data||{},owner=Boolean(state.platformAdmin);
 const requestedTable=CONFIG[info.table]?info.table:'info_crafts';
 const tabTable=['info_craft_materials','info_material_recipes'].includes(requestedTable)?'info_crafts':requestedTable;
 const categories=TOP_TABS.map(([key,label])=>{
  const count=visibleRows(data,key,info,owner).length;
  return `<button type="button" data-info-table="${key}" class="${tabTable===key?'is-active':''}" aria-current="${tabTable===key?'true':'false'}">${label}<small>${count}</small></button>`;
 }).join('');
 const filters=categoryFilters(tabTable,info,data,owner),table=filters.table;
 const q=String(info.query||'').trim().toLowerCase();
 const rows=filters.rows.filter(row=>{
  if(!q)return true;
  return table==='info_craft_materials'&&Array.isArray(row.materials)
   ?[row.craft_name,...row.materials.flatMap(m=>[m.material_name,m.quantity])].join(' ').toLowerCase().includes(q)
   :searchText(table,row,data).includes(q);
 });
 const selected=rows.find(row=>String(row.id)===String(info.selectedId||''))||null;
 const detailTitle=selected?(table==='info_craft_materials'&&selected.craft_name?selected.craft_name:itemName(table,selected,data)):'';
 const details=selected?`<section class="axe-info-detail" aria-label="상세 정보"><header><span>상세 정보</span><strong>${escapeText(detailTitle)}</strong>${selected.is_active===false?'<em>비활성</em>':''}</header><dl>${table==='info_material_recipes'?weaponPartDetails(selected,data,info,owner):detailFields(table,selected,data,info,owner)}</dl></section>`:`<section class="axe-info-detail axe-info-detail--empty" aria-label="상세 정보"><span class="axe-info-detail__eyebrow">상세 정보</span><div class="axe-info-detail__placeholder"><span class="axe-info-detail__placeholder-mark" aria-hidden="true">◇</span><strong>정보를 선택해 주세요</strong><p>왼쪽 목록에서 항목을 선택하면<br>상세 정보가 여기에 표시됩니다.</p></div></section>`;
 const rowList=rows.length?rows.map(row=>{
  const id=String(row.id),active=id===String(info.selectedId||'');
  const title=filters.selectedSkill&&table==='info_skill_ranks'?String(row.rank||'미지정'):itemName(table,row,data);
  return `<button type="button" class="axe-info-row ${active?'is-active':''}" data-info-id="${escapeText(id)}" aria-pressed="${active?'true':'false'}"><strong>${escapeText(title)}</strong>${row.is_active===false?'<em>비활성</em>':''}</button>`;
 }).join(''):'<p class="axe-info-empty">조건에 맞는 정보가 없습니다.</p>';
 const ownerNote=owner?'<span class="axe-info-owner-note">조회 전용 · 관리자 편집 기능은 준비 중</span>':'';
 const error=info.error?`<div class="axe-info-error">${escapeText(info.error)} <button type="button" data-action="info-refresh">다시 불러오기</button></div>`:'';
 return `<section class="axe-info"><header class="axe-info-header"><div><span class="page-eyebrow">AXE ONE / INFORMATION</span><h1>게임 정보</h1><p>제작법과 퀘스트 등 최신 공통 정보를 찾아보세요.</p></div><button type="button" class="ops-action-secondary" data-action="info-refresh">새로고침</button></header><nav class="axe-info-tabs" aria-label="게임 정보 종류">${categories}</nav>${filters.controls?`<div class="axe-info-subfilters">${filters.controls}</div>`:''}<div class="axe-info-toolbar"><input type="search" data-info-query placeholder="현재 분류에서 이름 · 재료 검색" value="${escapeText(info.query||'')}" aria-label="현재 분류에서 정보 검색">${owner?`<label><input type="checkbox" data-info-inactive ${info.showInactive?'checked':''}> 비활성 포함</label>`:''}</div>${error}${info.loading?'<div class="runtime-inline-loading">게임 정보를 불러오는 중…</div>':!info.loaded?'<div class="runtime-inline-loading">정보를 불러오려면 새로고침을 눌러 주세요.</div>':`<div class="axe-info-content"><div class="axe-info-list"><div class="axe-info-list__heading"><span>${escapeText(filters.heading)}</span><small>${escapeText(filters.countNote||`${rows.length}건`)}</small></div><div class="axe-info-list__items">${rowList}</div></div>${details}</div>${ownerNote}`}</section>`;
}
