/* 统计编译产物中「党派标签」的中文/拉丁使用情况,验证一致性修复。
 * 用法: node scripts/verify-party-labels.js
 */
const fs = require('fs');
const path = require('path');
const j = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'out', 'game.json'), 'utf8'));

const LATIN = ['SPD', 'SAPD', 'KPD', 'DDP', 'DVP', 'DNVP', 'NSDAP', 'BVP', 'Z + BVP'];
const CHINESE = ['社民党', '社会民主党', '社会主义工人党', '共产党', '民主党', '人民党', '国家人民党', '纳粹党', '中央党', '巴伐利亚人民党'];

const latHits = [], zhHits = [];
for (const [id, sc] of Object.entries(j.scenes)) {
  const t = JSON.stringify(sc);
  for (const w of LATIN) {
    // 标签位: "XXX: " 紧邻(排除 chart data 的 "name": "SPD")
    const re = new RegExp('(?<!name\\\\": \\\\")(?<!legend\\\\": \\\\")' + w.replace(/[+]/g, '\\\\+') + ': ', 'g');
    const n = (t.match(re) || []).length;
    if (n) latHits.push([id, w, n]);
  }
  for (const w of CHINESE) {
    const re = new RegExp(w + ': ', 'g');
    const n = (t.match(re) || []).length;
    if (n) zhHits.push([id, w, n]);
  }
}

const sum = a => a.reduce((x, y) => x + y[2], 0);
console.log('=== 编译产物中的党派标签 ===');
console.log('拉丁缩写标签位总数: ' + sum(latHits));
console.log('中文党名标签位总数: ' + sum(zhHits));
if (latHits.length) {
  console.log('\n仍有拉丁标签位的场景:');
  const byScene = {};
  latHits.forEach(([id, w, n]) => { byScene[id] = (byScene[id] || 0) + n; });
  Object.entries(byScene).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + String(v).padStart(4) + '  ' + k));
}
