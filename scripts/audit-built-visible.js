/* 从 out/game.json(权威构建产物)提取"玩家可见"的英文残留。
 * 覆盖:场景 title/content/options(title,subtitle,unavailableSubtitle)、
 *        qdisplays、qualities 的显示名、代码段内 legend/name/label 字面量。
 */
const fs = require('fs');
const path = require('path');
const g = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../out/game.json'), 'utf8'));
const cjk = /[\u3400-\u9fff]/;
const hits = [];

function text(seg) {
  if (typeof seg === 'string') return seg;
  if (Array.isArray(seg)) return seg.map(text).join('');
  if (seg && typeof seg === 'object') {
    if (seg.$code) return '';
    if (typeof seg.insert === 'number') return '\u0000'; // 占位:打断英文单词连接,避免 insert 拼接成假英文
    return Object.values(seg).map(text).join('');
  }
  return '';
}
function check(where, s) {
  if (!s) return;
  const words = s.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  if (words.length >= 2 && !cjk.test(s) && !/\u0000/.test(s)) hits.push([where, s.trim().slice(0, 100)]);
}

for (const [sid, sc] of Object.entries(g.scenes || {})) {
  check(sid + '.title', text(sc.title));
  check(sid + '.content', text(sc.content));
  for (const o of (sc.options || [])) {
    check(sid + '.opt.title', text(o.title));
    check(sid + '.opt.subtitle', text(o.subtitle));
    check(sid + '.opt.unavailable', text(o.unavailableSubtitle));
  }
}
for (const [qid, q] of Object.entries(g.qdisplays || {})) {
  check('qdisplay.' + qid, text(q));
}
for (const [kid, q] of Object.entries(g.qualities || {})) {
  check('quality.' + kid, text(q.title));
}

// 代码段内的可见字面量(legend/name/label)
const litRe = /\b(legend|name|label|title|subtitle)\b\s*[:=]\s*["']([^"']{2,})["']/g;
function walkCode(node, where) {
  if (Array.isArray(node)) return node.forEach(x => walkCode(x, where));
  if (node && typeof node === 'object') {
    if (node.$code) {
      let m;
      while ((m = litRe.exec(node.$code))) {
        if (!cjk.test(m[2]) && /[A-Za-z]{3,}/.test(m[2])) hits.push([where + '.code:' + m[1], m[2]]);
      }
      return;
    }
    for (const [k, v] of Object.entries(node)) walkCode(v, where + '.' + k);
  }
}
for (const [sid, sc] of Object.entries(g.scenes || {})) walkCode(sc, sid);

console.log('玩家可见英文片段(构建产物):', hits.length);
hits.forEach(h => console.log(' -', h[0], '|', h[1]));
