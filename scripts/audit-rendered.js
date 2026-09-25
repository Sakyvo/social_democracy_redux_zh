#!/usr/bin/env node
/* 权威「玩家可见文本」审计 —— 直接检查构建产物 out/game.json
 * 只提取引擎真正渲染的字符串: title / subtitle / unavailableSubtitle / content 文本叶子,
 * 排除 $code、stateDependencies、onDisplay、legend/name(图表约定保留拉丁)等非文本字段。
 */
const fs=require('fs');
const g=JSON.parse(fs.readFileSync('out/game.json','utf8'));
const SKIP_KEY=/^(\$code|predicate|stateDependencies|onArrival|onDeparture|onDisplay|legend|name|id|js|eval|viewIf|chooseIf|goTo|set|insert|delete|append|move)$/;
const PAR=/\b(NSDAP|DNVP|DVP|DDP|KPD|SPD|BVP|ASPD|DNE|SAPD|DStP|RDP|ZCA|VONC|KAPD|BB)\b/;
const EN_WORDS=/\b[A-Za-z][A-Za-z'’-]{2,}\b/g;

let abbr=[], english=[];
function walk(node,path){
  if(typeof node==='string'){
    const c=node.replace(/<[^>]*>/g,' ').replace(/style="[^"]*"/g,' ');
    const m=c.match(PAR);
    if(m)abbr.push('['+m[0]+'] '+path+' :: '+c.replace(/\s+/g,' ').trim().slice(0,110));
    const w=(c.match(EN_WORDS)||[]);
    if(!/[\u4e00-\u9fff]/.test(c) && w.length>=4) english.push(path+' :: '+c.replace(/\s+/g,' ').trim().slice(0,110));
    return;
  }
  if(Array.isArray(node)){node.forEach((x,i)=>walk(x,path+'['+i+']'));return;}
  if(node&&typeof node==='object'){
    for(const k of Object.keys(node)){
      if(SKIP_KEY.test(k))continue;
      if(k==='content'||k==='title'||k==='subtitle'||k==='unavailableSubtitle'||k==='heading'||k==='text') walk(node[k],path+'.'+k);
      else if(typeof node[k]==='object'&&node[k]!==null) walk(node[k],path+'.'+k);
    }
  }
}

walk(g,'');
abbr=abbr.filter(x=>!/credits/.test(x));
english=english.filter(x=>!/credits/.test(x));

console.log('=== 玩家可见拉丁党派缩写 ===');
console.log(abbr.length? abbr.join('\n') : '(无)');
console.log('\n=== 玩家可见纯英文文本 ===');
console.log(english.length? english.join('\n') : '(无)');
console.log('\n合计: 缩写 '+abbr.length+' / 英文 '+english.length);
