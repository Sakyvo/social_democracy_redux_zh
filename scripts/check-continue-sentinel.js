/* 校验「继续……」哨兵一致性:引擎默认选项标题 与 post_event 中的比较字符串必须完全相同。
 * 用法: node scripts/check-continue-sentinel.js
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const core = fs.readFileSync(path.join(root, 'out/html/core.js'), 'utf8');

// 引擎默认标题(编译后 bundle 中)
let eng = null;
for (const m of core.matchAll(/title:("|')([^"']{1,12})\1,canCh/g)) { eng = m[2]; break; }
if (!eng) for (const m of core.matchAll(/title:("|')([^"']{1,12})\1,\s?can/g)) { eng = m[2]; break; }

// 源码中的哨兵比较
const src = fs.readFileSync(path.join(root, 'source/scenes/post_event.scene.dry'), 'utf8');
const sm = src.match(/choices\[0\]\.title\s*!=\s*"([^"]*)"/);
const sen = sm ? sm[1] : null;

const cp = s => s === null ? '(未找到)' : [...s].map(x => x.codePointAt(0).toString(16)).join(' ');
console.log('引擎默认标题 :', JSON.stringify(eng), '=', cp(eng));
console.log('源码哨兵     :', JSON.stringify(sen), '=', cp(sen));
if (eng === sen) {
  console.log('\n✔ 一致 —— post_event 的事件判定不会失效。');
} else {
  console.error('\n✘ 不一致 —— 选项标题被汉化但源码比较未同步,会导致 has_event 恒为 0。');
  process.exit(1);
}
