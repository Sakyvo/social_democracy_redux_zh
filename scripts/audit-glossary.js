#!/usr/bin/env node
// 校对:扫描译文与 glossary 的不一致用法
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||process.env.ZH_ROOT||path.resolve(__dirname,'..','source','scenes');

// 禁用词 / 易错词 -> 正确用法
const BAD=[
  [/国社党/g,'纳粹党(禁用"国社党")'],
  [/帝国议会/g,'国会(禁用"帝国议会")'],
  [/巴本/g,'弗朗茨·冯·帕彭(禁用"巴本")'],
  // 移除:正确的"施莱谢尔"不应报错
  [/帝国银行/g,'国家银行'],
  [/帝国总理/g,'总理'],
  [/帝国总统/g,'总统'],
  [/帝国政府/g,'国家政府'],
  [/帝国国防军/g,'国防军'],
  [/帝国议会大厦/g,'国会大厦'],
];
// 术语一致性:同义异译候选 (A 应为 B)
const CONSIST=[
  [/(?<!国家)人民党/g,'人民党(DVP)—— 检查是否应为"国家人民党"'],
  [/社会民主党员/g,'社民党员'],
  [/社会民主/g,'检查是否应为"社民党/社会民主党"'],
];

function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p);}return o;}

const hits=[];
for(const f of walk(ROOT).filter(x=>x.endsWith('.dry'))){
  const lines=fs.readFileSync(f,'utf8').split('\n');
  lines.forEach((l,i)=>{
    for(const [re,msg] of BAD){
      if(re.test(l)) hits.push({f:f.replace(ROOT,''),n:i+1,msg,line:l.trim().slice(0,100)});
    }
  });
}
console.log('=== 禁用词/易错词命中 ('+hits.length+') ===');
for(const h of hits) console.log(h.f+':'+h.n+'  ['+h.msg+']  '+h.line);
// 退出码语义:0=干净。带退出码才能接入构建门禁。
process.exit(hits.length ? 1 : 0);