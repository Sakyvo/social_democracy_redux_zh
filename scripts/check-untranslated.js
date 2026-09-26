#!/usr/bin/env node
/* 权威未译检测:node check-untranslated.js <scenesDir>
 * 规则:
 *  - 跳过代码块 {! !}、注释(// #)、元数据指令(view-if/go-to/...)与纯 label 行
 *  - 文本行 = title/subtitle/unavailable-subtitle、"- @x: 文本" 选项、普通段落、以 "= " 开头的段落标题
 *  - 若剔除内联标签([+..+] [?..?] <span>)后仍含 >=2 个拉丁单词 → 判为未译
 */
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || process.env.ZH_ROOT || path.resolve(__dirname, '..', 'source', 'scenes');
function walk(d, o = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, o) : o.push(p); } return o; }

const CODE_START = /^\s*(\{!|\/\/|#)/;
const DIRECTIVE = /^\s*(view-if|choose-if|go-to|on-arrival|on-departure|new-page|tags|max-visits|frequency|audio|image|set|available-if|card-image|card_image|is-card|is-hand|is-deck|is-pinned-card|is-special|game-over|call|achievement|max-choices|priority|set-jump|set-bg|min-visits|section|vary|on-display|insert|delete|append|move|publish|unpublish|title-disable|title-class|subtitle-class|class|js|eval|view_if|face-image|face_image|view-ifs|choose-ifs|go-tos):\s*/;

function stripTags(s) {
  return s
    .replace(/\[[+?][^\]]*?:\s*/g, ' ').replace(/\[[+?][^\]]*?\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/[@#][\w.-]+/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ');
}
function isTextLine(l) {
  const t = l.trim();
  if (!t) return false;
  if (DIRECTIVE.test(t) && /^(title|subtitle|unavailable-subtitle):/.test(t)) return true;
  if (/^\s*(title|subtitle|unavailable-subtitle):/.test(l)) return true;
  if (/^\s*-\s*@[\w.-]+:/.test(l)) return true;
  if (/^\s*=\s/.test(l)) return true;
  if (/^\s*[A-Za-z0-9"'(\[]/.test(l) && !DIRECTIVE.test(l)) return true;
  return false;
}

let total = 0; const byfile = {};
for (const f of walk(ROOT).filter(x => x.endsWith('.dry'))) {
  if (/credits.scene.dry$/.test(f)) continue; // 参考文献按惯例保留原文
  if (/mod_info.scene.dry$/.test(f)) continue;
  const L = fs.readFileSync(f, 'utf8').split('\n');
  let inCode = false, n = 0;
  L.forEach((l, i) => {
    if (l.includes('{!')) inCode = true;
    const was = inCode;
    if (l.includes('!}')) inCode = false;
    if (was) return;
    if (CODE_START.test(l)) return;
    if (/^\s*(title|subtitle|unavailable-subtitle):\s*$/.test(l)) return;
    if (DIRECTIVE.test(l) && !/^\s*(title|subtitle|unavailable-subtitle):/.test(l)) return;
    if (!isTextLine(l)) return;
    if (/[\u4e00-\u9fff]/.test(l)) return;
    const words = (stripTags(l).match(/\b[A-Za-z][A-Za-z'\u2019-]{1,}\b/g) || []);
    if (words.length < 2) return;
    n++;
    if (process.env.VERBOSE) console.log(path.relative(ROOT, f).split(path.sep).join('/') + ':' + (i + 1) + ' | ' + l.trim().slice(0, 160));
  });
  if (n) { byfile[path.relative(ROOT, f).split(path.sep).join('/')] = n; total += n; }
}
console.log('未译文本行合计: ' + total);
for (const [k, v] of Object.entries(byfile).sort((a, b) => b[1] - a[1])) console.log('  ' + String(v).padStart(4) + '  ' + k);
process.exit(total ? 1 : 0);
