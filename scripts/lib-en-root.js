/* 定位英文原版场景目录(EN 源)。
 * 优先顺序:
 *   1) 显式参数 / 环境变量 EN_ROOT
 *   2) <repo>/.upstream/source/scenes        —— CI 由工作流 clone upstream 后注入
 *   3) 仓库同级的 origin 布局(本地)
 * 项目名默认 social_democracy_redux,可用第二参数或 ORIGIN_GAME 覆盖。
 * 两者都找不到时退出码 2,让调用方区分「缺源」与「有缺陷」。
 */
const fs = require('fs');
const path = require('path');

function resolveEnRoot(repoRoot, explicit, game) {
  const name = game || process.env.ORIGIN_GAME || 'social_democracy_redux';
  const candidates = [
    explicit,
    process.env.EN_ROOT,
    path.join(repoRoot, '.upstream', 'source', 'scenes'),
    // 本地布局 A:raspd/origin/<game>/source/scenes(仓库位于 raspd/zh/<repo>)
    path.resolve(repoRoot, '..', '..', '..', 'origin', name, 'source', 'scenes'),
    // 本地布局 B:raspd/origin/<game>/source/scenes(仓库直接位于 raspd/<repo>)
    path.resolve(repoRoot, '..', '..', 'origin', name, 'source', 'scenes'),
  ].filter(Boolean);
  const found = candidates.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
  if (!found) {
    console.error('找不到英文原版场景目录(EN 源)。');
    console.error('  本地:确保存在 raspd/origin/' + name + '/source/scenes');
    console.error('  CI  :设 EN_ROOT,或先把 upstream clone 到 <repo>/.upstream');
    process.exit(2);
  }
  return found;
}

module.exports = { resolveEnRoot };
