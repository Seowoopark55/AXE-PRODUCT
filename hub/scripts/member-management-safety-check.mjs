import assert from 'node:assert/strict';
import fs from 'node:fs';
import { memberChanges } from '../src/lib/memberChanges.js';

const row = {
  id: 'member-1', company_id: 'company-1', role: 'member', status: 'active',
  alias_name: '별칭', employment_started_on: null, member_note: null,
};
const owner = {...row, role:'owner'};
const draft = (overrides={}) => new Map(Object.entries({
  role:'member', status:'active', alias_name:'별칭',
  employment_started_on:'', member_note:'', ...overrides,
}));
assert.deepEqual(memberChanges(row, draft()), {}, 'unchanged editor makes no UPDATE');
assert.deepEqual(memberChanges(row,draft({alias_name:' 새 별칭 ',member_note:' 참고 ',employment_started_on:'2026-09-24'})), {
  alias_name:'새 별칭',employment_started_on:'2026-09-24',member_note:'참고',
}, 'changes are normalized into one payload');
assert.deepEqual(memberChanges(row,draft({alias_name:' '})), {alias_name:null}, 'clear alias saves null');
assert.deepEqual(memberChanges(row,draft({status:'left'})), {status:'left'}, 'departure is distinguishable for confirmation');
assert.throws(()=>memberChanges(row,draft({role:'owner'})),/대표 권한/, 'cannot promote member to owner');
assert.deepEqual(memberChanges(owner,draft({role:'owner'})),{},'owner info can remain unchanged');
assert.throws(()=>memberChanges(owner,draft({role:'admin'})),/대표 계정/, 'cannot demote owner');
assert.throws(()=>memberChanges(owner,draft({role:'owner',status:'left'})),/대표 계정/, 'cannot retire owner');
assert.deepEqual(memberChanges(owner,draft({role:'owner',member_note:'memo'})), {member_note:'memo'}, 'owner memo remains editable');
assert.throws(()=>memberChanges(row,draft({status:'bogus'})),/역할과 상태/, 'unknown status rejected');

const main=fs.readFileSync(new URL('../src/main.js', import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../src/lib/productApi.js', import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js', import.meta.url),'utf8');
assert.match(main,/if \(changes\.status === 'left'\)[\s\S]+?accepted = await confirmHubDeletion[\s\S]+?if \(!accepted[\s\S]+?await withMutation/, 'departure confirmation happens before mutation');
assert.match(main,/async function closeModal[\s\S]+?memberChanges\(row, new FormData\(form\)\)[\s\S]+?confirmHubDeletion/, 'dirty close requires confirmation');
assert.match(main,/event\.key==='Escape' && state\.modal\?\.type==='member'/, 'Esc close shares discard guard');
assert.match(api,/export async function updateMembershipDetails[\s\S]+?\.update\(changes\)[\s\S]+?\.eq\('company_id', companyId\)[\s\S]+?\.eq\('role', original\.role\)[\s\S]+?\.eq\('status', original\.status\)/,'one guarded membership UPDATE');
assert.match(render,/isOwner\?`<input value="대표" readonly/, 'owner role read-only');
assert.match(render,/\['admin','manager','member'\]\.map/, 'owner excluded from role choices');
console.log('MEMBER MANAGEMENT SAFETY CHECK: PASS (10 behavior cases + 6 source guards)');
