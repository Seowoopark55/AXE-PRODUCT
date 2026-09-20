// A single balanced type scale for the whole LAC ONE interface.
// Legacy per-cell settings are deliberately not read; otherwise a user's old
// overrides would continue to distort the intended typography hierarchy.
export const LAYOUT_STUDIO_STORAGE_KEY = 'lac_one_type_scale_v1';
export const LAYOUT_STUDIO_DEFAULTS = Object.freeze({fontScale: 100});

export function normalizeLayoutStudioProfile(input = {}) {
  const raw = Number(input?.fontScale);
  return {fontScale: Number.isFinite(raw) ? Math.min(150, Math.max(90, Math.round(raw / 5) * 5)) : 100};
}
export function loadLayoutStudioProfile() {
  try { return normalizeLayoutStudioProfile(JSON.parse(localStorage.getItem(LAYOUT_STUDIO_STORAGE_KEY) || '{}')); }
  catch { return {...LAYOUT_STUDIO_DEFAULTS}; }
}
export function saveLayoutStudioProfile(profile) {
  const next = normalizeLayoutStudioProfile(profile);
  localStorage.setItem(LAYOUT_STUDIO_STORAGE_KEY, JSON.stringify(next));
  return next;
}
export function clearLayoutStudioProfile() {
  localStorage.removeItem(LAYOUT_STUDIO_STORAGE_KEY);
  return {...LAYOUT_STUDIO_DEFAULTS};
}
export function applyLayoutStudioProfile(profile) {
  const next = normalizeLayoutStudioProfile(profile);
  const el = document.documentElement;
  el.style.setProperty('--lac-type-scale', String(next.fontScale / 100));
  el.dataset.layoutStudioActive = next.fontScale === 100 ? 'false' : 'true';
  const scale = next.fontScale / 100;
  const sizeTokens = {
    '--ops-table-header-font-size':8.5,'--ops-table-primary-font-size':10.2,
    '--ops-table-secondary-font-size':9,'--ops-table-control-font-size':9.6,
    '--ops-table-status-font-size':8.3,'--ops-table-action-font-size':8.4,
    '--ops-font-primary':12.5,'--ops-font-secondary':10.5,
    '--ops-font-support':9.5,'--ops-font-control':10.8
  };
  for (const [key, base] of Object.entries(sizeTokens)) el.style.setProperty(key, `${Number((base * scale).toFixed(3))}px`);
  return next;
}
// Legacy exports are harmless compatibility shims for old local scripts.
export function applyLayoutStudioPreset(profile, type, value) {
  if (type !== 'text') return normalizeLayoutStudioProfile(profile);
  return normalizeLayoutStudioProfile({fontScale: ({small: 90, default: 100, comfortable: 120, large: 140})[value] ?? profile.fontScale});
}
export function adjustLayoutStudioValue(profile, key, delta) {
  return key === 'fontScale' ? normalizeLayoutStudioProfile({fontScale: Number(profile.fontScale) + Number(delta)}) : normalizeLayoutStudioProfile(profile);
}
export function detectLayoutStudioPreset(profile, type) {
  if (type !== 'text') return 'default';
  return ({90:'small', 100:'default', 120:'comfortable', 140:'large'})[normalizeLayoutStudioProfile(profile).fontScale] || 'custom';
}
