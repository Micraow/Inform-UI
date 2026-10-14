# Inform UI 2 · 快速开始

Inform UI 将 DSL 解析为带严格契约的本地交互界面。浏览器运行不需要 OpenAI 账号、API 或服务。

## 运行展示页

```sh
git clone https://github.com/Micraow/Inform-UI.git
cd Inform-UI
npm ci --ignore-scripts
npm run showcase:next
```

使用 Node.js 22+。直接打开 `output/next/Inform-UI-Next-All-Components.html`，即可浏览组件、编辑源文本并切换主题。这个文件内嵌运行库、样式、示例与许可，不需要本地服务器。

## 嵌入网页

先运行 `npm run build:next`，将 `dist/v2/` 作为静态资源目录提供。下面的页面假设该目录相对于 HTML 可访问：

```html
<!doctype html>
<html lang="zh-CN">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Inform UI 示例</title>
  <div id="app"></div>
  <script type="module">
    import { mount } from './dist/v2/inform-ui.js';

    const view = mount(document.querySelector('#app'), {
      theme: 'light',
      source: `
        $pages = 20
        root = Stack([
          Heading("每天读一点", 1),
          Slider("每日页数", $pages, 5, 80, 5),
          Badge("今日目标：" + $pages + " 页", "info")
        ])
      `,
      onError: issues => console.error(issues),
    });

    window.addEventListener('pagehide', () => view.dispose(), { once: true });
  </script>
</html>
```

通过 HTTP 提供模块页面；需要直接打开的单文件时，使用上面的展示页或配套 Skill 的离线交付工具。全量入口包含图表与领域视图，基础入口为 `dist/v2/inform-core.js`。

## 实例 API

- `view.commit(source)`：提交完整 DSL，并重建声明的初始状态
- `view.preview(source)`：展示部分内容；预览期间不启用交互
- `view.getSnapshot()`：读取当前运行快照
- `view.setTheme('light' | 'dark')`：切换主题
- `view.dispose()`：释放事件、视图与运行时

状态由 `$name = initialValue` 声明，通过控件绑定或 `@Set` / `@Reset` 更新。DSL 中不执行任意 JavaScript，也不自动获得网络、预订、付款或消息权限。媒体 URL 由宿主的显式允许策略控制。详细规则见 [DSL 兼容矩阵](dsl-compatibility.md)。

## 编写界面

从实际 profile 的生成提示词获取组件签名，按 [设计基础](design-foundations.md) 组合布局、语义色和图标。需要智能体辅助时，使用 [Inform-UI-skill](https://github.com/Micraow/Inform-UI-skill)，并保持 Skill 契约与运行库版本对应。

源码仍保留 `iui/1` JSON 入口；其 [API、CLI](../api.md) 和 [画廊](../showcase.md) 单独使用。两种入口不共享输入语法。
