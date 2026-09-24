/* Editable LAC COOK processed-material recipes.
 * Baseline AXE-snapshot rows remain read-only; authorized DB overrides are
 * applied to the in-memory catalog without changing the baseline on disk.
 */
const byId=id=>document.getElementById(id);
const REQUEST='lac-cook:recipes:request:v1';
const RESPONSE='lac-cook:recipes:response:v1';
let seq=0;
const pending=new Map();
window.addEventListener('message',event=>{
  if(event.origin!==window.location.origin || event.source!==window.parent ||
     !event.data || event.data.type!==RESPONSE)return;
  const slot=pending.get(event.data.requestId);if(!slot)return;
  clearTimeout(slot.timeout);pending.delete(event.data.requestId);
  if(event.data.ok)slot.resolve(event.data);
  else slot.reject(Error(String(event.data.error||'가공 데이터 요청 실패')));
});
function request(action,payload){
  if(window.parent===window)return Promise.reject(Error('가공 수정은 HUB에서만 가능합니다.'));
  const requestId=`cook-process-${Date.now().toString(36)}-${++seq}`;
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(requestId);reject(Error('서버 응답 시간이 초과되었습니다.'));},10000);
    pending.set(requestId,{resolve,reject});
    window.parent.postMessage({type:REQUEST,requestId,action,payload},window.location.origin);
  });
}
const norm=name=>String(name||'').trim().toLocaleLowerCase('ko');
const validInt=(value,max)=>value!==''&&Number.isSafeInteger(Number(value))&&Number(value)>0&&Number(value)<=max;
function el(tag,cls='',text=''){
  const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;
}
let catalog=null, baseline=[],entries=[],ready=false,canEdit=false,error='',mode='add',selected='',onSaved=()=>{};
const active=r=>r.is_active==='TRUE';
function sourceNames(){
  return [...new Set([
    ...(catalog.materials||[]).filter(active).map(r=>r.material_name),
    ...(catalog.farms||[]).filter(active).map(r=>r.material_name),
    ...(catalog.fish||[]).filter(active).map(r=>r.result_material_name),
    ...(catalog.processes||[]).filter(active).flatMap(r=>[r.input_material_name,r.process_material_name]),
    ...(catalog.recipes||[]).filter(active).map(r=>r.material_name)
  ].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
}
function processNames(){
  return [...new Set([...baseline.filter(active).map(r=>r.process_material_name),...entries.map(r=>r.process_material_name)]
    .filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
}
function originalOrEdited(name){return catalog.processes.filter(r=>active(r)&&r.process_material_name===name);}
function applyRows(rows){
  // Rebuild from the same imported baseline on every refresh: no repeated overlays.
  const next=baseline.map(r=>({...r}));
  for(const entry of rows){
    if(!entry||typeof entry.process_material_name!=='string')continue;
    const name=entry.process_material_name;
    if(entry.ingredients===null){
      // Yield-only: preserve each original ingredient, active flag and reference.
      for(const part of next){
        if(part.process_material_name===name && part.is_active==='TRUE'){
          part.result_qty=String(entry.result_qty);
          if(entry.process_time)part.process_time=entry.process_time;
          part.lac_user_override='TRUE';
        }
      }
    }else if(Array.isArray(entry.ingredients)){
      for(let i=next.length-1;i>=0;i--)if(next[i].process_material_name===name)next.splice(i,1);
      for(const [i,part] of entry.ingredients.entries())next.push({
        process_id:`lac_process_${name}_${i}`,process_material_id:'',process_material_name:name,
        input_material_id:'',input_material_name:part.name,required_qty:String(part.qty),
        result_qty:String(entry.result_qty),process_time:entry.process_time||'',
        is_active:'TRUE',sort_order:String(i+1),memo:'',lac_user_override:'TRUE'
      });
    }
  }
  // Preserve shared array identity so the planner and UI read the new values.
  catalog.processes.splice(0,catalog.processes.length,...next);
  entries=rows;
}
function addRow(name='',qty=''){
  const root=byId('cook-process-materials');
  const row=el('div','cook-editor-material-row');
  const input=el('input');input.type='text';input.maxLength=90;input.required=true;
  input.placeholder='투입 재료명';input.setAttribute('list','cook-process-material-options');input.value=name;
  input.setAttribute('aria-label','가공 투입 재료명');
  const count=el('input');count.type='number';count.inputMode='numeric';count.min='1';count.max='999999';count.step='1';
  count.required=true;count.placeholder='수량';count.value=String(qty);
  count.setAttribute('aria-label','1회 가공 투입 수량');
  const remove=el('button','cook-editor-remove','×');remove.type='button';remove.setAttribute('aria-label','가공 재료 삭제');
  remove.addEventListener('click',()=>{if(root.childElementCount>1)row.remove();});
  row.append(input,count,remove);root.append(row);return row;
}
function paintOptions(){
  const list=byId('cook-process-select');list.replaceChildren();
  for(const name of processNames()){
    const original=baseline.filter(r=>active(r)&&r.process_material_name===name);
    const stored=entries.find(r=>r.process_material_name===name);
    const missing=!stored && !original.some(r=>String(r.result_qty||'').trim());
    const option=el('option','',`${name}${missing?' · 생산량 확인 필요':''}`);
    option.value=name;list.append(option);
  }
  const candidates=byId('cook-process-material-options');candidates.replaceChildren();
  for(const name of sourceNames()){const option=el('option');option.value=name;candidates.append(option);}
}
function fill(name){
  selected=name;
  const row=entries.find(item=>item.process_material_name===name);
  const group=originalOrEdited(name);
  byId('cook-process-name').value=name;
  byId('cook-process-name').readOnly=mode==='edit'; // preserve primary key and incoming references
  byId('cook-process-yield-only').checked=mode==='edit' && (!row || row.ingredients===null);
  syncMaterialMode();
  const yields=[...new Set(group.map(r=>String(r.result_qty||'').trim()).filter(Boolean))];
  const times=[...new Set(group.map(r=>String(r.process_time||'').trim()).filter(Boolean))];
  byId('cook-process-output').value=row?String(row.result_qty):yields.length===1?yields[0]:'';
  byId('cook-process-time').value=row?row.process_time:times.length===1?times[0]:'';
  const root=byId('cook-process-materials');root.replaceChildren();
  for(const item of group)addRow(item.input_material_name,item.required_qty||'');
  if(!root.childElementCount)addRow();
  byId('cook-process-note').textContent=!ready?error:
    !canEdit?'가공 추가·수정은 플랫폼 관리자 로그인 후 이용할 수 있습니다.':
    name==='빵 반죽' && !row && yields.length===1 && yields[0]==='8'
      ? 'AXE 원본 CSV에는 1회 8개로 기록되어 있습니다. AXE 기존 화면의 1회 1개 계산과 다른 이유는 레거시 이름 연결 오류이며 실제 게임 수량 확인 후 수정하세요.':
    !row && !yields.length?'원본에 1회 생산량이 없습니다. 실제 게임 수량을 확인해 입력해 주세요.':
    yields.length>1?'원본 가공 생산량이 서로 다릅니다. 실제 생산량을 확인해 주세요.':
    '가공 1회에서 실제로 나오는 개수와 가공 1회에 사용하는 재료를 입력해 주세요.';
}
function syncMaterialMode(){
  const yieldOnly=mode==='edit' && byId('cook-process-yield-only').checked;
  byId('cook-process-yield-only').disabled=mode!=='edit';
  byId('cook-process-ingredients-panel').hidden=yieldOnly;
}
function setResult(message,kind=''){
  const node=byId('cook-process-result');node.textContent=message;node.dataset.kind=kind;
}
function open(modeValue){
  mode=modeValue;
  const dialog=byId('cook-process-editor');if(dialog.open)return;
  paintOptions();
  byId('cook-process-editor-title').textContent=mode==='edit'?'가공 수정':'가공 추가';
  byId('cook-process-save').textContent=mode==='edit'?'변경사항 저장':'가공 등록';
  byId('cook-process-select-wrap').hidden=mode!=='edit';
  byId('cook-process-yield-only').checked=mode==='edit';
  syncMaterialMode();
  byId('cook-process-save').disabled=!ready||!canEdit;
  setResult('');
  if(mode==='edit'){
    const names=processNames();
    selected=names[0]||'';
    byId('cook-process-select').value=selected;
    fill(selected);
    if(!names.length){setResult('수정할 가공품이 없습니다.','error');byId('cook-process-save').disabled=true;}
  }else{
    selected='';byId('cook-process-form').reset();
    byId('cook-process-name').readOnly=false;
    byId('cook-process-materials').replaceChildren();addRow();
    syncMaterialMode();
    byId('cook-process-note').textContent=error||(!canEdit?'가공 추가·수정은 플랫폼 관리자 로그인 후 이용할 수 있습니다.':
      '가공 1회 생산량을 게임에서 확인한 뒤 입력해 주세요. 음식 1세트 구성 수량과는 별개입니다.');
  }
  dialog.showModal();
  (mode==='edit'?byId('cook-process-select'):byId('cook-process-name')).focus();
}
function formPayload(){
  const name=byId('cook-process-name').value.trim(), outputRaw=byId('cook-process-output').value;
  const time=byId('cook-process-time').value.trim();
  if(!name||name.length>90)throw Error('가공 결과물 이름을 확인해 주세요.');
  if(mode==='edit' && name!==selected)throw Error('기존 가공품 이름은 변경할 수 없습니다.');
  if(!validInt(outputRaw,100000))throw Error('실제 게임에서 확인한 1회 가공 생산량(1~100000)을 입력해 주세요.');
  if(time.length>40)throw Error('가공시간은 40자 이내로 입력해 주세요.');
  if(mode==='add' && processNames().some(s=>norm(s)===norm(name)))throw Error('같은 가공품이 존재합니다. 가공 수정을 이용해 주세요.');
  if(mode==='add' && [...(catalog.materials||[]),...(catalog.farms||[])].some(r=>active(r)&&
    norm(r.material_name)===norm(name)))throw Error('같은 이름의 구매/농장 재료가 있습니다. 이름을 확인해 주세요.');
  const yieldOnly=mode==='edit' && byId('cook-process-yield-only').checked;
  let ingredients=null;
  if(!yieldOnly){
    const rows=[...byId('cook-process-materials').children];
    const parts=rows.map(row=>({name:row.querySelector('input[type=text]').value.trim(),
      raw:row.querySelector('input[type=number]').value}));
    if(!parts.length||parts.length>24||parts.some(p=>!p.name||p.name.length>90||!validInt(p.raw,999999)))
      throw Error('가공 1회 투입 재료와 수량을 확인해 주세요 (최대 24종).');
    if(parts.some(p=>norm(p.name)===norm(name)))throw Error('가공 결과물 자신을 투입 재료로 사용할 수 없습니다.');
    if(new Set(parts.map(p=>norm(p.name))).size!==parts.length)throw Error('중복된 투입 재료가 있습니다.');
    const known=new Set(sourceNames().map(norm));
    if(parts.some(p=>!known.has(norm(p.name))))throw Error('기존 재료 목록에 없는 이름이 있습니다. 이름을 확인해 주세요.');
    ingredients=parts.map(p=>({name:p.name,qty:Number(p.raw)}));
  }
  const old=entries.find(row=>row.process_material_name===name);
  // If this process was previously created/fully edited, keep its saved recipe
  // when the operator changes only its yield. The snapshot may have no row.
  if(yieldOnly && Array.isArray(old?.ingredients))ingredients=old.ingredients;
  if(mode==='edit'&&!processNames().includes(name))throw Error('수정할 가공품을 먼저 선택해 주세요.');
  return {entry:{process_material_name:name,result_qty:Number(outputRaw),process_time:time,
    ingredients,
    source_kind:mode==='add'?'new':old?.source_kind||'override'},expectedVersion:old?.version??null};
}
async function submit(event){
  event.preventDefault();if(!canEdit||!ready)return;
  const button=byId('cook-process-save');
  try{
    const payload=formPayload();button.disabled=true;setResult('가공 데이터를 저장 중입니다.');
    await request('process-save',payload);
    const fresh=await request('list');
    if(!fresh.processReady||!Array.isArray(fresh.processEntries))throw Error(fresh.processError||'가공 데이터 확인 실패');
    canEdit=Boolean(fresh.canEdit);applyRows(fresh.processEntries);
    onSaved();setResult('가공 생산량과 재료를 계산에 반영했습니다.','success');
    byId('cook-process-editor').close();
  }catch(e){setResult(e.message,'error');}
  finally{button.disabled=!ready||!canEdit;}
}
export async function initializeCookProcessEditor({catalog:givenCatalog,onSaved:updated}){
  catalog=givenCatalog;onSaved=updated;
  baseline=catalog.processes.map(row=>({...row}));
  for(const button of document.querySelectorAll('[data-process]'))button.addEventListener('click',()=>open(button.dataset.process));
  byId('cook-process-close').addEventListener('click',()=>byId('cook-process-editor').close());
  byId('cook-process-cancel').addEventListener('click',()=>byId('cook-process-editor').close());
  byId('cook-process-select').addEventListener('change',e=>{setResult('');fill(e.target.value);});
  byId('cook-process-yield-only').addEventListener('change',syncMaterialMode);
  byId('cook-process-add-material').addEventListener('click',()=>{
    if(byId('cook-process-materials').childElementCount>=24){setResult('재료는 최대 24종까지 등록할 수 있습니다.','error');return;}
    addRow().querySelector('input').focus();
  });
  byId('cook-process-form').addEventListener('submit',submit);
  try{
    const result=await request('list');
    if(!result.processReady||!Array.isArray(result.processEntries))throw Error(result.processError||'가공 편집 DB 연결 실패');
    canEdit=Boolean(result.canEdit);ready=true;applyRows(result.processEntries);
  }catch(e){canEdit=false;ready=false;error=e.message;}
}
