import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'src');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(src).filter((f) => /\.(js|css|html)$/.test(f));
const failures = [];

const forbidden = [
  ['service role secret reference', /service[_-]?role/i],
  ['NEW AXE NET schema reference', /new_axe_net/i],
  ['AXE HUB public profile query', /\.from\(\s*['"]profiles['"]\s*\)/],
  ['AXE HUB public builds query', /\.from\(\s*['"]builds['"]\s*\)/],
  ['hardcoded Supabase service JWT', /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/],
];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) failures.push(`${label}: ${path.relative(root, file)}`);
  }
}

const supabaseFile = path.join(src, 'lib', 'supabase.js');
const supabaseText = fs.readFileSync(supabaseFile, 'utf8');

if (!/schema:\s*['"]axe_product['"]/.test(supabaseText)) {
  failures.push('Supabase client is not locked to axe_product schema.');
}

if (failures.length) {
  console.error('AXE PRODUCT SOURCE CHECK: FAIL');
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}

console.log('AXE PRODUCT SOURCE CHECK: PASS');
console.log(`Checked ${files.length} source files.`);
console.log(' - axe_product schema lock: PASS');
console.log(' - service role secret reference: PASS');
console.log(' - NEW AXE NET reference: PASS');
console.log(' - AXE HUB public app-table query: PASS');
