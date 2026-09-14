import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=[
  'index.html','src/ui/render.js','src/main.js',
  'api/discord/setup/channels.js','api/support/notify.js','api/suggestions/notify.js'
].map(p=>[p,read(p)]);
const failures=[];
for(const [p,s] of runtime){
  if(s.includes('AXE PRODUCT')) failures.push(`${p}: legacy customer brand remains`);
}
const render=read('src/ui/render.js');
const main=read('src/main.js');
const html=read('index.html');
const supabase=read('src/lib/supabase.js');
const server=read('server/supabaseUser.js');
if(!html.includes('<title>AXE ONE</title>')) failures.push('browser title is not AXE ONE');
if(!render.includes('<strong>AXE ONE</strong>')) failures.push('app shell brand is not AXE ONE');
if(!main.includes('AXE ONE 멤버 등록 요청')) failures.push('registration copy is not AXE ONE');
if(!/schema:\s*['\"]axe_product['\"]/.test(supabase)) failures.push('internal Supabase schema changed unexpectedly');
if(!server.includes("'Accept-Profile': 'axe_product'")) failures.push('internal API schema profile changed unexpectedly');
if(failures.length){console.error('AXE ONE BRAND CHECK: FAIL');for(const f of failures)console.error(' - '+f);process.exit(1);}
console.log('AXE ONE BRAND CHECK: PASS');
