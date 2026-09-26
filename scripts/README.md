# 校对工具链

所有门禁以**构建产物**(`out/game.json`)或**源码行级分类**为判据,不用「含英文的行」这类
粗口径 —— 该口径曾把结构性属性行(`view-if:` / `on-arrival:`)误计为未译散文,导致
「5466 行未译」的虚高数字(真实值:5 行,全在 credits 且属有意保留)。

## 构建 / 维护

| 脚本 | 用途 |
|---|---|
| `build.js` | 全量构建(清 `out/game.json` 强制重编 → 生成 HTML → 套用中文模板) |
| `patch-engine.js` | 幂等修补 dendrynexus 引擎(Windows 路径坑等) |
| `gen-glossary.js` | `glossary.tsv` → `glossary.md`(勿手改 md) |
| `apply-terms.js` | 按 `glossary.tsv` 批量套用译名 |
| `replace-line.js` / `dump-file.js` | 定向替换 / 查看单文件 |

## 覆盖率(权威口径)

| 脚本 | 判据 |
|---|---|
| `coverage-json.js` | 遍历 `out/game.json` 的 title/heading/option/paragraph,算真实覆盖率 |
| `status.js` | 同上的旧版报告 |
| `audit-completeness.js` | 与 `origin/` 逐文件比对散文覆盖率,列出可疑文件 |

## 门禁(退出码 0 = 干净)

| 脚本 | 判据 |
|---|---|
| `audit-rendered.js` | **主门禁**:逐场景遍历 `out/game.json`,排除 `$code`/`stateDependencies`/`legend`/`name`/资源路径;报玩家可见拉丁党派缩写与纯英文 |
| `audit-built-visible.js` | 直接扫构建产物中的玩家可见英文片段 |
| `audit-prose.js` | 行级散文分类:整行英文 / 中英混排 / 中文散文 |
| `audit-mixed.js` | 中英混排行(允许有意保留的专名括注) |
| `audit-party-labels.js` | 党派标签中文一致性 |
| `audit-precision.js` | 术语精确度(禁用词 / 误译) |
| `audit-semantic.js` | 语义配对(EN/ZH 段落对齐) |
| `audit-consistency.js` | 同一拉丁原文是否多译(需两个参数:`<zh scenes> <en scenes>`) |
| `audit-duplicate-name.js` | 「中文名(同一中文名)」式重复翻译 |
| `audit-malformed-insert.js` | `.dry` 畸形插入标记 `[ + var +]` |
| `check-untranslated.js` | 未译英文残留 |
| `check-continue-sentinel.js` | 「继续......」哨兵一致性(post_event 事件判定依赖它) |

## 术语表校对(源码级)

| 脚本 | 用途 |
|---|---|
| `audit-glossary.js` | 扫描禁用词(国社党 / 帝国议会 / 巴本 / 施莱歇尔…) |
| `audit-variants.js` | 扫描同义异译 |
| `audit-names.js` | 提取全部「·」式译名,与术语表比对 |
| `audit-byline.js` | 逐行比对中英文,检出译名与原文不对应之处 |
| `audit-visible-abbr.js` | 源码级 `{! !}` 状态机,检出玩家可见的拉丁党派缩写 |
| `find-partial.js` / `find-eng-runs.js` | 检出中英文混排行 / 连续英文段 |
| `verify-party-labels.js` | 党派标签核验 |

## 阳性对照

注入 `SPD` 与一个英文句 → `audit-rendered.js` 报 1 缩写 + 2 英文并退出码 1。
新增门禁必须做同样的阳性对照,否则「PASS」可能只是没检测到。

## 移植注意:路径可移植性

模板脚本**全部可移植**,新仓库无需改路径即可跑。定位约定统一为:

- 仓库根:`path.resolve(__dirname, '..')`
- 待扫场景目录:显式参数 → 专用环境变量(`ZH_ROOT` / `VARIANTS_SCAN_ROOT` /
  `ENGRUN_SCAN_ROOT` / `PARTIAL_SCAN_ROOT` / `STATUS_REPO`)→ `<repo>/source/scenes`
- 英文原版:一律走 `lib-en-root.js`(顺序:显式参数 → `EN_ROOT` →
  `<repo>/.upstream/source/scenes` → 本地 `origin/<game>/source/scenes`)。
  游戏目录名用 `ORIGIN_GAME` 覆盖,默认 `social_democracy_redux`。
- 术语表:`<repo>/glossary/glossary.tsv` → `glossary.md`(`gen-glossary.js`)

CI 用法:工作流把上游仓库 clone 到 `<repo>/.upstream`,并 `export EN_ROOT=$PWD/.upstream/source/scenes`。
本地用法:无参数直接跑,自动回落到 `origin/<game>/source/scenes`。

门禁脚本(退出码 0 = 干净)才有 CI 价值;**一次性报告/术语表工具**默认无退出码,
需要时用 `process.exit(命中数 ? 1 : 0)` 补上。当前带退出码的门禁见上表。
