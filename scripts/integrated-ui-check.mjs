import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const failures=[];
const checks=[];
function expect(label, condition){ checks.push([label,Boolean(condition)]); if(!condition) failures.push(label); }

const main=read('src/main.js');
const render=read('src/ui/render.js');
const api=read('src/lib/productApi.js');
const supabase=read('src/lib/supabase.js');
const css=read('src/styles.css');
const settingsCss=read('src/styles/settings.css');

for (const name of [
  'getFundTreasurySnapshot','saveFundLedgerEntry','cancelFundLedgerEntry',
  'getWebAssetsSnapshot','saveWebAsset','manageWebAsset',
  'getWebAccountsSnapshot','submitWebAccountRequest','reviewWebAccountRequest',
  'submitProductFeedback'
]) expect(`WEB bridge helper: ${name}`, api.includes(`function ${name}`));

for (const rpc of [
  'fund_admin_get_treasury_snapshot','fund_admin_save_ledger_entry','fund_admin_cancel_ledger_entry',
  'web_assets_admin_snapshot','web_assets_admin_save','web_assets_admin_manage',
  'web_accounts_admin_snapshot','web_accounts_submit_request','web_accounts_review_request',
  'submit_product_feedback'
]) expect(`RPC binding: ${rpc}`, api.includes(`'${rpc}'`));

expect('axe_product schema lock', /schema:\s*['"]axe_product['"]/.test(supabase));
expect('No browser BOT runtime RPC usage', !/bot_runtime_/i.test(`${main}\n${render}\n${api}`));
expect('No raw fund ledger browser write', !/\.from\(\s*['"]fund_ledger['"]\s*\)[\s\S]{0,250}\.(insert|update|delete|upsert)\(/i.test(api));
expect('No raw company asset browser write', !/\.from\(\s*['"]asset_company_assets['"]\s*\)[\s\S]{0,250}\.(insert|update|delete|upsert)\(/i.test(api));
expect('No raw member account browser write', !/\.from\(\s*['"]asset_member_accounts['"]\s*\)[\s\S]{0,250}\.(insert|update|delete|upsert)\(/i.test(api));

expect('Accepted sidebar group label', render.includes('회사 운영'));
for (const label of ['공금 관리','멤버 관리','자산 관리','계좌 관리','회사 설정','피드백 · 제보']) expect(`Sidebar/page label: ${label}`, render.includes(label));
expect('Boxed AXE header mark removed', !render.includes('brand-mark'));
expect('Feedback backdrop does not close modal', main.includes("if(event.target.matches('[data-modal-backdrop]')){ if(state.modal?.type==='feedback')return; closeModal(); return; }"));
expect('Feedback draft close protection', main.includes('작성 중인 피드백 내용이 사라질 수 있습니다.'));
expect('Mandatory ledger cancellation reason', main.includes('취소 사유를 입력해 주세요.') && api.includes('normalizedReason'));
expect('Fund monthly selector', render.includes('data-fund-weekly-month'));
expect('Fund AXE NET grouped ledger structure', render.includes('axe-fund-history-list') && render.includes('renderLedgerGroup'));
expect('Settings basic/module tabs', render.includes("ops-settings-nav-row") && render.includes("ops-settings-tabs") && render.includes("data-settings-tab=\"basic\"") && render.includes("data-settings-tab=\"modules\""));
expect('Power-style module controls', render.includes('runtime-power') && render.includes("icon('power')") && render.includes('ops-settings-module--channels-${ui.channels.length}'));
expect('No onboarding flash while company list loads', render.includes('!state.ready ? renderStartupLoading()'));
expect('Stable custom company picker', render.includes('runtime-company-picker') && main.includes("action==='toggle-company-menu'") && main.includes("action==='switch-company'"));
expect('Asset compact mode contract', render.includes("state.assetTab==='returns'?'is-returns':'is-assets'") && render.includes('ops-mgmt-tabs-row'));
expect('Fund settings compact runtime override', css.includes('.axe-fund-subview--settings .axe-fund-setting{grid-template-columns:205px minmax(0,1fr)'));
expect('Customer settings hide internal code badge', !render.includes('<span>${esc(m.module_key)}</span>') && render.includes('<div class="ops-settings-module-copy"><strong>${esc(ui.name)}</strong>'));
expect('Compact save action visual', settingsCss.includes('.ops-settings-save-action'));
expect('Prototype CSS system imported', ['tokens.css','layout.css','fund.css','management.css','settings.css','overlays.css'].every(x=>css.includes(x)));

if(failures.length){
  console.error('AXE PRODUCT INTEGRATED UI CHECK: FAIL');
  for(const [label,ok] of checks) console.error(`${ok?' PASS':' FAIL'} ${label}`);
  process.exit(1);
}
console.log('AXE PRODUCT INTEGRATED UI CHECK: PASS');
console.log(`${checks.length}/${checks.length} checks passed.`);
for(const [label] of checks) console.log(` - ${label}: PASS`);
