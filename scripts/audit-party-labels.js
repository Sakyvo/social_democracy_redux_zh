/* 枚举所有「党派标签行」:字面缩写(SPD:)与变量式([+ ddp_name +]:)。
 * 用法: node scripts/audit-party-labels.js
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

/* 标签位:行首(可带 ** 强调)后紧跟 拉丁缩写 / [+ var +] / 中文党名,再接冒号 */
const LAT = /^\s*\*{0,2}(SPD|SAPD|KPD|DDP|DStP|RDP|DVP|DNVP|NSDAP|BVP|BAP|ZCA|DNE|VONC|Z)\s*(?:\+\s*(?:BVP|Z)\s*)?[:：]/;
const VAR = /^\s*\*{0,2}\[\+\s*(\w+_name)\s*\+\]\s*[:：]/;
const ZH  = /^\s*\*{0,2}(共产党|社会民主党|社民党|社会主义工人党|中央党|民主党|德国民主党|人民党|国家人民党|纳粹党|巴伐利亚人民党|巴伐利亚工人党|中央基督教联盟|其他|无党籍)\s*[:：]/;

const rows = [];
for (const f of walk(ROOT)) {
  if (!f.endsWith('.dry')) continue;
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let inCode = false;
  const lat = [], v = [], zh = [];
  lines.forEach((l, i) => {
    if (l.includes('{!')) inCode = true;
    const was = inCode;
    if (l.includes('!}')) inCode = false;
    if (was || /^\s*(#|\/\/)/.test(l)) return;
    if (LAT.test(l)) lat.push(i + 1);
    else if (VAR.test(l)) v.push((i + 1) + ':' + l.trim().split(':')[0]);
    else if (ZH.test(l)) zh.push(i + 1);
  });
  if (lat.length || v.length || zh.length) rows.push({ rel, lat, v, zh });
}

const kinds = r => [r.lat.length ? '拉丁' : '', r.v.length ? '变量' : '', r.zh.length ? '中文' : ''].filter(Boolean);
const mixed = rows.filter(r => kinds(r).length > 1);
console.log('含党派标签的文件:' + rows.length + '  多体系并存:' + mixed.length);
console.log('\n=== 多体系并存(不一致) ===');
for (const r of mixed) {
  console.log('\n' + r.rel + '   体系:' + kinds(r).join('+'));
  if (r.lat.length) console.log('  拉丁  行: ' + r.lat.join(','));
  if (r.v.length) console.log('  变量  行: ' + r.v.join(' '));
  if (r.zh.length) console.log('  中文  行: ' + r.zh.join(','));
}
console.log('\n=== 单一体系 ===');
for (const r of rows.filter(x => kinds(x).length === 1)) {
  console.log('  ' + kinds(r)[0] + '  ' + String(r.lat.length + r.v.length + r.zh.length).padStart(3) + '  ' + r.rel);
}
