// AXE ONE common information catalogue. Read-only in this UI stage.
// All strings originating in Supabase are escaped before entering HTML.
const CONFIG = Object.freeze({
  info_crafts: ['제작법','item_name',[['category','분류'],['success_rate','성공률'],['craft_rank','제작 등급'],['obtain_place','획득 장소'],['note','비고']]],
  info_craft_materials: ['제작 재료','material_name',[['craft_id','제작법 ID'],['quantity','필요 수량']]],
  info_material_recipes: ['재료 조합','item_name',Array.from({length:8},(_,i)=>[`input${i+1}`,`재료 ${i+1}`]).concat([['note','비고']])],
  info_processes: ['가공','item_name',[['job','직업'],['process_type','가공 종류'],['output_qty','생산 수량'],['quest_qty','퀘스트 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_quests: ['퀘스트','item_name',[['job','직업'],['required_qty','필요 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_skill_ranks: ['스킬 등급','skill',[['rank','등급'],['required_point','필요 포인트'],['point_type','포인트 종류'],['note','비고']]],
});
const escapeText = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const fieldValue = (row,key) => row[key] === null || row[key] === undefined || row[key] === '' ? '—' : String(row[key]);
const itemName = (table,row,data) => {
  if(table === 'info_craft_materials'){
    const parent = (data.info_crafts||[]).find(c=>String(c.id)===String(row.craft_id));
    return parent ? `${parent.item_name} · ${row.material_name}` : String(row.material_name||'');
  }
  if(table === 'info_skill_ranks') return [row.skill,row.rank].filter(Boolean).join(' · ') || '이름 없음';
  return String(row[CONFIG[table][1]] || '이름 없음');
};
const searchText = (table,row,data) => [itemName(table,row,data),...Object.values(row)].join(' ').toLowerCase();
const detailFields = (table,row,data) => {
  const fields=CONFIG[table][2].map(([key,label])=>[label,fieldValue(row,key)]);
  if(table === 'info_material_recipes'){
    for(let i=1;i<=8;i++){
      const name=row[`input${i}`]; if(name)fields.splice((i-1)*2+1,0,[`재료 ${i} 수량`,fieldValue(row,`input${i}_qty`)]);
    }
  }
  if(table === 'info_processes'){
    for(let i=1;i<=4;i++){
      if(row[`input${i}`]) fields.push([`투입 재료 ${i}`,`${row[`input${i}`]} × ${fieldValue(row,`input${i}_qty`)}`]);
    }
  }
  if(table === 'info_crafts'){
    const materials=(data.info_craft_materials||[]).filter(m=>String(m.craft_id)===String(row.id) && m.is_active!==false);
    if(materials.length)fields.push(['필요 재료',materials.map(m=>`${m.material_name} × ${m.quantity}`).join(' · ')]);
  }
  return fields.filter(([,value])=>value!=='—').map(([label,value])=>`<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join('');
};

const ALL='__all__';
const UNSET='__unset__';
// ETC is heterogeneous in the imported data. These are UI-only groupings:
// the original category, craft ID and every Supabase row remain untouched.
// A new/unrecognized ETC item lands in "기타" instead of being silently hidden.
const ETC_GROUPS=Object.freeze({
  '조악한 무기부품':'부품·재료', '무난한 무기부품':'부품·재료',
  '고철':'부품·재료', '화약':'부품·재료', '소형 탄피(20)':'부품·재료',
  '의료용 붕대':'도구·소모품', '기본 감정 키트(1)':'도구·소모품',
  '기본 감정 키트(2)':'도구·소모품', '캠프 파이어 키트(1)':'도구·소모품',
  '캠프 파이어 키트(2)':'도구·소모품', '캠프 파이어 키트(3)':'도구·소모품',
  '종이':'도구·소모품', '폭죽 시리즈 I':'도구·소모품',
  '볼품없는 락픽':'도구·소모품', '낡은 락픽':'도구·소모품',
  '9mm 탄약':'탄약', '.45 ACP 탄약':'탄약', '.50 AE 탄약':'탄약', '.44 매그넘 탄약':'탄약',
});
const craftOf = (table,row,crafts) => table==='info_craft_materials' ? crafts.get(String(row.craft_id)) : row;
const filterName = value => value===null||value===undefined||String(value).trim()==='' ? UNSET : String(value).trim();
const showFilterName = value => value===UNSET ? '미지정' : value;
const visibleRows = (data,table,info,owner) => (data[table]||[]).filter(row=>owner&&info.showInactive||row.is_active!==false);
const distinct = values => [...new Set(values)].sort((a,b)=>a.localeCompare(b,'ko'));
const chipRow = (title,field,values,selected,rows,valueOf) => {
  const counts=values.map(value=>({value,count:rows.filter(row=>value===ALL||valueOf(row)===value).length}));
  const items=counts.map(({value,count})=>`<button type="button" data-info-filter="${field}" data-info-value="${escapeText(value)}" class="${selected===value?'is-active':''}" aria-pressed="${selected===value?'true':'false'}">${escapeText(value===ALL?'전체':showFilterName(value))}<small>${count}</small></button>`).join('');
  return `<div class="axe-info-subfilter"><span class="axe-info-subfilter__label">${escapeText(title)}</span><div class="axe-info-chips" role="group" aria-label="${escapeText(title)}">${items}</div></div>`;
};
const selectFilter = (title,field,values,selected,rows,valueOf) => {
  const options=values.map(value=>`<option value="${escapeText(value)}"${selected===value?' selected':''}>${escapeText(value===ALL?'전체':showFilterName(value))} (${rows.filter(row=>value===ALL||valueOf(row)===value).length})</option>`).join('');
  return `<label class="axe-info-subfilter axe-info-subfilter--select"><span class="axe-info-subfilter__label">${escapeText(title)}</span><select data-info-filter-select="${field}" aria-label="${escapeText(title)}">${options}</select></label>`;
};

// All counts and options are derived from the current Supabase response.
// Filter values live in UI state only; no new columns or DB migrations are needed.
function categoryFilters(table,info,data,owner){
  const base=visibleRows(data,table,info,owner);
  const crafts=new Map((data.info_crafts||[]).map(row=>[String(row.id),row]));
  const primary=String(info.filterPrimary||ALL);
  const secondary=String(info.filterSecondary||ALL);
  const craftRow=row=>craftOf(table,row,crafts);
  const craftCategory=row=>filterName(craftRow(row)?.category);
  const etcGroup=row=>ETC_GROUPS[String(craftRow(row)?.item_name||'')]||'기타';
  let shown=base, controls='';
  if(table==='info_crafts'||table==='info_craft_materials'){
    const values=[ALL,...distinct(base.map(craftCategory))];
    const active=values.includes(primary)?primary:ALL;
    controls+=chipRow('제작 분류','primary',values,active,base,craftCategory);
    shown=base.filter(row=>active===ALL||craftCategory(row)===active);
    if(active==='ETC'){
      const groups=[ALL,...['부품·재료','도구·소모품','탄약','기타'].filter(group=>shown.some(row=>etcGroup(row)===group))];
      const chosen=groups.includes(secondary)?secondary:ALL;
      controls+=chipRow('ETC 세부 분류','secondary',groups,chosen,shown,etcGroup);
      shown=shown.filter(row=>chosen===ALL||etcGroup(row)===chosen);
    }
  } else if(table==='info_quests'||table==='info_processes'){
    const jobOf=row=>filterName(row.job);
    const jobs=[ALL,...distinct(base.map(jobOf))];
    const active=jobs.includes(primary)?primary:ALL;
    controls+=chipRow('직업','primary',jobs,active,base,jobOf);
    shown=base.filter(row=>active===ALL||jobOf(row)===active);
    const field=table==='info_quests'?'rank':'process_type';
    const label=table==='info_quests'?'등급':'가공 방식';
    const valueOf=row=>filterName(row[field]);
    const options=[ALL,...distinct(shown.map(valueOf))];
    const chosen=options.includes(secondary)?secondary:ALL;
    controls+=chipRow(label,'secondary',options,chosen,shown,valueOf);
    shown=shown.filter(row=>chosen===ALL||valueOf(row)===chosen);
  } else if(table==='info_skill_ranks'){
    const valueOf=row=>filterName(row.skill);
    const values=[ALL,...distinct(base.map(valueOf))];
    const active=values.includes(primary)?primary:ALL;
    controls+=selectFilter('스킬 선택','primary',values,active,base,valueOf);
    shown=base.filter(row=>active===ALL||valueOf(row)===active);
  }
  return {rows:shown,controls,selectedSkill:table==='info_skill_ranks'&&primary!==ALL?primary:''};
}

export function renderInfoPage(state){
  const info=state.info||{}; const data=info.data||{};
  const table=CONFIG[info.table]?info.table:'info_crafts';
  const owner=Boolean(state.platformAdmin);
  const categories=Object.entries(CONFIG).map(([key,[label]])=>{
    const rows=visibleRows(data,key,info,owner);
    return `<button type="button" data-info-table="${key}" class="${table===key?'is-active':''}" aria-current="${table===key?'true':'false'}">${label}<small>${rows.length}</small></button>`;
  }).join('');
  const filters=categoryFilters(table,info,data,owner);
  const q=String(info.query||'').trim().toLowerCase();
  const rows=filters.rows.filter(row=>!q||searchText(table,row,data).includes(q));
  const selected=rows.find(r=>String(r.id)===String(info.selectedId||''))||null;
  const details=selected?`<section class="axe-info-detail" aria-label="상세 정보"><header><span>상세 정보</span><strong>${escapeText(itemName(table,selected,data))}</strong>${selected.is_active===false?'<em>비활성</em>':''}</header><dl>${detailFields(table,selected,data)}</dl></section>`:`<section class="axe-info-detail axe-info-detail--empty" aria-label="상세 정보"><span class="axe-info-detail__eyebrow">상세 정보</span><div class="axe-info-detail__placeholder"><span class="axe-info-detail__placeholder-mark" aria-hidden="true">◇</span><strong>정보를 선택해 주세요</strong><p>왼쪽 목록에서 항목을 선택하면<br>상세 정보가 여기에 표시됩니다.</p></div></section>`;
  const rowList=rows.length?rows.map(row=>{
    const id=String(row.id);
    const active=id===String(info.selectedId||'');
    const title=filters.selectedSkill&&table==='info_skill_ranks'?String(row.rank||'미지정'):itemName(table,row,data);
    return `<button type="button" class="axe-info-row ${active?'is-active':''}" data-info-id="${escapeText(id)}" aria-pressed="${active?'true':'false'}"><strong>${escapeText(title)}</strong>${row.is_active===false?'<em>비활성</em>':''}</button>`;
  }).join(''):'<p class="axe-info-empty">조건에 맞는 정보가 없습니다.</p>';
  const ownerNote=owner?'<span class="axe-info-owner-note">조회 전용 · 관리자 편집 기능은 준비 중</span>':'';
  const error=info.error?`<div class="axe-info-error">${escapeText(info.error)} <button type="button" data-action="info-refresh">다시 불러오기</button></div>`:'';
  return `<section class="axe-info"><header class="axe-info-header"><div><span class="page-eyebrow">AXE ONE / INFORMATION</span><h1>게임 정보</h1><p>제작법과 퀘스트 등 최신 공통 정보를 찾아보세요.</p></div><button type="button" class="ops-action-secondary" data-action="info-refresh">새로고침</button></header><nav class="axe-info-tabs" aria-label="게임 정보 종류">${categories}</nav>${filters.controls?`<div class="axe-info-subfilters">${filters.controls}</div>`:''}<div class="axe-info-toolbar"><input type="search" data-info-query placeholder="현재 분류에서 이름 · 재료 검색" value="${escapeText(info.query||'')}" aria-label="현재 분류에서 정보 검색">${owner?`<label><input type="checkbox" data-info-inactive ${info.showInactive?'checked':''}> 비활성 포함</label>`:''}</div>${error}${info.loading?'<div class="runtime-inline-loading">게임 정보를 불러오는 중…</div>':!info.loaded?'<div class="runtime-inline-loading">정보를 불러오려면 새로고침을 눌러 주세요.</div>':`<div class="axe-info-content"><div class="axe-info-list"><div class="axe-info-list__heading"><span>${escapeText(CONFIG[table][0])}</span><small>${rows.length}건</small></div><div class="axe-info-list__items">${rowList}</div></div>${details}</div>${ownerNote}`}</section>`;
}
