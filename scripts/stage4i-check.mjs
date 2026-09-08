import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const api = fs.readFileSync(path.join(root, 'src/lib/productApi.js'), 'utf8');
const render = fs.readFileSync(path.join(root, 'src/ui/render.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = [
  [pkg.version === '0.9.0', 'web version is 0.9.0'],
  [api.includes("fund_admin_cancel_approval"), 'web cancel approval RPC client exists'],
  [render.includes("data-action=\"fund-cancel-approval\""), 'approved row exposes cancel button'],
  [render.includes("cancelled: '승인취소'"), 'cancelled status label exists'],
  [main.includes("action === 'fund-cancel-approval'"), 'web cancel handler exists'],
  [main.includes('await cancelFundApproval('), 'web cancel handler calls RPC'],
  [!api.includes(".from('fund_requests')") && !api.includes('.from("fund_requests")'), 'raw fund request table is not accessed directly'],
];
let failed = false;
for (const [ok, name] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log('ALL PASS');
