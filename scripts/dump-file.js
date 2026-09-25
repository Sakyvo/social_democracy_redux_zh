#!/usr/bin/env node
/* 输出指定文件的完整未译文本行(不截断),供翻译。
 * 用法: node dump-file.js <scenesDir> <file1> [file2 ...]  (file 相对 scenesDir)
 */
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2];
const files = process.argv.slice(3);
const CODE_START = /^\s*(\{!|\/\/|#)/;
const DIRECTIVE = /^\s*(view-if|choose-if|go-to|on-arrival|on-departure|new-page|tags|max-visits|frequency|audio|image|set|available-if|card-image|is-card|call|achievement|max-choices|priority|is-pinned-card|set-jump|set-bg|min-visits|section|vary|on-display|insert|delete|append|move|publish|unpublish|title-disable|title-class|subtitle-class|class|js|eval|view_if|face-image|face_image|game-over|is-special|is-deck|is-hand|card_image):\s*/;
function stripTags(s) {
  return s.replace(/\[[+?][^\]]*?:\s*/g, ' ').replace(/\[[+?][^\]]*?\]/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\{[^}]*\}/g, ' ')
    .replace(/[@#][\w.-]+/g, ' ').replace(/https?:\/\/\S+/g, ' ');
}
for (const rel of files) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) { console.log('!! missing ' + rel); continue; }
  const L = fs.readFileSync(f, 'utf8').split('\n');
  let inCode = false;
  L.forEach((l, i) => {
    if (l.includes('{!')) inCode = true;
    const was = inCode;
    if (l.includes('!}')) inCode = false;
    if (was) return;
    if (CODE_START.test(l)) return;
    if (DIRECTIVE.test(l) && !/^\s*(title|subtitle|unavailable-subtitle):/.test(l)) return;
    if (/^\s*(title|subtitle|unavailable-subtitle):\s*$/.test(l)) return;
    const isText = /^\s*(title|subtitle|unavailable-subtitle):/.test(l) || /^\s*-\s*@[\w.-]+:/.test(l) || /^\s*=\s/.test(l) || /^\s*[A-Za-z0-9"'(\[]/.test(l);
    if (!isText) return;
    if (/[\u4e00-\u9fff]/.test(l)) return;
    const words = (stripTags(l).match(/\b[A-Za-z][A-Za-z'\u2019-]{1,}\b/g) || []);
    if (words.length < 2) return;
    console.log('@@' + rel + ':' + (i + 1));
    console.log(l);
  });
}
