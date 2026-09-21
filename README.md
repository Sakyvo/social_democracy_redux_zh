# 社会民主:另一段历史(中文版)

《Social Democracy: An Alternate History》**redux 版**的中文汉化。

- 原作:[Autumn Chen — social_democracy_alternate_history](https://github.com/aucchen/social_democracy_alternate_history)
- redux 版:[CuttleCraft — social_democracy_redux](https://github.com/CuttleCraft/social_democracy_redux)
- 中文版:本仓库
- 引擎:[dendry](https://github.com/aucchen/dendry) / dendrynexus

中文单语言,**覆盖**原文。

## 直接玩

浏览器打开 `out/html/index.html`,或访问 GitHub Pages。

## 构建

```bash
npm install
node scripts/build.js       # 打引擎补丁 + 用 template-zh 构建到 out/html
```

`scripts/patch-engine.js` 有两处必需补丁:

1. **Windows 路径修复**:引擎 `lib/parsers/dry.js` 用 `lastIndexOf('/')` 从文件路径取 basename,Windows 路径分隔符为 `\`,会导致所有 `.dry` 源文件解析失败并静默产出空数据。补丁先归一化路径分隔符。
2. **UI 层汉化**:`lib/ui/browser.js` 里的提示语字面量与存档时间 locale。

两处补丁都是幂等的,重复执行安全。

> `out/html` 里除 `img/` 与 `d3*.js` 之外的文件由 `template-zh/` 生成;**不要直接改 `out/html`**,改 `template-zh/` 后重新构建。

## 目录

```
source/            场景脚本(.dry)—— 译文在此
template-zh/       构建模板(index.html / game.js / game.css 已汉化)
scripts/           patch-engine.js / build.js
out/html/          构建产物(GitHub Pages 根目录)
out/html/img/      原版图片资源(未改)
```

## 汉化约定

- 专有名词以"最常用译名"为准,党派/组织不用缩写。
- `Reich` 在本视角下译"国家"(`Reichstag` = 国会),不译"帝国";见术语表。
- 图片内嵌文字、`credits` 中的档案来源不译。
- 术语表:`../_template/glossary/`(`glossary.tsv` 机器用 / `glossary.md` 审阅用 / `reich-family.md`)。

## 许可

原作与 redux 版均为 MIT(MIT License 见 `LICENSE`)。本汉化沿用同一许可。
