/* 修复 HTML 表格内嵌的党派标签:形如  !}KPD: {!</td>  —— 标签在代码块之外,玩家可见。
 * 依据:brief「对于党派/组织,避免使用缩写」+ Q5「DVP 始终是人民党,DNVP 始终是国家人民党」。
 * 用法: node scripts/fix-party-labels-3.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'source', 'scenes');

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : o.push(p);
  }
  return o;
}

/* 位于 !} 与 {! 之间的标签(HTML 表格单元格) */
const LABELS = [
  ['Z + BVP', '中央党 + 巴伐利亚人民党'],
  ['SAPD', '社会主义工人党'],
  ['SPD', '社民党'],
  ['KPD', '共产党'],
  ['DVP', '人民党'],
  ['DNVP', '国家人民党'],
  ['NSDAP', '纳粹党'],
  ['DDP', '民主党'],
  ['BVP', '巴伐利亚人民党'],
  ['ZCA', '中央基督教联盟'],
  ['DNE', '国家人民阵线'],
  ['Others', '其他'],
  ['Other', '其他'],
  ['BB', '巴伐利亚农民联盟'],
  ['Z', '中央党'],
];

let changed = [];
for (const f of walk(ROOT)) {
  if (!f.endsWith('.dry')) continue;
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  let n = 0;
  const out = lines.map(line => {
    if (/"legend"|"name"/.test(line)) return line;   // 图表数据字段保持拉丁
    let s = line;
    for (const [lat, zh] of LABELS) {
      const esc = lat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 紧跟在 !} 之后(可有空白/星号)的标签
      const re = new RegExp('(!\\}\\s*\\**\\s*)' + esc + '(\\s*\\**\\s*[:：])', 'g');
      if (re.test(s)) s = s.replace(re, '$1' + zh + '$2');
    }
    // HTML 表格里的插入变量 -> 显示层
    s = s.replace(/\[\+\s*ddp_name\s*\+\]/g, '[+ ddp_display +]')
         .replace(/\[\+\s*bvp_name\s*\+\]/g, '[+ bvp_display +]');
    if (s !== line) n++;
    return s;
  });
  if (n) { fs.writeFileSync(f, out.join('\n')); changed.push(rel + '  (' + n + ' 行)'); }
}
console.log('已修改 ' + changed.length + ' 个文件:');
changed.forEach(c => console.log('  ' + c));
