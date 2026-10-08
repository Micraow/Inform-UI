# API 与 CLI 使用

以下示例面向当前源码构建。先运行 `npm ci --ignore-scripts` 和 `npm run build`。

## 校验文档

```js
import { validateDocument } from './dist/index.js';

const result = validateDocument(input);
if (!result.ok) {
  console.error(result.issues); // [{ code, path, message }]
} else {
  console.log(result.document);
}
```

`input` 是 `iui/1` JSON 对象。成功结果是脱离原输入、深度冻结的文档；错误的 `path` 使用 JSON Pointer。校验覆盖结构、表达式、状态引用、图表/表格/拓扑数据以及 URL/SVG 边界。

## 编译 HTML

```js
import { compileHtml, compileArtifact } from './dist/index.js';

const html = await compileHtml(document, {
  assets: 'inline',
  lang: 'zh-CN'
});

const artifact = await compileArtifact(document, {
  assets: 'shared',
  assetBase: './iui-assets/',
  lang: 'zh-CN'
});
// 保存 artifact.html，并按相对路径逐项保存 artifact.assets。
```

- `compileHtml` 返回单文件 HTML 字符串，默认内联代码与样式。
- `compileArtifact` 返回 `{ html, assets }`；共享资源模式需要同时保存资源并通过静态服务器提供。
- 两个入口都校验输入。相同文档、选项与库版本生成确定性的输出。
- `backend: 'portable'` 是现有后端的技术标识，通常可以省略；它不是另一种产品版本。

## 浏览器 API

```js
import { mount } from './dist/browser.js';

const controller = mount(container, document);
controller.setState({ gain: 3 });
console.log(controller.getState());
controller.update(nextDocument);
controller.dispose();
```

- `mount` 需要一个 DOM 容器；默认注入有作用域的样式。
- 已自行加载 `dist/style.css` 时，传入 `{ styles: false }`。
- `setState` 合并标量状态，校验后才更新；无效更新不会覆盖已接受的状态。
- `getState` 返回冻结的状态副本。
- `update` 校验并替换完整文档，状态重置为新文档的初始值。
- `dispose` 清理该实例的界面、事件和尺寸观察；可重复调用。
- 多个实例的状态独立。卸载后继续修改状态会报错。

JavaScript、样式与宿主页面仍受浏览器 CSP 约束。严格 CSP 应用请同时阅读[安全说明](security.md)。

## CLI

从仓库根目录运行：

```sh
node bin/iui.mjs validate answer.json
node bin/iui.mjs validate answer.json --json
node bin/iui.mjs build answer.json --out answer.html --lang zh-CN
node bin/iui.mjs build answer.json --out output/answer.html --assets shared
node bin/iui.mjs inspect answer.json
node bin/iui.mjs doctor
```

`validate --json` 适合工具读取；`inspect` 汇总节点和状态；`doctor` 显示本地运行信息。

退出码：成功为 `0`，文档结构/语义无效为 `1`，参数、文件或 JSON 解析错误为 `2`。当前没有 `preview` 命令；共享资源页面请使用已有静态服务器。

## 状态与表达式

`state` 保存字符串、有限数值或布尔值。引用写作 `{ "$": "gain" }`，计算写作 `{ "op": "mul", "args": [12, { "$": "gain" }] }`。

可用操作符：`add`、`sub`、`mul`、`div`、`max`、`min`、`round`、`abs`、`clamp`、`gt`、`lt`、`eq`、`if`、`format`。它们是受约束的数据树，不是 JavaScript 源码。未知引用、循环依赖、非法参数、除零及非有限结果会被拒绝。

需要直接求值时，可从主入口导入 `evaluateValue` 和 `evaluateState`；通常由控件与渲染器自动处理即可。
