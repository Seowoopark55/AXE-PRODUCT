import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const exists=(p)=>fs.existsSync(path.join(root,p));
const index=read('index.html');
const main=read('src/main.js');
const render=read('src/ui/render.js');
const sw=read('public/sw.js');
const manifest=JSON.parse(read('public/manifest.webmanifest'));
const checks=[
  ['manifest linked', /rel="manifest" href="\/manifest\.webmanifest"/.test(index)],
  ['standalone manifest', manifest.display==='standalone' && manifest.start_url?.startsWith('/') && manifest.scope==='/'],
  ['192 icon exists', exists('public/icons/icon-192.png')],
  ['512 icon exists', exists('public/icons/icon-512.png')],
  ['maskable icon exists', exists('public/icons/icon-maskable-512.png') && manifest.icons?.some(x=>x.purpose==='maskable')],
  ['offline page exists', exists('public/offline.html')],
  ['service worker registered', /serviceWorker\.register\('\/sw\.js'/.test(main)],
  ['install prompt handled', /beforeinstallprompt/.test(main) && /data-action="install-app"/.test(render)],
  ['app installed handled', /appinstalled/.test(main)],
  ['update waiting flow handled', /updateAvailable/.test(main) && /SKIP_WAITING/.test(sw) && /apply-app-update/.test(render)],
  ['online offline state handled', /addEventListener\('offline'/.test(main) && /addEventListener\('online'/.test(main)],
  ['operational api explicitly excluded from cache', /pathname\.startsWith\('\/api\/'\)/.test(sw)],
  ['external traffic excluded from cache', /url\.origin !== self\.location\.origin/.test(sw)],
  ['navigation network first', /networkFirstNavigation/.test(sw)],
  ['last page persists across app restarts', /localStorage\.getItem\('axe_product_page'\)/.test(main) && /localStorage\.setItem\('axe_product_page'/.test(main)],
  ['critical boot splash present', /pwa-boot/.test(index)],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} - ${name}`);if(ok)pass++;}
console.log(`PWA app experience: ${pass}/${checks.length} PASS`);if(pass!==checks.length)process.exit(1);
