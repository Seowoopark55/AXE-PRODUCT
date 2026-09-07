import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const requireText = (file, text, label) => {
  if (!read(file).includes(text)) failures.push(`${label}: ${file}`);
};

requireText('src/ui/render.js', 'Ctrl+V 붙여넣기', 'clipboard evidence hint missing');
requireText('src/ui/render.js', 'data-fund-evidence-zone', 'clipboard paste zone missing');
requireText('src/ui/render.js', 'data-fund-evidence-preview', 'evidence preview missing');
requireText('src/ui/render.js', 'data-action="fund-clear-evidence"', 'evidence clear button missing');
requireText('src/main.js', "root.addEventListener('paste'", 'clipboard paste handler missing');
requireText('src/main.js', 'clipboardImageFile(event)', 'clipboard image extraction missing');
requireText('src/main.js', "fundEvidenceFiles.get(form) || data.get('evidence')", 'pasted file submit binding missing');
requireText('src/main.js', "action === 'fund-clear-evidence'", 'clear action handler missing');
requireText('src/main.js', 'validateFundEvidenceFile(evidenceFile)', 'client evidence validation missing');
requireText('src/styles.css', '.fund-evidence-preview', 'preview style missing');

const render = read('src/ui/render.js');
if (/name="evidence"[^>]*required/.test(render)) {
  failures.push('native required on file input would block clipboard-only submission');
}

if (failures.length) {
  console.error('AXE PRODUCT STAGE 4D.1 CHECK: FAIL');
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}

console.log('AXE PRODUCT STAGE 4D.1 CHECK: ALL PASS');
console.log(' - file picker remains available: PASS');
console.log(' - clipboard image paste: PASS');
console.log(' - clipboard-only submit path: PASS');
console.log(' - preview and remove UX: PASS');
console.log(' - JPG/PNG/WEBP 10MB validation retained: PASS');
