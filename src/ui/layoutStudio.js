export const LAYOUT_STUDIO_STORAGE_KEY='axe_layout_studio_profile_v1';

export const LAYOUT_STUDIO_DEFAULTS=Object.freeze({
  headerFont:8.5,
  primaryFont:10.2,
  secondaryFont:9.0,
  controlFont:9.6,
  statusFont:8.3,
  actionFont:8.4,
  headerHeight:27,
  rowHeight:40,
  gap:4,
  cellPad:8,
  railWidth:636,
  actionMinWidth:42,
});

const LIMITS={
  headerFont:[7.5,11],primaryFont:[9,13],secondaryFont:[8,12],controlFont:[8.5,12],statusFont:[7.5,11],actionFont:[7.5,11],
  headerHeight:[24,32],rowHeight:[36,48],gap:[2,8],cellPad:[5,12],railWidth:[604,680],actionMinWidth:[38,54],
};

const round1=v=>Math.round(Number(v)*10)/10;
const clamp=(key,value)=>{const [min,max]=LIMITS[key];return Math.min(max,Math.max(min,Number(value)));};

export function normalizeLayoutStudioProfile(input={}){
  const next={...LAYOUT_STUDIO_DEFAULTS};
  for(const key of Object.keys(next)){
    const raw=Number(input?.[key]);
    if(Number.isFinite(raw)) next[key]=round1(clamp(key,raw));
  }
  return next;
}

export function loadLayoutStudioProfile(){
  try{return normalizeLayoutStudioProfile(JSON.parse(localStorage.getItem(LAYOUT_STUDIO_STORAGE_KEY)||'{}'));}
  catch{return {...LAYOUT_STUDIO_DEFAULTS};}
}

export function saveLayoutStudioProfile(profile){
  const normalized=normalizeLayoutStudioProfile(profile);
  localStorage.setItem(LAYOUT_STUDIO_STORAGE_KEY,JSON.stringify(normalized));
  return normalized;
}

export function clearLayoutStudioProfile(){
  localStorage.removeItem(LAYOUT_STUDIO_STORAGE_KEY);
  return {...LAYOUT_STUDIO_DEFAULTS};
}

export function applyLayoutStudioProfile(profile){
  const p=normalizeLayoutStudioProfile(profile);
  const style=document.documentElement.style;
  style.setProperty('--ops-table-header-font-size',`${p.headerFont}px`);
  style.setProperty('--ops-table-primary-font-size',`${p.primaryFont}px`);
  style.setProperty('--ops-table-secondary-font-size',`${p.secondaryFont}px`);
  style.setProperty('--ops-table-control-font-size',`${p.controlFont}px`);
  style.setProperty('--ops-table-status-font-size',`${p.statusFont}px`);
  style.setProperty('--ops-table-action-font-size',`${p.actionFont}px`);
  style.setProperty('--ops-table-header-height',`${p.headerHeight}px`);
  style.setProperty('--ops-table-row-height',`${p.rowHeight}px`);
  style.setProperty('--ops-table-gap',`${p.gap}px`);
  style.setProperty('--ops-table-cell-pad-inline',`${p.cellPad}px`);
  style.setProperty('--ops-rail-standard',`${p.railWidth}px`);
  style.setProperty('--ops-table-action-min-width',`${p.actionMinWidth}px`);
  return p;
}

const TEXT_PRESETS={
  small:{headerFont:8.1,primaryFont:9.8,secondaryFont:8.6,controlFont:9.2,statusFont:7.9,actionFont:8.0},
  default:{headerFont:8.5,primaryFont:10.2,secondaryFont:9.0,controlFont:9.6,statusFont:8.3,actionFont:8.4},
  comfortable:{headerFont:9.0,primaryFont:10.7,secondaryFont:9.5,controlFont:10.1,statusFont:8.8,actionFont:8.9},
  large:{headerFont:9.5,primaryFont:11.2,secondaryFont:10.0,controlFont:10.6,statusFont:9.3,actionFont:9.4},
};
const DENSITY_PRESETS={
  compact:{headerHeight:25,rowHeight:38,gap:3,cellPad:7},
  default:{headerHeight:27,rowHeight:40,gap:4,cellPad:8},
  relaxed:{headerHeight:29,rowHeight:42,gap:5,cellPad:9},
};
const WIDTH_PRESETS={compact:{railWidth:620},default:{railWidth:636},wide:{railWidth:652}};
const ACTION_PRESETS={compact:{actionMinWidth:40,actionFont:8.0,statusFont:8.0},default:{actionMinWidth:42,actionFont:8.4,statusFont:8.3},large:{actionMinWidth:46,actionFont:9.0,statusFont:8.9}};

export function applyLayoutStudioPreset(profile,type,value){
  const source=type==='text'?TEXT_PRESETS[value]:type==='density'?DENSITY_PRESETS[value]:type==='width'?WIDTH_PRESETS[value]:type==='action'?ACTION_PRESETS[value]:null;
  return normalizeLayoutStudioProfile(source?{...profile,...source}:profile);
}

export function adjustLayoutStudioValue(profile,key,delta){
  if(!(key in LAYOUT_STUDIO_DEFAULTS))return normalizeLayoutStudioProfile(profile);
  return normalizeLayoutStudioProfile({...profile,[key]:Number(profile[key])+Number(delta)});
}

function same(a,b,keys){return keys.every(k=>Math.abs(Number(a[k])-Number(b[k]))<.001);}
export function detectLayoutStudioPreset(profile,type){
  const p=normalizeLayoutStudioProfile(profile);
  const table=type==='text'?TEXT_PRESETS:type==='density'?DENSITY_PRESETS:type==='width'?WIDTH_PRESETS:ACTION_PRESETS;
  for(const [name,values] of Object.entries(table)) if(same(p,values,Object.keys(values))) return name;
  return 'custom';
}
