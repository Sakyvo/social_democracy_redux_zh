/* 扫描 source/ 中未被翻译的英文残留。
 * 用法: node scripts/scan-untranslated.js [--dir <子路径>] [--top <n>]
 * 判定:一个"文本片段"(非代码、非键名、非变量)中不含任何 CJK 字符且含 >=2 个英文单词。
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = get('--dir', 'source');
const top = parseInt(get('--top', '40'), 10);
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
for (const f of walk(path.join(root, base))) {
  if (!f.endsWith('.dry')) continue;
  if (/credits\.scene\.dry$/.test(f)) continue; // 档案出处不译
  const rel = path.relative(root, f).replace(/\\/g, '/');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let inCode = false;
  lines.forEach((line, i) => {
    // 跟踪 {! ... !} 代码块
    if (line.includes('{!')) inCode = true;
    const wasCode = inCode;
    if (line.includes('!}')) inCode = false;
    if (wasCode) return;
    if (CODE.test(line)) return;
    // 去掉行内代码与标签
    const t = line.replace(/\{![\s\S]*?!\}/g, ' ').replace(/\[\?[^\]]*?:\s*/g, '')
                  .replace(/\?\]/g, ' ').replace(/\[\+[^\]]*?\]/g, '0').replace(/[@#][\w.-]+/g, ' ');
    if (/[\u4e00-\u9fff]/.test(t)) return;
    const words = t.match(/[A-Za-z][A-Za-z'’-]{1,}/g) || [];
    if (words.length >= 2) hits.push({ rel, line: i + 1, text: line.trim().slice(0, 110) });
  });
}

console.log('未翻译行数:' + hits.length + '\n');
const byFile = {};
for (const h of hits) byFile[h.rel] = (byFile[h.rel] || 0) + 1;
const sorted = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
console.log('按文件(前 ' + top + '):');
for (const [f, c] of sorted.slice(0, top)) console.log(String(c).padStart(5) + '  ' + f);
if (hits.length) {
  console.log('\n样例:');
  for (const h of hits.slice(0, 15)) console.log(h.rel + ':' + h.line + '  ' + h.text);
}