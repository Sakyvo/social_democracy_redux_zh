#!/usr/bin/env node
// 校对 2:术语一致性 —— 检查同一拉丁原文在本 mod 内的译法是否统一
// 用法: node audit-consistency.js <zh scenes> <en scenes>
const fs=require('fs'),path=require('path');
const ZH=process.argv[2], EN=process.argv[3];
function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p);}return o;}
function load(root){const m={};for(const f of walk(root).filter(x=>x.endsWith('.dry'))){m[path.basename(f)]=fs.readFileSync(f,'utf8');}return m;}
const zh=load(ZH), en=load(EN);

// 候选拉丁原词 -> 允许的中文译法
const TERMS=[
 ['Reichstag','国会','帝国议会'],
 ['Reichsrat','国家参议院'],
 ['Reichswehr','国防军'],
 ['Reichsexekution','国家执行'],
 ['Reichskanzler','总理'],
 ['Reichspräsident','总统'],
 ['Reichsbanner','国旗团'],
 ['Reichskonkordat','国家政教协定'],
 ['Zentrumspartei','中央党'],
 ['Deutschnationale','国家人民党'],
 ['Nationalsozialistische','纳粹党'],
 ['Sozialdemokratische','社会民主党','社民党'],
 ['Kommunistische','共产党'],
 ['Nationale Einheitsfront','国家人民阵线'],
 ['Bürgerblock','市民联盟'],
 ['Volksblock','人民联盟'],
 ['Reichsblock','国家联盟'],
 ['Verfassungskoalition','宪法联盟'],
 ['Weimarer Koalition','魏玛联盟'],
 ['Populärfront','人民阵线'],
 ['Einheitsfront','统一战线'],
 ['Bauernbund','巴伐利亚农民联盟'],
 ['Alte Sozialdemokratische','萨克森旧社会民主党'],
 ['Landtag','州议会'],
 ['Ministerpräsident','州总理'],
 ['Querfront','横向阵线'],
 ['Eiserne Front','铁前线'],
];
/* 有意共存的多译对:术语表明确规定「正式全称 / 惯用简称」并存的场合,
 * 按 完整原文 -> [两种允许译法] 登记,不算冲突。 */
const INTENTIONAL_PAIRS = [
  // SPD 规则:首次出现用全称「社会民主党」,其后用简称「社民党」
  ['Sozialdemokratische', ['社会民主党', '社民党']],
];

let issues=0;
for(const [lat,...allowed] of TERMS){
  // 找出 en 中含该词的文件
  const files=Object.keys(en).filter(f=>en[f].includes(lat));
  if(!files.length) continue;
  // 在对应 zh 文件中查找允许译法之外的用法
  const found=new Set();
  for(const f of files){
    if(!zh[f]) continue;
    for(const a of allowed) if(zh[f].includes(a)) found.add(a);
  }
  if(found.size>1){
    const pair=INTENTIONAL_PAIRS.find(([k])=>k===lat);
    if(pair && [...found].every(x=>pair[1].includes(x))){
      console.log('[允许] '+lat+' -> '+[...found].join(' / ')+'(全称 / 简称并存,见术语表)');
    } else {
      console.log('[多译] '+lat+' -> '+[...found].join(' / ')); issues++;
    }
  }
}
console.log('\n多译冲突:',issues);

// 反向:中文译名出现但同文件对应英文原文无该词(潜在误译)
const REVERSE=[
 ['中央党','Zentrum','Center Party','Center'],
 ['国家人民党','Deutschnationale','DNVP'],
 ['人民党','Volkspartei','DVP'],
 ['纳粹党','NSDAP','Nazi'],
 ['共产党','KPD','Communist'],
];