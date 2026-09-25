/* 从编译产物 out/game.json 精确统计用户可见文本的汉化覆盖率。
 * 引擎渲染:title / subtitle / unavailableSubtitle / content(heading|paragraph) / option.title+subtitle
 * 用法: node scripts/coverage-json.js [--dump <sceneId>] [--list]
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const j = JSON.parse(fs.readFileSync(path.join(root, 'out/game.json'), 'utf8'));
const ZH = /[\u4e00-\u9fff]/;
const args = process.argv.slice(2);
const dumpIdx = args.indexOf('--dump');

/* 递归抽取富文本中的纯字符串片段,把 insert 片段替换成占位符 */
function flatten(node, out) {
  if (node == null) return;
  if (typeof node === 'string') { out.push(node); return; }
  if (Array.isArray(node)) { for (const n of node) flatten(n, out); return; }
  if (typeof node === 'object') {
    if (node.type === 'insert' || node.type === 'insert' || node.fn || node.qdisplay) { out.push('\u0001'); return; }
    if (node.content !== undefined) flatten(node.content, out);
    else if (node.type === 'paragraph' || node.type === 'heading') return;
  }
}
function textOf(node) {
  const parts = [];
  flatten(node, parts);
  return parts.join(' ').replace(/<[^>]+>/g, ' ').replace(/\u0001/g, 'X')
              .replace(/\{[^}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
}

const buckets = { title: [0, 0], heading: [0, 0], paragraph: [0, 0], option: [0, 0] };
const missing = { title: [], heading: [], paragraph: [], option: [] };

function tally(kind, node, id) {
  const t = textOf(node);
  const zhChars = (t.match(/[\u4e00-\u9fff]/g) || []).length;
  const enWords = (t.match(/[A-Za-z][A-Za-z'’-]{1,}/g) || []).length;
  // 视为“散文文本”的条件:含 ≥2 个汉字,或含 ≥2 个英文单词
  if (zhChars < 2 && enWords < 2) return;
  buckets[kind][1]++;
  if (ZH.test(t)) buckets[kind][0]++;
  else missing[kind].push(id + '  ' + t.slice(0, 130));
}

if (dumpIdx >= 0) {
  console.log(JSON.stringify(j.scenes[args[dumpIdx + 1]], null, 1).slice(0, 5000));
  process.exit(0);
}

/* 统一取出场景的 section 数组(兼容 content 为数组或 {content:[...]} 两种形态) */
function sectionsOf(sc) {
  const c = sc.content;
  if (Array.isArray(c)) return c;
  if (c && typeof c === 'object' && Array.isArray(c.content)) return c.content;
  return [];
}

for (const [id, sc] of Object.entries(j.scenes || {})) {
  tally('title', sc.title, id);
  for (const sec of sectionsOf(sc)) {
    if (!sec || sec.content === undefined) continue;
    if (sec.type === 'paragraph') tally('paragraph', sec.content, id);
    else if (sec.type === 'heading') tally('heading', sec.content, id);
  }
  for (const o of (sc.options || [])) {
    tally('option', o.title, id);
    tally('option', o.subtitle, id);
  }
}

let T = 0, Z = 0;
console.log('=== 编译产物可见文本覆盖率 ===');
for (const k in buckets) {
  console.log(k.padEnd(10) + buckets[k][0] + '/' + buckets[k][1] + '  ' +
    (100 * buckets[k][0] / (buckets[k][1] || 1)).toFixed(1) + '%');
  T += buckets[k][1]; Z += buckets[k][0];
}
console.log('总计      ' + Z + '/' + T + '  = ' + (100 * Z / T).toFixed(2) + '%');

const byScene = {};
for (const k in missing) for (const m of missing[k]) {
  const id = m.split('  ')[0];
  byScene[id] = (byScene[id] || 0) + 1;
}
console.log('\n未汉化最多的场景(前 40):');
Object.entries(byScene).sort((a, b) => b[1] - a[1]).slice(0, 40)
  .forEach(([k, v]) => console.log(String(v).padStart(5) + '  ' + k));
if (args.includes('--list')) {
  console.log('\n全部未汉化:');
  for (const k in missing) missing[k].forEach(x => console.log('[' + k + '] ' + x));
}
