import {calculateDirect, positiveInt} from './engine.js';
import catalog from '../data/catalog.js';
import {calculatePlan} from './planner.js';
import {CATALOG_REVISION} from '../data/revision.js';
import {WORKSPACE_KEY,checklistItems,currentChecks,prepareWorkspace,parseWorkspace} from './workspace.js';
import {mountCookCloudPanel} from './cloudPanel.js';
import {requestHostReturn} from './hostBridge.js';

const $ = id => document.getElementById(id);
const state = {foods:[], recipes:[], orders:new Map(), query:'', choices:{offers:{},fish:{}}, checked:new Set(),memo:'', favorites:new Set()};
const FAVORITES_KEY = 'lac-cook-favorite-foods-v1';
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
const getFood = id => state.foods.find(food=>food.food_id===id && food.is_active==='TRUE');
function addOrder(id){
  if(!getFood(id)) return;
  const count=state.orders.get(id)||0;
  state.orders.set(id,Math.min(100000,count+1));
  markDirty();paintOrders();
}
function saveFavorites(){
  try { localStorage.setItem(FAVORITES_KEY,JSON.stringify([...state.favorites]));
    $('favorites-status').hidden=true;
  }catch{
    $('favorites-status').textContent='즐겨찾기를 브라우저에 저장하지 못했어. 현재 화면에서는 계속 사용할 수 있어.';
    $('favorites-status').hidden=false;
  }
}
function loadFavorites(){
  try{
    const raw=JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]');
    if(!Array.isArray(raw)) return;
    state.favorites=new Set(raw.filter(id=>typeof id==='string' && getFood(id)).slice(0,100));
  }catch{state.favorites=new Set();}
}
function toggleFavorite(id){
  if(!getFood(id))return;
  if(state.favorites.has(id))state.favorites.delete(id);
  else if(state.favorites.size<100)state.favorites.add(id);
  else {
    $('favorites-status').textContent='즐겨찾기는 최대 100개까지 등록할 수 있어.';
    $('favorites-status').hidden=false;
    return;
  }
  saveFavorites();paintFavorites();paintFoods();
}
function paintFavorites(){
  const root=$('favorites');root.replaceChildren();
  for(const id of state.favorites){
    const food=getFood(id);
    if(!food)continue;
    const row=elem('div','favorite-row');
    const name=elem('span','favorite-name',food.food_name);
    const add=elem('button','accent favorite-add','추가 +');
    add.type='button';add.setAttribute('aria-label',`${food.food_name} 작업 목록에 추가`);
    add.addEventListener('click',()=>addOrder(id));
    const remove=elem('button','favorite-remove','★');
    remove.type='button';remove.title='즐겨찾기 해제';
    remove.setAttribute('aria-label',`${food.food_name} 즐겨찾기 해제`);
    remove.addEventListener('click',()=>toggleFavorite(id));
    row.append(name,add,remove);root.append(row);
  }
  if(!root.childElementCount)root.append(msg('검색 결과에서 ☆를 눌러 자주 만드는 요리를 등록해 줘.'));
}


function paintFoods() {
  const root = $('results');
  root.replaceChildren();
  const query = state.query.toLocaleLowerCase('ko').trim();
  root.hidden = !query;
  if (!query) return;
  const matches = usableFoods().filter(food=>food.food_name.toLocaleLowerCase('ko').includes(query)).slice(0,20);
  if (!matches.length) return root.append(msg('검색 결과가 없어.'));
  for (const food of matches) {
    const row = elem('div','food-row');
    const text = elem('div','food-text');
    text.append(elem('strong','',food.food_name));
    text.append(elem('small','',`${food.grade||'등급 미확인'} · 1세트 ${food.set_qty||'미설정'}개`));
    const button = elem('button','accent','추가 +');
    button.type='button';
    button.addEventListener('click',()=>addOrder(food.food_id));
    const favorite=elem('button','favorite-toggle',state.favorites.has(food.food_id)?'★':'☆');
    favorite.type='button';favorite.title=state.favorites.has(food.food_id)?'즐겨찾기 해제':'즐겨찾기 등록';
    favorite.setAttribute('aria-label',`${food.food_name} ${favorite.title}`);
    favorite.setAttribute('aria-pressed',String(state.favorites.has(food.food_id)));
    favorite.addEventListener('click',()=>toggleFavorite(food.food_id));
    row.append(text,favorite,button);
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
    const stepper=elem('div','qty-stepper');
    stepper.setAttribute('role','group');
    stepper.setAttribute('aria-label',`${food.food_name} 제작 세트 수 조절`);
    const changeBatches=n=>{
      if(!Number.isSafeInteger(n)||n<1||n>100000) return;
      if(n===state.orders.get(id))return;
      state.orders.set(id,n);markDirty();paintOrders();
    };
    const minus=elem('button','qty-adjust qty-minus','−');
    minus.type='button';minus.disabled=batches<=1;
    minus.setAttribute('aria-label',`${food.food_name} 제작 세트 1개 줄이기`);
    minus.addEventListener('click',()=>changeBatches(state.orders.get(id)-1));
    const input=elem('input','qty');
    input.type='text';input.inputMode='numeric';input.autocomplete='off';
    input.maxLength=6;input.value=String(batches);
    input.setAttribute('aria-label',`${food.food_name} 제작 세트 수 직접 입력`);
    input.addEventListener('change',()=>{
      const typed=input.value.trim();
      const n=/^\d{1,6}$/.test(typed)?positiveInt(typed):null;
      if(n==null||n>100000){input.value=String(state.orders.get(id));return;}
      changeBatches(n);
    });
    const plus=elem('button','qty-adjust qty-plus','+');
    plus.type='button';plus.disabled=batches>=100000;
    plus.setAttribute('aria-label',`${food.food_name} 제작 세트 1개 늘리기`);
    plus.addEventListener('click',()=>changeBatches(state.orders.get(id)+1));
    stepper.append(minus,input,plus);
    const remove=elem('button','remove','삭제');
    remove.type='button';remove.setAttribute('aria-label',`${food.food_name} 목록에서 삭제`);
    remove.addEventListener('click',()=>{state.orders.delete(id);markDirty();paintOrders();});
    controls.append(stepper,remove);
    row.append(text,controls);
    root.append(row);
  }
  paintMaterials();
}

// Recipe cards are always the source recipe for ONE finished dish, never
// the scaled ingredient totals for the current order. Totals stay in the plan.
function paintFoodRecipes() {
  const root=$('food-recipes'); root.replaceChildren();
  if(!state.orders.size){root.append(msg('요리를 선택하면 레시피가 표시돼.'));return;}
  const foods=new Map(state.foods.map(food=>[food.food_id,food]));
  for(const [id,batches] of state.orders){
    const food=foods.get(id);
    if(!food)continue;
    const source=state.recipes.filter(line=>line.is_active==='TRUE' && line.food_name===food.food_name);
    const card=elem('article','recipe-card');
    const head=elem('div','recipe-card-head');
    const title=elem('div','recipe-head-title');
    title.append(elem('strong','',food.food_name));
    const seconds=Number(food.cook_time);
    title.append(elem('span','recipe-time',food.cook_time!=='' && Number.isFinite(seconds) && seconds>0 ? `${format(seconds)}초` : '시간 미설정'));
    head.append(title);
    card.append(head);
    if(!source.length)card.append(msg('등록된 레시피가 없어.'));
    const ingredients=elem('div','recipe-ingredients');
    for(const item of source){
      const qty=Number(item.required_qty);
      const valid=item.required_qty!=='' && Number.isFinite(qty) && qty>0;
      const ingredient=elem('span','recipe-ingredient');
      ingredient.append(elem('span','',item.material_name||'재료명 미설정'),elem('b','',valid?`×${format(qty)}`:'수량 확인'));
      ingredients.append(ingredient);
    }
    card.append(ingredients);
    root.append(card);
  }
}

// Show prerequisite processing first (dough -> bread -> toast), even if the
// planner's list is alphabetically sorted. Cycles are left in source order;
// the planner already flags them as unresolved rather than fabricating steps.
function processingOrder(processes){
  const byName=new Map(processes.map(item=>[item.name,item]));
  const aliasNames=new Map((catalog.aliases||[])
    .filter(row=>row.is_active==='TRUE'&&row.alias_name&&row.standard_name)
    .map(row=>[row.alias_name,row.standard_name]));
  const visited=new Set();const visiting=new Set();const ordered=[];
  const visit=item=>{
    if(visited.has(item.name))return;
    if(visiting.has(item.name))return;
    visiting.add(item.name);
    const inputs=(catalog.processes||[])
      .filter(row=>row.is_active==='TRUE'&&row.process_material_name===item.name)
      .map(row=>row.input_material_name);
    for(const name of inputs){const dependency=byName.get(aliasNames.get(name)||name);if(dependency)visit(dependency);}
    visiting.delete(item.name);visited.add(item.name);ordered.push(item);
  };
  for(const item of processes)visit(item);
  return ordered;
}

let visibleChecklistItems = [];
function updateProgress() {
  const done = visibleChecklistItems.filter(item => state.checked.has(item.key)).length;
  $('prep-progress').textContent = `${done} / ${visibleChecklistItems.length} 완료`;
}
function checkRow(item, type, detail, amount) {
  const row=elem('label','check-row');
  if(type==='농장'||type==='생선')row.classList.add('is-gathering');
  const input=elem('input'); input.type='checkbox'; input.checked=state.checked.has(item.key);
  input.setAttribute('aria-label',`${item.name} 준비 완료`);
  const copy=elem('span','check-copy');
  const heading=elem('span','check-name');
  heading.append(elem('strong','',item.name),elem('span','check-type',type));
  copy.append(heading,elem('small','',detail));
  row.append(input,copy);
  if(amount != null){
    if(typeof amount==='object'){
      const summary=elem('span','check-purchase-info');
      summary.append(elem('b','bundle-pill',amount.primary),elem('small','price-note',amount.secondary));
      row.append(summary);
    }else row.append(elem('b','check-amount',amount));
  }
  row.classList.toggle('is-checked',input.checked);
  input.addEventListener('change',()=>{
    if(input.checked) state.checked.add(item.key);
    else state.checked.delete(item.key);
    row.classList.toggle('is-checked',input.checked);
    updateProgress(); markDirty();
  });
  return row;
}
function paintMaterials() {
  const plan=calculatePlan(catalog,[...state.orders].map(([foodId,batches])=>({foodId,batches})),state.choices);
  const outcome=plan.direct;
  const allChecklistItems=checklistItems(plan);
  visibleChecklistItems=allChecklistItems.filter(item=>['purchase','farm','fish'].includes(item.group));
  state.checked=currentChecks(state.checked,allChecklistItems);
  paintFoodRecipes();
  $('count-food').textContent=`${format(state.orders.size)}종`;
  $('count-sets').textContent=format(outcome.batches);
  $('count-units').textContent=`${format(outcome.units)}개`;
  $('material-count').textContent=`${outcome.materials.length}종`;
  const warnings=$('warning');
  warnings.replaceChildren();
  warnings.hidden=!plan.warnings.length;
  if(plan.warnings.length){
    warnings.append(elem('strong','',`계산 확인 필요 · ${plan.warnings.length}건`));
    for(const warning of plan.warnings.slice(0,8)) warnings.append(elem('p','',warning));
    if(plan.warnings.length>8) warnings.append(elem('p','',`외 ${plan.warnings.length-8}건`));
  }
  const root=$('materials'); root.replaceChildren();
  if(!outcome.materials.length)root.append(msg('제작할 요리를 선택하면 재료 합계를 볼 수 있어.'));
  else for(const material of outcome.materials){
    const item=elem('div','material-row');
    item.append(elem('span','',material.name),elem('strong','',format(material.quantity)));
    root.append(item);
  }
  const processRoot=$('processes'); processRoot.replaceChildren();
  $('process-count').textContent=`${plan.processes.length}종`;
  if(!plan.processes.length) processRoot.append(msg('가공이 필요한 재료가 없어.'));
  for(const [index,item] of processingOrder(plan.processes).entries()){
    // The planner's item.items are already multiplied by total processing
    // runs; use the original CSV rows to present the stable ONE-run recipe.
    const source=catalog.processes.filter(row=>row.is_active==='TRUE' && row.process_material_name===item.name);
    const line=elem('article','process-recipe-card');
    const head=elem('div','process-recipe-head');
    const title=elem('div','recipe-head-title');
    title.append(elem('span','process-order',String(index+1)),elem('strong','',item.name));
    const times=[...new Set(source.map(row=>String(row.process_time||'').trim()).filter(Boolean))];
    title.append(elem('span','recipe-time',times.length===1?times[0]:'시간 미설정'));
    head.append(title);line.append(head);
    const base=elem('div','process-base');
    const ingredients=elem('div','recipe-ingredients');
    for(const row of source){
      const qty=Number(row.required_qty);
      const valid=row.required_qty!=='' && Number.isFinite(qty) && qty>0;
      const tag=elem('span','recipe-ingredient');
      tag.append(elem('span','',row.input_material_name||'재료명 미설정'),elem('b','',valid?`×${format(qty)}`:'수량 확인'));
      ingredients.append(tag);
    }
    base.append(ingredients);line.append(base);processRoot.append(line);
  }
  const offerOptions=new Map(plan.purchaseOptions.map(item=>[item.name,item]));
  const checkByGroupName=new Map(visibleChecklistItems.map(item=>[`${item.group}:${item.name}`,item]));
  const purchases=$('purchases'); purchases.replaceChildren();
  purchases.hidden=!plan.purchases.length && !plan.farms.length && !plan.fishSupply.length;
  for(const item of plan.purchases){
    const itemKey=checkByGroupName.get(`purchase:${item.name}`);
    if(!itemKey)continue;
    const container=elem('div','supply-card');
    const detail=item.bundles==null
      ? `필요 ${format(item.quantity)}개 · 묶음 수량 확인 필요`
      : `1묶음 ${format(item.bundleQty)}개 · 필요 ${format(item.quantity)}개 · 구매 ${format(item.buyQuantity)}개 · 남음 ${format(item.buyQuantity-item.quantity)}개`;
    container.append(checkRow(itemKey,'구매',detail,item.bundles==null?'묶음 미확정':`${format(item.bundles)}묶음`));
    const choices=offerOptions.get(item.name);
    if(choices){
      const field=elem('label','choice-label',`${item.name} 구매처`);
      const select=elem('select','choice-select');
      select.setAttribute('aria-label',`${item.name} 구매처 선택`);
      const placeholder=elem('option','','구매처 선택 / 미확정');placeholder.value='';select.append(placeholder);
      for(const option of choices.options){
        const label=`${option.source} · ${option.bundleQty==null?'묶음 미설정':'1묶음 '+format(option.bundleQty)+'개'}`;
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
    purchases.append(container);
  }
  paintChecklist(plan,checkByGroupName);
}

function paintChecklist(plan,checkByGroupName) {
  const root=$('prep-list');root.replaceChildren();
  const append = (key,type,detail,amount) => {
    if(!key)return;
    const card=elem('div','supply-card'); card.append(checkRow(key,type,detail,amount));root.append(card);
  };
  for(const item of plan.farms){
    const key=checkByGroupName.get(`farm:${item.name}`);
    if(!key)continue;
    const card=elem('div','supply-card');
    card.append(checkRow(key,'농장',`채집 · 필요 ${format(item.quantity)}개`,'채집'));
    $('purchases').append(card);
  }
  for(const item of plan.fishOptions){
    const container=elem('div','supply-card');
    const field=elem('label','choice-label',`${item.name} 변환 · 생선살 ${format(item.quantity)}개 필요`);
    const select=elem('select','choice-select');
    select.setAttribute('aria-label',`${item.name} 변환 생선 선택`);
    const placeholder=elem('option','','변환에 사용할 생선 선택');placeholder.value='';select.append(placeholder);
    for(const option of item.options){
      const node=elem('option','',`${option.fishName} · ${option.rawRequired==null?'수량 미확정':format(option.rawRequired)+'개 필요'}`);
      node.value=option.id;select.append(node);
    }
    select.value=state.choices.fish[item.name]||'';
    select.addEventListener('change',()=>{
      if(select.value)state.choices.fish[item.name]=select.value;
      else delete state.choices.fish[item.name];
      markDirty();paintMaterials();
    });
    field.append(select);container.append(field);root.append(container);
  }
  for(const item of plan.fishSupply){
    const key=checkByGroupName.get(`fish:${item.name}`);
    if(!key)continue;
    const card=elem('div','supply-card');
    card.append(checkRow(key,'생선',`수급 · 필요 ${format(item.quantity)}개`,'채집'));
    $('purchases').append(card);
  }
  const unresolved=$('unresolved');unresolved.replaceChildren();
  for(const item of plan.unresolved){
    const line=elem('div','data-row');
    const info=elem('div','data-info');
    info.append(elem('strong','',item.name),elem('small','',`수량 ${format(item.quantity)}개 · 원본 데이터/제작 방식 확인 필요`));
    line.append(info);unresolved.append(line);
  }
  $('unresolved-count').textContent=`${plan.unresolved.length}종`;
  const issues=$('cook-issues');issues.hidden=!plan.unresolved.length&&!plan.warnings.length;
  issues.open=plan.unresolved.length>0;
  if(!purchases.children.length&&!root.children.length&&!plan.unresolved.length){
    purchases.hidden=false;
    purchases.append(msg(state.orders.size?'구매·채집할 재료가 없어.':'요리를 추가하면 필요한 구매·채집 재료가 여기에 표시돼.'));
  }
  updateProgress();
}

// Native <dialog> provides a centered top-layer overlay, keyboard focus,
// Escape handling and focus return. The operation runs ONLY on confirmation.
function askCookConfirmation({title,description,confirmText='확인',danger=false}){
  const dialog=$('cook-confirm');
  if(!dialog || typeof dialog.showModal!=='function'){
    setStatus('확인 창을 열 수 없어. 브라우저를 업데이트한 뒤 다시 시도해 줘.','error');
    return Promise.resolve(false);
  }
  if(dialog.open)return Promise.resolve(false);
  $('cook-confirm-title').textContent=title;
  $('cook-confirm-description').textContent=description;
  const confirm=$('cook-confirm-action');
  confirm.textContent=confirmText;
  confirm.classList.toggle('is-danger',danger);
  return new Promise(resolve=>{
    const previouslyFocused=document.activeElement;
    const onClose=()=>{
      dialog.removeEventListener('close',onClose);
      const accepted=dialog.returnValue==='confirm';
      dialog.returnValue='';
      if(previouslyFocused?.isConnected && typeof previouslyFocused.focus==='function')previouslyFocused.focus();
      resolve(accepted);
    };
    dialog.addEventListener('close',onClose);
    dialog.showModal();
    $('cook-confirm-cancel').focus();
  });
}
$('cook-confirm-cancel').addEventListener('click',()=>$('cook-confirm').close('cancel'));
$('cook-confirm-action').addEventListener('click',()=>$('cook-confirm').close('confirm'));
$('cook-confirm').addEventListener('click',event=>{
  const dialog=$('cook-confirm');
  const bounds=dialog.getBoundingClientRect();
  if(event.target===dialog && (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom)){
    dialog.close('cancel');
  }
});

function saveWorkspace(){
  try{
    const orders=[...state.orders].map(([foodId,batches])=>({foodId,batches}));
    const plan=calculatePlan(catalog,orders,state.choices);
    const payload=prepareWorkspace({...state,plan,revision});
    localStorage.setItem(WORKSPACE_KEY,JSON.stringify(payload));
    setStatus(`이 브라우저에 저장했어 · ${new Date(payload.savedAt).toLocaleString('ko-KR')}`,'success');
  }catch{setStatus('저장하지 못했어. 브라우저 저장소 사용 가능 여부를 확인해 줘.','error');}
}
async function loadWorkspace(){
  try{
    const raw=localStorage.getItem(WORKSPACE_KEY);
    if(!raw){setStatus('이 브라우저에 저장된 작업이 없어.','error');return;}
    if(state.orders.size && !await askCookConfirmation({title:'저장한 작업을 불러올까?',description:'현재 화면의 제작 목록과 체크 상태가 저장본으로 교체돼. 저장하지 않은 변경 사항은 사라져.',confirmText:'불러오기'}))return;
    const loaded=parseWorkspace(raw,{revision,foods:state.foods});
    const plan=calculatePlan(catalog,[...loaded.orders].map(([foodId,batches])=>({foodId,batches})),loaded.choices);
    state.orders=loaded.orders;state.choices=loaded.choices;
    state.checked=currentChecks(loaded.checked,checklistItems(plan));
    state.memo=loaded.memo||'';
    paintOrders();
    setStatus('이 브라우저의 저장본을 불러왔어. 계정 간 동기화는 되지 않아.','success');
  }catch(error){setStatus(`불러오기 중단: ${error.message}`,'error');}
}
async function deleteWorkspace(){
  try{
    if(localStorage.getItem(WORKSPACE_KEY)==null){setStatus('삭제할 저장본이 없어.');return;}
    if(!await askCookConfirmation({title:'저장본을 삭제할까?',description:'브라우저에 저장한 작업만 삭제돼. 현재 화면의 제작 목록은 그대로 유지돼.',confirmText:'저장본 삭제',danger:true}))return;
    localStorage.removeItem(WORKSPACE_KEY);
    setStatus('브라우저에 저장된 작업을 삭제했어. 현재 화면은 그대로야.','success');
  }catch{setStatus('저장본을 삭제하지 못했어. 브라우저 저장소를 확인해 줘.','error');}
}

function start(){
  try{
    if(!Array.isArray(catalog.foods)||!Array.isArray(catalog.recipes))throw Error('데이터 형식 오류');
    state.foods=catalog.foods;state.recipes=catalog.recipes;
    $('search-meta').textContent=`요리 ${usableFoods().length}종 · 기준 자료`;
    loadFavorites();paintFavorites();paintFoods();paintOrders();
  }catch(err){
    $('search-meta').textContent='데이터 읽기 실패';
    $('results').replaceChildren(msg('자료를 불러오지 못했어. 시연 자료를 확인해 줘.'));
    $('warning').hidden=false;
    $('warning').textContent=`시연 자료 불러오기 오류: ${err.message}`;
  }
}
$('search').addEventListener('input',e=>{state.query=e.target.value;paintFoods();});
$('clear').addEventListener('click',async()=>{
  if(!state.orders.size)return;
  if(!await askCookConfirmation({title:'작업 목록을 비울까?',description:'현재 제작 목록과 준비 체크가 초기화돼. 브라우저에 따로 저장한 작업과 즐겨찾기는 유지돼.',confirmText:'목록 비우기',danger:true}))return;
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
          state.memo=loaded.memo||'';
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
