import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const requireText = (file, text, label) => {
  if (!read(file).includes(text)) failures.push(`${label}: ${file}`);
};

for (const file of ['src/main.js', 'src/lib/productApi.js', 'src/ui/render.js']) {
  const text = read(file);
  if (/\.from\(\s*['"]fund_/i.test(text)) {
    failures.push(`direct fund table access is forbidden: ${file}`);
  }
}

for (const rpc of [
  'fund_get_my_periods',
  'fund_admin_list_requests',
  'fund_admin_get_period_status',
  'fund_admin_review_request',
  'fund_admin_set_fee_rule',
]) {
  requireText('src/lib/productApi.js', rpc, `missing fund RPC ${rpc}`);
}

if (read('src/lib/productApi.js').includes('fund_submit_request')) {
  failures.push('member web submission must remain excluded until evidence storage stage');
}

requireText('src/main.js', "['overview', 'fund', 'members'", 'fund view is not registered');
requireText('src/main.js', "module_key === 'fund'", 'fund module gate missing');
requireText('src/main.js', "['approve', 'hold', 'reject']", 'fund review action gate missing');
requireText('src/ui/render.js', "navItem('fund', '공금'", 'fund navigation missing');
requireText('src/ui/render.js', '주차별 공금 현황', 'admin period UI missing');
requireText('src/ui/render.js', '주간 공금액 설정', 'fee rule UI missing');
requireText('src/ui/render.js', '내 공금 현황', 'member fund UI missing');
requireText('src/ui/render.js', '증빙 저장소를 연결한 다음 단계', 'submission deferral notice missing');

if (failures.length) {
  console.error('AXE PRODUCT STAGE 4C CHECK: FAIL');
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}

console.log('AXE PRODUCT STAGE 4C CHECK: ALL PASS');
console.log(' - fund menu + module gate: PASS');
console.log(' - member own-period read UI: PASS');
console.log(' - OWNER/ADMIN period status UI: PASS');
console.log(' - OWNER/ADMIN fee rule UI: PASS');
console.log(' - OWNER/ADMIN review UI: PASS');
console.log(' - RPC-only fund access: PASS');
console.log(' - no member submission before evidence storage: PASS');
