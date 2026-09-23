/* LAC COOK recipe editor. Static CSV is immutable baseline; new/edited recipes
 * are read from a separate Supabase table through the authenticated HUB host.
 * No service key or OAuth session is ever sent into the embedded iframe. */
const byId = id => document.getElementById(id);
const RESPONSE_TYPE='lac-cook:recipes:response:v1';
const REQUEST_TYPE='lac-cook:recipes:request:v1';
const pending=new Map();
let seq=0;

window.addEventListener('message',event=>{
  if(event.origin !== window.location.origin || event.source !== window.parent ||
     !event.data || event.data.type!==RESPONSE_TYPE) return;
  const slot=pending.get(event.data.requestId);
  if(!slot)return;
  pending.delete(event.data.requestId);
  clearTimeout(slot.timeout);
  if(event.data.ok)slot.resolve(event.data);
  else slot.reject(Error(String(event.data.error||'레시피 데이터 요청이 실패했습니다.')));
});
function request(action,payload){
  if(window.parent===window)return Promise.reject(Error('레시피 등록·수정은 HUB 안에서만 가능합니다.'));
  const requestId=`cook-r-${Date.now().toString(36)}-${++seq}`;
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(requestId);reject(Error('서버 응답 시간이 초과되었습니다. 다시 시도해 주세요.'));},10000);
    pending.set(requestId,{resolve,reject,timeout});
    window.parent.postMessage({type:REQUEST_TYPE,requestId,action,payload},window.location.origin);
  });
}
function element(tag,className='',value=''){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(value)node.textContent=value;
  return node;
}
const baseFoodSnapshot = new Map();
let baseRecipes=[];
let editorState={entries:[],canEdit:false,ready:false,error:''};
let activeMode='add',selectedFoodId='',catalogRef=null, stateRef=null, onSavedCallback=()=>{};
function normalizeFood(name){return name.trim().toLocaleLowerCase('ko');}
function knownIngredientNames(){
  const names=new Set([
    ...(catalogRef.materials||[]).map(row=>row.material_name),
    ...(catalogRef.farms||[]).map(row=>row.material_name),
    ...(catalogRef.processes||[]).flatMap(row=>[row.input_material_name,row.process_material_name]),
    ...catalogRef.recipes.map(row=>row.material_name)
  ].filter(Boolean));
  return [...names].sort((a,b)=>a.localeCompare(b,'ko'));
}
function paintIngredientOptions(){
  const root=byId('cook-editor-material-options');root.replaceChildren();
  for(const name of knownIngredientNames()){
    const node=element('option');node.value=name;root.append(node);
  }
}
function applyEntries(rows){
  const foods=[...baseFoodSnapshot.values()].map(row=>({...row}));
  const recipes=baseRecipes.map(row=>({...row}));
  for(const row of rows){
    const existing=foods.find(food=>food.food_id===row.food_id);
    if(existing){
      const oldName=existing.food_name;
      for(let i=recipes.length-1;i>=0;i--)if(recipes[i].food_name===oldName)recipes.splice(i,1);
      Object.assign(existing,{food_name:row.food_name,set_qty:String(row.set_qty),cook_time:String(row.cook_time)});
    }else foods.push({food_id:row.food_id,food_name:row.food_name,grade:'신규',category:'',
      set_qty:String(row.set_qty),sale_price:'',cook_time:String(row.cook_time),effect:'',effect_time:'',
      is_active:'TRUE',is_favorite:'FALSE',sort_order:'9999',memo:''});
    for(const [index,item] of row.ingredients.entries()){
      recipes.push({recipe_id:`editor_${row.food_id}_${index}`,food_id:row.food_id,
        food_name:row.food_name,material_id:'',material_name:item.name,required_qty:String(item.qty),
        material_type:'',is_active:'TRUE',sort_order:String(index+1),memo:''});
    }
  }
  // Preserve array identity shared between catalog and state; every calculation
  // reads the same overlay rather than silently using the old CSV totals.
  catalogRef.foods.splice(0,catalogRef.foods.length,...foods);
  catalogRef.recipes.splice(0,catalogRef.recipes.length,...recipes);
  stateRef.foods=catalogRef.foods;
  stateRef.recipes=catalogRef.recipes;
  editorState.entries=rows;
}
function createIngredientRow(name='',qty=1){
  const row=element('div','cook-editor-material-row');
  const input=element('input');input.type='text';input.maxLength=90;input.required=true;
  input.placeholder='재료명';input.setAttribute('list','cook-editor-material-options');input.value=name;
  input.setAttribute('aria-label','재료명');
  const count=element('input');count.type='number';count.inputMode='numeric';count.step='1';count.min='1';count.max='999999';
  count.required=true;count.placeholder='수량';count.value=String(qty);
  count.setAttribute('aria-label','1회 필요 수량');
  const remove=element('button','cook-editor-remove','×');remove.type='button';
  remove.setAttribute('aria-label','재료 삭제');remove.addEventListener('click',()=>{
    if(byId('cook-editor-materials').children.length<=1)return;
    row.remove();
  });
  row.append(input,count,remove);byId('cook-editor-materials').append(row);
  return row;
}
function setStatus(text,kind=''){
  const node=byId('cook-editor-result');node.textContent=text;node.dataset.kind=kind;
}
function loadFormFromFood(food){
  if(!food)return;
  byId('cook-editor-name').value=food.food_name;
  byId('cook-editor-set').value=food.set_qty||'';
  byId('cook-editor-time').value=food.cook_time||'';
  byId('cook-editor-materials').replaceChildren();
  for(const row of catalogRef.recipes.filter(row=>row.is_active==='TRUE' && row.food_name===food.food_name)){
    createIngredientRow(row.material_name,row.required_qty||'');
  }
  if(!byId('cook-editor-materials').children.length)createIngredientRow();
}
function paintFoodSelector(){
  const select=byId('cook-editor-select');select.replaceChildren();
  for(const food of catalogRef.foods.filter(food=>food.is_active==='TRUE').sort((a,b)=>a.food_name.localeCompare(b.food_name,'ko'))){
    const option=element('option','',food.food_name);option.value=food.food_id;select.append(option);
  }
}
function openEditor(mode){
  const dialog=byId('cook-recipe-editor');if(dialog.open)return;
  activeMode=mode;
  paintIngredientOptions();
  byId('cook-recipe-editor-title').textContent=mode==='add'?'레시피 추가':'레시피 수정';
  byId('cook-editor-save').textContent=mode==='add'?'레시피 등록':'변경사항 저장';
  byId('cook-editor-select-wrap').hidden=mode==='add';
  const note=byId('cook-editor-note');
  note.textContent=editorState.error
    ? `레시피 DB를 연결하지 못했습니다. ${editorState.error}`
    : !editorState.canEdit?'레시피 등록·수정은 플랫폼 관리자 로그인 후 이용할 수 있습니다.':'요리명과 1회 제작 재료만 입력해 주세요.';
  byId('cook-editor-save').disabled=!editorState.ready||!editorState.canEdit;
  setStatus('');
  if(mode==='edit'){
    paintFoodSelector();
    const preferred=stateRef.orders.keys().next().value;
    selectedFoodId=(preferred&&catalogRef.foods.some(food=>food.food_id===preferred))?preferred:byId('cook-editor-select').value;
    byId('cook-editor-select').value=selectedFoodId;
    loadFormFromFood(catalogRef.foods.find(food=>food.food_id===selectedFoodId));
  }else{
    selectedFoodId='';byId('cook-recipe-form').reset();
    byId('cook-editor-materials').replaceChildren();createIngredientRow();
  }
  dialog.showModal();
  (mode==='add'?byId('cook-editor-name'):byId('cook-editor-select')).focus();
}
function parseForm(){
  const name=byId('cook-editor-name').value.trim();
  const setCount=Number(byId('cook-editor-set').value);
  const timeValue=byId('cook-editor-time').value;
  const time=Number(timeValue);
  if(!name||name.length>90)throw Error('요리명을 입력해 주세요 (최대 90자).');
  if(!Number.isSafeInteger(setCount)||setCount<1||setCount>100000)throw Error('1세트 완성 수량을 정확히 입력해 주세요.');
  if(timeValue===''||!Number.isFinite(time)||time<0||time>86400||Math.abs(Math.round(time*100)-time*100)>1e-6)
    throw Error('조리시간을 초 단위로 입력해 주세요 (소수점 둘째 자리까지).');
  const rows=[...byId('cook-editor-materials').children];
  const ingredients=rows.map(row=>({name:row.querySelector('input[type=text]').value.trim(),qty:Number(row.querySelector('input[type=number]').value)}));
  if(!ingredients.length||ingredients.length>24||ingredients.some(item=>!item.name||item.name.length>90||
      !Number.isSafeInteger(item.qty)||item.qty<1||item.qty>999999))
    throw Error('재료명과 1회 수량을 확인해 주세요 (최대 24종).');
  if(new Set(ingredients.map(item=>normalizeFood(item.name))).size!==ingredients.length)
    throw Error('같은 재료가 중복 등록되어 있습니다.');
  const known=new Set(knownIngredientNames().map(normalizeFood));
  if(ingredients.some(item=>!known.has(normalizeFood(item.name))))
    throw Error('재료 목록에 없는 이름이 있습니다. 기존 재료를 선택해 주세요. 새 재료 등록은 별도로 준비 중입니다.');
  const existingId=activeMode==='edit'?selectedFoodId:'';
  const duplicated=catalogRef.foods.some(food=>normalizeFood(food.food_name)===normalizeFood(name)&&food.food_id!==existingId);
  if(duplicated)throw Error('동일한 요리명이 이미 등록되어 있습니다. 기존 레시피를 수정해 주세요.');
  const previous=editorState.entries.find(row=>row.food_id===selectedFoodId);
  const id=activeMode==='add'?`lac_new_${crypto.randomUUID().replace(/-/g,'')}`:selectedFoodId;
  if(activeMode==='edit'&&!catalogRef.foods.some(food=>food.food_id===id))throw Error('수정할 요리를 먼저 선택해 주세요.');
  return {entry:{food_id:id,food_name:name,set_qty:setCount,cook_time:time,ingredients,
     source_kind:activeMode==='add'?'new':previous?.source_kind||'override'},
    expectedVersion:previous?.version||null};
}
async function saveForm(event){
  event.preventDefault();
  if(!editorState.canEdit||!editorState.ready)return;
  const button=byId('cook-editor-save');
  try{
    const payload=parseForm();
    button.disabled=true;setStatus('저장하는 중입니다.');
    await request('save',payload);
    const result=await request('list');
    editorState.canEdit=Boolean(result.canEdit);
    applyEntries(result.entries);
    onSavedCallback();
    setStatus('레시피를 저장하고 계산에 반영했습니다.','success');
    byId('cook-recipe-editor').close();
  }catch(error){setStatus(error.message,'error');}
  finally{button.disabled=!editorState.canEdit;}
}
export async function initializeCookRecipeEditor({catalog,state,onSaved}){
  catalogRef=catalog;stateRef=state;onSavedCallback=onSaved;
  for(const row of catalog.foods)baseFoodSnapshot.set(row.food_id,{...row});
  baseRecipes=catalog.recipes.map(row=>({...row}));
  document.querySelectorAll('[data-recipe]').forEach(button=>button.addEventListener('click',()=>openEditor(button.dataset.recipe)));
  byId('cook-editor-close').addEventListener('click',()=>byId('cook-recipe-editor').close());
  byId('cook-editor-cancel').addEventListener('click',()=>byId('cook-recipe-editor').close());
  byId('cook-editor-add-material').addEventListener('click',()=>{
    if(byId('cook-editor-materials').children.length>=24){setStatus('재료는 최대 24종까지 등록할 수 있습니다.','error');return;}
    createIngredientRow().querySelector('input').focus();
  });
  byId('cook-editor-select').addEventListener('change',event=>{
    selectedFoodId=event.target.value;
    loadFormFromFood(catalogRef.foods.find(food=>food.food_id===selectedFoodId));
    setStatus('');
  });
  byId('cook-recipe-form').addEventListener('submit',saveForm);
  try{
    const result=await request('list');
    if(!Array.isArray(result.entries))throw Error('레시피 목록 형식이 올바르지 않습니다.');
    editorState.canEdit=Boolean(result.canEdit);
    editorState.ready=true;
    applyEntries(result.entries);
  }catch(error){
    editorState.error=error.message;
    editorState.ready=false;
    editorState.canEdit=false;
    // The immutable CSV catalogue remains readable if the new DB migration
    // has not yet been applied. Editing never silently writes a local substitute.
  }
}
