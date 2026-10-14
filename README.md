<div align="center">

# Inform UI

**把文字与数据，变成可交互的界面。**

独立的 JavaScript / TypeScript 可视化组件库。
用紧凑的 DSL 组合图表、表单、卡片与本地交互。

[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Preview](https://img.shields.io/badge/version-2.0.0--alpha.1-orange?style=flat-square)](package.json)
[![Node](https://img.shields.io/badge/Node.js-22%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![Stars](https://img.shields.io/github/stars/Micraow/Inform-UI?style=flat-square)](https://github.com/Micraow/Inform-UI/stargazers)

[快速开始](#-快速开始) · [文档](docs/README.md) · [组件展示](docs/showcase.md) · [配套 Skill](https://github.com/Micraow/Inform-UI-skill) · [反馈问题](https://github.com/Micraow/Inform-UI/issues)

</div>

<p align="center">
  <a href="docs/assets/gallery-panorama.png"><img src="docs/assets/gallery-create.png" alt="Inform UI 原创组件组合：图表、表单、阅读滑块与词汇卡片" width="1200"></a>
</p>
<p align="center">
  <a href="docs/assets/gallery-explore.png"><img src="docs/assets/gallery-explore.png" alt="数据与工具组合示例" width="49%"></a>
  <a href="docs/assets/gallery-compose.png"><img src="docs/assets/gallery-compose.png" alt="日程、旅行与内容组合示例" width="49%"></a>
</p>
<p align="center"><sub>真实运行截图 · 原创合成数据 · iui/1 组件画廊</sub></p>

## ✨ 特性

- 🧩 **组合式界面**：233 个注册组件，涵盖基础布局、控件、图表与领域视图
- ⚡ **本地交互**：状态绑定、筛选、排序与联动，无需服务端执行
- 🎨 **统一设计**：浅色 / 深色主题、语义色与 755 个 MIT 授权图标
- 🛡️ **严格契约**：Schema、参数校验与生成提示词共享组件定义
- 📦 **灵活交付**：浏览器嵌入、独立 HTML，以及帮助智能体编写界面的 [Skill](https://github.com/Micraow/Inform-UI-skill)

## 🚀 快速开始

需要 Node.js 22+。当前为源码预览，尚未发布 npm 包。

```sh
git clone https://github.com/Micraow/Inform-UI.git
cd Inform-UI
npm ci --ignore-scripts
npm run showcase:next
```

直接打开生成的 `output/next/Inform-UI-Next-All-Components.html`，浏览组件、编辑 DSL、切换主题。

## 🔨 一个交互示例

```text
$pages = 20
root = Stack([
  Heading("每天读一点", 1),
  Text("拖动滑块，调整今天的阅读目标。", "muted"),
  Slider("每日页数", $pages, 5, 80, 5),
  Badge("今日目标：" + $pages + " 页", "info")
])
```

嵌入已有页面：

```js
import { mount } from './dist/v2/inform-ui.js';

const view = mount(document.querySelector('#app'), {
  source: dsl,
  theme: 'light',
});

// 页面卸载时释放实例
view.dispose();
```

完整 HTML 壳、API 与交付方式见[接入指南](docs/v2/quick-start.md)。原有 `iui/1` JSON API、CLI 和画廊继续保留，见[兼容入口](docs/api.md)。

## 📚 文档

- [接入与运行](docs/v2/quick-start.md) · [DSL 语法边界](docs/v2/dsl-compatibility.md)
- [主题与组合](docs/v2/design-foundations.md) · [图标](docs/icons.md)
- [组件画廊](docs/showcase.md) · [开发指南](docs/development.md)
- [安全边界](docs/security.md) · [更新日志](CHANGELOG.md)

## 🤝 参与

欢迎通过 [Issues](https://github.com/Micraow/Inform-UI/issues) 报告问题，或提交改进。组件数量是注册目录规模；示例使用给定数据，外部服务由宿主应用接入。医疗相关示例未经临床验证。

## 📄 许可

[MIT](LICENSE) · [第三方许可](THIRD_PARTY_NOTICES.md) · [素材来源](docs/provenance.md)

Inform UI 是独立、非官方项目，不由 OpenAI 开发、维护或认可；运行无需 OpenAI 账号、API 或服务。
