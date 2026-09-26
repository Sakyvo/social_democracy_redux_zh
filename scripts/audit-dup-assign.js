#!/usr/bin/env node
/* 审计:重复赋值(批量替换「打重」痕迹)。
 *
 * 真正的缺陷签名只有一种:同一 `变量 = 字面量` 被**紧邻重复**。成因是批量替换脚本
 * 把 `X = "A"` 追加到了已经含 `X = "A"` 的位置,产生两种形态:
 *   (a) 同行相邻段:`X = "A"; X = "A"`
 *   (b) 相邻重复块:同一串赋值行连着出现两遍
 *
 * 刻意不检:同一变量在同一行被赋同一个值但**不相邻** —— dendry 方言里
 * `=` 兼作比较,`[? if a = 1 : ... ?][? if a = 0 and b : ... ?]` 与
 * `x = 0 if c1; ... ; x = 0 if c2` 都是正常写法(上游原文即有),不是缺陷。
 * 退出码 0 = 干净。
 */
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || process.env.ZH_ROOT || path.resolve(__dirname, '..', 'source', 'scenes');
function walk(d, o = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, o) : o.push(p); } return o; }

const ASSIGN_SEG = /^[A-Za-z_][\w.]*\s*=\s*"(?:[^"\\]|\\.)*"$/;
const ASSIGN_LINE = /^[A-Za-z_][\w.]*\s*=\s*"/;
const hits = [];

for (const f of walk(ROOT).filter(x => x.endsWith('.dry'))) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');

  // (a) 同行相邻段:`X = "A"; X = "A"`
  lines.forEach((l, i) => {
    if (/^\s*(\{!|\/\/|#)/.test(l)) return;
    // 只取赋值区:剔除 [? ... ?] 条件块(其中 = 是比较)
    const region = l.replace(/\[\?[\s\S]*?\?\]/g, '');
    const segs = region.split(';').map(s => s.trim()).filter(s => s);
    for (let k = 1; k < segs.length; k++) {
      if (ASSIGN_SEG.test(segs[k]) && segs[k] === segs[k - 1])
        hits.push({ f, n: i + 1, why: '同行相邻重复段', key: segs[k], line: l.trim().slice(0, 110) });
    }
  });

  // (b) 相邻重复块:长度 1..4 的赋值行串连着出现两遍
  for (let len = 4; len >= 1; len--) {
    for (let i = 0; i + 2 * len <= lines.length; i++) {
      const blk = lines.slice(i, i + len).map(s => s.trim());
      const nxt = lines.slice(i + len, i + 2 * len).map(s => s.trim());
      if (!blk.every(s => ASSIGN_LINE.test(s))) continue;
      if (blk.join('\u0000') !== nxt.join('\u0000')) continue;
      hits.push({ f, n: i + 1, why: '相邻重复块(' + len + ' 行)', key: blk[0].slice(0, 50), line: blk.join(' | ').slice(0, 110) });
    }
  }
}

console.log('=== 重复赋值 (' + hits.length + ') ===');
for (const h of hits) console.log(h.f.replace(ROOT, '') + ':' + h.n + '  [' + h.why + ': ' + h.key + ']  ' + h.line);
process.exit(hits.length ? 1 : 0);