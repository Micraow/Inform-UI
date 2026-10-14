# 开发指南

需要 Node.js 22+。项目使用 JavaScript / TypeScript，当前为未发布的源码预览。

## Inform UI 2

```sh
npm ci --ignore-scripts
npm run build:next
npm run typecheck:next
npm run test:next
npm run showcase:next
```

`showcase:next` 生成 `output/next/Inform-UI-Next-All-Components.html`。核心契约、解释器、图表和领域视图各自的测试位于 `packages/*/tests/`；集成回归位于 `tests/v2/`。

## iui/1 兼容入口

```sh
npm run check
npm run showcase
```

`check` 生成 Schema / 类型 / 预编译校验器，构建资源，检查类型、Node / DOM / CLI 合同和源码边界。`showcase` 在 `http://127.0.0.1:4175` 提供组件画廊。

浏览器测试需要 Chromium：

```sh
npx playwright install --with-deps chromium
npm run test:browser
npm run test:showcase
```

测试覆盖范围由具体配置与用例决定。Node 或 JSDOM 通过不代表浏览器视觉与交互已通过；CI 结果请对应到实际提交，见 [Actions](https://github.com/Micraow/Inform-UI/actions) 与 [CI 范围](ci-validation.md)。

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/v2/` | DSL 浏览器入口、主题、控件与视图生命周期 |
| `packages/component-contract/` | 组件定义、Schema 与生成提示词 |
| `packages/parser-runtime/` | 严格解释器与本地状态 |
| `packages/chart-extension/` | 图表适配与许可完整的上游源码 |
| `packages/view-contracts/` | 领域视图契约 |
| `packages/domain-view-renderer/` | 领域视图渲染 |
| `showcase-next/` | DSL 展示页与原创示例 |
| `src/core/`, `src/renderer/`, `src/schema/` | `iui/1` 兼容实现 |
| `showcase/`, `examples/` | JSON 画廊与示例 |
| `scripts/`, `tests/` | 构建工具与回归测试 |
| `cdn/` | 可分发浏览器资源与相邻许可 |
| `docs/` | 用户文档与公开截图 |

生成源是 `scripts/generate-schema.mjs` 和各包的构建脚本。修改契约时同步更新源码、生成资源、示例与相关测试。

## 贡献

- 保持独立、厂商中立的运行方式，不依赖私有站点或账号。
- 只提交原创或许可明确的代码、字体、图标和合成示例。
- 保留许可证、来源记录、功能测试及真实的失败信息。
- 说明尚未验证的平台或交互；不要将注册数量当作完整能力证明。
- `dist/`、`output/`、本地日志和测试截图是生成产物。需要公开展示的截图放在 `docs/assets/`，并说明来源。

更多：[架构](architecture.md) · [安全](security.md) · [素材来源](provenance.md)。
