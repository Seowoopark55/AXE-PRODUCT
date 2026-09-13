import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const checks=[];
const ok=(name,pass)=>checks.push([name,Boolean(pass)]);

const main=read('src/main.js');
const render=read('src/ui/render.js');
const api=read('src/lib/productApi.js');
const questionApi=read('api/discord/questions.js');
const setupApi=read('api/discord/setup/channels.js');
const security=read('server/discordSecurity.js');
const pages=read('src/styles/pages.css');

ok('questions page is a first-class route', main.includes("'questions'") && render.includes("state.page === 'questions'"));
ok('support nav uses question board', render.includes("navItem(state,'questions','질문게시판')"));
ok('legacy usage guide launcher removed', !main.includes("action==='open-guide'") && !render.includes('사용 가이드') && !render.includes('guideCenterModal'));
ok('question board is available to active members', render.indexOf("state.page === 'questions'") < render.indexOf("if (!canAdmin(state))"));
ok('dashboard surfaces unanswered questions', render.includes('질문 답변') && render.includes("page:'questions'"));
ok('guided setup always plans a question forum', main.includes("key:'questionForum'") && main.includes("type:'forum'"));
ok('guided setup supports account lookup alongside question forum', main.includes("key:'accountLookup'") && main.includes('account_lookup_channel_id'));
ok('forum channel creation uses Discord forum type', setupApi.includes("item.type === 'forum' ? 15 : 0"));
ok('forum status tags exist', setupApi.includes('답변대기') && setupApi.includes('확인중') && setupApi.includes('답변완료'));
ok('question API lists Discord threads', questionApi.includes('/threads/active') && questionApi.includes('/threads/archived/public'));
ok('question API supports status updates', questionApi.includes("action === 'configure'") && questionApi.includes('applied_tags'));
ok('completion status attempts author DM', questionApi.includes('sendCompletionDm') && questionApi.includes("status === 'complete'"));
ok('client question API bridge exists', api.includes('getQuestionBoard') && api.includes('configureQuestionBoard') && api.includes('updateQuestionStatus'));
ok('Manage Threads is included without Administrator', security.includes('MANAGE_THREADS') && security.includes('Administrator (8) is intentionally not included'));
ok('question board styling exists', pages.includes('.axe-questions') && pages.includes('.axe-question-status'));

const failed=checks.filter(([,pass])=>!pass);
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} · ${name}`);
if(failed.length) process.exit(1);
console.log(`Question Board: ${checks.length}/${checks.length} PASS`);
