#!/usr/bin/env node
/* 审计:畸形的 insert 标记(引擎不解析,玩家会看到字面量文本)
 * 正确: [+ var +] 或 [+ var : qdisplay +]   —— '[' 后紧接 '+'
 * 畸形: [ + var +]                         —— '[' 后是空格,引擎忽略
 *       [+ var + ]                         —— ']' 前有空格
 * 同时查条件块 [? if ... ?] 的同类形变(仅检 '[ ?' 与 '? ]')
 */
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'source/scenes';
function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p);}return o;}
const RULES=[
  [/\[\s\+/,  '「[ +」: 方括号后有空格'],
  [/\+\s+\]/, '「+ ]」: 方括号前有空格'],
  [/\[\s\?/,  '「[ ?」: 条件块方括号后有空格'],
  [/\?\s+\]/, '「? ]」: 条件块闭括号前有空格'],
];
let n=0;
for(const f of walk(ROOT).filter(x=>x.endsWith('.dry'))){
  const L=fs.readFileSync(f,'utf8').split('\n');
  L.forEach((l,i)=>{
    if(/^\s*#/.test(l)||/^\s*\/\//.test(l))return;
    const stripped=l.replace(/\{![\s\S]*?!\}/g,' ');
    for(const [re,desc] of RULES){
      if(re.test(stripped)){
        n++;
        console.log(path.relative(ROOT,f).split(path.sep).join('/')+':'+(i+1)+'  ['+desc+']  '+l.trim().slice(0,130));
        break;
      }
    }
  });
}
console.log('\n畸形标记:',n);
process.exit(n?1:0);
