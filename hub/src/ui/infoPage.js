// LAC HUB shared information catalogue — read-only presentation.
// UI categories never modify source records, craft IDs, or linked ingredients.
const CONFIG = Object.freeze({
  info_crafts: ['제작법','item_name',[['category','분류'],['success_rate','성공률'],['craft_rank','제작 등급'],['obtain_place','획득 장소'],['note','비고']]],
  info_craft_materials: ['제작 재료','material_name',[['craft_id','제작법 ID'],['quantity','필요 수량']]],
  info_material_recipes: ['무기부품','item_name',Array.from({length:8},(_,i)=>[`input${i+1}`,`재료 ${i+1}`]).concat([['note','비고']])],
  info_processes: ['가공·재련','item_name',[['job','직업'],['process_type','가공 종류'],['output_qty','생산 수량'],['quest_qty','퀘스트 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_quests: ['퀘스트','item_name',[['job','직업'],['required_qty','필요 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_skill_ranks: ['스킬','skill',[['rank','등급'],['required_point','필요 포인트'],['point_type','포인트 종류'],['note','비고']]],
  modbook_catalog: ['개조서','name',[['type','접두·접미'],['category','적용 분야'],['parts','필요 부품'],['option1','옵션 1'],['option2','옵션 2'],['option3','옵션 3'],['success_rate','성공률'],['recent_price','최근 거래가격'],['recent_date','최근 거래일'],['price_note','가격 비고'],['note','비고']]],
});
const TOP_TABS=[['info_crafts','제작법'],['info_processes','가공·재련'],['info_quests','퀘스트'],['info_skill_ranks','스킬'],['modbook_catalog','개조서']];
// Stage 10: lightweight, consistent line symbols for the five top-level categories.
// These are presentation-only; no data or navigation semantics change.
const INFO_TAB_ICONS=Object.freeze({
 info_crafts:'<path d="m14 6 4 4M11 9l7-7 4 4-7 7M2 22l9-9M3 18l3 3"/>',
 info_processes:'<path d="M3 21V9l6 4V9l6 4V5h6v16H3Z"/><path d="M7 17h2m3 0h2m3 0h2"/>',
 info_quests:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6m-6 4h3"/>',
 info_skill_ranks:'<circle cx="12" cy="8" r="5"/><path d="m8.5 12-2 9 5.5-3 5.5 3-2-9"/>',
 modbook_catalog:'<path d="M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V20c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5V5.5Z"/><path d="M12 6v14.5"/>',
});
const infoTabIcon=table=>`<svg class="axe-info-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${INFO_TAB_ICONS[table]||''}</svg>`;
const ALL='__all__', UNSET='__unset__';
const escapeText=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
// Read-only image mapping from the verified game-info export and approved PNG ZIP.
// Only known names are mapped. Do not infer a PNG from item names, IDs or category.
const ITEM_IMAGE_FILES=Object.freeze({
  ".44 매그넘 탄약": "ammo_44_magnum.png",
  ".45 ACP 탄약": "ammo_45_acp.png",
  ".50 AE 탄약": "ammo_50_ae.png",
  "9mm 탄약": "ammo_9mm.png",
  "SMG": "smg.png",
  "SNS 피스톨": "sns_pistol.png",
  "견습생의 도구": "apprentice_tool.png",
  "견승생의 도구": "apprentice_tool.png",
  "고급 삼나무": "premium_cedar.png",
  "고철": "scrap_metal.png",
  "금 주괴": "gold_ingot.png",
  "금광석": "gold_ore.png",
  "금주괴": "gold_ingot.png",
  "기본 감정 키트(1)": "basic_appraisal_kit.png",
  "기본 감정 키트(2)": "basic_appraisal_kit.png",
  "나이프": "knife.png",
  "낡은 락픽": "old_lockpick.png",
  "녹슨 탄피": "rusted_casing.png",
  "달인의 도구": "master_tool.png",
  "동광석": "copper_ore.png",
  "동주괴": "copper_ingot.png",
  "마이크로 SMG": "micro_smg.png",
  "목탄": "charcoal.png",
  "무난한 무기부품": "standard_weapon_parts.png",
  "미니 SMG": "mini_smg.png",
  "배송 전표": "shipping_label.png",
  "버려진 병뚜껑": "discarded_bottle_cap.png",
  "볼품없는 락픽": "crude_lockpick.png",
  "상급 목재": "premium_wood.png",
  "상급목재": "premium_wood.png",
  "석탄": "coal.png",
  "세라믹 피스톨": "ceramic_pistol.png",
  "소형 탄피": "small_casing.png",
  "소형 탄피(20)": "small_casing.png",
  "숙련가의 도구": "expert_tool.png",
  "오래된 나사": "old_screw.png",
  "유황": "sulfur.png",
  "은광석": "silver_ore.png",
  "은주괴": "silver_ingot.png",
  "의료용 붕대": "medical_bandage.png",
  "이단 산타의 리볼버": "heretic_santa_revolver.png",
  "일반 삼나무": "common_cedar.png",
  "저급 삼나무": "low_grade_cedar.png",
  "전문가의 도구": "professional_tool.png",
  "조악한 무기부품": "crude_weapon_parts.png",
  "종이": "paper.png",
  "중급 목재": "medium_grade_wood.png",
  "중급목재": "medium_grade_wood.png",
  "찢어진 천조각": "torn_cloth.png",
  "철광석": "iron_ore.png",
  "철주괴": "iron_ingot.png",
  "초심자의 도구": "beginner_tool.png",
  "최상급 목재": "top_grade_wood.png",
  "최상급 삼나무": "top_grade_cedar.png",
  "최상급목재": "top_grade_wood.png",
  "캠프 파이어 키트(1)": "quick_campfire_kit.png",
  "캠프 파이어 키트(2)": "quick_campfire_kit.png",
  "캠프 파이어 키트(3)": "quick_campfire_kit.png",
  "컴뱃 PDW": "combat_pdw.png",
  "컴뱃 피스톨": "combat_pistol.png",
  "폭죽 시리즈 I": "firework_series_1.png",
  "플로우 생수": "flow_water.png",
  "피스톨": "pistol.png",
  "피스톨.50": "pistol_50.png",
  "하급목재": "low_grade_wood.png",
  "헤비 리볼버": "heavy_revolver.png",
  "헤비 피스톨": "heavy_pistol.png",
  "화약": "gunpowder.png",
  "셰프의 야생 블루베리": "quest_wild_blueberry.png",
  "야생 블루베리": "quest_wild_blueberry.png",
  "삼나무 베리": "quest_cedar_berry.png",
  "암염": "quest_rock_salt.png",
  "산딸기": "quest_raspberry.png",
  "홀리리프 체리": "quest_hollyleaf_cherry.png",
  "솔리리프 베리": "quest_hollyleaf_cherry.png",
  "삼나무 솔방울": "quest_cedar_cone.png",
  "평범한 잎사귀": "quest_plain_leaf.png",
  "네잎클로버": "quest_four_leaf_clover.png",
  "느타리 버섯": "quest_oyster_mushroom.png",
  "광대 버섯": "quest_fly_agaric.png",
  "큰갓 버섯": "quest_big_cap_mushroom.png",
  "식물줄기": "quest_plant_stem.png",
  "그물버섯": "quest_net_mushroom.png",
  "모빌버섯": "quest_mobil_mushroom.png",
  "달빛잎사귀": "quest_moonlight_leaf.png",
  "반짝이는 보석": "quest_shining_gem.png",
});
// Quest titles can be task labels rather than item names. Resolve only confirmed
// deliveries and obvious A/B variants of an existing, exactly named ore item.
// Never infer artwork from job/rank alone or assign an unrelated item image.
const QUEST_ITEM_ALIASES=Object.freeze({
 '벌목|저급A':'저급 삼나무',
 '벌목|저급B':'저급 삼나무',
 '벌목|일반A':'일반 삼나무',
 '벌목|일반B':'일반 삼나무',
 '벌목|고급':'고급 삼나무',
 '벌목|최고급':'최상급 삼나무',
 '채광|석탄A':'석탄',
 '채광|석탄B':'석탄',
 '채광|철광석A':'철광석',
 '채광|철광석B':'철광석',
});
const QUEST_JOB_FALLBACK_FILES=Object.freeze({
 '벌목':'quest_logging_bundle.png',
 '채광':'quest_mining_sack.png',
 '배송':'quest_delivery_box.png',
 '택배':'quest_delivery_box.png',
 '낚시':'quest_fishing_crate.png',
 '요리':'quest_cooking_meal.png',
 '셰프':'quest_cooking_meal.png',
 '채집':'quest_herb_basket.png',
 '할머니':'quest_tactical_clipboard.png',
 '감정':'quest_tactical_clipboard.png',
 '미션':'quest_tactical_clipboard.png',
 '기타':'quest_tactical_clipboard.png',
 '범용':'quest_tactical_clipboard.png',
});
const QUEST_NAME_FALLBACK_FILES=Object.freeze({
 '셰프의 야생 블루베리':'quest_wild_blueberry.png',
 '야생 블루베리':'quest_wild_blueberry.png',
 '삼나무 베리':'quest_cedar_berry.png',
 '산딸기':'quest_raspberry.png',
 '홀리리프 체리':'quest_hollyleaf_cherry.png',
 '솔리리프 베리':'quest_hollyleaf_cherry.png',
 '암염':'quest_rock_salt.png',
 '삼나무 솔방울':'quest_cedar_cone.png',
 '평범한 잎사귀':'quest_plain_leaf.png',
 '네잎클로버':'quest_four_leaf_clover.png',
 '느타리 버섯':'quest_oyster_mushroom.png',
 '광대 버섯':'quest_fly_agaric.png',
 '큰갓 버섯':'quest_big_cap_mushroom.png',
 '식물줄기':'quest_plant_stem.png',
 '그물버섯':'quest_net_mushroom.png',
 '모빌버섯':'quest_mobil_mushroom.png',
 '달빛잎사귀':'quest_moonlight_leaf.png',
 '반짝이는 보석':'quest_shining_gem.png',
});
const questTargetName=row=>{
 const name=String(row?.item_name??'').trim();
 const job=String(row?.job??'').trim();
 return QUEST_ITEM_ALIASES[`${job}|${name}`]||name;
};
const questKeywordFallbackFile=name=>{
 const clean=String(name??'').trim();
 if(!clean)return '';
 if(QUEST_NAME_FALLBACK_FILES[clean])return QUEST_NAME_FALLBACK_FILES[clean];
 if(/(베리|허브|약초|꽃|버섯)/.test(clean))return 'quest_herb_basket.png';
 if(/(광석|원석|암염|석탄|주괴|광물)/.test(clean))return 'quest_mining_sack.png';
 if(/(장작|통나무|목재|삼나무)/.test(clean))return 'quest_logging_bundle.png';
 if(/(도시락|요리|음식|식사)/.test(clean))return 'quest_cooking_meal.png';
 if(/(생선|어획|낚시)/.test(clean))return 'quest_fishing_crate.png';
 if(/(상자|배송|택배)/.test(clean))return 'quest_delivery_box.png';
 return '';
};
const questFallbackImageUrl=row=>{
 const job=String(row?.job??'').trim();
 const target=questTargetName(row);
 const file=questKeywordFallbackFile(target)||QUEST_JOB_FALLBACK_FILES[job]||QUEST_JOB_FALLBACK_FILES[String(row?.category??'').trim()]||'';
 return file?`/hub/game-info/items/${file}`:'';
};
const questItemArt=row=>itemImageUrl(questTargetName(row))||questFallbackImageUrl(row);
// Only source-listed A/B job+name pairs may be grouped; each original DB row
// remains distinct and keeps its original quantity, reward, rank and ID.
const QUEST_PAIR_NAMES=Object.freeze({벌목:['저급','일반'],채광:['석탄','철광석']});
const questPairInfo=row=>{
 const job=String(row?.job??'').trim();
 const name=String(row?.item_name??'').trim();
 const found=name.match(/^(.+?)([AB])$/);
 if(!found||!QUEST_PAIR_NAMES[job]?.includes(found[1]))return null;
 return {key:`${job}|${found[1]}`,variant:found[2],base:found[1]};
};
const questGroupedRows=rows=>{
 const groups=new Map();
 for(const row of rows){
  const pair=questPairInfo(row);
  if(pair){const entries=groups.get(pair.key)||[];entries.push(row);groups.set(pair.key,entries);}
 }
 const seen=new Set();
 return rows.flatMap(row=>{
  const pair=questPairInfo(row);
  if(!pair||groups.get(pair.key).length<2)return [{row,variants:[row]}];
  if(seen.has(pair.key))return [];
  seen.add(pair.key);
  return [{row,variants:groups.get(pair.key).slice().sort((a,b)=>questPairInfo(a).variant.localeCompare(questPairInfo(b).variant))}];
 });
};
const questGroupedTitle=(row,variants)=>variants.length>1?(
 questItemArt(row)?questTargetName(row):questPairInfo(row)?.base||String(row.item_name||'이름 없음')
):String(row.item_name||'이름 없음');
const questQtyText=value=>value===null||value===undefined||String(value).trim()===''?'미등록':
 /^\d+(?:\.\d+)?$/.test(String(value).trim())?Number(value).toLocaleString('ko-KR'):escapeText(value);
const itemImageUrl=name=>{
  const file=ITEM_IMAGE_FILES[String(name??'').trim()];
  return file?`/hub/game-info/items/${file}`:'';
};
// These labels/quantities have already been HTML-escaped by renderFields.
// Keep the original text for unmapped items, instead of showing an unrelated image.
const itemMaterialBadge=(rawName,rawQty='',fallbackText='')=>{
  const name=String(rawName??'').trim();
  const qty=String(rawQty??'').trim();
  const image=itemImageUrl(name);
  // A neutral icon is a visual fallback; never substitute a different item art.
  const artwork=image?`<img src="${image}" alt="" loading="lazy" decoding="async">`:'<span class="game-detail-material__placeholder" aria-hidden="true">◇</span>';
  return `<span class="game-detail-material${image?' game-detail-material--art':' game-detail-material--missing'}">${artwork}<span class="game-detail-material__name">${fallbackText||name}</span>${qty?`<b class="game-detail-material__qty">× ${qty}</b>`:''}</span>`;
};
const itemMaterialFromPart=part=>{
  const at=part.lastIndexOf(' × ');
  if(at<0)return itemMaterialBadge(part,'',part);
  return itemMaterialBadge(part.slice(0,at),part.slice(at+3));
};

const fieldValue=(row,key)=>row[key]===null||row[key]===undefined||row[key]===''?'—':String(row[key]);
const filterName=value=>value===null||value===undefined||String(value).trim()===''?UNSET:String(value).trim();
const showFilterName=value=>value===UNSET?'미지정':value;
const visibleRows=(data,table,info,owner)=>(data[table]||[]).filter(row=>(owner&&info.showInactive)||(table==='modbook_catalog'?row.active!==false:row.is_active!==false));
const distinct=values=>[...new Set(values)].sort((a,b)=>a.localeCompare(b,'ko'));
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
// Presentation aliases only: preserve source row.skill and row.id for lookups.
const skillDisplayName=skill=>{
 const name=String(skill??'').trim();
 return name==='제련'||name==='재련'?'재련':name;
};
const skillIconKey=skill=>{
 const name=skillDisplayName(skill).replace(/\s+/g,'');
 return name==='목재가공'?'목재 가공':name==='차량정비'?'차량 정비':name;
};
const skillGroup=skill=>Object.entries(SKILL_GROUPS).find(([,names])=>names.some(name=>skillIconKey(name)===skillIconKey(skill)))?.[0]||'기타';

// Read-only, explicit per-skill image mapping. The seven existing lifestyle icons
// retain their original files; source screenshots are cropped into isolated icons.
const SKILL_ICON_FILES=Object.freeze({
 '낚시':'fishing.png','벌목':'logging.png','보물찾기':'treasure.png',
 '요리':'cooking.png','채광':'mining.png','채집':'gathering.png','택배':'delivery.png',
 '목재 가공':'addons/woodworking.png','재련':'addons/refining.png',
 '돌진':'addons/charge.png','전력질주':'addons/sprinting.png',
 '체력':'addons/strength.png','컴뱃롤':'addons/combat-roll.png',
 '피스톨마스터리':'addons/pistol-mastery.png','SMG마스터리':'addons/smg-mastery.png',
 '감정':'addons/appraisal.png','운전':'addons/driving.png','절도':'addons/theft.png',
 '제작':'addons/crafting.png','차량 정비':'addons/vehicle-repair.png',
 '전문가치료(EMS)':'addons/ems.png','몸수색(경찰)':'addons/police-search.png',
 '악기연주':'addons/music-performance.png','작곡':'addons/composing.png'
});
const SKILL_LIFE_ORDER=Object.freeze(['낚시','벌목','보물찾기','요리','채광','채집','택배']);
const SKILL_SCENE_FILES=Object.freeze({
 '낚시':'fishing.webp', '벌목':'logging.webp', '보물찾기':'treasure.webp',
 '요리':'cooking.webp', '채광':'mining.webp', '채집':'gathering.webp', '택배':'delivery.webp'
});

const skillIconUrl=skill=>SKILL_ICON_FILES[skillIconKey(skill)]?`/hub/game-info/skills/${SKILL_ICON_FILES[skillIconKey(skill)]}`:'';
const skillIconMarkup=(skill,large=false)=>{
 const url=skillIconUrl(skill);
 return url?`<span class="game-skill-art${large?' game-skill-art--large':''}" aria-hidden="true"><img src="${url}" alt="" loading="lazy" decoding="async"></span>`:
  `<span class="game-skill-art${large?' game-skill-art--large':''} game-skill-art--fallback" aria-hidden="true">${infoTabIcon('info_skill_ranks')}</span>`;
};
// Rank order uses the transition's source tier, never its required_point.
// Unknown source labels remain visible after the known progression.
const SKILL_RANK_ORDER=['연습','F','E','D','C','B','A','9'];
const skillRankSortValue=rank=>{
 const raw=String(rank??'').trim().toUpperCase().replace(/\s+/g,'');
 const from=raw.split(/→|->|⇒|➡|~|-/)[0];
 const index=SKILL_RANK_ORDER.findIndex(tier=>tier.toUpperCase()===from);
 return index<0?99:index;
};
const skillDetailPanel=(skill,rows)=>{
 const image=skillIconMarkup(skill,true);
 // Only bundled, approved lifestyle art is eligible. Never construct a path from a DB label.
 const scene=SKILL_SCENE_FILES[String(skill)]||'';
 const sceneImg=scene?`<div class="game-skill-detail__scene" aria-hidden="true"><img src="/hub/game-info/skills/scenes/${scene}" alt="" decoding="async" loading="lazy"></div>`:'';

 const ordered=[...rows].sort((a,b)=>skillRankSortValue(a.rank)-skillRankSortValue(b.rank)||String(a.rank??'').localeCompare(String(b.rank??''),'ko'));
 const parseSkillRank=rankValue=>{
  const raw=String(rankValue??'').trim();
  const parts=raw.split(/→|->|⇒|➡|~|-/).map(part=>part.trim()).filter(Boolean);
  if(parts.length>=2)return {from:parts[0],to:parts[1]};
  return {from:raw||'등급 미등록',to:''};
 };
 const rankRows=ordered.map(row=>{
  const rank=String(row.rank??'').trim();
  const {from,to}=parseSkillRank(rank);
  const required=row.required_point===null||row.required_point===undefined||String(row.required_point).trim()===''?'미등록':String(row.required_point);
  const pointType=String(row.point_type??'').trim()||'sp';
  const rawNote=String(row.note??'').trim();
  // For the refining skill only, hide the imported CSV naming annotation.
  // All other notes and the actual rank-point data are left untouched.
  const note=skillDisplayName(skill)==='재련'
   ?rawNote.split(/\r?\n/).filter(line=>!/^[\s]*CSV\s*표기\s*[:：]\s*(?:제련|재련)\s*[.!]?\s*$/.test(line)).join('\n').trim()
   :rawNote;
  const needsManual=/수련서/.test(note);
  const noteContent=note?`<p class="game-skill-rank__note">${needsManual?'<span class="game-skill-training-icon" aria-hidden="true"><img src="/hub/game-info/skills/training_manual.png" alt="" loading="lazy" decoding="async"></span>':''}<span>${escapeText(note)}</span></p>`:'';
  const flow=`<div class="game-skill-rank__tier"><span class="game-skill-rank__from">${escapeText(from)}</span>${to?`<span class="game-skill-rank__arrow" aria-hidden="true">→</span><span class="game-skill-rank__to">${escapeText(to)}</span>`:''}<span class="game-skill-rank__fill" aria-hidden="true"></span></div>`;
  return `<div class="game-skill-rank${note?' game-skill-rank--has-note':''}" aria-label="${escapeText(rank||'등급 미등록')} 승급 조건">${flow}<div class="game-skill-rank__cost"><b>${escapeText(required)}</b>${pointType?`<span>${escapeText(pointType)}</span>`:''}</div>${noteContent}</div>`;
 }).join('');
 return `<section class="axe-info-detail game-skill-detail game-skill-detail--atlas${scene?' game-skill-detail--illustrated':''}" aria-label="${escapeText(skill)} 스킬 승급 정보">${sceneImg}<div class="game-skill-detail__information"><header class="game-skill-detail__header"><div class="game-skill-detail__eyebrow"><span>LAC HUB</span><span>SKILL INFORMATION</span></div><div class="game-skill-detail__hero">${image}<div class="game-skill-detail__name"><h2>${escapeText(skillDisplayName(skill))}</h2><p>등급별 승급 조건</p></div></div></header><div class="game-skill-detail__body"><div class="game-skill-detail__sheet"><div class="game-skill-detail__columns"><span>승급 구간</span><span>필요 포인트</span></div><div class="game-skill-detail__ranks">${rankRows||'<p class="axe-info-empty">등록된 승급 정보가 없습니다.</p>'}</div></div></div></div></section>`;
};

const MODBOOK_GROUPS=Object.freeze({
 '무기':['SMG','피스톨','라이플','저격소총','머신건','근접무기'],
 '생활':['벌목','채광','채집','낚시','요리','제련','제작','감정','절도'],
 '전투':['체력','이동속도'],
});
const splitModbookLabels=value=>String(value||'').split(/[,，、]/u).map(label=>label.trim()).filter(Boolean);
const MODBOOK_KNOWN_CATEGORIES=new Set(Object.values(MODBOOK_GROUPS).flat());
// These two option-keywords are supported by verified legacy screenshots:
// 돌판의 (채집 effects) and 냄비의 (요리 effects). Do not guess categories from
// arbitrary materials/effects, or use the item's name as a category hint.
// If a new legacy record cannot be classified safely, keep it in 분류 미확인.
const MODBOOK_VERIFIED_OPTION_HINTS=Object.freeze(['채집','요리']);
const modbookClassification=row=>{
 const stored=splitModbookLabels(row?.category);
 const recognized=stored.filter(label=>MODBOOK_KNOWN_CATEGORIES.has(label));
 if(recognized.length)return {categories:[...new Set(recognized)],source:'category'};
 if(stored.length===0||(stored.length===1&&stored[0]===row?.type)){
  const partLabels=splitModbookLabels(row?.parts);
  if(partLabels.length&&partLabels.every(label=>MODBOOK_KNOWN_CATEGORIES.has(label)))
   return {categories:[...new Set(partLabels)],source:'parts'};
  const effects=[row?.option1,row?.option2,row?.option3].filter(Boolean).join(' ');
  const explicit=MODBOOK_VERIFIED_OPTION_HINTS.filter(label=>effects.includes(label));
  if(explicit.length)return {categories:explicit,source:'options'};
 }
 return {categories:stored,source:'unclassified'};
};
const modbookCategories=row=>{
 return modbookClassification(row).categories;
};
const modbookGroups=row=>{
 const values=modbookCategories(row);
 const groups=Object.entries(MODBOOK_GROUPS).filter(([,types])=>values.some(value=>types.includes(value))).map(([group])=>group);
 return groups.length?groups:['분류 확인 필요'];
};
const productionGroup=row=>row.job==='벌목'?'목재':row.job==='채광'?'재련':'기타';
const craftGroup=craft=>{
 const category=String(craft?.category||'').toUpperCase();
 if(category==='KNIFE')return '근접무기';
 if(['PISTOL','REVOLVER','SMG'].includes(category))return '총기류';
 // Weapon parts are crafting materials, not weapons; the linked composition recipe
 // is only a second source of material details, not a second item or category.
 if(category==='ETC'&&['조악한 무기부품','무난한 무기부품'].includes(String(craft.item_name)))return '부품·원재료';
 if(category==='ETC'&&ETC_GROUPS[String(craft.item_name)]==='부품·원재료')return '부품·원재료';
 return '기타 제작품';
};
const craftSubtype=craft=>{
 const category=String(craft?.category||'').toUpperCase();
 if(category==='KNIFE')return '나이프';
 if(['PISTOL','REVOLVER','SMG'].includes(category))return ({PISTOL:'피스톨',REVOLVER:'리볼버',SMG:'SMG'})[category];
 return ETC_GROUPS[String(craft?.item_name)]||'기타';
};
// Display alias only: the DB craft name and output count remain unchanged.
const craftDisplayName=name=>String(name??'')==='소형 탄피(20)'?'소형 탄피':String(name??'');
const itemName=(table,row,data)=>{
 if(table==='info_craft_materials'){
  const parent=(data.info_crafts||[]).find(c=>String(c.id)===String(row.craft_id));
  return parent?String(parent.item_name):String(row.material_name||'이름 없음');
 }
 if(table==='info_skill_ranks')return [skillDisplayName(row.skill),row.rank].filter(Boolean).join(' · ')||'이름 없음';
 return table==='info_crafts'?craftDisplayName(row.item_name||'이름 없음'):String(row[CONFIG[table][1]]||'이름 없음');
};
const renderFields=fields=>fields.filter(([,value])=>value!=='—').map(([label,value])=>`<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join('');
// Standalone catalogue detail is a presentation of existing records only.
// Embedded company information keeps its original renderFields output.
const presentSuccessRate=value=>{
 const clean=String(value??'').trim();
 // Source success_rate uses percent points (e.g. 40 means 40%). Never
 // double-append a suffix, scale fractions, or invent values for free text.
 return /^\d+(?:\.\d+)?$/.test(clean)?`${clean}%`:clean;
};
// Process and quest are INDEPENDENT gameplay activities. This standalone,
// read-only view never implies that processing itself grants quest rewards.
// Do not convert a blank quantity into x1 or infer a quest from reward fields.
const processDetailBody=record=>{
 const hasValue=value=>value!==null&&value!==undefined&&String(value).trim()!=='';
 const hasQuest=hasValue(record.quest_qty)&&String(record.quest_qty).trim()!=='0';
 const item=String(record.item_name??'').trim();
 const image=itemImageUrl(item);
 const art=image?`<img src="${image}" alt="" loading="lazy" decoding="async">`:'<span class="game-process-image-fallback" aria-hidden="true">◇</span>';
 const count=value=>/^\d+(?:\.\d+)?$/.test(String(value??'').trim())?Number(value).toLocaleString('ko-KR'):escapeText(value);
 const output=hasValue(record.output_qty)?`<strong class="game-process-result__qty">× ${count(record.output_qty)}</strong>`:'<small class="game-process-input__unknown">수량 미등록</small>';
 const inputs=Array.from({length:4},(_,i)=>({name:record[`input${i+1}`],qty:record[`input${i+1}_qty`]})).filter(input=>hasValue(input.name));
 const cards=inputs.length?inputs.map(input=>{
  const name=String(input.name).trim(),src=itemImageUrl(name);
  const itemArt=src?`<img src="${src}" alt="" loading="lazy" decoding="async">`:'<span class="game-process-image-fallback" aria-hidden="true">◇</span>';
  const qty=hasValue(input.qty)?`<strong class="game-process-input__qty">× ${count(input.qty)}</strong>`:'<small class="game-process-input__unknown">수량 미등록</small>';
  return `<div class="game-process-input__card">${itemArt}<span class="game-process-input__name">${escapeText(name)}</span>${qty}</div>`;
 }).join(''):'<p class="game-process-empty">등록된 투입 재료가 없습니다.</p>';
 const extra=[['등급',record.rank],['비고',record.note]].filter(([,value])=>hasValue(value));
 const kind=String(record.process_type??'').trim();
 if(kind&&!['가공','재련','제련'].includes(kind))extra.unshift(['작업 유형',kind]);
 const foot=extra.length?`<div class="game-process-footnote">${extra.map(([label,value])=>`<span><b>${escapeText(label)}</b> ${escapeText(value)}</span>`).join('')}</div>`:'';
 const production=`<section class="game-process-section game-process-section--production" aria-label="생산 정보"><header class="game-process-section__heading"><span class="game-process-section__icon" aria-hidden="true">⌁</span><div><h3>생산</h3><p>재료를 가공하여 아이템 획득</p></div></header><div class="game-process-flow"><span class="game-process-flow__label">필요 재료</span><div class="game-process-flow__materials">${cards}</div><div class="game-process-flow__arrow" aria-hidden="true">↓</div><span class="game-process-flow__label">생산 결과</span><div class="game-process-result__card">${art}<span class="game-process-result__name">${escapeText(item||'이름 미등록')}</span>${output}</div></div>${foot}</section>`;
 const rewards=[['보상 금액',record.reward_money,'coins'],['보상 경험치',record.reward_xp,'xp']].filter(([,value])=>hasValue(value));
 // Source row stores quest_qty and reward data together. With no quest quantity,
 // a reward is shown only as unverified metadata, NOT as a quest completion reward.
 const handin=hasQuest?`<div class="game-process-quest__section"><span class="game-process-flow__label">별도 납품 필요 수량</span><div class="game-process-quest__line">${art}<span class="game-process-quest__name">${escapeText(item||'이름 미등록')}</span><strong class="game-process-quest__qty">× ${count(record.quest_qty)}</strong></div></div>`:'';
 const reward=rewards.length?`<div class="game-process-quest__section game-process-quest__section--reward"><span class="game-process-flow__label">${hasQuest?'퀘스트 완료 보상':'보상 정보'}</span><div class="game-process-rewards__grid">${rewards.map(([label,value,type])=>`<div class="game-process-reward game-process-reward--${type}"><span>${escapeText(label)}</span><strong>${count(value)}</strong></div>`).join('')}</div>${!hasQuest?'<p class="game-process-rewards__note">지급 조건이 등록되지 않았습니다.</p>':''}</div>`:'';
 const quest=hasQuest||rewards.length?`<section class="game-process-section game-process-section--quest" aria-label="${hasQuest?'별도 퀘스트 정보':'보상 정보'}"><header class="game-process-section__heading"><span class="game-process-section__icon" aria-hidden="true">✧</span><div><h3>${hasQuest?'퀘스트':'보상 정보'}</h3><p>${hasQuest?'생산과 별도로 납품하여 보상 획득':'지급 조건 확인 필요'}</p></div></header>${handin}${reward}</section>`:'';
 return `<div class="game-detail-body game-detail-body--process"><div class="game-process-split${quest?'':' game-process-split--production-only'}">${production}${quest}</div></div>`;
};
// A/B entries share one catalogue card but remain DISTINCT source quests.
// Never merge their quantities or rewards. The hero already identifies the item,
// so do not repeat a large target panel and waste the detail viewport.
const questDetailBody=(record,variants=[record])=>{
 const grouped=variants.length>1;
 const target=questTargetName(record);
 const art=questItemArt(record);
 const itemArt=art?`<img src="${escapeText(art)}" alt="" loading="lazy" decoding="async">`:`<span class="game-quest-entry__fallback" aria-hidden="true">${infoTabIcon('info_quests')}</span>`;
 const options=variants.map(variant=>{
  const pair=questPairInfo(variant);
  const title=grouped?`${pair?.variant||String(variant.item_name||'').trim()} 퀘스트`:'퀘스트 정보';
  const qty=questQtyText(variant.required_qty);
  const rank=String(variant.rank??'').trim();
  const reward=(label,value,tone)=>value===null||value===undefined||String(value).trim()===''?'':
   `<div class="game-quest-reward game-quest-reward--${tone}"><span>${label}</span><strong>${questQtyText(value)}</strong></div>`;
  const money=reward('보상 금액',variant.reward_money,'money');
  const xp=reward('보상 경험치',variant.reward_xp,'xp');
  const note=String(variant.note??'').trim();
  return `<section class="game-quest-option" aria-label="${escapeText(title)}">
   <header class="game-quest-option__head"><strong>${escapeText(title)}</strong>${rank?`<span>등급 ${escapeText(rank)}</span>`:''}</header>
   <div class="game-quest-option__facts">
    <div class="game-quest-delivery" aria-label="납품 정보"><span class="game-quest-delivery__art">${itemArt}</span><div class="game-quest-delivery__copy"><span>납품 아이템</span><strong>${escapeText(target||String(variant.item_name||'이름 미등록'))}</strong></div><div class="game-quest-delivery__quantity"><span>필요 수량</span><strong>${qty==='미등록'?qty:`× ${qty}`}</strong></div></div>
    <div class="game-quest-option__reward-block"><span class="game-quest-option__reward-label">완료 보상</span>${money||xp?`<div class="game-quest-rewards" aria-label="완료 보상">${money}${xp}</div>`:'<p class="game-quest-missing">보상 정보 미등록</p>'}</div>
   </div>${note?`<p class="game-quest-note"><b>비고</b> ${escapeText(note)}</p>`:''}</section>`;
 }).join('');
 return `<div class="game-detail-body game-detail-body--quest"><div class="game-quest-body-heading"><strong>납품 조건 · 완료 보상</strong>${grouped?'<span>A와 B는 각각 별도의 퀘스트</span>':''}</div><div class="game-quest-options${grouped?' game-quest-options--grouped':''}">${options}</div></div>`;
};
const standaloneDetailSections=(htmlFields,table,record,questVariants=[record])=>{
 const fieldRe=/<div(?: class="axe-info-detail__section")?><dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g;
 const fields=Array.from(htmlFields.matchAll(fieldRe),([,label,value],index)=>({
  label,value,index,plain:label.replace(/<[^>]+>/g,'')
 }));
 const keyLabels={
  info_crafts:['성공률','제작 등급','획득 장소'],
  info_material_recipes:['제작 등급','성공률','획득 장소'],
  info_processes:[], // Output and quest rewards have separate, correctly labeled stages below.
  info_quests:['보상 금액','보상 경험치','등급'],
  info_skill_ranks:['등급','필요 포인트','포인트 종류'],
  modbook_catalog:['성공률','최근 거래가격','최근 거래일']
 }[table]||[];
 // Source name/category remain unchanged in DB. Human-readable grouping is
 // used in the standalone UI instead of exposing a raw KNIFE/ETC code.
 const displayedValue=field=>field.plain==='성공률'?presentSuccessRate(field.value):
  field.plain==='분류'&&/^(KNIFE|PISTOL|REVOLVER|SMG|ETC)$/.test(field.value)?escapeText(table==='info_material_recipes'?'부품·원재료':craftGroup(record)):field.value;
 const highlights=keyLabels.map(label=>fields.find(field=>field.plain===label)).filter(Boolean).slice(0,3);
 const remainder=fields.filter(field=>!highlights.includes(field));
 const isMaterial=field=>/재료|부품|투입/.test(field.plain);
 const materials=remainder.filter(isMaterial); // retain source order
 const overview=remainder.filter(field=>!isMaterial(field));
 const qtyLookup=new Map(materials.filter(field=>/^재료 [1-8] 수량$/.test(field.plain)).map(field=>[field.plain,field.value]));
 const ingredientFields=materials.filter(field=>!/^재료 [1-8] 수량$/.test(field.plain));
 const ingredientMarkup=field=>{
  if(field.plain==='필요 재료')return field.value.split(' · ').map(itemMaterialFromPart).join('');
  const match=field.plain.match(/^재료 ([1-8])$/);
  if(match)return itemMaterialBadge(field.value,qtyLookup.get(`재료 ${match[1]} 수량`)||'');
  if(/^투입 재료 [1-4]$/.test(field.plain))return itemMaterialFromPart(field.value);
  return `<span class="game-detail-material-note"><span>${field.label}</span><strong>${field.value}</strong></span>`;
 };
 const highlightsHtml=highlights.length?`<div class="game-detail-highlights" aria-label="핵심 정보">${highlights.map((field,index)=>`<div class="game-detail-highlight${field.plain==='성공률'?' game-detail-highlight--rate':''}"><span>${field.label}</span><strong>${displayedValue(field)}</strong></div>`).join('')}</div>`:'';
 const panel=(title,key,items)=>items.length?`<section class="game-detail-panel game-detail-panel--${key}" aria-label="${title}"><h3>${title}</h3><dl>${items.map(field=>`<div class="game-detail-pair${field.value.length>100?' game-detail-pair--long':''}"><dt>${field.label}</dt><dd>${displayedValue(field)}</dd></div>`).join('')}</dl></section>`:'';
 let ingredientHtml='';
 if(ingredientFields.length){
  // Connected weapon-part recipes may also include an ordinary crafting recipe;
  // keep both ingredient sets, labeled by their respective original record.
  const combine=fields=>fields.length?`<div class="game-detail-ingredient-grid">${fields.map(ingredientMarkup).join('')}</div>`:'';
  if(table==='info_material_recipes'){
   const combination=ingredientFields.filter(field=>/^재료 [1-8]$/.test(field.plain));
   const craft=ingredientFields.filter(field=>field.plain==='필요 재료');
   const other=ingredientFields.filter(field=>!combination.includes(field)&&!craft.includes(field));
   ingredientHtml=`${combination.length?`<div class="game-detail-ingredient-set">${craft.length?'<h4>조합 재료</h4>':''}${combine(combination)}</div>`:''}${craft.length?`<div class="game-detail-ingredient-set"><h4>별도 등록된 제작 재료</h4>${combine(craft)}</div>`:''}${other.length?combine(other):''}`;
  }else ingredientHtml=combine(ingredientFields);
 }
 const materialsHtml=ingredientHtml?`<section class="game-detail-panel game-detail-panel--materials" aria-label="필요 재료"><h3>${table==='info_processes'?'가공 재료':'필요 재료'}</h3>${ingredientHtml}</section>`:'';
 const supplementaryTitle=({info_processes:'가공·재련 정보',info_quests:'퀘스트 정보',info_skill_ranks:'스킬 정보',modbook_catalog:'개조서 정보'})[table]||'제작 정보';
 // Processing is a conversion flow, not a crafting dashboard. The rail above
 // still uses the original output/reward fields; the body only moves DB data.
 if(table==='info_processes')return {highlightsHtml,bodyHtml:processDetailBody(record)};
 if(table==='info_quests')return {highlightsHtml:'',bodyHtml:questDetailBody(record,questVariants)};
 return {highlightsHtml,bodyHtml:`<div class="game-detail-body"><div class="game-detail-panels">${materialsHtml}${panel(supplementaryTitle,'overview',overview)}</div></div>`};
};
const itemListSubtitle=(table,row)=>{
 if(table==='info_crafts')return [...new Set([craftGroup(row),craftSubtype(row)].filter(Boolean))].join(' · ');
 if(table==='info_material_recipes')return '무기부품 · 조합';
 if(table==='info_processes')return [row.job,row.process_type].filter(Boolean).join(' · ');
 if(table==='info_quests')return [row.job,row.rank].filter(Boolean).join(' · ');
 if(table==='info_skill_ranks')return [row.skill,row.rank].filter(Boolean).join(' · ');
 if(table==='modbook_catalog')return [row.type,modbookCategories(row).slice(0,2).join(', ')].filter(Boolean).join(' · ');
 return '';
};
const listDecor=(table,title,subtitle,search=false,imageRef=null)=>{
  const image=table==='info_quests'?questItemArt(imageRef):['info_crafts','info_material_recipes','info_processes'].includes(table)?itemImageUrl(title):'';
  if(table==='info_skill_ranks')return `${skillIconMarkup(imageRef||title)}<span class="game-list-label"><strong>${escapeText(title)}</strong>${subtitle?`<small>${escapeText(subtitle)}</small>`:''}</span>`;
  return `<span class="game-list-symbol" aria-hidden="true">${image?`<img src="${image}" alt="" loading="lazy" decoding="async">`:infoTabIcon(table==='info_material_recipes'?'info_crafts':table)}</span><span class="game-list-label"><strong>${escapeText(title)}</strong>${subtitle?`<small>${escapeText(subtitle)}</small>`:''}</span>`;
};

const nonEmptyLines=value=>String(value??'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
const modbookDisplayTitle=row=>`${String(row?.type||'개조서').trim()||'개조서'} 개조서: ${String(row?.name||'이름 없음').trim()||'이름 없음'}`;
const modbookApplicableLabel=row=>{
 const classified=modbookCategories(row).filter(Boolean);
 if(classified.length)return [...new Set(classified)].join(' · ');
 const fallbacks=[row?.category,row?.parts].flatMap(splitModbookLabels).filter(Boolean);
 return fallbacks.length?[...new Set(fallbacks)].join(' · '):'미등록';
};
const modbookEffectEntries=row=>[row?.option1,row?.option2,row?.option3].flatMap(nonEmptyLines).filter(Boolean).map(line=>{
 const raw=String(line||'').trim();
 const isDebuff=/^\*/.test(raw)||/\(\s*-\d/.test(raw)||/~\s*-\d/.test(raw);
 const clean=raw.replace(/^[*•·ㆍ▪◦]+\s*/, '').trim();
 return {text:clean||raw,isDebuff};
});
const modbookSupportLines=row=>[row?.note,row?.price_note].flatMap(nonEmptyLines).filter(Boolean);
const modbookDetailPanel=row=>{
 const type=String(row?.type||'').trim();
 const theme=type==='접미'?'suffix':'prefix';
 const title=modbookDisplayTitle(row);
 const subtitle=type?`${type} 계열 개조서 정보`:'개조서 정보';
 const facts=[
  ['개조 위치',type||'미등록'],
  ['성공 확률',presentSuccessRate(row?.success_rate)||'미등록'],
  ['적용 가능 부위',modbookApplicableLabel(row)],
 ];
 const effects=modbookEffectEntries(row);
 const support=modbookSupportLines(row);
 return `<section class="axe-info-detail axe-info-detail--studio game-modbook-detail game-modbook-detail--${theme}" aria-label="${escapeText(title)} 상세 정보"><div class="game-modbook-detail__hero"><div class="game-modbook-detail__eyebrow"><span>LAC HUB</span><span>MOD BOOK DATABASE</span></div><div class="game-modbook-detail__hero-main"><div class="game-modbook-detail__title-wrap"><span class="game-modbook-detail__kind">${escapeText(type||'개조서')}</span><h2>${escapeText(title)}</h2><p>${escapeText(subtitle)}</p></div><div class="game-modbook-detail__book-slot" aria-hidden="true"><span class="game-modbook-detail__book"><span class="game-modbook-detail__book-spine"></span><span class="game-modbook-detail__book-ring game-modbook-detail__book-ring--top"></span><span class="game-modbook-detail__book-ring game-modbook-detail__book-ring--mid"></span><span class="game-modbook-detail__book-ring game-modbook-detail__book-ring--bot"></span><span class="game-modbook-detail__book-emblem"></span></span></div></div></div><div class="game-modbook-detail__body"><div class="game-modbook-detail__facts">${facts.map(([label,value])=>`<div class="game-modbook-detail__fact"><span>${escapeText(label)}</span><strong>${escapeText(value)}</strong></div>`).join('')}</div><section class="game-modbook-detail__panel game-modbook-detail__panel--effects" aria-label="개조 효과"><header><h3>개조 효과</h3></header><div class="game-modbook-detail__effects">${effects.length?`<ul>${effects.map(effect=>`<li class="game-modbook-detail__effect${effect.isDebuff?' game-modbook-detail__effect--debuff':''}"><span class="game-modbook-detail__effect-mark" aria-hidden="true">◆</span><span class="game-modbook-detail__effect-text">${escapeText(effect.text)}</span></li>`).join('')}</ul>`:'<p class="game-modbook-detail__empty">등록된 개조 효과가 없습니다.</p>'}</div></section><section class="game-modbook-detail__panel game-modbook-detail__panel--support" aria-label="추가 정보"><header><h3>추가 정보</h3></header><div class="game-modbook-detail__support">${support.length?support.map(line=>`<p>${escapeText(line)}</p>`).join(''):'<p class="game-modbook-detail__empty">추가 안내가 없습니다.</p>'}</div></section></div></section>`;
};

const detailFields=(table,row,data,info,owner,{includeCraftMaterials=true}={})=>{
 const fields=CONFIG[table][2].map(([key,label])=>[label,fieldValue(row,key)]);
 if(table==='modbook_catalog'){
  const classification=modbookClassification(row);
  if(['parts','options'].includes(classification.source)){
   const field=fields.find(([label])=>label==='적용 분야');
   const explanation=classification.source==='parts'?'필요 부품 표기 기준 · 분류 확인 필요':'옵션 효과 기준 · 원본 분류값은 변경되지 않음';
   if(field)field[1]=`${classification.categories.join(', ')} (${explanation})`;
  }
  const price=fields.find(([label])=>label==='최근 거래가격');
  if(price&&price[1]!=='—'&&Number.isFinite(Number(row.recent_price)))price[1]=`${Number(row.recent_price).toLocaleString('ko-KR')}원`;
 }
 if(table==='info_material_recipes')for(let i=1;i<=8;i++){
  const name=row[`input${i}`]; if(name)fields.splice((i-1)*2+1,0,[`재료 ${i} 수량`,fieldValue(row,`input${i}_qty`)]);
 }
 if(table==='info_processes')for(let i=1;i<=4;i++){
  if(row[`input${i}`])fields.push([`투입 재료 ${i}`,`${row[`input${i}`]} × ${fieldValue(row,`input${i}_qty`)}`]);
 }
 if(table==='info_crafts'&&includeCraftMaterials){
  const materials=visibleRows(data,'info_craft_materials',info,owner).filter(m=>String(m.craft_id)===String(row.id));
  if(materials.length)fields.push(['필요 재료',materials.map(m=>`${m.material_name} × ${m.quantity}`).join(' · ')]);
 }
 return renderFields(fields);
};
// Restrained monochrome line symbols (not OS-dependent emoji) keep the LAC HUB tone.
const MODBOOK_ICONS=Object.freeze({
 '무기':'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
 '생활':'<path d="M20 4c-9 0-15 4-15 11a5 5 0 0 0 5 5c7 0 11-6 10-16Z"/><path d="M4 21c2-5 6-9 12-12"/>',
 '전투':'<path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/>',
 '접두':'<path d="M7 12h10M11 8l-4 4 4 4"/>',
 '접미':'<path d="M7 12h10M13 8l4 4-4 4"/>',
});
const modbookIcon=value=>MODBOOK_ICONS[value]?`<svg class="axe-info-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MODBOOK_ICONS[value]}</svg>`:'';
const chipRow=(title,field,values,selected,rows,valueOf,{modbook=false,craftChild=false}={})=>{
 const items=values.map(value=>{
  const tone=modbook&&field==='secondary'?(value==='접두'?' axe-info-chip--prefix':value==='접미'?' axe-info-chip--suffix':''):'';
  return `<button type="button" data-info-filter="${field}" data-info-value="${escapeText(value)}" class="${selected===value?'is-active':''}${tone}" aria-pressed="${selected===value?'true':'false'}">${modbook?modbookIcon(value):''}${escapeText(showFilterName(value))}</button>`;
 }).join('');
 return `<div class="axe-info-subfilter${modbook?' axe-info-subfilter--modbook':''}${craftChild?' axe-info-subfilter--craft-child':''}"><span class="axe-info-subfilter__label">${craftChild?'<span class="axe-info-subfilter__branch" aria-hidden="true">↳</span>':''}${escapeText(title)}</span><div class="axe-info-chips" role="group" aria-label="${escapeText(title)}">${items}</div></div>`;
};
const recipeIngredientSignature=entries=>JSON.stringify(entries
 .filter(([name])=>name!==null&&name!==undefined&&String(name).trim()!=='')
 .map(([name,qty])=>[String(name).trim(),String(qty??'').trim()])
 .sort(([nameA,qtyA],[nameB,qtyB])=>nameA.localeCompare(nameB,'ko')||qtyA.localeCompare(qtyB,'ko')));
// A part exists in both tables. When both tables describe the SAME material
// quantities, show one ingredient set and retain the craft-only factual fields.
// If they differ, both source recipes remain visible as distinct alternatives.
const weaponPartDetails=(recipe,data,info,owner,{dedupe=false}={})=>{
 const craft=visibleRows(data,'info_crafts',info,owner).find(row=>String(row.item_name).trim()===String(recipe.item_name).trim());
 const source=detailFields('info_material_recipes',recipe,data,info,owner);
 if(!craft)return source;
 if(!dedupe)return `${source}<div class="axe-info-detail__section"><dt>연결된 제작법</dt><dd>${escapeText(craft.item_name)}</dd></div>${detailFields('info_crafts',craft,data,info,owner)}`;
 const craftInputs=visibleRows(data,'info_craft_materials',info,owner)
  .filter(row=>String(row.craft_id)===String(craft.id))
  .map(row=>[row.material_name,row.quantity]);
 const combination=Array.from({length:8},(_,i)=>[recipe[`input${i+1}`],recipe[`input${i+1}_qty`]]);
 const sameIngredients=craftInputs.length>0&&recipeIngredientSignature(craftInputs)===recipeIngredientSignature(combination);
 const craftFields=detailFields('info_crafts',craft,data,info,owner,{includeCraftMaterials:!sameIngredients});
 return `${source}${craftFields}`;
};

// Browsing has no "전체" chips. The unified search below is the sole cross-category search.
export function categoryFilters(table,info,data,owner,{standalone=false}={}){
 const primary=String(info.filterPrimary||ALL),secondary=String(info.filterSecondary||ALL);
 let shown=visibleRows(data,table,info,owner),controls='',chosenSkill='',heading=CONFIG[table][0],countNote='';
 if(['info_crafts','info_craft_materials','info_material_recipes'].includes(table)){
  const craftRows=visibleRows(data,'info_crafts',info,owner);
  const recipes=visibleRows(data,'info_material_recipes',info,owner);
  const unlinkedRecipes=recipes.filter(recipe=>!craftRows.some(craft=>String(craft.item_name).trim()===String(recipe.item_name).trim()));
  // The legacy composition tab is only exposed when a future recipe has no
  // corresponding craft record, so those records cannot silently disappear.
  const groupNames=['근접무기','총기류','부품·원재료',...(unlinkedRecipes.length?['무기부품']:[]),'기타 제작품'];
  const group=groupNames.includes(info.craftGroup)?info.craftGroup:groupNames[0];
  controls+=`<div class="axe-info-subfilter axe-info-subfilter--craft-parent"><span class="axe-info-subfilter__label">제작 구분</span><div class="axe-info-chips" role="group" aria-label="제작 구분">${groupNames.map(value=>`<button type="button" data-info-filter="craftGroup" data-info-value="${escapeText(value)}" class="${group===value?'is-active':''}" aria-pressed="${group===value?'true':'false'}">${escapeText(value==='무기부품'?'부품 조합':value)}</button>`).join('')}</div></div>`;
  if(group==='무기부품'){
   table='info_material_recipes';shown=unlinkedRecipes;heading='부품 조합';
  }else{
   table='info_crafts';shown=craftRows.filter(craft=>craftGroup(craft)===group);
   if(['근접무기','총기류','기타 제작품'].includes(group)){
    const preferred=group==='근접무기'?['나이프']:group==='총기류'?['피스톨','리볼버','SMG']:['도구·소모품','탄약','기타'];
    const values=preferred.filter(value=>shown.some(craft=>craftSubtype(craft)===value));
    if(values.length>1){
     const chosen=values.includes(primary)?primary:values[0];
     controls+=chipRow('세부 분류','primary',values,chosen,shown,craftSubtype,{craftChild:true});
     shown=shown.filter(craft=>craftSubtype(craft)===chosen);
    }
   }
   heading=group;
  }
 }else if(table==='info_processes'){
  const types=['목재','재련','기타'].filter(type=>shown.some(row=>productionGroup(row)===type));
  const chosen=types.includes(primary)?primary:(types[0]||'목재');
  controls+=chipRow(standalone?'분류':'가공·재련 종류','primary',types,chosen,shown,productionGroup);
  shown=shown.filter(row=>productionGroup(row)===chosen);
  heading=standalone?chosen:`가공·재련 · ${chosen}`;
 }else if(table==='info_quests'){
  const jobOf=row=>filterName(row.job),jobs=distinct(shown.map(jobOf)).sort((a,b)=>{const order=['벌목','채광'];const aIndex=order.indexOf(a),bIndex=order.indexOf(b);return aIndex<0?(bIndex<0?a.localeCompare(b,'ko'):1):bIndex<0?-1:aIndex-bIndex;});
  const chosen=jobs.includes(primary)?primary:jobs[0];
  controls+=chipRow('직업','primary',jobs,chosen,shown,jobOf);
  shown=shown.filter(row=>jobOf(row)===chosen);
  // Quest grade is shown in each detail, not as a second category/filter.
  // Keep A/B records available together for side-by-side quantity/reward comparison.
  heading=`퀘스트 · ${showFilterName(chosen)}`;
  if(standalone){
   const groups=questGroupedRows(shown);
   if(groups.length<shown.length)countNote=`${shown.length}건 · ${groups.length}개 항목`;
  }
 }else if(table==='info_skill_ranks'){
  const types=distinct(shown.map(row=>skillGroup(row.skill)));
  const groups=['생활','생산','전투','기술','기타'].filter(group=>types.includes(group));
  const group=groups.includes(primary)?primary:groups[0];
  controls+=chipRow('스킬 분야','primary',groups,group,shown,row=>skillGroup(row.skill));
  shown=shown.filter(row=>skillGroup(row.skill)===group);
  if(standalone){
   // A skill is the selectable list unit. Rank rows remain intact in data,
   // and are rendered together in the selected skill's detail pane.
   const unique=new Map();
   for(const row of shown)if(!unique.has(String(row.skill)))unique.set(String(row.skill),row);
   const order=group==='생활'?SKILL_LIFE_ORDER:[];
   shown=[...unique.values()].sort((a,b)=>{
    const ia=order.indexOf(String(a.skill)),ib=order.indexOf(String(b.skill));
    if(ia>=0||ib>=0)return ia<0?1:ib<0?-1:ia-ib;
    return String(a.skill).localeCompare(String(b.skill),'ko');
   });
   heading=group;
   countNote=`${shown.length}개 스킬`;
  }else{
   // Embedded company info keeps its existing per-rank selection flow.
   const skills=distinct(shown.map(row=>filterName(row.skill)));
   const chosen=skills.includes(secondary)?secondary:'';
   controls+=chipRow('세부 스킬','secondary',skills,chosen,shown,row=>filterName(row.skill));
   shown=chosen?shown.filter(row=>filterName(row.skill)===chosen):[];
   countNote=chosen?`${shown.length}개 등급`:'스킬을 선택해 주세요';
   chosenSkill=chosen;
   heading=`스킬 등급 · ${group}`;
  }
 }else if(table==='modbook_catalog'){
  const groupNames=['무기','생활','전투'];
  const hasUnclassified=shown.some(row=>modbookGroups(row).includes('분류 확인 필요'));
  const groups=groupNames.filter(group=>shown.some(row=>modbookGroups(row).includes(group)));
  const group=([...groups,...(hasUnclassified?['분류 확인 필요']:[])].includes(primary)?primary:groups[0]||(hasUnclassified?'분류 확인 필요':'무기'));
  controls+=chipRow('개조서 분야','primary',groups,group,shown,modbookGroups,{modbook:true});
  if(hasUnclassified){
   controls+=`<div class="axe-info-subfilter axe-info-subfilter--exception"><span class="axe-info-subfilter__label">분류 확인</span><div class="axe-info-chips"><button type="button" data-info-filter="primary" data-info-value="분류 확인 필요" class="${group==='분류 확인 필요'?'is-active':''}" aria-pressed="${group==='분류 확인 필요'?'true':'false'}">분류 미확인</button></div></div>`;
  }
  shown=shown.filter(row=>modbookGroups(row).includes(group));
  const types=['접두','접미'].filter(type=>shown.some(row=>row.type===type));
  const type=types.includes(secondary)?secondary:types[0];
  if(types.length>1)controls+=chipRow('개조 위치','secondary',types,type,shown,row=>row.type,{modbook:true});
  shown=shown.filter(row=>row.type===type);
  const categories=group==='분류 확인 필요'?['분류 미확인']:
   MODBOOK_GROUPS[group].filter(category=>shown.some(row=>modbookCategories(row).includes(category)));
  const category=categories.includes(info.modbookCategory)?info.modbookCategory:categories[0];
  if(categories.length>1)controls+=chipRow('세부 분류','modbookCategory',categories,category,shown,modbookCategories,{modbook:true});
  if(group!=='분류 확인 필요')shown=shown.filter(row=>modbookCategories(row).includes(category));
  heading=`개조서 · ${group} · ${type||''}${group==='분류 확인 필요'?'':` · ${category||''}`}`;
 }
 return {rows:shown,controls,selectedSkill:chosenSkill,table,heading,countNote};
}

const matchText=(values,q)=>values.flat(Infinity).filter(value=>value!==null&&value!==undefined).join(' ').toLocaleLowerCase('ko').includes(q);
// Return a single navigable result for each recipe; craft ingredients remain searchable by craft name.
export function searchInformation(data,query,info={},owner=false){
 const q=String(query||'').trim().toLocaleLowerCase('ko');
 if(!q)return [];
 const crafts=visibleRows(data,'info_crafts',info,owner);
 const recipes=visibleRows(data,'info_material_recipes',info,owner);
 const materials=visibleRows(data,'info_craft_materials',info,owner);
 const results=[];
 for(const row of crafts){
  const group=craftGroup(row);
  const recipe=recipes.find(item=>String(item.item_name).trim()===String(row.item_name).trim());
  const ingredients=materials.filter(item=>String(item.craft_id)===String(row.id));
  if(matchText([Object.values(row),recipe?Object.values(recipe):[],ingredients.map(item=>[item.material_name,item.quantity])],q))
   results.push({table:'info_crafts',row,group,primary:craftSubtype(row),secondary:'',path:['제작법',group,craftSubtype(row)].filter((value,index)=>index<2||!['부품·원재료','무기부품'].includes(group)),title:itemName('info_crafts',row,data)});
 }
 for(const row of recipes){
  const craft=crafts.find(item=>String(item.item_name).trim()===String(row.item_name).trim());
  if(craft)continue; // shown in the materials group as one crafted item
  const ingredients=[];
  if(matchText([Object.values(row),craft?Object.values(craft):[],ingredients.map(item=>[item.material_name,item.quantity])],q))
   results.push({table:'info_material_recipes',row,group:'무기부품',primary:'',secondary:'',path:['제작법','부품 조합'],title:itemName('info_material_recipes',row,data)});
 }
 for(const table of ['info_processes','info_quests','info_skill_ranks']){
  for(const row of visibleRows(data,table,info,owner)){
   if(!matchText(Object.values(row),q))continue;
   const group=table==='info_processes'?productionGroup(row):table==='info_quests'?filterName(row.job):skillGroup(row.skill);
   const primary=table==='info_skill_ranks'?group:table==='info_quests'?filterName(row.job):productionGroup(row);
   const secondary=table==='info_skill_ranks'?filterName(row.skill):'';
   results.push({table,row,group,primary,secondary,path:[CONFIG[table][0],showFilterName(group)],title:itemName(table,row,data)});
  }
 }
 for(const row of visibleRows(data,'modbook_catalog',info,owner)){
  // One search result per original row even when its category covers multiple fields.
  if(!matchText([row.name,row.type,row.category,row.parts,row.option1,row.option2,row.option3,row.note,row.price_note],q))continue;
  const group=modbookGroups(row)[0];
  const category=group==='분류 확인 필요'?'':modbookCategories(row).find(value=>MODBOOK_GROUPS[group].includes(value))||'';
  results.push({table:'modbook_catalog',row,group,primary:group,secondary:row.type||'',modbookCategory:category,path:['개조서',group,row.type,category].filter(Boolean),title:String(row.name||'이름 없음')});
 }
 return results;
}

export function renderInfoPage(state,{standalone=false}={}){
 const info=state.info||{},owner=Boolean(state.platformAdmin);
 // Stale company-specific rows must never survive a company/account switch.
 const data=!state.companyId||(info.companyId&&String(info.companyId)!==String(state.companyId))?{...(info.data||{}),modbook_catalog:[]}:(info.data||{});
 const hasCompany=Boolean(state.companyId && (state.companies||[]).some(c=>c.id===state.companyId));
 const requestedTable=CONFIG[info.table] && (hasCompany || info.table!=='modbook_catalog')?info.table:'info_crafts';
 const tabTable=['info_craft_materials','info_material_recipes'].includes(requestedTable)?'info_crafts':requestedTable;
 const q=String(info.query||'').trim();
 const searching=Boolean(q);
 const categories=TOP_TABS.filter(([key])=>hasCompany || key!=='modbook_catalog').map(([key,label])=>{
  return `<button type="button" data-info-table="${key}" class="${!searching&&tabTable===key?'is-active':''}" aria-current="${!searching&&tabTable===key?'true':'false'}">${infoTabIcon(key)}<span>${escapeText(label)}</span></button>`;
 }).join('');
 const filters=searching?null:categoryFilters(tabTable,info,data,owner,{standalone});
 const matches=searching?searchInformation(data,q,info,owner):[];
 const table=searching?'':filters.table;
 const rows=searching?matches:filters.rows;
 const selected=searching?null:rows.find(row=>String(row.id)===String(info.selectedId||''))||(standalone&&table==='info_skill_ranks'?rows.find(row=>String(row.skill)===String(info.filterSecondary||'')):null)||null;
 const selectedVariants=selected&&standalone&&table==='info_quests'?(questGroupedRows(rows).find(group=>group.variants.some(row=>String(row.id)===String(selected.id)))?.variants||[selected]):[];
 const detailTitle=selected?table==='info_quests'&&standalone&&selectedVariants.length>1?questGroupedTitle(selected,selectedVariants):itemName(table,selected,data):'';
 const selectedPartRecipe=standalone&&selected&&table==='info_crafts'?visibleRows(data,'info_material_recipes',info,owner).find(recipe=>String(recipe.item_name).trim()===String(selected.item_name).trim()):null;
 const existingFields=selected?(selectedPartRecipe?weaponPartDetails(selectedPartRecipe,data,info,owner,{dedupe:true}):table==='info_material_recipes'?weaponPartDetails(selected,data,info,owner,{dedupe:standalone}):detailFields(table,selected,data,info,owner)):'';
 const detailHeading=selected?`<header><span>${standalone?escapeText(CONFIG[table][0]):'상세 정보'}${table==='modbook_catalog'&&['접두','접미'].includes(selected.type)?` <span class="axe-info-type-badge axe-info-type-badge--${selected.type==='접두'?'prefix':'suffix'}">${modbookIcon(selected.type)}${escapeText(selected.type)}</span>`:''}</span><strong>${escapeText(detailTitle)}</strong>${selected.is_active===false||selected.active===false?'<em>비활성</em>':''}</header>`:'';
 // Density is based only on actual visible DB fields; no sample content.
 const visibleFieldCount=(existingFields.match(/<dt>/g)||[]).length;
 const longestField=Array.from(existingFields.matchAll(/<dd>([\s\S]*?)<\/dd>/g),match=>match[1].replace(/<[^>]*>/g,'').length).reduce((max,n)=>Math.max(max,n),0);
 const detailDensity=visibleFieldCount<=4?'sparse':visibleFieldCount<=8?'regular':visibleFieldCount<=14?'dense':'extended';
 const detailOverflow=longestField>160?' game-detail--long-copy':'';
 const artSource=selected&&table==='info_quests'?questItemArt(selected):selected&&['info_crafts','info_material_recipes','info_processes'].includes(table)?itemImageUrl(detailTitle):'';
 const heroSubtitle=selected&&['info_processes','info_quests'].includes(table)?'':selected?itemListSubtitle(table,selected):'';
 const hero=selected?`<div class="game-detail-hero${artSource?' game-detail-hero--art':''}"><header class="game-detail-hero__copy"><strong>${escapeText(detailTitle)}</strong>${heroSubtitle?`<span class="game-detail-hero__subtitle">${escapeText(heroSubtitle)}</span>`:''}${selected.is_active===false||selected.active===false?'<em>비활성</em>':''}</header><div class="game-detail-hero__artwork" aria-hidden="true">${artSource?`<img class="game-detail-hero__item" src="${artSource}" alt="" decoding="async">`:`<span class="game-detail-hero__symbol">${infoTabIcon(table==='info_material_recipes'?'info_crafts':table)}</span>`}</div></div>`:'';
 const detailSections=selected&&standalone?standaloneDetailSections(existingFields,selectedPartRecipe?'info_material_recipes':table,selected,selectedVariants):null;
 const details=selected&&standalone&&table==='info_skill_ranks'?skillDetailPanel(String(selected.skill),visibleRows(data,'info_skill_ranks',info,owner).filter(row=>String(row.skill)===String(selected.skill))):selected&&standalone&&table==='modbook_catalog'?modbookDetailPanel(selected):selected?`<section class="axe-info-detail${standalone?' axe-info-detail--studio game-detail--'+detailDensity+(table==='info_processes'?' game-detail--process':table==='info_quests'?' game-detail--quest':'')+detailOverflow:''}" aria-label="상세 정보">${standalone?`<div class="game-detail-feature">${hero}${detailSections.highlightsHtml}</div>${detailSections.bodyHtml}`:`${detailHeading}<dl>${existingFields}</dl>`}</section>`:`<section class="axe-info-detail axe-info-detail--empty" aria-label="상세 정보"><span class="axe-info-detail__eyebrow">상세 정보</span><div class="axe-info-detail__placeholder"><span class="axe-info-detail__placeholder-mark" aria-hidden="true">◇</span><strong>${searching?'검색 결과를 선택해 주세요':'정보를 선택해 주세요'}</strong><p>왼쪽 목록에서 항목을 선택하면<br>상세 정보가 여기에 표시됩니다.</p></div></section>`;
 const listEntries=!searching&&standalone&&table==='info_quests'?questGroupedRows(rows):rows.map(row=>({row,variants:[row]}));
 const rowList=rows.length?listEntries.map(({row:entry,variants})=>{
  if(searching){
   const {table:source,row,group,primary,secondary,path,title,modbookCategory}=entry;
   return `<button type="button" class="axe-info-row axe-info-row--search${standalone?' axe-info-row--studio':''}" data-info-result-table="${escapeText(source)}" data-info-result-id="${escapeText(row.id)}" data-info-result-group="${escapeText(group)}" data-info-result-primary="${escapeText(primary)}" data-info-result-secondary="${escapeText(secondary)}" data-info-result-modbook-category="${escapeText(modbookCategory||'')}">${standalone?listDecor(source,title,path.join(' › '),true,source==='info_quests'?row:null):`<strong>${escapeText(title)}</strong><span class="axe-info-row__path">${escapeText(path.join(' › '))}</span>`}${row.is_active===false||row.active===false?'<em>비활성</em>':''}</button>`;
  }
  const id=String(entry.id),active=standalone&&table==='info_skill_ranks'?Boolean(selected&&String(entry.skill)===String(selected.skill)):variants.some(row=>String(row.id)===String(info.selectedId||''));
  const title=standalone&&table==='info_skill_ranks'?skillDisplayName(entry.skill||'이름 없음'):filters.selectedSkill&&table==='info_skill_ranks'?String(entry.rank||'미지정'):table==='info_quests'&&standalone?questGroupedTitle(entry,variants):itemName(table,entry,data);
  const artRef=table==='info_quests'?entry:title;
  const subtitle='';
  return `<button type="button" class="axe-info-row ${active?'is-active':''}${standalone?' axe-info-row--studio':''}${standalone&&table==='info_quests'?' game-quest-list-row':''}" data-info-id="${escapeText(id)}" aria-pressed="${active?'true':'false'}">${standalone?listDecor(table,title,subtitle,false,artRef):`<strong>${escapeText(title)}</strong>`}${entry.is_active===false||entry.active===false?'<em>비활성</em>':''}</button>`;
 }).join(''):`<p class="axe-info-empty">${!searching&&tabTable==='info_skill_ranks'&&!filters.selectedSkill?'세부 스킬을 선택해 주세요.':searching?'전체 정보에서 검색 결과가 없습니다.':'조건에 맞는 정보가 없습니다.'}</p>`;
 const ownerNote=owner?'<span class="axe-info-owner-note">조회 전용 · 관리자 편집 기능은 준비 중</span>':'';
 const error=info.error?`<div class="axe-info-error">${escapeText(info.error)} <button type="button" data-action="info-refresh">다시 불러오기</button></div>`:'';
 const modbookError=info.modbookError&&(tabTable==='modbook_catalog'||searching)?`<div class="axe-info-error">개조서 조회 실패: ${escapeText(info.modbookError)} <button type="button" data-action="info-refresh">다시 불러오기</button></div>`:'';
 const header=`<header class="axe-info-header"><div><span class="page-eyebrow">LAC HUB / INFORMATION</span><h1>게임 정보</h1><p>제작법 · 가공·재련 · 퀘스트 · 스킬${hasCompany?' · 현재 회사 개조서':''} 정보를 찾아보세요.</p></div>${standalone?'':'<button type="button" class="ops-action-secondary" data-action="info-refresh">새로고침</button>'}</header>`;
 const toolbar=`<div class="axe-info-toolbar"><input type="search" data-info-query placeholder="제작법 · 가공·재련 · 퀘스트 · 스킬 정보 검색" value="${escapeText(info.query||'')}" aria-label="게임 정보 전체 검색">${searching?'<span class="axe-info-search-hint">전체 정보 검색 중</span>':''}${owner?`<label><input type="checkbox" data-info-inactive ${info.showInactive?'checked':''}> 비활성 포함</label>`:''}</div>`;
 const controls=!searching&&filters.controls?`<div class="axe-info-subfilters${tabTable==='info_crafts'?' axe-info-subfilters--craft':''}">${filters.controls}</div>`:'';
 const result=info.loading?'<div class="runtime-inline-loading">게임 정보를 불러오는 중…</div>':!info.loaded?`<div class="runtime-inline-loading">${standalone?'게임 정보를 불러오지 못했습니다. HUB 메인으로 돌아갔다가 다시 접속해 주세요.':'정보를 불러오려면 새로고침을 눌러 주세요.'}</div>`:`<div class="axe-info-content${standalone&&table==='info_skill_ranks'?' game-skill-content':''}"><div class="axe-info-list"><div class="axe-info-list__heading"><span>${searching?'전체 검색 결과':escapeText(filters.heading)}</span></div><div class="axe-info-list__items">${rowList}</div></div>${details}</div>`;
 if(standalone){
  // The public standalone hub uses a compact category rail + real-record explorer.
  // Embedded company information keeps its original DOM/layout below.
  return `<section class="axe-info game-info-rework">${header}${toolbar}<div class="game-info-explorer"><aside class="game-info-explorer__rail" aria-label="자료 카테고리"><div class="game-info-explorer__rail-title">자료 탐색</div><nav class="axe-info-tabs" aria-label="게임 정보 종류">${categories}</nav><p class="game-info-explorer__rail-note">항목을 선택하면 상세 정보가 표시됩니다.</p></aside><div class="game-info-explorer__workspace"><div class="game-info-explorer__filters">${controls}${error}${modbookError}</div>${result}${ownerNote}</div></div></section>`;
 }
 return `<section class="axe-info">${header}${toolbar}<nav class="axe-info-tabs" aria-label="게임 정보 종류">${categories}</nav>${controls}${error}${modbookError}${result}${ownerNote}</section>`;
}
