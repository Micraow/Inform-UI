# 开发指南

## 本地工作流

需要 Node.js 22+。当前包未发布 npm；`private: true` 用来防止误发布，源码本身采用 MIT 许可。

```sh
npm ci --ignore-scripts
npm run check
```

`check` 依次生成 Schema/类型/预编译校验器、构建产物、检查类型、运行 Node/DOM/CLI 测试、检查公开类型消费，并扫描源码边界。

需要真实浏览器测试时，在允许安装浏览器的环境中运行：

```sh
npx playwright install --with-deps chromium
npm run test:browser
```

Playwright 使用原创合成示例，覆盖明暗主题、390px/桌面宽度、CSP、输入与重置、图表缺测、共享资源、实例生命周期等。JSDOM 测试不能替代实际布局验证，截图也不等于逐像素复刻结论。当前状态以 [GitHub Actions](https://github.com/Micraow/Inform-UI/actions/workflows/ci.yml) 和[验证记录](verification.md)为准。

## 目录

| 路径 | 职责 |
| --- | --- |
| `src/schema/` | 生成的 `iui/1` Schema、类型与预编译校验器 |
| `src/core/` | 语义校验、状态与受约束表达式求值 |
| `src/renderer/` | DOM/SVG/MathML、控件、排版和主题 |
| `src/compiler.ts` | 独立 HTML 与共享资源编译 |
| `bin/iui.mjs` | 调用同一套核心逻辑的 CLI |
| `examples/` | 标注来源和单位的原创示意文档 |
| `tests/` | 核心、DOM、CLI、类型消费与浏览器测试 |

Schema 的生成源是 `scripts/generate-schema.mjs`，不要只修改生成结果。更改协议、默认行为或支持边界时，同步更新类型、测试、示例和文档。对 `iui/1` 的不兼容改动需要单独的版本决策。

## 贡献边界

- 新组件延续一套独立、vendor-neutral 公开库的方向，不依赖 OpenAI 账号、服务或私有网站内部实现。
- 只提交原创或许可明确的代码和素材；禁止抓取的私有运行时、HAR、账号数据或原始参考截图。
- 示例必须区分真实测量、推导与合成数据；不能用占位内容冒充已接通的外部服务。
- 没有实现或验证的能力应明确标注，不因 Schema 能识别某个节点就宣称支持。
- 修改后运行相关检查，并说明未测试的平台或交互。
- 合并、npm 发布、正式 release 和部署需要相应授权，开发提交不自动包含这些操作。

更多背景：[架构决策](architecture.md)、[安全策略](security.md)、[素材来源](provenance.md)。
