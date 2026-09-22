/* Local, explicitly saved planning draft. No network, account or Supabase access. */
export const WORKSPACE_KEY = 'lac-cook-preview-local-draft-v1';
export const WORKSPACE_VERSION = 1;
const MAX_ORDERS = 1000;
const MAX_CHOICES = 300;
const MAX_CHECKS = 3000;
const validString = (value, limit = 180) => typeof value === 'string' && value.length > 0 && value.length <= limit;
const safeName = name => !['__proto__', 'constructor', 'prototype'].includes(name);
const toSafeMap = (value, max = MAX_CHOICES) => {
  const output = Object.create(null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output;
  for (const [name, id] of Object.entries(value).slice(0, max)) {
    if (validString(name) && safeName(name) && validString(id)) output[name] = id;
  }
  return output;
};
export const sourceRevision = manifest => Object.keys(manifest).sort().map(key => `${key}:${manifest[key]?.sha256 || 'missing'}`).join('|');

// Category/name + the actual requirement make the tick invalid when requirements change.
export function checklistItems(plan) {
  const rows = [];
  const add = (group, name, quantity, detail) => {
    const key = JSON.stringify([group, name, quantity, detail]);
    rows.push({ group, name, quantity, key });
  };
  for (const item of plan.processes) add('process', item.name, item.batches, [item.need, item.output, item.items.map(x => [x.name, x.quantity])]);
  for (const item of plan.farms) add('farm', item.name, item.quantity, null);
  for (const item of plan.purchases) add('purchase', item.name, item.buyQuantity ?? item.quantity, [item.quantity, item.offerId ?? '', item.source, item.bundles, item.cost]);
  for (const item of plan.fishSupply) add('fish', item.name, item.quantity, null);
  return rows;
}
export function currentChecks(checked, items) {
  const allowed = new Set(items.map(item => item.key));
  return new Set([...checked].filter(key => allowed.has(key)));
}
export function prepareWorkspace({orders, choices, checked, plan, revision}) {
  const items = checklistItems(plan);
  const valid = currentChecks(checked, items);
  return {
    version: WORKSPACE_VERSION,
    revision,
    savedAt: new Date().toISOString(),
    orders: [...orders].map(([id,batches])=>({id,batches})),
    choices: {offers:toSafeMap(choices.offers),fish:toSafeMap(choices.fish)},
    checked: [...valid]
  };
}
export function parseWorkspace(json, {revision, foods}) {
  let raw;
  try { raw = JSON.parse(json); } catch { throw Error('저장된 작업 내용을 읽을 수 없어.'); }
  if (!raw || raw.version !== WORKSPACE_VERSION) throw Error('저장된 작업 형식이 달라 불러올 수 없어.');
  if (raw.revision !== revision) throw Error('기준 자료가 변경되어 이전 작업을 자동으로 불러오지 않았어.');
  if (!Array.isArray(raw.orders) || raw.orders.length > MAX_ORDERS || !Array.isArray(raw.checked) || raw.checked.length > MAX_CHECKS) {
    throw Error('저장된 제작 목록 또는 체크리스트 형식이 올바르지 않아.');
  }
  const allowed = new Set(foods.filter(food=>food.is_active==='TRUE').map(food=>food.food_id));
  const orders = new Map();
  for (const row of raw.orders) {
    if (!row || !validString(row.id) || !allowed.has(row.id) || !Number.isSafeInteger(row.batches) || row.batches < 1 || row.batches > 100000 || orders.has(row.id)) {
      throw Error('저장된 요리나 제작 수량을 확인할 수 없어.');
    }
    orders.set(row.id,row.batches);
  }
  const checked = new Set();
  for (const key of raw.checked) {
    if (!validString(key, 1500)) throw Error('체크리스트 데이터 형식이 올바르지 않아.');
    checked.add(key);
  }
  return {
    orders,
    choices: {offers:toSafeMap(raw.choices?.offers),fish:toSafeMap(raw.choices?.fish)},
    checked,
    savedAt:typeof raw.savedAt==='string' ? raw.savedAt : ''
  };
}
