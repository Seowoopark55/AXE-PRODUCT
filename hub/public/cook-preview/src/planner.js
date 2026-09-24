/* LAC COOK Phase 2 - conservative, read-only calculation preview.
 * This does NOT assert cost or processed-material parity with AXE COOK.
 * Ambiguous/absent source data stays unresolved, not free or silently skipped.
 */
import {calculateDirect,positiveInt} from './engine.js';
const active = row => row?.is_active === 'TRUE';
const number = raw => {
  if (raw === '' || raw == null) return null;
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : null;
};
const safeQty = raw => {
  const n = number(raw);
  return n != null && Number.isSafeInteger(n) && n > 0 ? n : null;
};
const sortKo = (a,b)=>a.name.localeCompare(b.name,'ko');
// The uploaded AXE COOK snapshot uses an effective yield of one for dough
// because of its legacy label mismatch. Preserve the already-tested toast
// result ONLY while the source lists eight dough per run. For other processes,
// use the active LAC catalog yield; notably, its broth yields five per run.
// Actual in-game dough yield remains a data-verification item.
const AXE_DOUGH_COMPATIBILITY = {name:'빵 반죽', catalogYield:8, effectiveYield:1};
const add = (map, name, qty) => {
  if (!name || !Number.isSafeInteger(qty) || qty < 1 || !Number.isSafeInteger((map.get(name)||0)+qty)) return false;
  map.set(name,(map.get(name)||0)+qty);
  return true;
};

export function calculatePlan(catalog,orders,choices={}){
  // Selection is local to this preview. IDs must match an active option for that exact ingredient.
  const selectedOffers=choices.offers || {};
  const selectedFish=choices.fish || {};
  const direct = calculateDirect(catalog.foods,catalog.recipes,orders);
  const warnings = [...direct.warnings];
  const warn = text=>warnings.push(text);
  const aliasMap = new Map(), ambiguousAliases = new Set();
  for(const item of catalog.aliases || []){
    if(!active(item) || !item.alias_name || !item.standard_name) continue;
    const existing = aliasMap.get(item.alias_name);
    if(existing && existing !== item.standard_name) ambiguousAliases.add(item.alias_name);
    aliasMap.set(item.alias_name,item.standard_name);
  }
  // The active recipe says '고기양념', while its sole corresponding process
  // is recorded as '고기 양념'. Resolve only this verified spelling pair and
  // only when no distinct material or processing item uses the compact name.
  const compactSeasoning='고기양념', spacedSeasoning='고기 양념';
  const seasoningExists=(catalog.processes||[]).some(row=>active(row) && row.process_material_name===spacedSeasoning);
  const distinctCompact=(catalog.processes||[]).some(row=>active(row) && row.process_material_name===compactSeasoning)
    || (catalog.materials||[]).some(row=>active(row) && row.material_name===compactSeasoning)
    || (catalog.farms||[]).some(row=>active(row) && row.material_name===compactSeasoning);
  const seasoningAlias=seasoningExists && !distinctCompact ? new Map([[compactSeasoning,spacedSeasoning]]) : new Map();
  const normalize = name => {
    if(ambiguousAliases.has(name)){
      warn(`${name}: 별칭이 여러 표준명을 가리켜 확인 필요`);
      return name;
    }
    // Compound recipe strings may encode quantities and alternatives; never split or normalize their parts.
    return aliasMap.get(name) || seasoningAlias.get(name) || name;
  };
  const farmNames = new Set((catalog.farms||[]).filter(active).map(x=>x.material_name));
  const offers = new Map();
  for(const row of catalog.materials||[]){
    if(!active(row)) continue;
    const key=row.material_name;
    if(!offers.has(key)) offers.set(key,[]);
    offers.get(key).push(row);
  }
  const processGroups = new Map();
  for(const row of catalog.processes||[]){
    if(!active(row)) continue;
    const key=row.process_material_name;
    if(!processGroups.has(key)) processGroups.set(key,[]);
    processGroups.get(key).push(row);
  }
  const fishGroups = new Map();
  for(const row of catalog.fish||[]){
    if(!active(row)) continue;
    const key=row.result_material_name;
    if(!fishGroups.has(key))fishGroups.set(key,[]);
    fishGroups.get(key).push(row);
  }
  const known = new Map(), farms = new Map(), unresolved = new Map(), processCount = new Map();
  const processes = new Map(), fishNeeds = new Map();
  function pending(name,quantity,message){
    if(!add(unresolved,name,quantity))warn(`${name}: 미해결 재료 수량 초과 또는 잘못된 수량`);
    if(message)warn(message);
  }
  function expand(name, quantity, trail=[]){
    const key=normalize(name);
    if(!Number.isSafeInteger(quantity)||quantity<=0) return pending(key,quantity,`${key}: 재료 수량이 유효하지 않아 계산에서 제외`);
    if(trail.includes(key)) return pending(key,quantity,`${[...trail,key].join(' → ')}: 순환 가공식이므로 자동 전개 중단`);
    // Fish are selectable conversion alternatives, not automatically priced raw fish.
    if(fishGroups.has(key)){
      add(fishNeeds,key,quantity);
      return;
    }
    const group=processGroups.get(key);
    if(group){
      const triples=group.map(row=>[row.input_material_name,row.required_qty,row.result_qty].join('\u0001'));
      const outputs=[...new Set(group.map(row=>row.result_qty).filter(Boolean))];
      const sourceOutput = outputs.length===1 ? safeQty(outputs[0]) : null;
      const output = key===AXE_DOUGH_COMPATIBILITY.name && sourceOutput===AXE_DOUGH_COMPATIBILITY.catalogYield && !group.some(row=>row.lac_user_override==='TRUE')
        ? AXE_DOUGH_COMPATIBILITY.effectiveYield : sourceOutput;
      if(!outputs.length)return pending(key,quantity,`${key}: 1회 가공 생산량 미확정 · 관리자 가공 수정에서 확인 후 입력 필요`);
      const invalid = group.some(row=>!row.input_material_name||safeQty(row.required_qty)==null || (outputs.length===1 && !row.result_qty));
      if(invalid || output==null || outputs.length>1 || new Set(triples).size!==triples.length){
        return pending(key,quantity,`${key}: 가공식에 중복·투입 누락·생산 수량 불일치가 있어 자동 계산 보류`);
      }
      const batch=Math.ceil(quantity/output);
      if(!Number.isSafeInteger(batch)||batch<=0) return pending(key,quantity,`${key}: 가공 횟수 초과`);
      const prev=processCount.get(key);
      if(prev){
        // Avoid pretending that independent rounding across branches equals one batched craft.
        warn(`${key}: 복수 경로에서 가공 요구 발생 · 경로별 올림 계산이므로 합산 최적화 전 검토 필요`);
      }
      add(processCount,key,batch);
      const record=processes.get(key)||{name:key,need:0,batches:0,output,items:[]};
      record.need+=quantity;record.batches+=batch;
      for(const row of group){
        const amount=safeQty(row.required_qty)*batch;
        if(!Number.isSafeInteger(amount)||amount<=0) return pending(key,quantity,`${key}: 하위 재료 수량 초과`);
        record.items.push({name:row.input_material_name,quantity:amount});
        expand(row.input_material_name,amount,[...trail,key]);
      }
      processes.set(key,record);
      return;
    }
    if(farmNames.has(key)){if(!add(farms,key,quantity))pending(key,quantity,`${key}: 농장 수량 초과`);return;}
    if(offers.has(key)){if(!add(known,key,quantity))pending(key,quantity,`${key}: 구매 수량 초과`);return;}
    pending(key,quantity,`${key}: 등록된 구매·농장·가공 정보가 없어 비용 계산 제외`);
  }
  for(const line of direct.materials)expand(line.name,line.quantity);
  const purchases=[], purchaseOptions=[];
  let pricedSubtotal=0;
  for(const [name,quantity] of known){
    const rows=offers.get(name);
    const primary=rows.filter(row=>row.is_primary==='TRUE');
    const selectedId=Object.prototype.hasOwnProperty.call(selectedOffers,name)?selectedOffers[name]:null;
    const row=selectedId!=null
      ? rows.find(candidate=>candidate.material_id===selectedId)
      : rows.length===1?rows[0]:primary.length===1?primary[0]:null;
    if(rows.length>1){
      purchaseOptions.push({name,quantity,selectedId:row?.material_id||null,options:rows.map(candidate=>({
        id:candidate.material_id,source:candidate.source||'구매처 미설정',bundleQty:safeQty(candidate.bundle_qty),
        bundlePrice:number(candidate.bundle_price),primary:candidate.is_primary==='TRUE'
      }))});
    }
    if(!row){
      warn(`${name}: ${selectedId!=null?'유효하지 않은 구매처 선택':'구매처 미확정'} · 가격 후보 ${rows.length}개`);
      purchases.push({name,quantity,source:'구매처 미확정',bundles:null,buyQuantity:null,cost:null});
      continue;
    }
    const bundleQty=safeQty(row.bundle_qty), bundlePrice=number(row.bundle_price);
    if(bundleQty==null||bundlePrice==null){
      warn(`${name}: 묶음 수량 또는 묶음 가격 미설정 · 비용 미확정`);
      purchases.push({name,quantity,source:row.source||'구매처 미설정',bundles:null,buyQuantity:null,cost:null});
      continue;
    }
    const bundles=Math.ceil(quantity/bundleQty);
    const buyQuantity=bundles*bundleQty, cost=bundles*bundlePrice;
    if(!Number.isSafeInteger(buyQuantity)||!Number.isSafeInteger(cost)){
      warn(`${name}: 구매 수량 또는 가격이 너무 커서 비용 미확정`);
      purchases.push({name,quantity,source:row.source||'구매처 미설정',bundles:null,buyQuantity:null,cost:null});
      continue;
    }
    pricedSubtotal+=cost;
    purchases.push({name,quantity,source:row.source||'구매처 미설정',bundleQty,bundlePrice,bundles,buyQuantity,cost,offerId:row.material_id});
  }
  const fishSupply = new Map();
  const fishOptions=[...fishNeeds].map(([name,quantity])=>{
    const rows=fishGroups.get(name)||[];
    const selectedId=Object.prototype.hasOwnProperty.call(selectedFish,name)?selectedFish[name]:null;
    const selected=selectedId==null?null:rows.find(row=>row.fish_id===selectedId);
    const options=rows.map(row=>{
      const input=safeQty(row.input_qty), output=safeQty(row.result_qty);
      const batches=output!=null?Math.ceil(quantity/output):null;
      const rawRequired=input!=null&&batches!=null&&Number.isSafeInteger(input*batches)?input*batches:null;
      return {id:row.fish_id,fishName:row.fish_name,rawRequired,processTime:row.process_time};
    });
    const selection=selected?.fish_id ? options.find(row=>row.id===selected.fish_id) : null;
    if(!selection||selection.rawRequired==null){
      pending(name,quantity,`${name}: ${selectedId==null?'변환 생선 미선택': '선택한 생선/변환 수량이 유효하지 않음'} · 원재료 미확정`);
    }else {
      add(fishSupply,selection.fishName,selection.rawRequired);
      warn(`${name}: ${selection.fishName} ${selection.rawRequired}개 직접 수급 필요 · 생선 원가/구매처는 미확정`);
    }
    return {name,quantity,selectedId:selection?.id||null,options};
  });
  const unpriced=purchases.filter(row=>row.cost==null).length;
  return {
    direct,processes:[...processes.values()].sort(sortKo),
    farms:[...farms].map(([name,quantity])=>({name,quantity})).sort(sortKo),
    purchases:purchases.sort(sortKo),unresolved:[...unresolved].map(([name,quantity])=>({name,quantity})).sort(sortKo),
    fishOptions,fishSupply:[...fishSupply].map(([name,quantity])=>({name,quantity})).sort(sortKo),
    purchaseOptions,warnings:[...new Set(warnings)],pricedSubtotal,
    complete:unresolved.size===0&&unpriced===0&&warnings.length===0&&fishSupply.size===0,
    costNote:'입력된 묶음 가격만으로 산출한 참고 소계 · 미확정/농장/생선/가공 데이터 및 실제 구매 선택에 따라 최종 비용 달라짐'
  };
}
