#!/usr/bin/env node
/* 按「行首特征」替换整行,规避行尾空白差异。
 * 用法: node replace-line.js <spec.json> <rootScenesDir>
 * spec: { "files": { "rel/path.dry": [ ["<行首特征(>=25字符)>", "<新整行>"], ... ] } }
 */
const fs = require('fs'), path = require('path');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const root = process.argv[3];
function find(name) {
  const stack = [root];
  while (stack.length) { const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p); else if (e.name === name) return p;
    } }
  return null;
}
let tot = 0, miss = [];
for (const [name, pairs] of Object.entries(spec.files || spec)) {
  const p = fs.existsSync(path.join(root, name)) ? path.join(root, name) : find(name);
  if (!p) { miss.push(name + ' (未找到)'); continue; }
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  let n = 0;
  for (const [prefix, repl] of pairs) {
    const idx = lines.findIndex(l => l.startsWith(prefix));
    if (idx >= 0) { lines[idx] = repl; n++; } else miss.push(name + ' :: ' + prefix.slice(0, 50));
  }
  fs.writeFileSync(p, lines.join('\n'));
  console.log('  ' + name + '  ' + n + '/' + pairs.length);
  tot += n;
}
console.log('total ' + tot + ', miss ' + miss.length);
miss.slice(0, 12).forEach(m => console.log('   MISS ' + m));
