/* 完整性核对:逐文件比较 origin 的散文行数与 zh 的已译行数。
 * origin 散文行 = 非代码块、非属性键、非注释、非 @id/选项引用、含 >=3 英文单词的行。
 * 输出:翻译覆盖率 < 80% 的"可疑未完成"文件。
 */
const fs = require('fs');
const path = require('path');
const { resolveEnRoot } = require('./lib-en-root');
const ZH = path.resolve(__dirname, '../source');
/* origin 源:优先 EN_ROOT,其次仓库同级 ../origin/<game>/source(见 lib-en-root.js)。
   项目名可用 ORIGIN_GAME 覆盖,默认 social_democracy_redux。 */
const ORIG = resolveEnRoot(path.resolve(__dirname, '..'));
const cjk = /[\u3400-\u9fff]/;

function proseLines(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\{![\s\S]*?!\}/g, '');
  const out = [];
  for (let line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('#') || t.startsWith('@') || t.startsWith('- @') || t.startsWith('=')) continue;
    if (/^[\w-]+\s*:/.test(t)) continue;          // 属性键
    if (/^[-+]/.test(t)) continue;                 // 选项/列表标记(单行选项标题另计)
    if (/[{};]/.test(t)) continue;                 // 代码
    const words = t.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
    if (words.length >= 3) out.push(t);
  }
  return out;
}

function zhCjkLines(file) {
  let n = 0;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (cjk.test(line)) n++;
  }
  return n;
}

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, o);
    else if (e.name.endsWith('.dry')) o.push(p);
  }
  return o;
}

const files = walk(ORIG);
const rows = [];
for (const f of files) {
  const rel = path.relative(ORIG, f);
  const zf = path.join(ZH, rel);
  if (!fs.existsSync(zf)) { rows.push([rel, '缺文件', 0, 0]); continue; }
  const op = proseLines(f).length;
  const zc = zhCjkLines(zf);
  if (op >= 3) rows.push([rel, '', op, zc]);
}
rows.sort((a, b) => (a[3] / (a[2] || 1)) - (b[3] / (b[2] || 1)));
const bad = rows.filter(r => r[2] >= 3 && r[3] / r[2] < 0.8);
console.log(`origin 文件: ${files.length}, 有散文的文件: ${rows.length}`);
console.log(`覆盖率 <80% 的可疑文件: ${bad.length}\n`);
for (const [rel, note, op, zc] of bad) {
  console.log(String(Math.round(100 * zc / op)).padStart(4) + '%  ', rel, `(origin 散文 ${op} 行 / zh 含中文 ${zc} 行)`, note);
}
// 退出码语义:0=无可疑文件。缺文件或覆盖率 <80% 即失败。
process.exit(bad.length ? 1 : 0);
