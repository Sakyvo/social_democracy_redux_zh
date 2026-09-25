#!/usr/bin/env node
// 审计:检测玩家可见的拉丁党派缩写(全文件级 {! !} 状态机 + 条件块剥离)
const fs=require('fs'),path=require('path');
function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p);}return o;}
const PAR=/\b(NSDAP|DNVP|DVP|DDP|KPD|SPD|BVP|ASPD|DNE|SAPD|DStP|RDP|ZCA|BB|VONC)\b/;

// 整文件扫描:先剔除 {! ... !} 代码块,再逐行剥离条件块的 cond 部分
function stripCodeBlocks(src){
  let out='', i=0;
  while(i<src.length){
    const st=src.indexOf('{!',i);
    if(st<0){out+=src.slice(i);break;}
    out+=src.slice(i,st);
    const en=src.indexOf('!}',st);
    if(en<0)break;            // 未闭合,丢弃尾部
    out+=en===st?' ':' ';     // 保留换行结构
    // 保留原换行数,避免行号错乱
    const removed=src.slice(st,en+2);
    out+='\n'.repeat((removed.match(/\n/g)||[]).length);
    i=en+2;
  }
  return out;
}
// 剥离 [? cond : content ?] 的 cond 部分
function stripConds(line){
  let out='', i=0;
  while(i<line.length){
    if(line.startsWith('[?',i)||line.startsWith('[[',i)){
      const close=line.startsWith('[?',i)?'?]':']]';
      const en=line.indexOf(close,i);
      if(en<0){out+=line.slice(i);break;}
      const inner=line.slice(i+2,en);
      const ci=inner.indexOf(':');
      out+=ci>=0?inner.slice(ci+1):'';
      i=en+2; continue;
    }
    out+=line[i]; i++;
  }
  return out;
}

let n=0;
for(const f of walk('source/scenes').filter(x=>x.endsWith('.dry'))){
  if(/credits\.scene\.dry$/.test(f))continue;
  const src=stripCodeBlocks(fs.readFileSync(f,'utf8'));
  src.split('\n').forEach((l,i)=>{
    const t=l.trim();
    if(!t||t.startsWith('#')||t.startsWith('//'))return;
    if(/^[A-Za-z_-]+:/.test(t)&&!/^(title|subtitle|unavailable-subtitle):/.test(t))return;
    const vis=stripConds(l);
    const m=vis.match(PAR);
    if(m){n++;console.log(path.relative('source/scenes',f).split(path.sep).join('/')+':'+(i+1)+'  ['+m[0]+']  '+vis.replace(/\s+/g,' ').trim().slice(0,110));}
  });
}
console.log('\n玩家可见拉丁党派缩写:',n);
