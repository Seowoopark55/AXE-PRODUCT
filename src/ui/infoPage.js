// AXE ONE common information catalogue. Read-only in this first UI stage.
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
export function renderInfoPage(state){
  const info=state.info||{}; const data=info.data||{};
  const table=CONFIG[info.table]?info.table:'info_crafts';
  const owner=Boolean(state.platformAdmin);
  const categories=Object.entries(CONFIG).map(([key,[label]])=>{
    const rows=data[key]||[];
    const visible=owner&&info.showInactive?rows:rows.filter(r=>r.is_active!==false);
    return `<button type="button" data-info-table="${key}" class="${table===key?'is-active':''}">${label}<small>${visible.length}</small></button>`;
  }).join('');
  const q=String(info.query||'').trim().toLowerCase();
  const rows=(data[table]||[]).filter(row=>(owner&&info.showInactive||row.is_active!==false) && (!q||searchText(table,row,data).includes(q)));
  const selected=rows.find(r=>String(r.id)===String(info.selectedId||''))||null;
  const details=selected?`<section class="axe-info-detail"><header><span>상세 정보</span><strong>${escapeText(itemName(table,selected,data))}</strong>${selected.is_active===false?'<em>비활성</em>':''}</header><dl>${detailFields(table,selected,data)}</dl></section>`:'';
  const rowList=rows.length?rows.map(row=>{
    const id=String(row.id);
    const line=table==='info_quests'?`필요 수량 ${fieldValue(row,'required_qty')} · 보상 경험치 ${fieldValue(row,'reward_xp')}`:table==='info_skill_ranks'?`등급 ${fieldValue(row,'rank')} · 필요 포인트 ${fieldValue(row,'required_point')}`:table==='info_crafts'?`분류 ${fieldValue(row,'category')} · 성공률 ${fieldValue(row,'success_rate')}`:'';
    return `<button type="button" class="axe-info-row ${id===String(info.selectedId||'')?'is-active':''}" data-info-id="${escapeText(id)}"><strong>${escapeText(itemName(table,row,data))}</strong>${line?`<small>${escapeText(line)}</small>`:''}${row.is_active===false?'<em>비활성</em>':''}</button>`;
  }).join(''):'<p class="axe-info-empty">조건에 맞는 정보가 없습니다.</p>';
  const ownerNote=owner?'<span class="axe-info-owner-note">정보 추가·수정 기능은 별도 검증 후 연결됩니다. 현재는 조회 전용입니다.</span>':'';
  const error=info.error?`<div class="axe-info-error">${escapeText(info.error)} <button type="button" data-action="info-refresh">다시 불러오기</button></div>`:'';
  return `<section class="axe-info"><header class="axe-info-header"><div><span class="page-eyebrow">AXE ONE / INFORMATION</span><h1>게임 정보</h1><p>제작법과 퀘스트 등 최신 공통 정보를 찾아보세요.</p></div><button type="button" class="ops-action-secondary" data-action="info-refresh">새로고침</button></header><nav class="axe-info-tabs" aria-label="게임 정보 종류">${categories}</nav><div class="axe-info-toolbar"><input type="search" data-info-query placeholder="이름 · 재료 · 퀘스트 검색" value="${escapeText(info.query||'')}" aria-label="정보 검색">${owner?`<label><input type="checkbox" data-info-inactive ${info.showInactive?'checked':''}> 비활성 포함</label>`:''}</div>${ownerNote}${error}${info.loading?'<div class="runtime-inline-loading">게임 정보를 불러오는 중…</div>':!info.loaded?'<div class="runtime-inline-loading">정보를 불러오려면 새로고침을 눌러 주세요.</div>':`<div class="axe-info-content"><div class="axe-info-list"><span>${escapeText(CONFIG[table][0])} · ${rows.length}건</span>${rowList}</div>${details}</div>`}</section>`;
}
