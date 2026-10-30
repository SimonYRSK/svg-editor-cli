# svg-editor-cli

Lab1 Phase 1 作业：一个用 TypeScript 写的 SVG 编辑器命令行（REPL），
以 **Command** 与 **Composite** 模式为主干，带 undo/redo、SVG 读写与自动补 id。

- 仓库：<https://github.com/SimonYRSK/svg-editor-cli>
- 最终标签：`final`（最后一个提交）
- 设计与过程文档：[`doc/README.md`](doc/README.md)（架构方案、设计模式、依赖方向、变化点假设、过程记录、一致性自查、质量保证）

## 快速开始

```bash
npm install          # 开发依赖：typescript / vitest / tsx（运行时零依赖）
npm run cli          # 启动交互式编辑器（输入 exit 或按 Ctrl-D 离开）
npm test             # 189 个用例
npm run typecheck    # strict 模式类型检查（含 tests/）
npm run build        # 编译到 dist/，可用 node dist/main.js 启动
```

> **注意**：`npm run cli` 是**前台阻塞**的交互程序。请单独执行它，或者另开一个终端跑 `npm test`；
> 如果把上面几行一次性粘贴进终端，第一行会占住前台，后面的命令要等编辑器退出（`exit`/Ctrl-D）才会执行，
> 看起来就像"终端没反应"。

## 一小段会话

```text
$ npm run cli
svg-editor 0.1 — type 'help' for commands

svg> init 800 600
canvas 800x600 created
svg> create g flowchart
g#flowchart created
svg> create g node1 in flowchart
g#node1 created in g#flowchart
svg> create rect start 120 100 160 60 #4a90d9 in node1
rect#start created in g#node1
svg> create text start-label 155 135 "开始" in node1
text#start-label created in g#node1
svg> tree
svg (800x600)
└── g#flowchart
    ├── g#node1
    │   ├── rect#start          x=120 y=100 w=160 h=60 fill=#4a90d9
    │   └── text#start-label    (155,135) "开始"
svg> move node1 0 100
g#node1 moved by (0,100)
svg> undo
g#node1 moved back by (0,-100)
svg> save examples/flowchart.svg
saved to examples/flowchart.svg (4 elements)
```

命令序列可以存成脚本回放（`#` 开头为注释）：

```bash
npm run cli < examples/session-flowchart.txt
```

`save` 产出的 `.svg` 可直接拖进浏览器查看。

## 目录

```text
src/model/          领域模型：Shape 层（形状树）、Document、注册表、错误
src/io/             持久化：SVG reader/writer、XML 解析、FileStore
src/app/            应用层：Command / EditCommand / History / Editor / 各命令类
src/presentation/   表示层：分词、行解释、tree/show 格式化、REPL
src/CompositionRoot.ts, src/main.ts   组合根与入口
tests/              189 个用例（含作业 transcript 逐行回放与依赖方向校验）
doc/README.md       架构与过程文档（提交要求的那份）
examples/           可回放脚本与示例 SVG
```
