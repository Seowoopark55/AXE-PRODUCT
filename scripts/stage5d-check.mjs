import fs from 'node:fs';

const files = {
  api: fs.readFileSync(new URL('../src/lib/productApi.js', import.meta.url), 'utf8'),
  main: fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'),
  render: fs.readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8'),
  css: fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8'),
};

const checks = [
  ['product config read rpc', files.api.includes("ammo_get_product_config")],
  ['product config save rpc', files.api.includes("ammo_admin_save_product_config")],
  ['weekday picker', files.render.includes('weekday-picker')],
  ['ammo catalog settings', files.render.includes('ammo_catalog') && files.render.includes('회사 별칭')],
  ['default ammo', files.render.includes('default_ammo_key')],
  ['no visible manual round form', !files.render.includes('data-form="ammo-round-open"')],
  ['chat-first copy', files.render.includes('1줄2세트') && files.render.includes('Discord 중심')],
  ['alias save handler', files.main.includes('ammo_alias_') && files.main.includes('enabledAmmoKeys')],
  ['stage5d css', files.css.includes('STAGE 5D · AXE NET-style ammo product settings')],
];
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) process.exitCode = 1;
}
if (!process.exitCode) console.log('ALL PASS');
