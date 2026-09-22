// Platform operator navigation / read-only dashboard / owner gate regression.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderShell} from '../src/ui/render.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/platform-center.css',import.meta.url),'utf8');
const base={envReady:true,ready:true,session:{user:{id:'operator',user_metadata:{name:'운영자'}}},companies:[],platformAdmin:true,page:'platform',platformView:'overview',platformSnapshot:[{company_id:'axe-id',company_name:'AXE',plan:'pro',subscription_status:'active'}],platformSupport:{counts:{pending:1,checking:0},items:[]},platformSuggestions:{counts:{pending:0,checking:0},items:[]},platformContentSettings:[{content_key:'lac_build',display_name:'LAC BUILD',is_published:true,is_free:true}],notice:'',error:'',modal:null};
const html=(state={})=>{const root={innerHTML:''};renderShell(root,{...base,...state});return root.innerHTML;};
for(const [view,expected] of Object.entries({overview:'운영 대시보드',companies:'회사별 구독 관리',contents:'콘텐츠 공개',support:'고객 질문',suggestions:'건의 · 제보'})){
 const out=html({platformView:view});
 assert.match(out,/platform-center__sidebar/);
 assert.match(out,/platform-center__nav-item/);
 assert.ok(out.includes(expected),`${view} content exists`);
 assert.match(out,/data-action="go-hub"/);
}
const dash=html();
assert.match(dash,/data-platform-view="overview"[^>]*aria-current="page"/);
assert.match(dash,/data-platform-view="companies"/);
assert.match(dash,/data-platform-view="contents"/);
assert.match(dash,/data-platform-view="support"/);
assert.doesNotMatch(dash,/data-action="toggle-platform-content"|data-action="edit-platform-subscription"/);
assert.match(html({platformView:'companies'}),/data-action="edit-platform-subscription"/);
assert.match(html({platformView:'contents'}),/data-action="toggle-platform-content"/);
assert.match(html({page:'layout'}),/data-action="layout-save"/);
assert.doesNotMatch(html({platformAdmin:false}),/platform-center__workspace|data-action="toggle-platform-content"/);
assert.match(main,/\['overview','companies','support','suggestions','contents'\]\.includes\(view\)/);
assert.match(main,/if\(state\.page!=='platform'&&state\.page!=='layout'\)state\.platformView='overview'/);
assert.match(main,/if\(state\.page!=='platform'\)\{navigatePrimaryScreen\('platform'\);localStorage\.setItem\('axe_product_page','platform'\);\}/);
assert.match(css,/\.platform-center__workspace \{[^}]*display:grid/);
assert.match(css,/@media \(max-width:820px\)/);
console.log('Platform admin shell stage 1: PASS (5 routes, read-only overview, existing actions, owner gate, responsive rail).');
