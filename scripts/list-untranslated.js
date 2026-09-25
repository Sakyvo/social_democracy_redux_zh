/* 列出 source/ 中未翻译的英文残留行(逐行,含行号)。
 * 用法: node scripts/list-untranslated.js
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const CODE = /^\s*(\{!|!?\}|if |else|for |var |let |const |Q\.|this\.|function |\/\/|#(?!\w)|[A-Za-z_][\w-]*\s*:|\}|\))/;

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : o.push(p);
  }
  return o;
}

const hits = [];
for (const f of walk(path.join(root, 'source'))) {
  if (!f.endsWith('.dry')) continue;
  if (/credits\.scene\.dry$/.test(f)) continue;
  const rel = path.relative(root, f).split(path.sep).join('/');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let inCode = false;
  lines.forEach((line, i) => {
    if (line.includes('{!')) inCode = true;
    const wasCode = inCode;
    if (line.includes('!}')) inCode = false;
    if (wasCode) return;
    if (CODE.test(line)) return;
    const t = line.replace(/\{![\s\S]*?!\}/g, ' ').replace(/\[\?[^\]]*?:\s*/g, '')
                  .replace(/\?\]/g, ' ').replace(/\[\+[^\]]*?\]/g, '0').replace(/[@#][\w.-]+/g, ' ');
    if (/[\u4e00-\u9fff]/.test(t)) return;
    const words = t.match(/[A-Za-z][A-Za-z'’-]{1,}/g) || [];
    if (words.length >= 2) hits.push(rel + ':' + (i + 1) + '|' + line.trim());
  });
}
console.log('未翻译行数:' + hits.length);
hits.forEach(h => console.log(h));
