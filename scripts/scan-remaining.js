/* 精确扫描 source/ 中"玩家可见"的英文残留。
 * 判定:
 *  - .dry 文件中,# 开头 = 引擎注释(不渲染)。但 #subtitle: 是作者散文注解,计入待译。
 *  - 代码块 {! ... !} 内容跳过。
 *  - 属性键(如 view-if: / on-arrival:)整行跳过。
 *  - 纯代码/变量行(含 = ; ( ) [ ] + 等,dry 语言)跳过。
 *  - 统计:既无 CJK、又含 >=2 个英文单词的"散文片段"。
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = get('--dir', 'source/scenes');
const top = parseInt(get('--top', '200'), 10);
const cjk = /[\u3400-\u9fff\uf900-\ufaff]/;

// 引擎属性键(整行不是散文)
const PROPKEY = /^\s*([\w-]+)\s*:\s*\S/;

// 资产路径 / 内部 id 类注解,不译
const NONPROSE_COMMENT = /^#(card-image|face-image|go-to|todo|tags|max-visits|count-visits|count-visits-max|order|priority|frequency|id|signal|style)\s*:/;

function isProse(s) {
  // 跳过含 dry 代码符号的行
  if (/[{};]/.test(s)) return false;
  if (/^[-+@]/.test(s.trim())) return false;
  const words = s.match(/[A-Za-z][A-Za-z''-]*/g) || [];
  if (words.length < 2) return false;
  if (cjk.test(s)) return false;
  // 至少一个长单词,避免 "Govt Affairs" 这种 tag
  if (!words.some(w => w.length >= 3)) return false;
  return true;
}

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, o);
    else if (e.name.endsWith('.dry')) o.push(p);
  }
  return o;
}

const files = walk(path.join(root, dir));
let total = 0;
const perFile = [];
const samples = [];

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  // 移除代码块
  const stripped = raw.replace(/\{![\s\S]*?!\}/g, '');
  const lines = stripped.split(/\r?\n/);
  let n = 0;
  lines.forEach((line, i) => {
    let s = line.trim();
    if (!s) return;
    if (s.startsWith('#')) {
      if (NONPROSE_COMMENT.test(s)) return;
      // #subtitle: 散文注解
      const m = s.match(/^#\w[\w-]*:\s*(.*)$/);
      if (!m) return;
      s = m[1].trim();
    } else if (PROPKEY.test(line)) {
      // title/subtitle 以外的属性键整行跳过;title: 与 subtitle: 的值是散文
      if (!/^\s*(title|subtitle|unavailable-subtitle)\s*:/.test(line)) return;
      s = line.replace(/^\s*[\w-]+\s*:\s*/, '').trim();
    }
    if (isProse(s)) { n++; total++; if (samples.length < top) samples.push({ f: path.relative(root, f), i: i + 1, s }); }
  });
  if (n) perFile.push([path.relative(root, f), n]);
}

perFile.sort((a, b) => b[1] - a[1]);
console.log(`玩家可见英文残留片段总数: ${total}`);
console.log(`涉及文件: ${perFile.length}`);
console.log('\n按残留量排序(前 40):');
for (const [f, n] of perFile.slice(0, 40)) console.log(String(n).padStart(5), ' ', f);
console.log('\n样例:');
for (const s of samples) console.log(`${s.f}:${s.i}  ${s.s.slice(0, 110)}`);
