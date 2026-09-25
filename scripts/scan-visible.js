/* 扫描用户可见字段中未翻译的英文:title / subtitle / unavailable-subtitle / 段落标题(= ...) / 选项标题
 * 用法: node scripts/scan-visible.js
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : o.push(p);
  }
  return o;
}

const ZH = /[\u4e00-\u9fff]/;
const FIELD = /^(title|subtitle|unavailable-subtitle)\s*:\s*(.*)$/;
const HEADING = /^=\s+(.*)$/;
const OPTION = /^-\s+@([\w-]+)\s*:\s*(.*)$/;

const out = { field: [], heading: [], option: [] };

for (const f of walk(path.join(root, 'source'))) {
  if (!f.endsWith('.dry')) continue;
  const rel = path.relative(root, f).split(path.sep).join('/');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let inCode = false;
  lines.forEach((line, i) => {
    if (line.includes('{!')) inCode = true;
    const was = inCode;
    if (line.includes('!}')) inCode = false;
    if (was) return;
    const strip = s => s.replace(/\{![\s\S]*?!\}/g, ' ')
                        .replace(/\[\?[^\]]*?:\s*/g, '').replace(/\?\]/g, ' ')
                        .replace(/\[\+\s*[\w.]+\s*\+?\]?/g, '0').replace(/[@#][\w.-]+/g, ' ');
    let m;
    if ((m = FIELD.exec(line))) {
      const v = strip(m[2]).trim();
      if (v && !ZH.test(v) && /[A-Za-z]{2}/.test(v)) out.field.push(rel + ':' + (i + 1) + '  ' + line.trim());
    } else if ((m = HEADING.exec(line))) {
      const v = strip(m[1]).trim();
      if (v && !ZH.test(v) && /[A-Za-z]{2}/.test(v)) out.heading.push(rel + ':' + (i + 1) + '  ' + line.trim());
    } else if ((m = OPTION.exec(line))) {
      const v = strip(m[2]).trim();
      if (v && !ZH.test(v) && /[A-Za-z]{2}/.test(v)) out.option.push(rel + ':' + (i + 1) + '  ' + line.trim());
    }
  });
}

const sec = (name, arr) => {
  console.log('\n===== ' + name + ' (' + arr.length + ') =====');
  arr.forEach(x => console.log(x));
};
sec('字段 title/subtitle', out.field);
sec('段落标题 =', out.heading);
sec('选项标题 @id:', out.option);
