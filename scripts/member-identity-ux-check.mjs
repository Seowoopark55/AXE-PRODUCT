import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../src/lib/productApi.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function check(c,l){if(!c){console.error(`FAIL ${l}`);process.exitCode=1;}else console.log(`PASS ${l}`)}
check(!render.includes('PRODUCT STAGING'),'customer UI no longer exposes PRODUCT STAGING badge');
check(!render.includes('data-action="refresh" title="새로고침"'),'sidebar refresh button removed');
check(render.includes('Discord 표시명')&&render.includes('name="alias_name"'),'member detail separates Discord display name and alias');
check(render.includes('비우면 Discord 표시명 사용'),'alias fallback UX is explicit');
check(api.includes('discord_display_name,alias_name'),'membership identity layers are loaded');
check(api.includes('updateMembershipAlias'),'member alias mutation is wired');
check(main.includes('updateMembershipAlias(id,aliasName)'),'member form persists alias');
check(main.includes('suppressBrowserFormHistory'),'browser form history suppression is applied');
check(render.includes('name="category"')&&render.includes('autocomplete="off"'),'fund free-text category disables browser autocomplete');
check(html.includes('<title>AXE PRODUCT</title>')&&!html.includes('<title>AXE PRODUCT STAGING</title>'),'browser title is customer-facing');
if(!process.exitCode) console.log('AXE PRODUCT MEMBER IDENTITY UX CHECK: PASS');
