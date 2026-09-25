/* 把玩家可见的党派缩写标签改为中文译名(依据 brief「避免使用缩写」+ Q5「DVP 始终是人民党」)。
 * 只处理 {! !} 之外的行(即会渲染的行);图表数据字段("legend"/"name")保持拉丁。
 * 用法: node scripts/fix-party-labels-2.js
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

/* 行首标签位(可带 ** 强调):拉丁缩写 -> 中文 */
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
  ['Z', '中央党'],
];

let changed = [];
for (const f of walk(ROOT)) {
  if (!f.endsWith('.dry')) continue;
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  let inCode = false, n = 0;
  const out = lines.map(line => {
    if (line.includes('{!')) inCode = true;
    const was = inCode;
    if (line.includes('!}')) inCode = false;
    if (was) return line;                                  // 代码块内不动
    if (/^\s*(#|\/\/)/.test(line)) return line;            // 注释不动
    if (/"legend"|"name"/.test(line)) return line;         // 图表数据不动
    let s = line;
    // 1) 标签位缩写 -> 中文
    for (const [lat, zh] of LABELS) {
      const re = new RegExp('^(\\s*)(\\*{0,2})' + lat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s*[:：])');
      if (re.test(s)) { s = s.replace(re, '$1$2' + zh + '$3'); }
    }
    // 2) 行内插入变量 -> 显示层变量
    s = s.replace(/\[\+\s*ddp_name\s*\+\]/g, '[+ ddp_display +]')
          .replace(/\[\+\s*bvp_name\s*\+\]/g, '[+ bvp_display +]');
    if (s !== line) n++;
    return s;
  });
  if (n) { fs.writeFileSync(f, out.join('\n')); changed.push(rel + '  (' + n + ' 行)'); }
}
console.log('已修改 ' + changed.length + ' 个文件:');
changed.forEach(c => console.log('  ' + c));
