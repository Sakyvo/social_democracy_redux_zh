/* 语义抽样审校:把每个场景的英文段落与中文段落按顺序配对,
 * 用「关键实体覆盖率」找出疑似漏译/增译的段落。
 * 原理:原文出现的人名/党派/数字,译文里应有对应物;缺失则报警。
 * 用法: node scripts/audit-semantic.js [--show N]
 */
const fs = require('fs');
const path = require('path');

const ZH = process.env.ZH_ROOT ||
  path.resolve(__dirname, '..', 'source', 'scenes');
const { resolveEnRoot } = require('./lib-en-root');
const EN = resolveEnRoot(path.resolve(__dirname, '..'), process.argv[2]);
const showIdx = process.argv.indexOf('--show');

function walk(d, o = [], b = d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o, b) : o.push(path.relative(b, p).split(path.sep).join('/'));
  }
  return o;
}

/* 必须成对出现的实体:原文词 -> 译文应含的候选 */
const ENTITY = [
  [/\bHitler\b/, /希特勒/, '希特勒'],
  [/\bHindenburg\b/, /兴登堡/, '兴登堡'],
  [/\bBraun\b/, /布劳恩/, '布劳恩'],
  [/\bSchleicher\b/, /施莱谢尔/, '施莱谢尔'],
  [/\bPapen\b/, /帕彭/, '帕彭'],
  [/\bBrüning\b|\bBruning\b/, /布吕宁/, '布吕宁'],
  [/\bThälmann\b|\bThalmann\b/, /台尔曼/, '台尔曼'],
  [/\bHilferding\b/, /希法亭/, '希法亭'],
  [/\bStresemann\b/, /施特雷泽曼/, '施特雷泽曼'],
  [/\bSevering\b/, /泽韦林/, '泽韦林'],
  [/\bWels\b/, /韦尔斯/, '韦尔斯'],
  [/\bLevi\b/, /列维/, '列维'],
  [/\bSchumacher\b/, /舒马赫/, '舒马赫'],
  [/\bEbert\b/, /艾伯特/, '艾伯特'],
  [/\bMarx\b/, /马克思/, '马克思'],
  [/\bKaas\b/, /卡斯/, '卡斯'],
  [/\bSeldte\b/, /泽尔特/, '泽尔特'],
  [/\bHugenberg\b/, /胡根贝格/, '胡根贝格'],
  [/\bWoytinsky\b/, /沃伊京斯基/, '沃伊京斯基'],
  [/\bLeipart\b/, /莱帕特/, '莱帕特'],
  [/\bAdenauer\b/, /阿登纳/, '阿登纳'],
  [/\bMussolini\b/, /墨索里尼/, '墨索里尼'],
  [/\bStalin\b/, /斯大林/, '斯大林'],
  [/\bGoebbels\b/, /戈培尔/, '戈培尔'],
  [/\bGöring\b/, /戈林/, '戈林'],
  [/\bStrasser\b/, /施特拉瑟/, '施特拉瑟'],
  [/\bBreitscheid\b/, /布赖特沙伊德/, '布赖特沙伊德'],
  [/\bVersailles\b/, /凡尔赛/, '凡尔赛'],
  [/\bReichsbanner\b/, /国旗团/, '国旗团'],
  [/\bReichswehr\b/, /国防军|国防部/, 'Reichswehr'],
  [/\bStahlhelm\b|\bStalhelm\b/, /钢盔团/, '钢盔团'],
  [/\bDNVP\b|Deutschnational/, /国家人民党/, '国家人民党'],
  [/\bDVP\b|Deutsche Volkspartei/, /人民党/, '人民党'],
  [/\bNSDAP\b(?!:)|\bNazi/i, /纳粹/, '纳粹党'],
  [/\bKPD\b|Communist/i, /共产党/, '共产党'],
  [/\bReichstag\b/, /国会/, '国会'],
  [/\bLandtag\b/, /州议会/, '州议会'],
  [/\bReichsexe[ck]ut/, /国家执行/, '国家执行'],
  [/\bZentrum\b|Center Party/i, /中央党/, '中央党'],
  [/\bSPD\b|Social Democrat/i, /社民党|社会民主党/, '社民党'],
  [/\bSAPD\b/, /社会主义工人党|社工党|SAPD/, 'SAPD'],
  [/\bSPD\b/, /社民党|社会民主党|SPD/, 'SPD'],
  [/\bNSDAP\b/, /纳粹党|NSDAP/, 'NSDAP'],
  [/\bDNVP\b/, /国家人民党|DNVP/, 'DNVP'],
  [/\bUnited Front\b|(?<!Nationale )Einheitsfront/i, /统一战线/, '统一战线'],
  [/\bPopular Front\b|Volksfront/i, /人民阵线/, '人民阵线'],
];

/* 提取场景的可见段落(过滤指令/注释,并完整剔除 {! ... !} 代码块) */
const DIRECT = /^\s*(title|subtitle|unavailable-subtitle|view-if|choose-if|go-to|on-arrival|on-departure|new-page|tags|max-visits|frequency|audio|image|set|available-if|card-image|card_image|is-card|is-hand|is-deck|is-pinned-card|is-special|game-over|call|achievement|max-choices|priority|set-jump|set-bg|min-visits|section|vary|on-display|insert|delete|append|move|publish|unpublish|class|js|eval|view_if|face-image|face_image):/;
/* 剔除内联条件/插入标签的「条件部分」,只保留玩家可见内容。
 * [? if pred : text ?]  → text;  [+ var : qdisplay +] → ''(本身无文字)
 * 否则条件里的变量名(Hitler/Hindenburg)会被当成正文实体而误报。 */
function visibleOnly(s) {
  return s
    .replace(/\[\?[^\]]*?:\s*/g, ' ')   // 条件谓词部分
    .replace(/\?\]/g, ' ')
    .replace(/\[\+[^\]]*?\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ');
}

/* 「缩写标签」行(如 "KPD: 12%"、"SPD: 赞成"、"Z: [+ z_vote +]")——
 * 术语表规定图表内保留拉丁缩写,不作为正文段落参与实体覆盖比对。 */
const ABBR_LABEL = /^[A-Za-z]{1,6}\s*[:：]/;

function paragraphs(text) {
  const out = [];
  let inCode = false;
  for (const raw of text.split('\n')) {
    if (raw.includes('{!')) inCode = true;
    const was = inCode;
    if (raw.includes('!}')) inCode = false;
    if (was) continue;                       // {! ... !} 内的 JS/Q 赋值不是可见文本
    const l = raw.trim();
    if (!l) continue;
    if (/^[#/]/.test(l) || /^@/.test(l) || /^- @/.test(l)) continue;
    if (DIRECT.test(l)) continue;
    const v = visibleOnly(l).trim();
    if (!v || ABBR_LABEL.test(v)) continue;
    out.push(v);
  }
  return out;
}

const hits = [];
let pairs = 0;
for (const rel of walk(EN).filter(x => x.endsWith('.dry'))) {
  if (/credits\.scene\.dry$/.test(rel)) continue;
  const ep = path.join(EN, rel), zp = path.join(ZH, rel);
  if (!fs.existsSync(zp)) continue;
  const E = paragraphs(fs.readFileSync(ep, 'utf8'));
  const Ztxt = paragraphs(fs.readFileSync(zp, 'utf8')).join('\n');
  // 逐条实体在文件粒度上检查:原文有该实体但译文整个文件都没有
  for (const [enRe, zhRe, name] of ENTITY) {
    const enCount = (E.join('\n').match(new RegExp(enRe.source, 'g')) || []).length;
    if (!enCount) continue;
    if (zhRe.test(Ztxt)) continue;
    pairs++;
    hits.push(rel + '  [' + name + '] 原文出现 ' + enCount + ' 次,译文无对应译名');
  }
}
console.log('实体覆盖缺失:' + hits.length);
hits.forEach(h => console.log('  ' + h));
if (showIdx >= 0) {
  const n = parseInt(process.argv[showIdx + 1] || '5', 10);
  console.log('\n--- 抽样对照(前 ' + n + ' 个场景)---');
  walk(EN).filter(x => x.endsWith('.dry')).slice(0, n).forEach(rel => {
    const zp = path.join(ZH, rel);
    if (!fs.existsSync(zp)) return;
    console.log('\n===== ' + rel + ' =====');
    console.log('EN: ' + paragraphs(fs.readFileSync(path.join(EN, rel), 'utf8')).slice(0, 2).join(' | ').slice(0, 200));
    console.log('ZH: ' + paragraphs(fs.readFileSync(zp, 'utf8')).slice(0, 2).join(' | ').slice(0, 200));
  });
}
