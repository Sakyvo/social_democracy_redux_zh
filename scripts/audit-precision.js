/* 术语精确度审计(文件级):对照英文原文,检查中文译名是否有原文依据。
 * 原理:行号会因翻译重排而漂移,故按「同一文件」为范围:
 *   若某中文译名在文件中出现,但该译名对应的任何英文形式都不在该文件中,
 *   则该行疑似误译(或原文确实没用该词)。
 * 用法: node scripts/audit-precision.js [zhRoot] [enRoot]
 */
const fs = require('fs');
const path = require('path');

const ZH = process.argv[2] || process.env.ZH_ROOT ||
  path.resolve(__dirname, '..', 'source', 'scenes');
const { resolveEnRoot } = require('./lib-en-root');
const EN = resolveEnRoot(path.resolve(__dirname, '..'), process.argv[3]);

function walk(d, o = [], base = d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o, base) : o.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return o;
}

/* [中文正则, 允许的原文正则, 说明] —— 中文匹配加负向断言避免父串误吞子串
 * 注意:原文常把 Stahlhelm 误拼作 Stalhelm、Reichsexekution 写作 Reichsexecution。 */
const RULES = [
  [/中央党/, /Zentrum|Center Party|Catholic|\bZ\b|the Center/i, 'Zentrum=中央党'],
  [/中间派/, /[Cc]entrist|center_|moderate|\bCenter\b/i, 'centrist=中间派'],
  [/国家人民党/, /Deutschnational|DNVP|National People/, 'DNVP=国家人民党'],
  [/巴伐利亚人民党/, /Bavarian People|\bBVP\b/, 'BVP=巴伐利亚人民党'],
  [/(?<![国家巴伐利亚])人民党/, /Volkspartei|\bDVP\b|People/, 'DVP=人民党'],
  [/纳粹党/, /NSDAP|Nazi|National Socialist/, 'NSDAP=纳粹党'],
  [/共产党/, /\bKPD\b|Communist|communist|COMMUNIST/, 'KPD=共产党'],
  [/社会主义工人党/, /\bSAPD\b|Socialist Workers/, 'SAPD=社会主义工人党'],
  [/社民党/, /\bSPD\b|Social Democrat/, 'SPD=社民党'],
  [/社会民主党/, /\bSPD\b|Social Democrat|SDAP|Social Democracy/i, 'SPD=社会民主党'],
  [/国旗团/, /Reichsbanner/, 'Reichsbanner=国旗团'],
  [/国防军/, /Reichswehr/, 'Reichswehr=国防军'],
  [/冲锋队/, /\bSA\b|Sturmabteilung|Stormtrooper|Nazi/, 'SA=冲锋队'],
  [/钢盔团/, /Stahlhelm|Stalhelm/, 'Stahlhelm=钢盔团'],
  [/(?<!德)国会(?!大厦)/, /Reichstag|parliament/i, 'Reichstag=国会'],
  [/州议会/, /Landtag|state legislature|state parliament/i, 'Landtag=州议会'],
  [/国家执行/, /Reichsexe[ck]ut/, 'Reichsexekution=国家执行'],
  [/国家人民阵线/, /National Unity Front|National Front|\bDNE\b|DNEF/, 'DNE=国家人民阵线'],
  [/国家联盟/, /Reichsblock|National Bloc/, 'Reichsblock=国家联盟'],
  [/市民联盟/, /Bürgerblock|Bourgeois Bloc|bourgeois bloc/i, 'Bürgerblock=市民联盟'],
  [/施莱谢尔/, /Schleicher/, 'Schleicher=施莱谢尔'],
  [/帕彭/, /Papen/, 'Papen=帕彭'],
  [/兴登堡/, /Hindenburg/, 'Hindenburg=兴登堡'],
  [/布吕宁/, /Brüning|Bruning/, 'Brüning=布吕宁'],
  [/希特勒/, /Hitler/, 'Hitler=希特勒'],
  [/台尔曼/, /Thälmann|Thalmann/, 'Thälmann=台尔曼'],
  [/希法亭/, /Hilferding/, 'Hilferding=希法亭'],
  [/沃伊京斯基/, /Woytinsky/, 'Woytinsky=沃伊京斯基'],
  [/布劳恩/, /Braun/, 'Braun=布劳恩'],
  [/舒马赫/, /Schumacher/, 'Schumacher=舒马赫'],
  [/韦尔斯/, /Wels/, 'Wels=韦尔斯'],
  [/泽韦林/, /Severing/, 'Severing=泽韦林'],
  [/魏玛联盟/, /Weimar [Cc]oalition|Weimarer Koalition/, 'Weimar Coalition=魏玛联盟'],
  [/大联合/, /Grand Coalition|grand coalition/, 'Grand Coalition=大联合'],
  [/(?<!国家)人民阵线/, /Popular Front|Volksfront|popular front/i, 'Volksfront=人民阵线'],
  [/统一战线/, /United Front|Einheitsfront|united front/i, 'Einheitsfront=统一战线'],
  [/建设性不信任案/, /constructive (vote|motion) of no confidence|constructive VONC|non-constructive votes of no confidence|no-confidence/i, 'VONC 机制'],
  [/不信任联盟/, /\bVONC\b|Vonc/i, 'VONC 联合体'],
  [/杨格计划/, /Young Plan/, 'Young Plan=杨格计划'],
  [/道威斯计划/, /Dawes Plan/, 'Dawes Plan=道威斯计划'],
  [/凡尔赛条约/, /Versailles/, 'Versailles=凡尔赛条约'],
  [/大萧条/, /Depression|economic crisis/i, 'Depression=大萧条'],
  [/恶性通货膨胀/, /[Hh]yperinflation/, 'Hyperinflation=恶性通货膨胀'],
  [/国会纵火/, /Reichstag Fire|Reichstag fire/, 'Reichstag Fire=国会纵火'],
  [/授权法案/, /Enabling Act/, 'Enabling Act=授权法案'],
  [/州总理/, /Ministerpräsident|Minister-President|minister-president|Prime Minister/i, 'Ministerpräsident=州总理'],
];

const hits = [];
let files = 0;

/* 有意偏离:这些行与原文不同是刻意的(如上游 copy-paste bug 的修正),不报警。 */
const INTENTIONAL = [
  // 上游把舒马赫之死的标题误写作 "The Death of Paul Levi"(列维另有 death_of_levi),
  // 本行按场景真实所属人物修正,属有意改进。
  { file: 'events/death_of_schumacher.scene.dry', line: 1 },
];
const isIntentional = (rel, line) =>
  INTENTIONAL.some(x => x.file === rel && (line === undefined || x.line === line));

for (const rel of walk(EN).filter(x => x.endsWith('.dry'))) {
  const ep = path.join(EN, rel), zp = path.join(ZH, rel);
  if (!fs.existsSync(zp)) continue;
  files++;
  const E = fs.readFileSync(ep, 'utf8');
  const Zl = fs.readFileSync(zp, 'utf8').split('\n');
  for (const [zhRe, enRe, note] of RULES) {
    if (enRe.test(E)) continue;                 // 原文含该词 -> 该文件整体合规
    Zl.forEach((l, i) => {
      if (!l.trim() || /^\s*(#|\/\/|\{!)/.test(l)) return;
      if (!zhRe.test(l)) return;
      if (isIntentional(rel, i + 1)) return;
      hits.push(rel + ':' + (i + 1) + '  [' + note + ']  ' + l.trim().slice(0, 110));
    });
  }
}
console.log('检查 ' + files + ' 个文件;译名缺原文依据的行:' + hits.length);
hits.forEach(h => console.log(h));
