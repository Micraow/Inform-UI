# DSL API 与 CLI

Inform UI 只接受 DSL 文本作为公开界面输入，文件扩展名为 `.openui`。当前是源码预览，尚未发布 npm 包。先在仓库中运行：

```sh
npm ci --ignore-scripts
npm run build
```

## API

包根入口 `@micraow/inform-ui`、`@micraow/inform-ui/browser` 和 `@micraow/inform-ui/core` 都使用 DSL。前两者提供全量 profile，`core` 提供基础 profile。源码构建后的浏览器文件为 `dist/v2/inform-ui.js` 和 `dist/v2/inform-core.js`。

使用 `mount(container, { source, theme, onError })` 挂载 DSL，返回的实例提供 `commit(source)`、`preview(source)`、`getSnapshot()`、`setTheme(theme)` 与 `dispose()`。完整 HTML 示例、状态订阅与运行约束见 [快速开始](v2/quick-start.md) 和 [DSL 语法边界](v2/dsl-compatibility.md)。

宿主应用负责外部数据、网络请求和业务回调。DSL 不执行任意 JavaScript，也不会自动将表单或状态发送给服务端。

## CLI

从仓库根目录直接运行源码中的 CLI：

```sh
node bin/iui.mjs check answer.openui
node bin/iui.mjs inspect answer.openui
node bin/iui.mjs build answer.openui --out output/answer.html
node bin/iui.mjs catalog
node bin/iui.mjs prompt
node bin/iui.mjs --help
```

- `check` 检查 DSL 的语法与组件契约。
- `inspect` 查看 DSL 的解析与运行信息。
- `build` 生成 HTML，默认将 `inform-ui.global.js` 与 `THIRD_PARTY_NOTICES.txt` 复制到 HTML 同目录；交付时保留生成文件之间的相对路径。
- `catalog` 与 `prompt` 提供所选 profile 的组件目录和创作提示词。

`--select` 与 `--views` 用于选择组件 profile；`build` 支持 `--title`、`--lang`、`--theme` 与显式 `--runtime-url`。指定远程运行库会改变交付的网络依赖，应使用匹配的固定版本。选项格式与默认值以 `--help` 为准。

公开命令不再接受 `iui/1` JSON 文档，也不提供旧 JSON API 的兼容入口。浏览器加载方式见 [CDN 指南](cdn.md)。
