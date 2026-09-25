/* 一致性修复:把玩家可见的党派缩写标签改为中文译名。
 * 依据:用户原始 brief「对于党派/组织,避免使用缩写,而是使用最常用的中文译名」
 *       与 Q5「DVP 始终是人民党,DNVP 始终是国家人民党」。
 * 说明:ddp_name / bvp_name 的值被代码用作比较("DDP"/"DStP"/"RDP"),不能直接改;
 *       因此新增 ddp_display / bvp_display 作为显示层,并同步脚本内联表格标签。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'source', 'scenes');

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s);

/* ---------- 1. 引入显示层变量 ddp_display / bvp_display ---------- */
const INIT = [
  ['root.scene.dry',
   'Q.ddp_name = "DDP";\nQ.bvp_name = "BVP";',
   'Q.ddp_name = "DDP";\nQ.bvp_name = "BVP";\n// 显示层:党派译名随代码值同步(值本身被代码用作比较,不可直接改)\nQ.ddp_display = "民主党";\nQ.bvp_display = "巴伐利亚人民党";'],
  ['1925_root.scene.dry',
   'Q.ddp_name = "DDP";\nQ.bvp_name = "BVP";',
   'Q.ddp_name = "DDP";\nQ.bvp_name = "BVP";\nQ.ddp_display = "民主党";\nQ.bvp_display = "巴伐利亚人民党";'],
  ['1930_root.scene.dry',
   'Q.ddp_name = "DDP";\nQ.bvp_name = "BVP";',
   'Q.ddp_name = "DDP";\nQ.bvp_name = "BVP";\nQ.ddp_display = "民主党";\nQ.bvp_display = "巴伐利亚人民党";'],
];
for (const [f, from, to] of INIT) {
  const s = read(f);
  if (!s.includes(from)) { console.log('!! 未命中初始化: ' + f); continue; }
  write(f, s.replace(from, to));
  console.log('初始化已加显示层: ' + f);
}

/* ---------- 2. 改名事件同步更新显示层 ---------- */
const RENAMES = [
  ['events/ddp_dstp.scene.dry', 'ddp_name = "DStP"', 'ddp_name = "DStP"; ddp_display = "国家党"'],
  ['events/ddp_becomes_socialist.scene.dry', 'ddp_name = "RDP"', 'ddp_name = "RDP"; ddp_display = "激进民主党"'],
  ['party_affairs/blocparteis.scene.dry', 'ddp_name = "RDP"', 'ddp_name = "RDP"; ddp_display = "激进民主党"'],
  ['events/bvp_reform.scene.dry', 'bvp_name = "BAP"', 'bvp_name = "BAP"; bvp_display = "巴伐利亚工人党"'],
];
for (const [f, from, to] of RENAMES) {
  const s = read(f);
  if (!s.includes(from)) { console.log('!! 未命中改名: ' + f + ' :: ' + from); continue; }
  write(f, s.replace(from, to));
  console.log('改名事件已同步: ' + f);
}
