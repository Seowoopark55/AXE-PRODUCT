import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const checks=[];
const ok=(name,pass)=>checks.push([name,Boolean(pass)]);

const main=read('src/main.js');
const render=read('src/ui/render.js');
const api=read('src/lib/productApi.js');
const notifyApi=read('api/support/notify.js');
const setupApi=read('api/discord/setup/channels.js');
const migration=read('SUPABASE_MIGRATION_3_23_1_NATIVE_SUPPORT_BOARD.sql');
const security=read('server/discordSecurity.js');
const pages=read('src/styles/pages.css');
const management=read('src/styles/management.css');

ok('questions page is a first-class route', main.includes("'questions'") && render.includes("state.page === 'questions'"));
ok('support nav uses question board', render.includes("navItem(state,'questions','질문게시판')"));
ok('legacy usage guide launcher removed', !main.includes("action==='open-guide'") && !render.includes('사용 가이드') && !render.includes('guideCenterModal'));
ok('question board is available to active members', render.indexOf("state.page === 'questions'") < render.indexOf("if (!canAdmin(state))"));
ok('question board creates questions on site', api.includes('web_support_create_question') && main.includes("type==='support-question-create'"));
ok('question thread supports platform answer and author follow-up', api.includes('web_support_add_message') && render.includes('추가 질문 보내기') && render.includes('답변 등록 · 완료 처리') && migration.includes('추가 질문은 최초 질문 작성자만 등록할 수 있습니다.'));
ok('other company members get read-only FAQ view', migration.includes("'viewer_can_reply'") && render.includes('다른 멤버가 작성한 질문입니다.'));
ok('support remains available even when subscription is blocked', render.indexOf("state.page === 'questions'") < render.indexOf("['paused','expired']"));
ok('question state is stored in axe_product DB', migration.includes('axe_product.support_questions') && migration.includes('axe_product.support_question_messages'));
ok('platform owner has global support queue', api.includes('platform_support_list_questions') && render.includes('SUPPORT QUEUE'));
ok('platform dashboard surfaces unanswered support', render.includes('고객 질문 ${platformQuestions}건') && render.includes("page:'platform'"));
ok('site unread badge exists', migration.includes('customer_unread') && render.includes('nav-item__badge'));
ok('Discord is notification only', notifyApi.includes('질문에 답변이 등록되었습니다') && !fs.existsSync(path.join(root,'api/discord/questions.js')));
ok('guided setup does not create a question forum', !main.includes('questionForum') && !render.includes('질문게시판 · 포럼'));
ok('guided channel API creates regular text channels only', setupApi.includes("type: 0") && !setupApi.includes('QUESTION_STATUS_TAGS'));
ok('Manage Threads was removed again', security.includes("DISCORD_BOT_BASE_PERMISSIONS = '93200'") && !security.includes('MANAGE_THREADS'));
ok('question board styling exists', pages.includes('.axe-questions') && pages.includes('.support-thread-message'));
ok('platform support styling exists', management.includes('.platform-support-board') && management.includes('.platform-support-row'));

const failed=checks.filter(([,pass])=>!pass);
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} · ${name}`);
if(failed.length) process.exit(1);
console.log(`Native Question Board: ${checks.length}/${checks.length} PASS`);
