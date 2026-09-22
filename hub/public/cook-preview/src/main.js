import {calculateDirect, positiveInt} from './engine.js';
import catalog from '../data/catalog.js';
import {calculatePlan} from './planner.js';
import {CATALOG_REVISION} from '../data/revision.js';
import {WORKSPACE_KEY,checklistItems,currentChecks,prepareWorkspace,parseWorkspace} from './workspace.js';
import {mountCookCloudPanel} from './cloudPanel.js';
import {requestHostReturn} from './hostBridge.js';

const $ = id => document.getElementById(id);
const state = {foods:[], recipes:[], orders:new Map(), query:'', choices:{offers:{},fish:{}}, checked:new Set()};
const revision = CATALOG_REVISION;
const setStatus = (text, kind='') => { $('save-status').textContent=text; $('save-status').dataset.kind=kind; };
const markDirty = () => setStatus('현재 작업에 저장되지 않은 변경 사항이 있어.');
const format = value => Number(value).toLocaleString('ko-KR');
const elem = (tag, className='', content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = String(content);
  return node;
};
const msg = text => elem('p','empty',text);
const usableFoods = () => state.foods.filter(food=>food.is_active==='TRUE');

function paintFoods() {
  const root = $('results');
  root.replaceChildren();
  const query = state.query.toLocaleLowerCase('ko').trim();
  const matches = usableFoods().filter(food=>food.food_name.toLocaleLowerCase('ko').includes(query)).slice(0,20);
  if (!matches.length) return root.append(msg('검색 결과가 없어.'));
  for (const food of matches) {
    const row = elem('div','food-row');
    const text = elem('div','food-text');
    text.append(elem('strong','',food.food_name));
    text.append(elem('small','',`${food.grade||'등급 미확인'} · 1세트 ${food.set_qty||'미설정'}개`));
    const button = elem('button','accent','추가 +');
    button.type='button';
    button.addEventListener('click',()=>{
      const count=state.orders.get(food.food_id)||0;
      state.orders.set(food.food_id,Math.min(100000,count+1));
      markDirty();paintOrders();
    });
    row.append(text,button);
    root.append(row);
  }
}

function paintOrders() {
  const root = $('orders');
  root.replaceChildren();
  const foods = new Map(state.foods.map(food=>[food.food_id,food]));
  if (!state.orders.size) root.append(msg('왼쪽에서 만들 요리를 추가해 줘.'));
  for (const [id,batches] of state.orders) {
    const food=foods.get(id);
    if(!food) continue;
    const row=elem('div','order-row');
    const text=elem('div','food-text');
    text.append(elem('strong','',food.food_name));
    text.append(elem('small','',`1세트 ${food.set_qty||'미설정'}개`));
    const controls=elem('div','order-controls');
    const input=elem('input','qty');
    input.type='number';input.min='1';input.max='100000';input.step='1';input.value=String(batches);
    input.setAttribute('aria-label',`${food.food_name} 제작 세트 수`);
    input.addEventListener('change',()=>{
      const n=positiveInt(input.value);
      if(n==null||n>100000){input.value=String(state.orders.get(id));return;}
      state.orders.set(id,n);markDirty();paintOrders();
    });
    const remove=elem('button','remove','삭제');
    remove.type='button';remove.setAttribute('aria-label',`${food.food_name} 목록에서 삭제`);
    remove.addEventListener('click',()=>{state.orders.delete(id);markDirty();paintOrders();});
    controls.append(input,remove);
    row.append(text,controls);
    root.append(row);
  }
  paintMaterials();
}

function paintMaterials() {
  const plan=calculatePlan(catalog,[...state.orders].map(([foodId,batches])=>({foodId,batches})),state.choices);
  const outcome=plan.direct;
  $('count-food').textContent=format(state.orders.size);
  $('count-sets').textContent=format(outcome.batches);
  $('count-units').textContent=format(outcome.units);
  $('material-count').textContent=`${outcome.materials.length}종`;
  const warnings=$('warning');
  warnings.replaceChildren();
  warnings.hidden=!plan.warnings.length;
  if(plan.warnings.length){
    warnings.append(elem('strong','',`계산 확인 필요 · ${plan.warnings.length}건`));
    for(const warning of plan.warnings.slice(0,10)) warnings.append(elem('p','',warning));
    if(plan.warnings.length>10) warnings.append(elem('p','',`외 ${plan.warnings.length-10}건`));
  }
  const root=$('materials');root.replaceChildren();
  if(!outcome.materials.length){
    root.append(msg(state.orders.size?'계산할 수 있는 레시피 재료가 없어.':'제작할 요리를 선택하면 재료별 합계를 볼 수 있어.'));
  } else {
    for(const material of outcome.materials){
      const line=elem('div','material-row');
      line.append(elem('span','',material.name),elem('strong','',format(material.quantity)));
      root.append(line);
    }
  }
  const fill = (id,items,build) => {
    const target=$(id);target.replaceChildren();
    if(!items.length){target.append(msg('해당 항목이 없어.'));return;}
    for(const item of items)target.append(build(item));
  };
  const line = (title,meta,value) => {
    const row=elem('div','data-row');
    const info=elem('div','data-info');
    info.append(elem('strong','',title),elem('small','',meta));
    row.append(info,elem('b','',value));return row;
  };
  $('process-count').textContent=`${plan.processes.length}종`;
  fill('processes',plan.processes,item=>line(item.name,`필요 ${format(item.need)}개 · 회당 ${item.output}개 · ${item.items.map(x=>`${x.name} ${format(x.quantity)}`).join(' / ')}`,`${format(item.batches)}회`));
  $('farm-count').textContent=`${plan.farms.length}종`;
  fill('farms',plan.farms,item=>line(item.name,'농장 · 별도 수급',`${format(item.quantity)}개`));
  const priceReady=plan.purchases.some(x=>x.cost!=null);
  const uncertainty=plan.unresolved.length>0||plan.purchases.some(x=>x.cost==null)||plan.warnings.length>0;
  $('priced-subtotal').textContent=priceReady?`확인된 소계 ${format(plan.pricedSubtotal)} · ${uncertainty?'일부 미확정':'참고'}`:'가격 확인 필요';
  const offerOptions=new Map(plan.purchaseOptions.map(item=>[item.name,item]));
  fill('purchases',plan.purchases,item=>{
    const container=elem('div','choice-card');
    container.append(line(item.name,`${item.source} · 필요 ${format(item.quantity)}개 · ${item.bundles==null?'묶음/가격 미확정':`구매 ${format(item.buyQuantity)}개 (${format(item.bundles)}묶음)`}`,item.cost==null?'비용 미확정':`${format(item.cost)}원`));
    const choices=offerOptions.get(item.name);
    if(choices){
      const field=elem('label','choice-label',`${item.name} 구매처`);
      const select=elem('select','choice-select');
      select.setAttribute('aria-label',`${item.name} 구매처 선택`);
      const placeholder=elem('option','','구매처 자동 선택 / 미확정'); placeholder.value='';select.append(placeholder);
      for(const option of choices.options){
        const label=`${option.source} · ${option.bundleQty==null?'묶음 미설정':format(option.bundleQty)+'개'} / ${option.bundlePrice==null?'가격 미설정':format(option.bundlePrice)+'원'}`;
        const node=elem('option','',label);node.value=option.id;select.append(node);
      }
      select.value=state.choices.offers[item.name]||'';
      select.addEventListener('change',()=>{
        if(select.value)state.choices.offers[item.name]=select.value;
        else delete state.choices.offers[item.name];
        markDirty();paintMaterials();
      });
      field.append(select);container.append(field);
    }
    return container;
  });
  $('fish-count').textContent=`${plan.fishOptions.length}종`;
  fill('fish',plan.fishOptions,item=>{
    const container=elem('div','choice-card');
    const selected=item.options.find(option=>option.id===item.selectedId);
    container.append(line(item.name,`생선살 필요 ${format(item.quantity)}개 · ${selected ? `${selected.fishName} ${selected.rawRequired==null?'필요 수량 미확정':format(selected.rawRequired)+'개 필요'}`:'변환 생선 미선택'}`,`${item.options.length}가지`));
    const field=elem('label','choice-label',`${item.name} 변환에 사용할 생선`);
    const select=elem('select','choice-select');
    select.setAttribute('aria-label',`${item.name} 변환 생선 선택`);
    const placeholder=elem('option','','생선 선택 안 함'); placeholder.value='';select.append(placeholder);
    for(const option of item.options){
      const node=elem('option','',`${option.fishName} · ${option.rawRequired==null?'필요량 미확정':format(option.rawRequired)+'개 필요'}`);
      node.value=option.id;select.append(node);
    }
    select.value=state.choices.fish[item.name]||'';
    select.addEventListener('change',()=>{
      if(select.value)state.choices.fish[item.name]=select.value;
      else delete state.choices.fish[item.name];
      markDirty();paintMaterials();
    });
    field.append(select);container.append(field);
    return container;
  });
  const supply=$('fish-supply');supply.replaceChildren();
  if(plan.fishSupply.length){
    supply.append(elem('strong','', '선택한 변환 방식의 원물 수급량 (원가 미포함)'));
    for(const item of plan.fishSupply)supply.append(elem('p','',`${item.name} · ${format(item.quantity)}개`));
    supply.hidden=false;
  }else supply.hidden=true;
  $('unresolved-count').textContent=`${plan.unresolved.length}종`;
  fill('unresolved',plan.unresolved,item=>line(item.name,'원본 데이터 또는 제작 방식 확인 필요',`${format(item.quantity)}개`));
  paintChecklist(plan);
}


function paintChecklist(plan) {
  const items=checklistItems(plan);
  state.checked=currentChecks(state.checked,items);
  const total=items.length, done=state.checked.size;
  $('prep-progress').textContent=`${done} / ${total} 완료`;
  const root=$('prep-list');root.replaceChildren();
  if(!total) {root.append(msg('요리를 추가하면 준비할 품목이 이곳에 표시돼.'));return;}
  for (const [group,title,unit] of [['process','가공 준비','회'],['farm','농장 수급','개'],['purchase','구매 준비','개'],['fish','생선 원물 수급','개']]) {
    const rows=items.filter(item=>item.group===group);
    if(!rows.length)continue;
    const section=elem('section','prep-group');
    section.append(elem('h4','',`${title} · ${rows.filter(row=>state.checked.has(row.key)).length}/${rows.length}`));
    for(const item of rows){
      const label=elem('label','prep-item');
      const check=elem('input');check.type='checkbox';check.checked=state.checked.has(item.key);
      check.setAttribute('aria-label',`${item.name} 준비 완료`);
      check.addEventListener('change',()=>{
        if(check.checked)state.checked.add(item.key);
        else state.checked.delete(item.key);
        label.classList.toggle('is-checked', check.checked);
        $('prep-progress').textContent=`${state.checked.size} / ${total} 완료`;
        section.querySelector('h4').textContent=`${title} · ${rows.filter(row=>state.checked.has(row.key)).length}/${rows.length}`;
        markDirty();
      });
      const name=elem('span','prep-item-name',item.name);
      const qty=elem('b','',`${format(item.quantity)}${unit}`);
      label.classList.toggle('is-checked',check.checked);
      label.append(check,name,qty);section.append(label);
    }
    root.append(section);
  }
}

function saveWorkspace(){
  try{
    const orders=[...state.orders].map(([foodId,batches])=>({foodId,batches}));
    const plan=calculatePlan(catalog,orders,state.choices);
    const payload=prepareWorkspace({...state,plan,revision});
    localStorage.setItem(WORKSPACE_KEY,JSON.stringify(payload));
    setStatus(`이 브라우저에 저장했어 · ${new Date(payload.savedAt).toLocaleString('ko-KR')}`,'success');
  }catch{setStatus('저장하지 못했어. 브라우저 저장소 사용 가능 여부를 확인해 줘.','error');}
}
function loadWorkspace(){
  try{
    const raw=localStorage.getItem(WORKSPACE_KEY);
    if(!raw){setStatus('이 브라우저에 저장된 작업이 없어.','error');return;}
    if(state.orders.size && !window.confirm('현재 제작 목록과 체크를 저장된 작업으로 교체할까? 저장하지 않은 변경 사항은 사라져.'))return;
    const loaded=parseWorkspace(raw,{revision,foods:state.foods});
    const plan=calculatePlan(catalog,[...loaded.orders].map(([foodId,batches])=>({foodId,batches})),loaded.choices);
    state.orders=loaded.orders;state.choices=loaded.choices;
    state.checked=currentChecks(loaded.checked,checklistItems(plan));
    paintOrders();
    setStatus('이 브라우저의 저장본을 불러왔어. 계정 간 동기화는 되지 않아.','success');
  }catch(error){setStatus(`불러오기 중단: ${error.message}`,'error');}
}
function deleteWorkspace(){
  try{
    if(localStorage.getItem(WORKSPACE_KEY)==null){setStatus('삭제할 저장본이 없어.');return;}
    if(!window.confirm('이 브라우저에 저장된 작업을 삭제할까? 현재 화면의 제작 목록은 그대로 유지돼.'))return;
    localStorage.removeItem(WORKSPACE_KEY);
    setStatus('브라우저에 저장된 작업을 삭제했어. 현재 화면은 그대로야.','success');
  }catch{setStatus('저장본을 삭제하지 못했어. 브라우저 저장소를 확인해 줘.','error');}
}

function start(){
  try{
    if(!Array.isArray(catalog.foods)||!Array.isArray(catalog.recipes))throw Error('데이터 형식 오류');
    state.foods=catalog.foods;state.recipes=catalog.recipes;
    $('search-meta').textContent=`요리 ${usableFoods().length}종 · 기준 자료`;
    paintFoods();paintOrders();
  }catch(err){
    $('search-meta').textContent='데이터 읽기 실패';
    $('results').replaceChildren(msg('자료를 불러오지 못했어. 시연 자료를 확인해 줘.'));
    $('warning').hidden=false;
    $('warning').textContent=`시연 자료 불러오기 오류: ${err.message}`;
  }
}
$('search').addEventListener('input',e=>{state.query=e.target.value;paintFoods();});
$('clear').addEventListener('click',()=>{
  if(!state.orders.size)return;
  if(!window.confirm('현재 제작 목록과 체크를 비울까? 브라우저에 별도로 저장한 작업은 유지돼.'))return;
  state.orders.clear();state.choices={offers:{},fish:{}};state.checked.clear();markDirty();paintOrders();
});
$('save-workspace').addEventListener('click',saveWorkspace);
$('load-workspace').addEventListener('click',loadWorkspace);
$('delete-workspace').addEventListener('click',deleteWorkspace);
start();


/**
 * Optional future HUB integration point; never invoked in standalone preview.
 * Caller must provide the HUB's EXISTING Supabase client (no second OAuth).
 * cloudWorkspaceEnabled defaults to false until a separate DB/RLS validation.
 */
let detachCookHost = null;
export function attachCookHubHost({supabase, onHubReturn, cloudWorkspaceEnabled = false} = {}) {
  if (detachCookHost) throw Error('LAC COOK은 이미 HUB에 연결되어 있어.');
  if (typeof onHubReturn !== 'function') throw Error('HUB 복귀 기능이 준비되지 않았어.');
  const previous = $('cook-return-preview');
  const back = document.createElement('button');
  back.id = 'cook-return-host'; back.type = 'button'; back.className = 'back back-button';
  back.textContent = '← LAC HUB';
  back.setAttribute('aria-label','LAC HUB 메인으로 이동');
  back.addEventListener('click',onHubReturn);
  previous.replaceWith(back);
  const previewTag = document.querySelector('.preview-tag');
  const priorPreviewHidden = previewTag?.hidden ?? false;
  if (previewTag) previewTag.hidden = true;
  const note = document.getElementById('cook-mode-note');
  const previousNote = note?.textContent;
  if (note) note.textContent = cloudWorkspaceEnabled
    ? '이 콘텐츠는 HUB 통합 검토용이야. 기본 계산 자료는 읽기 전용이며, 클라우드 작업은 인증을 확인한 뒤 버튼을 눌러 동의한 경우에만 처리해. 기존 AXE COOK과 Google Sheets는 수정하지 않아.'
    : '이 콘텐츠는 HUB 통합 검토용이야. 현재 작업은 이 브라우저에만 수동 저장되며 클라우드 저장은 아직 활성화되지 않았어.';
  let detachPanel = null;
  try {
    if (cloudWorkspaceEnabled) {
      if (!supabase) throw Error('HUB의 기존 Supabase 연결이 필요해.');
      detachPanel = mountCookCloudPanel({
        client: supabase,
        options: {revision, foods: state.foods},
        snapshot: () => {
          const plan = calculatePlan(catalog, [...state.orders].map(([foodId,batches]) => ({foodId,batches})),state.choices);
          return prepareWorkspace({...state, plan, revision});
        },
        apply: loaded => {
          state.orders = new Map(loaded.orders);
          state.choices = loaded.choices;
          const plan = calculatePlan(catalog,[...state.orders].map(([foodId,batches])=>({foodId,batches})),state.choices);
          state.checked = currentChecks(loaded.checked,checklistItems(plan));
          paintOrders();markDirty();
        }
      });
    }
  } catch (error) {
    back.replaceWith(previous);
    if (previewTag) previewTag.hidden = priorPreviewHidden;
    if (note) note.textContent = previousNote;
    throw error;
  }
  detachCookHost = () => {
    detachPanel?.();
    back.removeEventListener('click',onHubReturn);
    back.replaceWith(previous);
    if (previewTag) previewTag.hidden = priorPreviewHidden;
    if (note) note.textContent = previousNote;
    detachCookHost = null;
  };
  return detachCookHost;
}


/** Phase 9: standalone mock HUB preview. Not a production HUB route or auth link. */
if (new URLSearchParams(window.location.search).get('lacCookHostPreview') === '1' && window.parent !== window) {
  attachCookHubHost({
    onHubReturn:() => requestHostReturn({selfWindow:window,parentWindow:window.parent}),
    cloudWorkspaceEnabled:false
  });
  $('cook-host-account').textContent = '브라우저 작업공간';
  $('cook-mode-note').textContent = 'COOK은 현재 데이터 스냅샷을 사용하며, 작업은 이용자가 직접 저장할 때 이 브라우저에만 보관돼. 클라우드 저장과 계정별 동기화는 아직 제공하지 않아. 기존 AXE COOK·Google Sheets·HUB 데이터는 수정하지 않아.';
}
