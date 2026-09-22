/* LAC COOK — isolated, read-only calculation core, stage 1.
 * Exact raw ingredient labels retained; no automatic alias, process, fish or
 * shop-cost expansion until mapping and parity reviews are completed.
 */
export function positiveInt(value, fallback = null) {
  if (value === '' || value == null) return fallback;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}

export function calculateDirect(foods, recipes, orders) {
  const foodById = new Map(foods.map(food => [food.food_id, food]));
  const recipesByName = new Map();
  for (const recipe of recipes) {
    if (recipe.is_active !== 'TRUE') continue;
    const list = recipesByName.get(recipe.food_name) || [];
    list.push(recipe);
    recipesByName.set(recipe.food_name, list);
  }
  const total = new Map();
  const details = [];
  const warnings = [];
  let batches = 0;
  let units = 0;
  for (const order of orders) {
    const food = foodById.get(order.foodId);
    const count = positiveInt(order.batches);
    if (!food || food.is_active !== 'TRUE' || count == null) {
      warnings.push(`유효하지 않은 제작 항목: ${String(order.foodId)}`);
      continue;
    }
    // Preserve the legacy fallback only for preview; expose it to operators.
    const missingSetQty = food.set_qty === '';
    const setQty = positiveInt(food.set_qty, 1);
    if (missingSetQty) warnings.push(`${food.food_name}: 원본 1세트 수량 미설정 · 시연 계산에만 1개로 가정`);
    const actual = count * setQty;
    if (!Number.isSafeInteger(actual)) {
      warnings.push(`${food.food_name}: 수량이 너무 커서 계산에서 제외`);
      continue;
    }
    batches += count;
    units += actual;
    const lines = recipesByName.get(food.food_name) || [];
    if (!lines.length) warnings.push(`${food.food_name}: 등록된 레시피 없음 · 재료 합산 불가`);
    for (const line of lines) {
      const needed = Number(line.required_qty) * actual;
      if (!line.material_name || !Number.isFinite(needed) || needed <= 0) {
        warnings.push(`${food.food_name}: 레시피 ${line.recipe_id}의 재료명/수량 검토 필요`);
        continue;
      }
      if (!Number.isSafeInteger(needed)) {
        warnings.push(`${food.food_name}: 레시피 ${line.recipe_id} 수량이 너무 커서 제외`);
        continue;
      }
      const name = line.material_name; // intentionally NOT normalized
      total.set(name, (total.get(name) || 0) + needed);
      details.push({foodId: food.food_id,foodName:food.food_name,recipeId:line.recipe_id,name,quantity:needed});
    }
  }
  return {
    batches, units,
    materials:[...total.entries()].map(([name, quantity])=>({name, quantity})).sort((a,b)=>a.name.localeCompare(b.name,'ko')),
    details, warnings:[...new Set(warnings)],
    scope:'직접 레시피 투입량만 합산 · 가공/별칭/생선 변환/구매 비용 미포함'
  };
}
