# 按需读取 Schema

完整 [`iui.schema.json`](../src/schema/iui.schema.json) 仍是唯一协议定义，版本和校验语义保持不变。分片由同一个生成器裁剪，不维护另一套字段定义，也不增加浏览器运行时 API。

固定入口：[索引](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@6797f7f7755f483db6c3be3831aa03433b7c4696/cdn/schema/index.json) · [base Document](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@6797f7f7755f483db6c3be3831aa03433b7c4696/cdn/schema/base.schema.json) · [base+finance Document](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@6797f7f7755f483db6c3be3831aa03433b7c4696/cdn/schema/finance.schema.json) · [finance Node查询](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@6797f7f7755f483db6c3be3831aa03433b7c4696/cdn/schema/nodes/finance.schema.json)。这些路径与同提交的完整Schema/运行库已实际取回并核对哈希、MIME与CORS。

## 两种读取目的

- **准备写一页内容或结构校验**：选择 [`index.json`](../cdn/schema/index.json) 中该组的 `documentSchema`。领域 Document bundle 默认包含 `base` 与该领域，因此金融页可以直接含标题、正文、row、card、指标和基础联动控件。
- **已经掌握基础，只查询某类字段**：读取该组的 `nodeSchema`。它是较小的 Node 子集，不是 Document；没有文档 state/computed，递归子节点也限制在本组。不能用它代替整页校验。

`includedGroups` 明示 Document 包含哪些组，`ownedNodeTypes` 只列这一组拥有的类型；每个类型只有一个 owner。`forms`、`charts`、`graphics`、`weather`、`sports`、`learning`、`finance`、`converters` 分别拥有自己的节点。`compatibility` 仅记录历史 `native` 的结构，运行时始终拒绝，不属于可用组件。

示例路径 `groups[].examples[].path` 相对 **CDN 的 index.json URL** 解析，例如 `../../examples/finance-preview.json`。本地 checkout 使用 `repositoryPath`。完整 Schema 的 `fullSchema.path` 同样相对该索引，指向 `../iui.schema.json`。

## 跨领域组合

基础+单领域包适合该领域的普通页面。金融页如果还含天气组件，需要完整 Schema，或显式生成组合：

```sh
npm run generate
node scripts/schema-subset.mjs --groups base,finance,weather --out output/research.schema.json
```

CLI 的 `--groups` 是显式集合，不会自行补 base；例如 `--groups finance` 只允许金融节点。默认发布的 `finance.schema.json` 则等同于 `--groups base,finance`。重复组会去重，顺序不会改变结果。

无终端的网页聊天直接使用完整 Schema，或已生成的单领域 Document bundle；无需在浏览器加载 Node 脚本。混合更多领域时不要把一个单领域包当成全量协议。

## 结构与语义

所有分片仅做 JSON Schema **结构校验**，例如字段类型、必填字段和节点集合。最终仍须调用同一个 `IUI.validateDocument`；它继续检查状态引用、循环依赖、控件范围、日期、URL、安全边界和 native 拒绝。结构有效不保证语义有效。

Document bundle 保留完整 envelope，包括 `state`、`computed` 和 body；引用的 `$defs` 递归闭合。所有 `$ref` 都是文件内 JSON pointer，没有额外下载依赖。分片 `$id` 包含完整版 Schema 的 SHA-256、根类型和组集合，避免不同完整协议快照共享分片身份。原完整版的历史 URN 保持兼容。

使用同一固定提交的运行库、完整 Schema、索引、分片与示例。固定 CDN 入口见 [浏览器用法](cdn.md)；不要把活动分支路径当成固定版本。

## 体积与 token 估算

索引为每个文件记录实际 UTF-8 字节数、Unicode 字符数与 SHA-256。`estimatedTokens` 使用 `ceil(Unicode 字符数 / 4)`，只是明确标注的粗略启发式，不是特定模型分词器的实测值。实际 token 数、是否节省，以及省多少，取决于模型、读取的领域和是否重复读取基础定义。

以下是52节点首次分片的生成快照；后续版本以该版本索引中的数据为准。字节数是原始 JSON，未按 HTTP 压缩折算。

| 内容 | 实际字节 | 启发式 token 估算 |
|---|---:|---:|
| 完整 Schema | 97,708 | 24,427 |
| base Document | 33,485 | 8,372 |
| base+finance Document | 45,706 | 11,427 |
| finance Node 查询片 | 12,679 | 3,170 |
| weather Node 查询片 | 7,218 | 1,805 |
| charts Node 查询片 | 4,783 | 1,196 |

索引自身为12,811字节，也有读取成本。领域 Document 包重复包含基础定义；需要多个领域时，合并一次或读取完整 Schema 往往更合适。不能把某个节点片与完整版的大小差直接当成整次会话节省比例。

## 生成与检查

`scripts/generate-schema.mjs` 在定义节点时登记组，并调用 `scripts/schema-subsets.mjs` 从完整 Schema 裁剪。生成文件位于 `src/schema/fragments/`，CDN 构建镜像到 `cdn/schema/` 并加入完整性清单。不要手工修改生成文件。

测试覆盖现有真实示例、含基础布局的金融文档、跨领域 union、结构反例与语义反例、漏引用/远程引用、节点唯一归组、确定性、源码/CDN字节一致和 CLI。CI 还检查未跟踪的生成文件，防止漏提交；`.gitattributes` 固定文本文件为 LF，避免跨平台 checkout 改变哈希。
