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
  ["subtitle += 'Check: ' + choice.checkQuality + '<br>';",
   "subtitle += '检定:' + choice.checkQuality + '<br>';"],
  ["subtitle += 'Difficulty: ' + choice.difficulty + ' (' + Math.floor(choice.successProb*100) + '%)';",
   "subtitle += '难度:' + choice.difficulty + ' (' + Math.floor(choice.successProb*100) + '%)';"],
  ["return 'Game Over (reload to read again)';",
   "return '游戏结束(重新载入以重读)';"],
  ["save_button.textContent = \"Load\";", "save_button.textContent = \"读取\";"],
  ["save_button.textContent = \"Save\";", "save_button.textContent = \"保存\";"],
  ["save_element.textContent = \"Empty\";", "save_element.textContent = \"空\";"],
]);

// 3) 引擎层字面量汉化(牌库提示 / 继续 / 检定难度档)
ed('lib/engine.js', [
  ['c.unavailableSubtitle || "No cards available from deck."',
   'c.unavailableSubtitle || "牌库中已无可用卡牌。"'],
  ["title:'Continue...'", "title:'继续......'"],
  // 基类默认实现(Node/CLI 路径)也一并汉化;浏览器路径由 browser.js 覆写
  ["this.displayContent(simpleContent('Game Over'));",
   "this.displayContent(simpleContent('游戏结束'));"],
  ['return "almost impossible";', 'return "几乎不可能";'],
  ['return "high-risk";', 'return "高风险";'],
  ['return "tough";', 'return "艰难";'],
  ['return "very chancy";', 'return "非常冒险";'],
  ['return "chancy";', 'return "冒险";'],
  ['return "modest";', 'return "稳妥";'],
  ['return "very modest";', 'return "非常稳妥";'],
  ['return "low risk";', 'return "低风险";'],
  ['return "straightforward";', 'return "十拿九稳";'],
]);

console.log('\n引擎补丁完成。');
