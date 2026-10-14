# Inform v2 与固定 OpenUI DSL 的兼容矩阵

适用实现：[`packages/parser-runtime`](../../packages/parser-runtime/README.md)，浏览器入口为 [`src/v2/browser.ts`](../../src/v2/browser.ts)。对照上游：`thesysdev/openui@cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7`。

结论：Inform 复用 OpenUI 的词法、Pratt 表达式 parser、AST、statement 语法，以及 component/library/prompt 生成机制；采用新的严格本地解释器和事务状态语义。它是有明确边界的 OpenUI 派生方言，不是完整 OpenUI runtime 或语言行为的等价替换。

状态定义：
- **支持**：已实现这一语法或能力；“严格差异”仍然属于支持，但不保证与上游全部输入同结果。
- **明确禁用**：本地 profile 故意拒绝；不会通过兼容回退暗中执行。
- **尚缺**：未实现的接口、运行机制或集成能力；不是已支持但未写示例。
- **上游也未提供**：固定源中不存在该通用语法；不把它误算成迁移遗漏。

## 1. 基础语法与严格校验

| 项目 | 固定上游行为/接口 | Inform 当前行为 | 状态 |
|---|---|---|---|
| `name = expression`、`$name = default` | 按顶层换行拆声明，允许前向引用 | 保留语法和前向引用；要求唯一声明和指定 root | 支持 |
| 数字、双/单引号文本、bool、null、数组、对象、分组 | lexer/Pratt AST 支持 | 保留；最终数值必须有限；单引号支持显式 JSON 风格 escape 加 `\'` | 支持，严格差异 |
| `//` 注释 | 此处的 Inform 前处理不依赖上游是否容忍 | 在引号外移除注释，保留换行 | 支持的 Inform 扩展 |
| 缺逗号/坏 token/多余参数/非法声明行 | parser/materializer 多处会容错、跳过或截去参数 | 完整输入拒绝，不用清理后的树掩盖错误 | 支持，严格差异 |
| 不完整字符串/括号 | 自动补全支持 streaming | 仅 preview 可自动闭合；final 返回 INCOMPLETE 并保留 last-good | 支持，严格差异 |
| `&` / `|` 单字符 | lexer 将其当 And/Or | 拒绝，要求 `&&` / `||` | 明确禁用的宽松别名 |
| 未解析引用/引用环 | materialize 记录 unresolved 并返回 null/Ph | 所有声明 AST 检查未知引用；所有声明依赖环均拒绝，包括不可达声明 | 支持，严格差异 |
| 未使用声明 | 通常不会渲染 | 不渲染；AST 名称/调用/环检查仍执行；完整值和 props 语义惰性求值 | 支持，有明确边界 |
| root 类型 | 库和 parser 提供根配置 | root 必须求值为真实已注册 element，且类型等于 profile.root | 支持 |
| 任意 JavaScript、箭头函数、方法调用、`**` | 固定 Pratt grammar 没有通用支持 | 不提供；不会交给 JS eval | 上游也未提供此通用语法 |
| JSON/AST-looking object 当程序执行 | 上游有 isASTNode 等内部识别机制 | 只执行 parser 产生的 AST；数据 `{k:"Comp"}` 永远作为数据 | 明确安全边界 |

## 2. 算术、逻辑、数据访问

| 项目 | 上游 | Inform | 状态 |
|---|---|---|---|
| `+ - * / %`、一元 `-` | toNumber 宽松强转：bool→1/0，无效文本/其他值→0 | 数值运算要求 finite number，拒绝溢出；不会把非法数据当0 | 支持，严格差异 |
| `/0`、`%0` | 返回0 | DIVIDE_BY_ZERO | 明确禁用的静默容错 |
| 文本 `+` | 一方为文本则 String 拼接；null/undefined为空 | 一方为文本时允许 scalar 拼接；null为空；对象/数组拒绝；有长度预算 | 支持，严格差异 |
| `==`、`!=` | JS 宽松相等 | scalar `Object.is` / 取反；`5 == "5"` false；0 与 -0 不相等 | 支持，严格差异 |
| `< <= > >=` | 数值强转 | 两边 finite number | 支持，严格差异 |
| `! && ||`、三元 | truthiness 与惰性分支，&&/||可返回原操作数 | boolean 条件/逻辑操作数；短路保留，未运行分支不计算除零等运行时值错误 | 支持，严格差异 |
| `obj.field`、`obj["field"]` | evaluator 普通属性读取 | 只读 own property；缺值返回null；禁止原型危险键 | 支持，严格差异 |
| `arr[index]` | 数值强转索引 | 非负安全整数，越界null；不接受文本 `"1"` 作数组索引 | 支持，严格差异 |
| `rows.score`、`.length` | 数组 pluck/长度 | 保留，受操作/数组预算；嵌套数组按访问器递归 pluck | 支持 |
| `.constructor`、`__proto__`、`prototype` 路径 | 上游通用访问函数没有本包的统一安全门 | Member/Index/Filter/Sort/数据键/状态名全部拒绝这些危险键 | 明确禁用 |

## 3. 14 个纯 builtin 完整清单

所有调用使用 `@Name(...)`。组件名保留 builtin，不能靠同名组件替换函数。当前没有自定义函数注册。

| 签名 | Inform 空数组/边界 | 与上游的重要差异 |
|---|---|---|
| `@Count(array)` | `[] → 0` | 非数组拒绝；上游返回0 |
| `@First(array)` | `[] → null` | 非数组拒绝；上游返回null |
| `@Last(array)` | `[] → null` | 同上 |
| `@Sum(numbers)` | `[] → 0` | 每项 finite number，累加溢出拒绝；上游 toNumber 强转 |
| `@Avg(numbers)` | `[] → 0` | 同上；平均值按sum/length |
| `@Min(numbers)` | `[] → 0` | 每项 finite number；上游强转 |
| `@Max(numbers)` | `[] → 0` | 同上 |
| `@Round(number, decimals?)` | decimals默认0，整数[-12,12]；结果有限 | 上游没有这组范围/整数限制 |
| `@Abs(number)` | finite number | 上游强转 |
| `@Floor(number)` | finite number | 上游强转 |
| `@Ceil(number)` | finite number | 上游强转 |
| `@Filter(array, field, operator, value)` | 四个参数，空数组→[]；仍检查参数类型和危险路径 | 详见下节 |
| `@Sort(array, field, direction?)` | 两或三个参数，空数组→[]；direction默认asc | 详见下节 |
| `@Each(array, "item", inlineTemplate)` | 三个参数，空数组→[]，不求值模板运行时内容 | 详见下节 |

完整严格 arity 被验证，不能依赖上游的 missing-arg 容错或 extra-arg 丢弃。无 `@Map`、`@Reduce`、`@GroupBy`、`@Unique` 等额外 builtin；若后续要加，应新增实际实现、预算、签名与测试，不能仅添加 prompt 名称。

## 4. Filter / Sort / Each 精确边界

### Filter

- 参数：`(array, string field, operator, value)`；field 为 `"a.b"` 点路径，`""` 表示元素本身。
- operator 仅 `== != > < >= <= contains`；没有 callback/predicate lambda、regex、case-insensitive 模式或内置 OR。
- 顺序保持原输入顺序；不修改输入。
- Inform `==/!=` 要求两侧 scalar，使用 Object.is；关系比较要求两侧有限数值；contains要求两侧文本并使用区分大小写的 String.includes。
- 上游分别使用宽松相等、toNumber、String(v ?? "").includes(String(value ?? ""))。因此数字文本、null、缺字段的行为不保证相同。
- Inform 缺字段作为null：与null相等可匹配；关系/contains会类型拒绝，不能悄悄丢数据。
- 非数组拒绝；空数组返回[]，但非法参数仍拒绝。参数 field 即使数组为空也检查危险路径。
- 可嵌套 Filter 实现 AND。Each+三元可以产生含null数据；只有声明 childSlots 的UI数组会去掉null，普通数据数组不会自动压缩。

### Sort

- 参数：`(array, string field, "asc" | "desc"?)`；空 field使用元素，点路径用同一安全访问器。
- 单字段；复制输入。Inform先取出/验证全部keys，再排序；singleton也会检查key类型。
- Inform全部keys必须同为finite number，或同为string。null/缺值/mixed numeric-string拒绝。
- 文本采用 JavaScript `<`/`>` 的确定 UTF-16 字典序；不是 localeCompare，也不把 `"10"` 当数字10。数值按数值排序。
- 相等keys显式以原index打破平局，所以asc/desc均保持相对顺序。上游调用复制数组的原生 `.sort`，在现代符合规范的JS中也稳定，但用 numeric-looking coercion / localeCompare，比较含义不同。
- 不实现多字段、用户比较器、locale/collation配置。可在数据准备层预生成单一排序字段。

### Each

- 参数：`(array, "item", inlineTemplate)`；parser也接受裸简单identifier作为变量名，生成prompt推荐引号形式。
- 模板可返回数据或组件，支持嵌套Each；无index参数和JS lambda。
- 循环变量只在内联模板内。普通声明引用按其定义作用域求值，不捕获调用者循环变量。
- Inform按词法Map作用域实现嵌套/遮蔽，action保存对应item值并在点击时读取当时state；上游采用AST literal substitution来捕获item，因此不宣称嵌套同名变量的边界行为全等。
- 空数组返回[]；非数组拒绝（上游返回[]）。模板仍先接受AST名称/调用安全检查。
- 每项求值、嵌套展开、数组长度、输出节点和值量均预算；不能无限嵌套放大。
- 没有 DSL `key` 参数和本包自动稳定节点ID；renderer需处理列表重排后的focus/draft，不把index永久当业务身份。这属于尚缺的稳定身份设计，不是Each的第三个参数用途。

## 5. State / binding / action

| 能力 | Inform 当前合同 | 与上游边界/状态 |
|---|---|---|
| `$state`声明和初始表达式 | 默认值求值一次、安全JSON克隆；所有state initializer都校验 | 支持 |
| 未声明state自动创建 | 拒绝；`$value`仅assignment binding保留输入 | 明确禁用上游prompt的自动null默认行为 |
| 单一store | commit建立新程序及全新默认state；setState/事件事务更新 | 支持，但不复制上游store跨stream/persisted/pristine合并语义 |
| 直接binding | metadata指定prop接`$state`，props只含当前值，node.bindings有私有身份handle | 支持；不是上游 `__reactive` marker ABI |
| assignment binding | `$state = $value + 1`只在binding prop，incoming值安全解释后写目标 | 支持；其他上下文赋值拒绝 |
| `@Set($state, expression)` | 正好2参数，目标必须declared state；点击时算值 | 支持 |
| `@Reset($a, $b, ...)` | 1至64目标，全部必须declared state；恢复原commit默认 | 支持，严格参数差异；上游会过滤非法targets |
| `Action([step,...])` | literal array，可包含动作声明ref/嵌套Action，顺序操作同一draft，整体校验成功才提交 | 支持，严格差异 |
| `steps=[...]; Action(steps)` | 当前makeAction要求literal array | 尚缺上游可求值动作列表的该形式；可直接写Action([...]) |
| Action JSON对象或`{steps:...}` | 不能授权，原形/复制/猜ID均拒绝 | 明确禁用上游legacy动作对象兼容入口 |
| 旧event handle | 每次成功revision更新或dispose失效；失败事务保留原handle | 支持的安全生命周期，不是上游ActionPlan ABI |
| 类型变化 | 默认非null的state保持顶层JSON类型；默认null允许任意受限JSON，最终组件仍严格校验 | Inform严格政策 |
| 多step中间越界 | 只校验最终tree；所有step仍做state类型/预算安全验证；最后无效则整笔rollback | 明确事务语义，不承诺与上游逐step通知相同 |
| 异步动作 | 本包没有异步execute通道 | 尚缺；不要以local Action名义发送外部请求 |

## 6. 明确禁用和后续缺口

**当前本地profile明确禁用**：`Query(...)`、`Mutation(...)`、`@Run(...)`、`@OpenUrl(...)`、`@ToAssistant(...)`、RuntimeRef、任意JS/DOM/window/fetch访问、动态模块URL、DSL提供renderer/validator/callback、原型遍历、非JSON状态。

这些名字中的工具能力上游确有实现，但不是纯离线组件显示的免费权限。以后开通应由显式宿主capability配置、参数严格验证、用户/宿主授权、取消、幂等与过期结果检查共同控制。模型写出名称不能授权外部操作。

**尚缺上游完整接口**：自定义 `defineFunction`执行注册、自定义 `defineAction`网关、工具provider/MCP/query缓存/重试、persisted/pristine store合并、`createStreamingParser`增量缓存、jsonToOpenUI/mergeStatements等序列化工具、statementId传播与稳定节点身份。本包preview每次重解析文本，不宣传增量性能等价。

**整合范围**：解释器本身不拥有浏览器 DOM。集成入口提供 foundation、图表与领域视图，挂载方式见 [快速开始](quick-start.md)。语言支持、浏览器交互、可访问性与分发验证是各自独立的范围。

## 7. 性能与验证边界

解释器、真实组件契约和浏览器宿主均有独立回归测试；测试结果只适用于实际运行的提交与场景。源码位置与运行方式见 [开发指南](../development.md)。

尚未运行模型token或生成质量对照。可描述“更紧凑的语法设计”，不可给未测节省比例或“必然省token”。正式对照应固定组件/数据/交互任务、所选Skill模块和HTML壳、模型/tokenizer版本，分别计prompt、输出、修复重试及有效通过率；另外测真实最终bundle min/gzip、解析/求值/渲染延迟。字节数不等于token数。

## 固定上游证据

- [lexer](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/packages/lang-core/src/parser/lexer.ts)
- [Pratt grammar](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/packages/lang-core/src/parser/expressions.ts)
- [builtins完整签名及函数](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/packages/lang-core/src/parser/builtins.ts)
- [evaluator/Each/action](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/packages/lang-core/src/runtime/evaluator.ts)
- [materialize引用/环与参数映射](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/packages/lang-core/src/parser/materialize.ts)
- [state store/persisted/pristine](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/packages/lang-core/src/runtime/store.ts)
- [parser工具导出](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/packages/lang-core/src/parser/index.ts)
- [MIT原始许可](https://github.com/thesysdev/openui/blob/cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7/LICENSE)
