# 在浏览器中使用 DSL

Inform UI 的浏览器入口接收 DSL 文本。完整页面、状态与实例 API 见 [快速开始](v2/quick-start.md)。

## 当前运行库

无需构建时，可以加载预构建的 [DSL 浏览器脚本](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/inform-ui.global.js)，通过 `window.InformUI` 使用：

```html
<main id="app"></main>
<script src="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/inform-ui.global.js"></script>
<script>
  const view = InformUI.mount(document.querySelector('#app'), {
    source: 'root = Stack([Heading("Hello", 1), Text("Built with DSL")])',
    theme: 'light',
    onError: issues => console.error(issues),
  });
  window.addEventListener('pagehide', () => view.dispose(), { once: true });
</script>
```

`cdn/next/` 是当前 DSL 资源的文件路径。`@main` 会随仓库更新，CDN 和浏览器缓存可能延迟刷新；需要可复现的交付时，固定完整提交 SHA，并保存同一版本的 [第三方许可](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/THIRD_PARTY_NOTICES.txt)。不要把移动分支链接当作版本锁。

## 本地与离线交付

- 源码构建：运行 `npm run build`，按 [接入指南](v2/quick-start.md) 使用构建文件。
- 生成自己的页面：使用 [CLI](api.md) 构建 `.openui` 文件，并保留输出的运行库与许可文件。
- 重新分发预构建运行库时，将匹配的 `THIRD_PARTY_NOTICES.txt` 一起交付。

CDN 加载需要网络；本库不会自动上传 DSL 或状态。宿主允许的远程媒体仍可能发出网络请求。HTTP 可达、字节哈希一致和浏览器渲染验收是不同检查，不应互相代替。当前没有 npm 发布或正式 release。
