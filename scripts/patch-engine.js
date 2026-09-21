/* 把 dendrynexus 引擎打上中文补丁(幂等)。
 * 用法: node scripts/patch-engine.js [<node_modules 路径>]
 * 默认 K:/Projects/website/raspd/origin/social_democracy_redux/node_modules
 */
const fs = require('fs');
const path = require('path');

const nmRoot = process.argv[2] ||
  'K:/Projects/website/raspd/origin/social_democracy_redux/node_modules';
const NEX = path.join(nmRoot, 'dendrynexus');

if (!fs.existsSync(NEX)) {
  console.error('找不到 dendrynexus:' + NEX);
  process.exit(1);
}

const ed = (file, subs) => {
  const p = path.join(NEX, file);
  let s = fs.readFileSync(p, 'utf8');
  let hits = 0;
  for (const [from, to] of subs) {
    if (from === to || s.includes(to)) continue;
    const n = s.split(from).length - 1;
    if (!n) { console.log('  跳过(未匹配): ' + JSON.stringify(from.slice(0, 46))); continue; }
    s = s.split(from).join(to);
    hits += n;
  }
  fs.writeFileSync(p, s);
  console.log(hit(file) + ' → ' + hits + ' 处');
};
const hit = f => '  ' + f;

// 1) Windows 路径修复:parseFilename 用 '/' 取 basename,Windows 为 '\',导致全部源文件解析失败
ed('lib/parsers/dry.js', [[
  "var basename = filename.substr(filename.lastIndexOf('/') + 1);",
  "filename = filename.replace(/\\\\/g, '/');\n    var basename = filename.substr(filename.lastIndexOf('/') + 1);",
]]);

// 2) 浏览器 UI 层字面量汉化 + 存档时间用中文 locale
ed('lib/ui/browser.js', [
  ["date.toLocaleString(undefined, this.DateOptions)",
   "date.toLocaleString('zh-CN', this.DateOptions)"],
  ["var handDescription = 'Hand - click a card to play.';",
   "var handDescription = '手牌 — 点击卡牌打出。';"],
  ["var deckDescription = 'Decks - click a deck to draw a card.';",
   "var deckDescription = '牌库 — 点击牌库抽一张牌。';"],
  ["var pinnedCardsDescription = 'Pinned cards - click a card to play.';",
   "var pinnedCardsDescription = '常驻卡 — 点击卡牌打出。';"],
  ["window.alert('Saved.')", "window.alert('已保存。')"],
  ["window.alert('Loaded.')", "window.alert('已读取。')"],
  ["window.alert('No save available.')", "window.alert('没有可用的存档。')"],
  ["window.alert('Saving and loading is currently disabled.')",
   "window.alert('当前已禁用存读档。')"],
]);

console.log('\n引擎补丁完成。');
