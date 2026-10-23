# Lab1 Phase 1：SVG 编辑器（CLI）设计文档

> 代码：TypeScript + 面向对象，零运行时依赖（`typescript` / `vitest` / `tsx` 仅开发期使用）。
> 运行入口：`npm run cli`；测试：`npm test`；类型检查：`npm run typecheck`；构建：`npm run build`。

---

## 1. 架构方案

### 1.1 模块划分

工程按"依赖只能向内"的四层组织，另外两个文件（`src/CompositionRoot.ts`、`src/main.ts`）是组合根：

| 模块（目录） | 职责 | 关键类 |
|---|---|---|
| `src/model/` | **领域模型**：图形树、几何、文档、错误语义。不依赖任何其它层，也不做 IO、不做解析、不做打印 | `Shape`（抽象根）、`ContainerShape`、`Group`、`Rect`、`Circle`、`Ellipse`、`Line`、`Text`、`RootNode`、`Document`、`ShapeTypeRegistry`、`ShapeTypeProvider`、`EditorError` 及其 25 个子类、`NumberText`、`Point`、`NounCount` |
| `src/io/` | **持久化适配**：SVG 文本 <-> `Document`，以及唯一的文件系统访问点 | `SvgReader`、`SvgWriter`、`XmlTreeParser`、`AutoIdAssigner`、`FileStore`（接口）、`NodeFileStore` |
| `src/app/` | **应用层**：命令对象、撤销栈、编辑器会话。它是"用户意图"的落点，不含任何终端 / 文件系统细节 | `Command`（接口）、`EditCommand`、`CommandRegistry`、`History`、`Editor`、`commands/*Command`（15 个命令类，覆盖 16 个命令名） |
| `src/presentation/cli/` | **表示层**：分词、行解释（invoker）、树/明细格式化、REPL 循环 | `LineTokenizer`、`LineInterpreter`、`TreeFormatter`、`ShowFormatter`、`Repl`（按输入是否终端自动切换交互/脚本两种模式）、`commands/TreeCommand|ShowCommand|HelpCommand|ExitCommand` |
| `src/CompositionRoot.ts`、`src/main.ts` | **组合根**：唯一可以同时认识全部层的地方，负责把注册表、编解码器、文件存储、命令对象装配起来 | `CompositionRoot` |

一个类一个文件，文件名等于类名（`Rect.ts` / `RectProvider.ts` / `MoveCommand.ts` …），测试放 `tests/`。

#### 组件图（PlantUML）

```plantuml
@startuml
skinparam packageStyle rectangle

package "presentation/cli" {
  [Repl]
  [LineInterpreter]
  [LineTokenizer]
  [TreeFormatter]
  [ShowFormatter]
  [TreeCommand] [ShowCommand] [HelpCommand] [ExitCommand]
}

package "app" {
  [Editor]
  [History]
  [CommandRegistry]
  interface Command
  abstract class EditCommand
  [edit commands\ncreate/delete/move/scale/set/\ngroup/ungroup/addto/front/back/undo/redo]
  [document commands\ninit/read/save/canvas]
}

package "io" {
  interface FileStore
  [NodeFileStore]
  [SvgReader]
  [SvgWriter]
  [XmlTreeParser]
  [AutoIdAssigner]
}

package "model" {
  [Document]
  abstract class Shape
  abstract class ContainerShape
  [Rect] [Circle] [Ellipse] [Line] [Text]
  [Group] [RootNode]
  [ShapeTypeRegistry]
  interface ShapeTypeProvider
  [providers x6]
  [EditorError + 24 子类]
  [NumberText] [Point]
}

[Repl] --> [LineInterpreter]
[LineInterpreter] --> [CommandRegistry]
[LineInterpreter] --> [LineTokenizer]
[LineInterpreter] --> [Editor]
[LineInterpreter] ..> Command : invokes
CommandRegistry o-- Command
Command <|.. EditCommand
EditCommand <|-- [edit commands]
Command <|.. [document commands]
Command <|.. [TreeCommand]
[Editor] --> [History]
[Editor] --> [Document]
[History] o-- EditCommand
[document commands] --> [SvgReader]
[document commands] --> [SvgWriter]
[document commands] --> FileStore
FileStore <|.. [NodeFileStore]
[SvgReader] --> [XmlTreeParser]
[SvgReader] --> [AutoIdAssigner]
[SvgReader] --> [ShapeTypeRegistry]
[ShapeTypeRegistry] o-- ShapeTypeProvider
[ShapeTypeProvider] <|.. [providers x6]
[Document] --> Shape
Shape <|-- ContainerShape
ContainerShape <|-- [Group]
ContainerShape <|-- [RootNode]
Shape <|-- [Rect]
[TreeFormatter] --> Shape
@enduml
```

### 1.2 设计模式的选择与落地

#### (1) Command（作业要求，核心）

每个用户命令是一个对象，实现 `Command`（`src/app/Command.ts`）：

```ts
export interface Command {
  readonly name: string;
  readonly syntax: string;   // help 与 usage 错误共用
  readonly summary: string;
  execute(args: readonly string[], editor: Editor): string;
}
```

- **invoker**：`LineInterpreter`（`src/presentation/cli/LineInterpreter.ts`）。它只做四件事：过滤注释/空行、分词、在 `CommandRegistry` 里按名字取命令、执行；执行成功后，若该命令是 `EditCommand`，把它**整个对象**压入撤销栈。
- **receiver**：`Editor` + `Document` + `History`。命令不碰全局状态，全部通过构造参数或 `execute` 参数拿到。
- **具体命令**：`create / delete / move / scale / set / group / ungroup / addto / front / back / init / read / save / canvas / undo / redo` 各一个类，另加显示类 `tree / show / help / exit`。
- **落地的三点收益**（可直接在代码里对照）：
  1. 命令的分发只有一处（`CommandRegistry`），新增命令 = 新增一个类 + 一次 `register`，不改任何已有分支；
  2. 撤销单元天然等于命令对象（`History` 存的就是它），`group` 收编 3 个图形仍是一个单元；
  3. 参数校验、执行、回显、撤销回显都在同一个类里，改一条命令只改一个文件。

`EditCommand`（`src/app/EditCommand.ts`）在 `Command` 上加了 `undo()` / `redo()`，并提供 `captureStates` / `restoreStates` 两个复用工具（见下一条）。

#### (2) Composite（图形与容器统一操作）

`Shape`（抽象）→ `ContainerShape`（拥有子节点）→ `Group` / `RootNode`；叶子 `Rect` / `Circle` / `Ellipse` / `Line` / `Text` 直接继承 `Shape`。

- `translate` / `scaleBy` 在 `Shape` 上声明，`ContainerShape` 里实现为"对每个子节点递归"，因此 `move g1 5 5`、`scale g1 2`、`delete g1` 与对叶子图形的写法完全一致（`MoveCommand`、`ScaleCommand`、`DeleteCommand` 里没有任何 `if (isGroup)` 分支）。
- `tree` 递归渲染、`Document.allShapes()` 递归收集，都建立在同一个 `children` 契约上。
- `ungroup` 是否允许，由容器自己回答（`ContainerShape.supportsUngroup`），所以将来插件里的 `box` 只要返回 `false` 就自动得到"不可 ungroup"的语义，命令侧零改动。

#### (3) Memento（撤销的实现手段）

撤销有两种常见实现：逆操作、快照。这里选**快照（memento）**，因为 `group` / `ungroup` / `delete` 这类结构操作很难用逆运算精确还原位置：

- 属性类命令（`move` / `scale` / `set`）用 `Shape.captureState()` 取图形自有状态（几何 + fill/stroke/stroke-width + 文本），`restoreState()` 还原；容器操作时 `EditCommand.captureStates()` 会把子孙一并以 memento 记录，所以"移动整组"是一步撤销。
- 结构类命令（`create` / `delete` / `group` / `ungroup` / `addto` / `front` / `back`）记录"父容器 + 序号（+ 被摘下的子树对象本身）"，撤销即插回原位。被摘下的子树对象保留完整父子关系，因此撤销是 O(1) 结构操作而不是重建。

#### (4) Registry + Provider（唯一的两处按名字分派，标注为待重构）

作业允许按名字分派的地方只有两处，正是本实现中仅有的两处：

| 位置 | 文件 | 状态 |
|---|---|---|
| 命令名 → 命令对象 | `src/app/CommandRegistry.ts` | **待重构**：命令是数量稳定、生命周期与进程一致的集合，本阶段用注册表已足够；若将来需要动态禁用/宏命令，应改为配置驱动的命令描述符 + 解释器 |
| 图形类型名 → `ShapeTypeProvider` | `src/model/shapes/ShapeTypeRegistry.ts` | **待重构（但方向明确）**：这就是 phase 2 的 `ShapeProvider` 插件插槽。注册即可扩展，内核代码为 0；本阶段六个内核类型在 `KernelShapeTypes.ts` 里一次注册 |

除这两处之外，全部行为靠多态：`Shape.setAttribute` 的属性白名单、`describeGeometry` 的显示写法、`supportsUngroup`、`toXmlAttributes` 都是子类覆写，没有任何 `switch (tag)`。这一点由测试守住（见 §4 的 `Architecture.test.ts`：`never dispatches with a switch statement`）。

#### (5) 其它有意采用的小模式

- **Value Object**：`Point`、`NumberText`（解析/格式化/6 位小数规整，保证反复 `scale` 不产生浮点噪音）。
- **Ports & Adapters（轻量）**：`FileStore` 接口 + `NodeFileStore` 实现；测试用 `MemoryFileStore`，命令测试不碰真实文件系统。
- **Template-like 骨架**：`ShapeProviderBase` 收敛参数个数校验与数字解析，六个 provider 只声明自己的参数表与字段映射；`Shape.loadAttributes` 统一处理"内核认识的属性"与"原样保留的属性"。
- **Errors as objects**：25 个 `EditorError` 子类各自携带 `code` 与中文无关的固定文案，错误文案只在一处定义，`LineInterpreter` 统一加 `error:` 前缀；非 `EditorError` 一律视为内部缺陷并输出 `error: internal failure: ...`，便于区分"用户的错"与"我们的错"。

### 1.3 依赖方向规则

| 模块 | 可以依赖 | 理由 |
|---|---|---|
| `model` | 仅 `model` | 领域模型必须能被单独理解与单测；它不知道 SVG 文件、终端、命令的存在 |
| `io` | `model`、`io` | 编解码要把文件文本变成模型对象，只需认识模型 |
| `app` | `model`、`io`、`app` | 应用层需要持久化能力（`FileStore` / `SvgReader` / `SvgWriter`）来服务 `read` / `save`；这是本工程唯一一条"向外层"的依赖，且只依赖 io 暴露的 3 个类型 |
| `presentation/cli` | `model`、`app`、`presentation` | 表示层调用命令与编辑器、渲染模型，但**不得**直接读写文件或解析 SVG |
| 组合根（`CompositionRoot.ts`、`main.ts`） | 全部 | 装配是它的职责 |

配套的三条硬规则：

1. **禁止反向依赖**：`model` 不 import `io`/`app`/`presentation`；`io` 不 import `app`/`presentation`；`app` 不 import `presentation`。
2. **`node:fs` 只允许出现在 `io` 层**（实际只出现在 `NodeFileStore.ts`）。
3. **分层靠测试而不是靠自觉**：`tests/Architecture.test.ts` 逐个文件扫描 import 并断言上表；任何违反规则的 import 会让 `npm test` 直接失败。

> 已知的一条"不理想但有意保留"：`FileStore` 接口放在 `io` 层（而不是 `app/ports`），使 `app -> io` 的方向成立。若坚持"接口必须由使用方声明"，只需把该接口文件上移一层，改动 1 个文件、1 行 import，已记录为可选的待处理项。

### 1.4 变化点假设

按"最可能变化"排序，逐条说明留了什么，或为什么决定不留：

| # | 变化点 | 留下的东西 / 不留的理由 |
|---|---|---|
| 1 | **新增图形类型（如 `box`、`polygon`、`image`）** | 已留：`ShapeTypeProvider` 插槽 + `ShapeTypeRegistry.register`。新增类型 = 新增 1 个 `Shape` 子类 + 1 个 provider + 1 行注册；`CreateCommand`、`SvgReader`、`SvgWriter`、`TreeFormatter`、`HelpCommand` 全部零改动。作业 4.4 的 `box` 正是这条路径，本阶段按阶段边界只报 `unknown shape type: box (is the plugin loaded?)`，错误文案已经为插件预留。 |
| 2 | **撤销策略变化（快照 → 逆操作 / 事务日志）** | 半留：撤销的全部接触面是 `EditCommand` 的 `execute/undo/redo` 与 `History` 两个栈。若要换成事件溯源，只需改 `History` 与各命令的 `undo` 实现，`Command` 接口与调用方不变。 |
| 3 | **持久化格式变化（SVG 变体 / 自有格式 / 云端）** | 已留：`FileStore`（字节进出）+ `SvgReader`/`SvgWriter`（文本 <-> 模型）分离。换格式 = 新写一对 codec，命令层只换注入对象。 |
| 4 | **坐标变换（`transform` 被真正支持）** | 未留，理由：本阶段 `transform` 只出现在外部文件里，语义（嵌套变换的合成、与 `scale` 命令的交互）需要一套 `Transform` 值对象与矩阵乘法，投入产出比在 CLI 阶段不划算。当前策略是"原样保留、不解释、不影响几何命令"，round-trip 无损，已知局限写进了 §3 的修订记录。 |
| 5 | **新的交互通道（GUI / 鼠标 / agent 脚本）** | 已留：命令对象与 `Editor`/`Document` 是纯内存 API，与终端无关；CLI 特有部分被压到 `LineTokenizer` + `Repl` 两个类。GUI 只需换一层 invoker。 |
| 6 | **输出格式变化（颜色、JSON、富文本 tree）** | 已留：`TreeFormatter` / `ShowFormatter` 单独成类且在表示层，命令只返回字符串。换输出 = 换格式化器。 |
| 7 | **id 策略变化（结构路径寻址、重命名命令）** | 半留：所有按 id 的查找集中在 `Document.find/require/requireContainer`，改成路径寻址只改这一处；但"id 唯一性"的校验同时散在 `Document.assertIdAvailable` 与读取器的 `AutoIdAssigner`，若要做"重命名 + 引用更新"，需要引入一个 id 索引，属待处理项。 |
| 8 | **多文档 / 标签页** | 不留，理由：`init`/`read` 直接替换当前文档是本阶段语义，`Editor` 持有单文档对象；加多文档是产品需求变化，不是"为变化预留"能低成本的场景，硬留会污染所有命令签名。 |

---

## 2. 过程记录

按真实推进顺序记录关键判断，包括被修正的错误。

### 2.1 先定"什么不能靠名字分派"，再写代码

动手前把作业约束翻译成两条工程规则：按名字分派只允许两处；`switch (tag)` 一律禁止。于是先设计三层分工（"谁负责解析位置参数"、"谁负责把文本变成模型"、"谁负责回显"），才出现 `ShapeTypeProvider.createFromParams` 与 `createFromAttributes` 两个入口。它们分别服务 `create` 与 `read`，避免把 CLI 语法塞进模型层，也让 phase 2 的插件接口一次成型。

### 2.2 环境问题：npm 缓存不可写（与设计无关，但影响交付）

首次 `npm install` 直接失败：

```
npm error Your cache folder contains root-owned files ...
```

定位：`~/.npm/_cacache` 属主是 `root`（早前某次 `sudo npm` 留下的痕迹），当前用户无法写入。没有用 `sudo` 去动它，而是把本次安装的缓存指向独立目录（`npm install --cache /tmp/npm-cache-svg`），安装随即成功，且不改动机器上任何既有状态。**教训**：报错是环境权限问题还是工程配置问题，先看路径属主与报错原文，不要改工程配置去迁就环境。

### 2.3 类型检查发现的两处真实缺陷

1. `EditorError` 的子类用 `readonly code = '...'` 覆盖抽象属性，`noImplicitOverride` 要求显式 `override`：批量生成 24 个错误类后由 `tsc` 一次性指出，改为 `override readonly code`。
2. `UnknownCommandError` 原本把字段命名为 `name`，与 `Error.name` 冲突（`tsc` 报 TS4114）。改名 `commandName` 而不是 `override`，避免覆盖堆栈里真正有用的错误名。**这条很有代表性**：`override` 不是万能补丁，撞上基类语义时应该换名字。

### 2.4 发现作业样例自相矛盾，用"测原始字节"的方式定标准

§6.1 的 `tree` 样例里，`line#arrow1` 创建时带了 `black` 描边，但样例树里没有 `stroke=black`；同时该样例的属性列并不严格对齐（`rect#start` 的属性从第 29 列开始，`text#process-label` 从第 31 列开始）。做法：

1. 用脚本把 `phase_cli_1.md` 的相关行按原始字符打印出来，逐行数前缀与空格（不靠肉眼估）；
2. 确认 §5.1 与 §6 的样例符合"全局列 = 最宽 `前缀+标签` + 2"这一条规则，§6.1 属手写偏差；
3. 决定：**采用单一全局列规则**（同一棵树里所有带属性的行严格对齐），并且**凡用户设置过的属性都显示**（`stroke=black` 照显）。理由：编辑器树的用途是脱离画布看图，隐藏已设置属性会让人误判；一致性比复刻样例里的笔误更重要。
4. 结论写进本文档与测试：`tests/Transcript.test.ts` 里 §6 的期望输出与作业样例**逐字符一致**，§6.1 只在这两点上按上述规则修正，并在测试注释中标注原因。

### 2.5 撤销粒度：为什么整组操作是一个单元

作业要求"一条编辑命令 = 一个 undo 单元"。实现上不是给 `History` 加特判，而是让命令对象自带 memento：`GroupCommand` 记录新组位置 + 每个子图形的原父与原序号，`undo()` 先把组摘掉、再按原序号升序插回。写测试时发现一个真实的排序陷阱：**必须按原序号升序插回**，否则后插入的图形会被挤到错误位置。这条已固化为 `tests/History.test.ts` 的用例。

### 2.6 `ungroup` 的两条拒绝谁先谁后

作业 §4.2 同时给出"不能 ungroup 复合图形"与"不能 ungroup 根级容器"。§4.4 的例子里 `box#n1` 恰好是根级容器，期望的报错却是复合图形那条，由此确定顺序：先判"不是容器"，再判"不支持 ungroup（复合）"，最后判"根级"。实现为三个独立错误类，顺序在 `UngroupCommand.execute` 里显式写出，并被测试覆盖。

### 2.7 失败的命令不能留下半截状态

作业要求"命令失败不改变任何状态"。排查出的三个风险点及处理：

1. `set` 先取 memento 再改属性，属性白名单校验在赋值之前完成（每个 `applyGeometryAttribute` 分支都是"先解析、后赋值"），因此 `set r1 width abc` 抛错时图形仍是原值；
2. `create` 的顺序是"解析类型 → 校验 id → 校验 `in` 容器 → 由 provider 构造 → 插入"，前四步任一失败都不会有对象进树；
3. `save` 先序列化再写文件，写失败时文档与其 `sourcePath` 都不动（`writeText` 抛错发生在 `setSourcePath` 之前）。

对应测试：`tests/Errors.test.ts` 覆盖了 4.2 表的每一行（除 phase 2 才存在的 `cannot ungroup composite shape`，其代码路径已就位，只缺复合类型）。

### 2.8 测试先跑通作业样例，再补边界

先把作业 §6 的 19 条命令原样回放，发现输出与文档逐字符一致（包括 `├──`、空格列、`warning:` 行序），才继续补 §6.1 与错误表。这一步的价值在事后很明显：`read` 的告警行必须排在摘要行之前、`tree` 的属性列必须全局对齐，这两点都是回放时暴露的，靠"读文档想象"很容易写错。

### 2.9 最后一轮打磨（输出文案与标点）

交付前通读全部输出文案，做了两件小事：

1. **数量词**：`group` / `ungroup` / `scale` / `read` / `save` 的回显都带数量，n=1 时原先会打成 "1 children"。抽出 `NounCount` 值对象统一处理单复数（`1 child` / `2 children`），五个命令共用一处规则。作业样例从未出现 n=1 的句子，因此不影响与样例逐字符一致。
2. **标点**：代码注释里统一不用长破折号，改用冒号、逗号或括号（替换后逐条复查了 `Document`、`LineInterpreter` 两处读起来别扭的句子并重写）。这一条不改变任何行为，只是让注释在纯文本编辑器里也稳定可读。

### 2.10 用户报"终端没反应"之后：两条路径只测了一条

交付后用户按 README 的代码块一次粘贴四行命令，看到终端停在 banner 之后不动。用 `script` 分配伪终端复现：

- 慢速逐行输入：banner、`svg> ` 提示符、命令回显与结果全部正常，程序本身没坏；
- 一次粘贴多行：`npm run cli` 是前台阻塞的交互程序，它占住前台，后三行轮不到 shell 执行，于是"没反应"。

复现过程顺带暴露出两个真实缺陷，均已修：

1. **`Repl` 把 readline 的 `terminal` 硬编码成 `false`**。管道输入时这是对的，但真人交互时 readline 不进行编辑模式，方向键、历史、Ctrl-C 都不正常。改为按 `input.isTTY` 自动判定，并允许用 `ReplOptions.interactive` 显式覆盖。
2. **管道模式下仍打印 `svg> ` 提示符**，污染脚本输出。现在只在交互模式打印，`npm run cli < examples/session-basic.txt` 的输出可以直接逐行比对。

**这条教训最值得记**：此前的 REPL 测试全部用 `PassThrough`（非终端）驱动，等于只验证了"脚本模式"这一条路径，真实终端那条路径从未被执行过。"凡是有 TTY / 非 TTY 双路径的代码，两条路径都要有测试或至少一次伪终端冒烟"，现在 `tests/Repl.test.ts` 两种模式各有用例（189 个用例）。

---

## 3. 一致性自查

### 3.1 模块划分：实际目录是否与方案一致？

| 方案 | 实际 | 结论 |
|---|---|---|
| `src/model/` | `model/{shapes,document,geometry,errors}` | 一致（按职责再分四个子目录，属于细化，不改变依赖方向） |
| `src/io/` | `io/` | 一致。**修订记录**：最初建了空目录 `src/infrastructure/svg`，实现时统一收敛为 `src/io`（目录名更短、与 `app`/`model` 对仗），随后删除了空目录；工程内不存在两套并存的持久化实现 |
| `src/app/` | `app/{commands}/*` | 一致 |
| `src/presentation/cli/` | `presentation/cli/{commands}` | 一致 |
| 组合根 | `src/CompositionRoot.ts`、`src/main.ts` | 一致 |
| `doc/README.md` | 本文件 | 一致 |
| 测试 | `tests/`（9 个文件 + `support/`） | 方案中未单列，属实现期补充，已在此登记 |

### 3.2 依赖方向：规则有没有被违反？

- 机械核查：`tests/Architecture.test.ts` 扫全部 92 个源文件的 import，逐条断言 §1.3 的表；`npm test` 通过即表示**没有违反**。
- 三条硬规则的实际核查结果：`model` 无对外依赖（有独立断言）；`node:fs` 仅出现在 `io/NodeFileStore.ts`；`presentation` 未 import `io`。
- 抽样人工复核（与机械核查相互印证）：
  1. `app/commands/ReadCommand.ts` 依赖 `io/FileStore`、`io/SvgReader`（同层允许的 app->io 方向），未 import `presentation`；
  2. `model/shapes/Shape.ts` 只 import `model/geometry`、`model/errors`；
  3. `presentation/cli/TreeFormatter.ts` 只 import `model/shapes` 与 `model/geometry`，不碰 `Document` 之外的 IO；
  4. `app/History.ts` 对 `EditCommand` 用 `import type`，因此运行期不存在 `History <-> EditCommand` 的循环。
- **待处理项（如实列出）**：
  1. `app -> io` 的方向（见 §1.3 的说明），可选择把 `FileStore` 上移到 `app/ports`；
  2. `Document.assertIdAvailable` 与 `AutoIdAssigner` 各管一半的唯一性校验，将来若支持重命名需要合并成一个 id 索引；
  3. `GroupProvider` 仍是"新建空组"的实现，`group` 命令通过 `shapeTypes.resolve('g')` 复用 provider 以保持"内核不 new 具体图形"，这一写法在插件化阶段应改为由 registry 提供 `createEmptyContainer` 能力，否则 `g` 这个名字会以字符串形式散落。

---

## 4. 质量保证手段

### 4.1 功能完整性怎么确认

1. **作业 transcript 回放**（`tests/Transcript.test.ts`，34 条断言）：§6 的 19 条命令与 §6.1 的 14 条命令逐行断言输出，包含树形缩进、空格列、告警行顺序、undo 文案。这是"功能是否与作业一致"最直接的证据。
2. **错误表逐行覆盖**（`tests/Errors.test.ts`，14 条）：§4.2 的每一行都有对应用例，包括 phase 2 才需要的 `unknown shape type: box (is the plugin loaded?)`。
3. **round-trip**（`tests/SvgRoundTrip.test.ts`，10 条）：`read -> save -> read` 树结构不变；`transform`/`font-size`/`text-anchor` 等内核不解释的属性原样保留；`& < > "` 与中文往返无损；缺 `width/height` 时回落到 `viewBox`；无名元素补 id、重名 id 改名、`<path>` 跳过都各有告警文案。
4. **undo/redo 语义**（`tests/History.test.ts`，6 条）：多数图形一次收编是一个单元、新编辑清空 redo、显示类命令不入栈、io 命令后 undo/redo 皆被拒、下一次编辑后重新解禁。
5. **真实终端冒烟**：用 `npm run cli < session.txt` 跑通了两个作业样例会话，并把生成的 `examples/flowchart.svg` 人工过目（浏览器可直接打开）。

### 4.2 代码质量凭什么有把握

| 手段 | 结果 |
|---|---|
| `npm test`（vitest，9 个文件） | **189 个用例全部通过** |
| `npm run typecheck`（`strict` + `noImplicitOverride` + `noUnusedLocals/Parameters`，覆盖 `src` 与 `tests`） | 0 错误 |
| `npm run build`（`tsc` 到 `dist/`，NodeNext ESM） | 成功，`node dist/main.js` 可直接运行 |
| 架构规则测试 | 依赖方向、`node:fs` 位置、禁用 `switch` 三条硬规则机械守住 |
| 分层可测性 | 命令测试用内存 `FileStore`，不需要临时目录；REPL 测试用 `PassThrough` 驱动，不依赖真实终端 |
| 一处定义、多处复用 | 错误文案 25 个类各一处；`NumberText` 统一数字格式（6 位小数、去尾零），保证反复 `scale` 输出稳定、transcript 可比对 |
| 常量无魔法值 | 画布默认尺寸、缩进、列间距、prompt、banner 都以命名常量出现在所属类里 |

### 4.3 已知局限（如实声明）

1. `transform` 不被解释：外部文件里的 `transform` 会原样保存，但 `move`/`scale`/`tree` 不折算它（见 §1.4 第 4 条）。
2. `style="fill:red"` 这类"样式属性写在 `style` 里"的写法不被解析，只会原样保留。
3. 文本元素的空白会被 `trim`：`<text>  hello </text>` 读入为 `hello`。
4. 树的属性列规则是全局列，因此 §6.1 样例中那两处手写偏差与本文档输出不同（已在 §2.4 说明）。
5. `ungroup` 根级容器的拒绝是作业要求，因此"把根级 `<g>` 拆开"必须先把它的父级建出来（例如先 `group` 到一个外层容器），这是规范选择而非缺陷。
