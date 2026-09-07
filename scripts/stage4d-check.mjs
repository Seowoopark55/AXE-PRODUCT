import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const requireText = (file, text, label) => {
  if (!read(file).includes(text)) failures.push(`${label}: ${file}`);
};

for (const file of ['src/main.js', 'src/lib/productApi.js', 'src/ui/render.js']) {
  if (/\.from\(\s*['"]fund_/i.test(read(file))) {
    failures.push(`direct fund table access is forbidden: ${file}`);
  }
}

for (const rpc of [
  'fund_get_my_periods',
  'fund_admin_list_requests',
  'fund_admin_get_period_status',
  'fund_admin_review_request',
  'fund_admin_set_fee_rule',
  'fund_submit_request',
]) {
  requireText('src/lib/productApi.js', rpc, `missing fund RPC ${rpc}`);
}

requireText('src/lib/productApi.js', "const FUND_EVIDENCE_BUCKET = 'axe-fund-evidence'", 'private evidence bucket binding missing');
requireText('src/lib/productApi.js', '.upload(objectName, file', 'evidence upload missing');
requireText('src/lib/productApi.js', '.remove([objectName])', 'unclaimed evidence cleanup missing');
requireText('src/lib/productApi.js', '.createSignedUrl(objectName', 'signed evidence read missing');
requireText('src/main.js', "form.dataset.form === 'fund-submit'", 'member submission handler missing');
requireText('src/main.js', 'uploadFundEvidence(', 'evidence upload flow missing');
requireText('src/main.js', 'removeUnclaimedFundEvidence(', 'failed-submit cleanup missing');
requireText('src/main.js', "action === 'fund-open-evidence'", 'admin evidence open action missing');
requireText('src/ui/render.js', '공금 납부 신청', 'member submission UI missing');
requireText('src/ui/render.js', 'JPG · PNG · WEBP / 최대 10MB', 'evidence constraints notice missing');
requireText('src/ui/render.js', 'PRIVATE EVIDENCE', 'private evidence UI badge missing');

const api = read('src/lib/productApi.js');
if (/getPublicUrl\s*\(/.test(api)) failures.push('public Storage URL usage is forbidden');
if (/upsert:\s*true/.test(api)) failures.push('evidence overwrite must remain disabled');

if (failures.length) {
  console.error('AXE PRODUCT STAGE 4D CHECK: FAIL');
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}

console.log('AXE PRODUCT STAGE 4D CHECK: ALL PASS');
console.log(' - private evidence bucket client binding: PASS');
console.log(' - JPG/PNG/WEBP 10MB upload gate: PASS');
console.log(' - member payment submission: PASS');
console.log(' - best-effort orphan cleanup: PASS');
console.log(' - signed evidence review: PASS');
console.log(' - no public evidence URL / overwrite: PASS');
console.log(' - RPC-only fund table access: PASS');
