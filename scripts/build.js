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
console.log('\n构建完成:' + scenes + ' 个场景,' +
  (fs.statSync(gameJson).size / 1048576).toFixed(2) + ' MB');
