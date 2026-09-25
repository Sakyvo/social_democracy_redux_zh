#!/usr/bin/env node
/* 权威「玩家可见文本」审计 —— 直接检查构建产物 out/game.json
 *
 * 判定原则:逐个场景遍历全部字符串叶子,排除「结构/代码」字段,其余即渲染文本。
 * 排除项仅限实测确认不可见者:
 *   $code / predicate / stateDependencies / onArrival / onDeparture / onDisplay
 *     —— 编译后的逻辑与数据处理,引擎不渲染
 *   legend / name / id —— d3 图表数据(约定保留拉丁)
 *   audio / image / cardImage / faceImage / setMusic / setSprites —— 资源路径
 * 场景 id 以 credits 开头者整场跳过(参考文献,按范围决策不译)。
 * 其余(title/subtitle/unavailableSubtitle/content/heading/text/option.title…)全部检查。
 *
 * 退出码 0 = 干净,1 = 有发现。
 */
const fs=require('fs');
const g=JSON.parse(fs.readFileSync('out/game.json','utf8'));

const SKIP_KEY=/^(\$code|predicate|stateDependencies|onArrival|onDeparture|onDisplay|legend|name|id|audio|image|cardImage|faceImage|setMusic|setSprites)$/;
const PAR=/\b(NSDAP|DNVP|DVP|DDP|KPD|SPD|BVP|ASPD|DNE|SAPD|DStP|RDP|ZCA|VONC|KAPD|BB)\b/;
const EN_WORDS=/\b[A-Za-z][A-Za-z'’-]{2,}\b/g;

const abbr=[], english=[];
let leaves=0;

function walk(node,path){
  if(typeof node==='string'){
    leaves++;
    const c=node.replace(/<[^>]*>/g,' ').replace(/style="[^"]*"/g,' ');
    const m=c.match(PAR);
    if(m)abbr.push('['+m[0]+'] '+path+' :: '+c.replace(/\s+/g,' ').trim().slice(0,110));
    const w=c.match(EN_WORDS)||[];
    if(!/[\u4e00-\u9fff]/.test(c)&&w.length>=4)english.push(path+' :: '+c.replace(/\s+/g,' ').trim().slice(0,110));
    return;
  }
  if(Array.isArray(node)){node.forEach((x,i)=>walk(x,path+'['+i+']'));return;}
  if(node&&typeof node==='object'){
    for(const k of Object.keys(node)){
      if(SKIP_KEY.test(k))continue;
      walk(node[k],path+'.'+k);
    }
  }
}

for(const [sid,sc] of Object.entries(g.scenes)){
  if(/^credits/.test(sid))continue;
  walk(sc,sid);
}

console.log('检查的文本叶子:',leaves);
console.log('\n=== 玩家可见拉丁党派缩写 ===');
console.log(abbr.length? abbr.join('\n') : '(无)');
console.log('\n=== 玩家可见纯英文文本 ===');
console.log(english.length? english.join('\n') : '(无)');
console.log('\n合计: 缩写 '+abbr.length+' / 英文 '+english.length);
process.exit(abbr.length+english.length?1:0);