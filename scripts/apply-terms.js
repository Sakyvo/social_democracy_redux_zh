/* 批量应用译文:node scripts/apply-terms.js <json文件>
 * JSON 形如:
 *   { "global": [[from,to],...],
 *     "files": { "events/x.scene.dry": [[from,to],...],
 *                "party_affairs/*": [[from,to],...] } }
 * global 数组会先应用到 source/ 下所有 .dry;
 * files 的 key 相对 source/scenes/ 目录,支持 * 通配。
 * 相同 from 出现多次时全部替换。缺失的 from 会被报告。
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'source');
const specPath = process.argv[2];
if (!specPath) { console.error('用法: node scripts/apply-terms.js <json文件>'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : o.push(p);
  }
  return o;
}
const all = walk(root).filter(f => f.endsWith('.dry'));

const applyTo = (file, pairs, label) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  let n = 0; const miss = [];
  for (const [a, b] of pairs) {
    if (a === b) continue;
    if (!s.includes(a)) { miss.push(a.slice(0, 40)); continue; }
    s = s.split(a).join(b); n++;
  }
  fs.writeFileSync(file, s);
  const rel = path.relative(root, file).replace(/\\/g, '/');
  console.log('  ' + rel.padEnd(48) + n + '/' + pairs.length + (miss.length ? '  MISS: ' + miss.join(' | ') : ''));
  return { n, miss: miss.length };
};

if (spec.global) {
  console.log('GLOBAL');
  let tot = 0, miss = 0;
  for (const f of all) { const r = applyTo(f, spec.global, 'global'); tot += r.n; miss += r.miss; }
  console.log('  合计替换 ' + tot + ' 处,未匹配 ' + miss + ' 处');
}
if (spec.files) {
  console.log('FILES');
  for (const [key, pairs] of Object.entries(spec.files)) {
    const targets = key.includes('*')
      ? all.filter(f => new RegExp('^' + key.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
          .test(path.relative(root, f).replace(/\\/g, '/').replace(/^scenes\//, '')))
      : [path.join(root, 'scenes', key)];
    for (const t of targets) {
      if (!fs.existsSync(t)) { console.log('  ' + key + ' → 文件不存在'); continue; }
      applyTo(t, pairs, key);
    }
  }
}
