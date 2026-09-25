/* 混排检测:找出编译产物中「中英混排」的可见文本(英文散文片段 + 中文堆在同一段)。
 * 这类行会被「含中文即算已译」的检查漏掉,是历史上一类真实 bug。
 * 用法: node scripts/audit-mixed.js
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const j = JSON.parse(fs.readFileSync(path.join(root, 'out/game.json'), 'utf8'));

/* 连续 >=3 个英文单词(含空格)才视为「英文散文片段」,避免专名/缩写误报 */
const EN_RUN = /(?:\b[A-Za-z][A-Za-z'’-]{0,}\b[\s,]*){3,}/g;

function sectionsOf(sc, out = []) {
  const walk = n => {
    if (n == null) return;
    if (Array.isArray(n)) { for (const x of n) walk(x); return; }
    if (typeof n !== 'object') return;
    if (n.type === 'paragraph' || n.type === 'heading') { out.push(n); return; }
    if (n.content !== undefined) walk(n.content);
  };
  walk(sc.content);
  return out;
}
function textOf(node) {
  const parts = [];
  (function f(x) {
    if (x == null) return;
    if (typeof x === 'string') { parts.push(x); return; }
    if (Array.isArray(x)) { x.forEach(f); return; }
    if (typeof x === 'object') {
      if (x.type === 'insert' || x.fn || x.qdisplay) { parts.push('\u0001'); return; }
      if (x.content !== undefined) f(x.content);
    }
  })(node);
  return parts.join(' ').replace(/<[^>]+>/g, ' ').replace(/\u0001/g, ' 0 ').replace(/\s+/g, ' ').trim();
}

/* 有意保留原文的位置:资料库党名条目采用「德文原名(中文名)」体例,
 * 属于术语表允许的「正式介绍党名的资料库条目」。 */
const ALLOW = [/^library\.parties$/];

const hits = [];
function check(kind, node, id) {
  if (ALLOW.some(re => re.test(id))) return;
  const t = textOf(node);
  if (!/[\u4e00-\u9fff]/.test(t)) return;      // 纯中文/无中文都不算混排
  const runs = t.match(EN_RUN) || [];
  const bad = runs.filter(r => (r.match(/\b[A-Za-z][A-Za-z'’-]{1,}\b/g) || []).length >= 3);
  if (bad.length) hits.push('[' + kind + '] ' + id + '  ' + t.slice(0, 150));
}

for (const [id, sc] of Object.entries(j.scenes || {})) {
  if (/^credits/.test(id)) continue;           // 出处条目按约定保留原文
  check('title', sc.title, id);
  for (const sec of sectionsOf(sc)) check(sec.type, sec.content, id);
  for (const o of (sc.options || [])) { check('option', o.title, id); check('option', o.subtitle, id); }
}
console.log('中英混排可见文本:' + hits.length);
hits.forEach(h => console.log(h));
