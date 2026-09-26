/* 精确统计「玩家可见散文」的英/中数量。
 *
 * 关键:场景文件里大量行是结构化内容,不是散文:
 *   - 属性行 view-if / on-arrival / go-to / tags / max-visits ...
 *   - 注释行 # / //
 *   - 场景引用行  @scene_id  与选项引用行  - @scene_id
 *   - {! ... !} 代码块(可跨行)
 * 只有 title / subtitle / unavailable-subtitle 的值、以及裸段落行才是玩家可见文本。
 *
 * 用法: node scripts/audit-prose.js [--list N] [--samples]
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'source', 'scenes');
const PROSE_KEYS = new Set(['title', 'subtitle', 'unavailable-subtitle']);
const ALLOW = /^(if|else|not|and|or|true|false|subtitle|title|image|img|src|href|http|https|www|com|jpg|jpeg|png|gif|svg|mp3|ogg|wav|scene|dry|js|css|html|svg|class|style|div|span|month|SPD|SAPD|KPD|DDP|DVP|DNVP|NSDAP|BVP|USPD|BB|ASPD|DNE|CSP|WP|Z|mod|bug|UIC|Discord|Reddit|Sburb|Homestuck|Voyager|AltJapan)$/i;

/** 逐行剥离 {! ... !} 代码块(含跨行),返回与输入等长的行数组。 */
function stripCodeLines(src) {
  const lines = src.split(/\r?\n/);
  let inCode = false;
  return lines.map((ln) => {
    if (inCode) {
      const end = ln.indexOf('!}');
      if (end === -1) return '';
      inCode = false;
      ln = ln.slice(end + 2);
    }
    let out = '';
    let rest = ln;
    for (;;) {
      const s = rest.indexOf('{!');
      if (s === -1) { out += rest; break; }
      out += rest.slice(0, s);
      const e = rest.indexOf('!}', s + 2);
      if (e === -1) { inCode = true; break; }
      rest = rest.slice(e + 2);
    }
    return out;
  });
}

/** 该行是否为「非散文」的结构行。 */
function isStructural(t) {
  if (!t) return true;
  if (t.startsWith('#') || t.startsWith('//')) return true;
  if (t.startsWith('@')) return true;                 // 场景引用
  if (/^-\s*@/.test(t)) return true;                  // 选项引用
  return false;
}

function walk(d) {
  let o = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) o = o.concat(walk(p));
    else if (e.name.endsWith('.dry')) o.push(p);
  }
  return o;
}

const hasCJK = (s) => /[\u4e00-\u9fff]/.test(s);
const latinWords = (s) => (s.match(/[A-Za-z]{3,}/g) || []).filter((w) => !ALLOW.test(w));

/* 非散文内容识别:这些行虽然含大量拉丁字母,但不是「未翻译的散文」。
   - HTML/CSS:内联样式与标签
   - 引用:书目/档案出处(依据决策不译)
   - 原文括注:资料库中 `*German original*` 形式,是有意保留的原文
   - 注释锚点:选项行里的 `- #comment` */
function isNonProse(t) {
  if (/<[a-z/][^>]*>/i.test(t)) return true;                       // HTML 标签
  if (/font-family|letter-spacing|font-weight|color:\s*rgb/i.test(t)) return true; // CSS
  if (/https?:\/\/|doi\.org|archive\.org|wikimedia|journals?\.|press\b/i.test(t)) return true; // 引用/链接
  if (/^\*[^*]+\*\s*[—-]/.test(t)) return true;                    // *German original* —— 形式
  // 书目条目 ``Author, First. ...``(可带 markdown 加粗/斜体标记)。
  // 依据决策「credits 里的档案出处保留原文以便溯源」,不计入未译散文。
  const bare = t.replace(/^[*_`]+/, '').replace(/[*_`]+$/, '');
  if (/^\p{Lu}[\p{L}'’.-]+,\s+\p{Lu}[\p{L}'’.-]*\./u.test(bare)) return true; // Berman, Sheri.
  if (/^(Das|Der|Die)\s/.test(bare)) return true;                     // 德文档案标题
  if (/^---?\./.test(bare)) return true;                             // 同上作者省略
  if (/^[^:]{1,40}\.(jpg|jpeg|png|gif|svg|webp):\s/.test(t)) return true; // 档案文件名引用
  if (/^-[#\s]/.test(t) || /^#/.test(t)) return true;               // 选项/注释锚点
  if (/\.(jpg|jpeg|png|gif|svg|webp|mp3|ogg|wav)\b/i.test(t)) return true; // 资产名
  return false;
}

/** 从一行取「可能是散文的片段」;返回 null 表示不是散文行。 */
function proseOf(maskedLine) {
  let t = maskedLine.trim();
  if (!t || isStructural(t)) return null;
  const m = t.match(/^([a-z][a-z_-]*):\s*(.*)$/i);
  if (m) {
    if (!PROSE_KEYS.has(m[1].toLowerCase())) return null;   // 结构化属性
    t = m[2];
    if (!t) return null;
  }
  // 去掉条件头,保留分支正文
  t = t
    .replace(/\[\?\s*(?:if|else)\b[^:?\]]*:/g, ' ')
    .replace(/\[\?\s*if\b[^?\]]*\?\]/g, ' ')
    .replace(/\[\?\s*\?\]/g, ' ');
  // 去掉变量插入 [+ var : fmt +]:引擎代码,不是散文
  t = t.replace(/\[\+[\s\S]*?\+\]/g, ' ');
  return t.trim() ? t : null;
}

const files = walk(root);
let totEn = 0, totZh = 0, clean = 0;
const dirty = [];
const samples = [];
const mixed = [];

for (const f of files) {
  const masked = stripCodeLines(fs.readFileSync(f, 'utf8'));
  let en = 0, zh = 0;
  masked.forEach((ml, i) => {
    const t = proseOf(ml);
    if (!t) return;
    if (isNonProse(t)) return;
    const lw = latinWords(t);
    if (lw.length < 3) return;
    if (hasCJK(t)) {
      zh++;
      mixed.push([f.replace(/\\/g, '/'), (i + 1) + ': ' + t]);
    } else {
      // credits 整场为档案出处,按范围决策保留原文,不计入门禁判据。
      if (!/credits\.scene\.dry$/.test(f)) { totEn++; en++; }
      if (samples.length < 200) samples.push([f.replace(/\\/g, '/'), (i + 1) + ': ' + t]);
    }
    // 中文计数:任何含 CJK 的散文行
  });
  // 单独统计中文行(不受上面的 early-return 影响)
  masked.forEach((ml) => {
    const t = proseOf(ml);
    if (!t || isNonProse(t)) return;
    if (hasCJK(t)) totZh++;
  });
  if (en === 0) clean++; else dirty.push([f.replace(/\\/g, '/'), en]);
}

const listN = (() => { const i = process.argv.indexOf('--list'); return i > -1 ? +process.argv[i + 1] : 20; })();
console.log('源场景文件: ' + files.length);
console.log('完全无英文残留的文件: ' + clean);
console.log('仍含「整行英文」的文件: ' + dirty.length);
console.log('整行英文合计: ' + totEn + '  (真正的未译散文)');
console.log('中文散文行合计: ' + totZh);
console.log('中英混排行(含有意保留的专名/原文括注): ' + mixed.length);
console.log('\nTop ' + listN + ' 残留:');
dirty.sort((a, b) => b[1] - a[1]).slice(0, listN).forEach(([f, n]) => console.log(String(n).padStart(5) + '  ' + f));
if (process.argv.includes('--samples')) {
  console.log('\n整行英文样本:');
  samples.slice(0, 40).forEach(([f, l]) => console.log('  ' + f + '\n    ' + l.slice(0, 160)));
}
if (process.argv.includes('--mixed')) {
  console.log('\n混排样本:');
  mixed.slice(0, 60).forEach(([f, l]) => console.log('  ' + f + '\n    ' + l.slice(0, 170)));
}

module.exports = { stripCodeLines, proseOf, latinWords, hasCJK, walk, isNonProse };

/* 退出码:0 = 无「整行英文」残留(credits 除外),1 = 有。
   作为 module 被 build 引用时不退出,只在直接运行时生效。 */
if (require.main === module) process.exit(totEn ? 1 : 0);
