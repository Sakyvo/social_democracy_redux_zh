/* 构建中文站:打引擎补丁 + 用 template-zh 重新生成 out/html。
 * 用法: node scripts/build.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nexus = (() => {
  try { return require(path.join(root, 'node_modules/dendrynexus/package.json')); }
  catch (e) { return null; }
})();
if (!nexus) {
  console.error('请先 npm install');
  process.exit(1);
}

/* 1. 打引擎补丁(幂等) */
execSync('node scripts/patch-engine.js ' + JSON.stringify(path.join(root, 'node_modules')),
  { cwd: root, stdio: 'inherit' });

/* 2. 删掉编译产物,强制全量重编(mtime 增量判断在中文仓库内不可靠) */
const gameJson = path.join(root, 'out', 'game.json');
if (fs.existsSync(gameJson)) fs.unlinkSync(gameJson);

/* 3. 用 template-zh 构建 */
/* --overwrite:template-zh 里的 index.html / game.js / game.css 是权威版本,
   必须覆盖 out/html 中的旧副本;img 与 d3*.js 不在模板内,不受影响。 */
execSync('npx dendrynexus make-html -t ./template-zh --overwrite', { cwd: root, stdio: 'inherit' });

/* 4. 校验 */
const j = JSON.parse(fs.readFileSync(gameJson, 'utf8'));
const scenes = Object.keys(j.scenes || {}).length;
if (scenes < 100) {
  console.error('构建异常:game.json 仅 ' + scenes + ' 个场景');
  process.exit(1);
}

/* 5. 哨兵一致性:引擎默认选项标题必须与 post_event 中的比较字符串一致,
      否则事件判定 has_event 会恒为 0(汉化引擎字符串时的隐藏回归)。 */
execSync('node scripts/check-continue-sentinel.js', { cwd: root, stdio: 'inherit' });

/* 6. 构建门禁:以构建产物为准,任一失败即构建失败。
      新增门禁前先做阳性对照(注入一处已知缺陷,确认脚本报错),否则 PASS 可能只是没检测到。 */
const GATES = [
  'audit-rendered.js',        // 主门禁:玩家可见拉丁党派缩写 / 纯英文
  'audit-built-visible.js',   // 构建产物玩家可见英文片段
  'audit-party-labels.js',    // 党派标签中文一致性
  'audit-precision.js',       // 术语精确度(禁用词 / 误译)
  'audit-semantic.js',        // 语义配对(EN/ZH 段落对齐)
  'audit-duplicate-name.js',  // 「中文名(同一中文名)」重复翻译
  'audit-malformed-insert.js',// 畸形插入标记 [ + var +]
  'audit-mixed.js',           // 中英混排行
  'check-untranslated.js',    // 未译英文残留
];
const failed = [];
for (const g of GATES) {
  try {
    execSync('node scripts/' + g, { cwd: root, stdio: 'pipe' });
  } catch (e) {
    failed.push(g);
    process.stdout.write('\n--- ' + g + ' 输出 ---\n' +
      (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : ''));
  }
}
if (failed.length) {
  console.error('\n构建门禁失败(' + failed.length + '): ' + failed.join(', '));
  process.exit(1);
}
console.log('构建门禁:' + GATES.length + ' 道全过');

console.log('\n构建完成:' + scenes + ' 个场景,' +
  (fs.statSync(gameJson).size / 1048576).toFixed(2) + ' MB');
