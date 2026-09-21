import assert from 'node:assert/strict';
import { renderShell } from '../src/ui/render.js';
import { HUB_CONTENT } from '../src/platform/catalog.js';

const base = () => ({
  envReady: true, ready: true, loading: false, page: 'hub',
  session: { user: { id:'u1',user_metadata:{full_name:'테스트 <사용자>'} } },
  companies: [], companyId: null, memberships: [], canCreateCompany: true,
  platformAdmin: false, modal: null, error:'',notice:'',
});
const html = (state) => { const root={innerHTML:''};renderShell(root,state);return root.innerHTML; };
const noCompany = html(base());
assert.match(noCompany,/class="hub-home"/);
assert.match(noCompany,/data-action="open-company-start"/);
assert.match(noCompany,/data-action="logout"/);
assert.doesNotMatch(noCompany,/class="workspace-shell"/);
assert.match(noCompany,/무료 이용 정책 확정/);
assert.match(noCompany,/회사 가입 없이 이용 · 연결 준비 중/);
assert.doesNotMatch(noCompany,/data-action="open-build"|href="[^"]*build/);
assert.match(noCompany,/테스트 &lt;사용자&gt;/);
assert.doesNotMatch(noCompany,/테스트 <사용자>/);
const joined = html({...base(),companies:[{id:'c1',name:'우리 회사'}],companyId:'c1'});
assert.match(joined,/data-action="open-company-console"/);
assert.match(joined,/우리 회사/);
const onboarding = html({...base(),page:'company-start'});
assert.match(onboarding,/회사 개설 코드를 발급받아야/);
assert.match(onboarding,/data-action="go-hub"/);
const consoleHtml = html({...base(),page:'dashboard',companies:[{id:'c1',name:'우리 회사'}],companyId:'c1',memberships:[{user_id:'u1',role:'owner'}]});
assert.match(consoleHtml,/class="workspace-shell"/);
assert.match(consoleHtml,/data-action="go-hub"/);
assert.match(consoleHtml,/data-action="open-company-console" aria-label="회사 관리 대시보드로 이동"/);
assert.match(consoleHtml,/class="global-hub-return" data-action="go-hub"/);
assert.match(consoleHtml,/<strong>회사 관리<\/strong><\/span>/);
assert.doesNotMatch(consoleHtml,/OPERATIONS CONSOLE/);
const platformPage = html({...base(),platformAdmin:true,page:'platform'});
assert.match(platformPage,/<strong>서비스 관리<\/strong><small>LAC HUB · PLATFORM<\/small>/);
const platformNoCompany = html({...base(),platformAdmin:true});
assert.match(platformNoCompany,/data-action="open-platform-admin"/);
const platformConsole = html({...base(),platformAdmin:true,page:'platform'});
assert.match(platformConsole,/class="workspace-shell"/);
assert.equal(HUB_CONTENT.build.defaultFree,true);
assert.equal(HUB_CONTENT.company.phase,'existing');
console.log('LAC HUB phase 1: 18 assertions PASS (rendering, companyless entry, preserved console and pending content labels).');
