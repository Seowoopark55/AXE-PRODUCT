import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../src/',import.meta.url);
const main=fs.readFileSync(new URL('main.js',root),'utf8');
const render=fs.readFileSync(new URL('ui/render.js',root),'utf8');
const home=fs.readFileSync(new URL('ui/hubHome.js',root),'utf8');
let count=0;
function test(label,fn){fn();count++;process.stdout.write(`PASS ${label}\n`);}
const helper=main.slice(main.indexOf('// Subscription editor is draft-only'),main.indexOf("root.addEventListener('click',",main.indexOf('// Subscription editor is draft-only')));
const ctx={state:{platformSnapshot:[]},document:{createElement(tag){return {tag,children:[],append(...parts){this.children.push(...parts)},textContent:'',className:''}}},window:{},console,Date,Number,Intl};
vm.createContext(ctx);vm.runInContext(helper,ctx);
test('date arithmetic uses calendar days including leap year',()=>{
 assert.equal(ctx.addCalendarDays('2028-02-28',1),'2028-02-29');
 assert.equal(ctx.addCalendarDays('2028-02-29',1),'2028-03-01');
 assert.equal(ctx.addCalendarDays('2026-02-30',1),'');
});
function makeForm(row={company_id:'AXE',plan:'pro',subscription_status:'active',starts_at:'2026-09-07T00:00:00+09:00',ends_at:null,grace_until:null,memo:''}){
 ctx.state.platformSnapshot=[row];
 const vals={company_id:row.company_id,quick_days:'90',plan:row.plan,status:row.subscription_status,starts_at:row.starts_at?new Date(row.starts_at).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}):'',ends_at:row.ends_at?new Date(row.ends_at).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}):'',grace_until:row.grace_until?new Date(row.grace_until).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}):'',memo:row.memo};
 const elements=Object.fromEntries(Object.entries(vals).map(([k,v])=>[k,{value:v,disabled:false}]));
 const reviewLines={children:[],replaceChildren(){this.children=[]},append(node){this.children.push(node)}};
 const review={hidden:true,querySelector(){return reviewLines},scrollIntoView(){}};
 const submit={disabled:true};const note={textContent:''};const toggle={dataset:{nextStatus:row.subscription_status==='paused'?'active':'paused'}};
 const form={elements,dataset:{reviewSignature:''},querySelector(sel){if(sel==='[data-subscription-review]')return review;if(sel==='[data-subscription-submit]')return submit;if(sel==='[data-subscription-draft-message]')return note;if(sel==='[data-action="subscription-toggle-pause"]')return toggle;return null}};
 return {form,review,reviewLines,submit,note};
}
test('missing AXE end date cannot be auto-extended and no fields change',()=>{
 const {form}=makeForm(); const before=JSON.stringify(ctx.subscriptionDraft(form));
 assert.throws(()=>ctx.subscriptionQuickAction(form,'subscription-extend-period'),/종료일이 없는/);
 assert.equal(JSON.stringify(ctx.subscriptionDraft(form)),before);
});
test('new period changes only local draft, not persisted row',()=>{
 const row={company_id:'AXE',plan:'pro',subscription_status:'active',starts_at:'2026-09-07T00:00:00+09:00',ends_at:null,grace_until:null,memo:'preserve'};
 const {form,submit}=makeForm(row);
 ctx.subscriptionQuickAction(form,'subscription-new-period');
 assert.equal(form.elements.plan.value,'pro');assert.equal(form.elements.memo.value,'preserve');
 assert.match(form.elements.ends_at.value,/^\d{4}-\d{2}-\d{2}$/);
 assert.equal(row.ends_at,null);assert.equal(submit.disabled,true);
});
test('paused change is draft-only until reviewed and saved',()=>{
 const {form,submit}=makeForm();ctx.subscriptionQuickAction(form,'subscription-toggle-pause');
 assert.equal(form.elements.status.value,'paused');assert.equal(ctx.state.platformSnapshot[0].subscription_status,'active');assert.equal(submit.disabled,true);
});
test('review shows exact changes then invalidates when edited',()=>{
 const {form,review,reviewLines,submit}=makeForm();ctx.subscriptionQuickAction(form,'subscription-toggle-pause');
 ctx.subscriptionReview(form);assert.equal(review.hidden,false);assert.equal(submit.disabled,false);assert.ok(reviewLines.children.length>=1);
 form.elements.memo.value='edit';ctx.invalidateSubscriptionReview(form);assert.equal(submit.disabled,true);assert.equal(review.hidden,true);
});
test('legacy plan remains available rather than forced to internal',()=>{
 const idx=render.indexOf('function platformSubscriptionModal(state,m){');const end=render.indexOf('function companyDeleteModal(state,m){',idx);
 const txt=render.slice(idx,end);
 assert.match(txt,/const plan=String\(row.plan\|\|'standard'\)/);
 assert.match(txt,/\['legacy','기존 무제한 \(legacy\)'\]/);
 assert.match(txt,/기간형 이용권이지만 종료일이 없습니다/);
 assert.match(txt,/open-delete-company/);
});
test('both HUB/company account menus expose named close control',()=>{
 assert.match(home,/data-action="close-account-menu" aria-label="계정 메뉴 닫기"/);
 assert.match(render,/data-action="close-account-menu" aria-label="계정 메뉴 닫기"/);
 assert.match(main,/if\(action==='close-account-menu'\)/);
 assert.match(main,/hubProfile\.open=false/);
});
test('no subscription RPC is called by quick action or preview',()=>{
 const actions=main.slice(main.indexOf('function subscriptionQuickAction'),main.indexOf("root.addEventListener('click',",main.indexOf('function subscriptionQuickAction')));
 assert.doesNotMatch(actions,/updatePlatformSubscription|\.rpc\(|\.fetch\(/);
 assert.match(main,/form\.dataset\.reviewSignature!==signature/);
 assert.match(main,/const latest=\(await getPlatformCompanies\(\)\)/);
});
console.log(`Subscription UI safety checks: ${count}/${count} PASS`);
