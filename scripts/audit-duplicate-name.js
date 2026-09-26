#!/usr/bin/env node
// 审计:查找「中文名 + 括号内再次出现同一中文名」的重复翻译(如 中央党(中央党)、民主党([+ ddp_display +]))
const fs=require('fs'),path=require('path');
function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p);}return o;}

// 变量 -> 值
const VARS={
  ddp_display:'民主党', bvp_display:'巴伐利亚人民党',
  z_display:'中央党', dvp_display:'人民党', dnvp_display:'国家人民党',
  nsdap_display:'纳粹党', kpd_display:'共产党', spd_display:'社民党',
};
const ROOT=process.argv[2]||process.env.ZH_ROOT||path.resolve(__dirname,'..','source','scenes');
let n=0;
for(const f of walk(ROOT).filter(x=>x.endsWith('.dry'))){
  if(/credits\.scene\.dry$/.test(f))continue;
  const L=fs.readFileSync(f,'utf8').split('\n');
  L.forEach((l,i)=>{
    let bad=null;
    // 1) 同名重复: 中文名(同一中文名) 或 中文名([+ same_value_var +])
    for(const [v,val] of Object.entries(VARS)){
      if(new RegExp(escapeRe(val)+'\\s*\\(\\s*\\[\\+\\s*'+v+'\\s*\\+\\]\\s*\\)').test(l)) bad='变量重复:'+val+'([+' +v+ '])';
      if(new RegExp(escapeRe(val)+'\\s*\\(\\s*'+escapeRe(val)+'\\s*\\)').test(l)) bad='字面重复:'+val+'('+val+')';
    }
    // 2) 任意 中文名([+ xxx_display +])
    const m=l.match(/([\u4e00-\u9fff]{2,8})\s*\(\s*\[\+\s*(\w+_display)\s*\+\]\s*\)/);
    if(m && VARS[m[2]]===m[1] && !bad) bad='变量重复:'+m[1]+'([+'+m[2]+'+])';
    if(bad){n++;console.log(path.relative('source/scenes',f).split(path.sep).join('/')+':'+(i+1)+'  '+bad+'  ::  '+l.trim().slice(0,120));}
  });
}
function escapeRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
console.log('\n重复翻译:',n);

// 退出码语义:0=干净。
process.exit(n ? 1 : 0);
