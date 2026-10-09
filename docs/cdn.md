# 无需安装：直接在浏览器使用

网页聊天模型不需要读取库的实现，也不需要终端。它只需知道 `iui/1` 内容协议和下面的固定调用壳：填写 JSON，调用 `IUI.validateDocument`，再由 `IUI.mount` 渲染真正的 HTML DOM。

这是同一套 Inform UI 库，不是另一种产品版本。首次加载需要网络；不需要 Node、构建工具、OpenAI 账号或服务。

## 已固定的公开入口

以下链接固定到包含预构建产物的完整 Git commit `064ab51e1224045ca2968e3e3f1a3e886f3fca4c`，不随分支变化。

- [普通脚本：iui.global.min.js](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@064ab51e1224045ca2968e3e3f1a3e886f3fca4c/cdn/iui.global.min.js)，导出 `window.IUI`
- [ES module：iui.min.js](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@064ab51e1224045ca2968e3e3f1a3e886f3fca4c/cdn/iui.min.js)，支持 `import { mount, validateDocument }`
- [同版本样式：iui.css](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@064ab51e1224045ca2968e3e3f1a3e886f3fca4c/cdn/iui.css)
- [完整 JSON Schema](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@064ab51e1224045ca2968e3e3f1a3e886f3fca4c/cdn/iui.schema.json)
- [字节哈希与 SRI 清单](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@064ab51e1224045ca2968e3e3f1a3e886f3fca4c/cdn/integrity.json)

数学公式使用 KaTeX 可视排版与无障碍 MathML。CSS 会从同一固定提交的 `cdn/fonts/` 下载官方 MIT WOFF2 字体；部署时须保留这个目录。离线编译与默认 DOM 注入则内嵌相同字体。两个脚本格式任选其一，不要同时加载。

## 可复制的最小 HTML

保存为 `answer.html`。将 JSON 数据块替换为模型按 Schema 生成的内容即可；启动脚本保持固定。下方 SRI 与上面的固定提交一一对应。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>Inform UI 示例</title>
  <link id="iui-style" rel="stylesheet"
    href="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@064ab51e1224045ca2968e3e3f1a3e886f3fca4c/cdn/iui.css"
    integrity="sha384-b9Fs3hvitvhtio4FkB82fDurrf09T+j9zh/CiWRNmLkQZycn894/nyNDOpq3nYEa"
    crossorigin="anonymous">
</head>
<body class="iui-page" data-theme="auto" style="margin:0">
  <main id="answer"></main>
  <pre id="status" role="alert"></pre>
  <script id="spec" type="application/json">
  {
    "version": "iui/1",
    "state": { "gain": 2 },
    "computed": { "result": { "op": "mul", "args": [12, { "$": "gain" }] } },
    "body": [
      { "type": "title", "value": "调节增益，观察合成读数" },
      { "type": "slider", "label": "增益", "bind": "gain", "min": 1, "max": 4, "step": 1 },
      { "type": "metric", "label": "合成读数", "value": { "$": "result" }, "unit": "示意单位" }
    ]
  }
  </script>
  <script
    src="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@064ab51e1224045ca2968e3e3f1a3e886f3fca4c/cdn/iui.global.min.js"
    integrity="sha384-R/xK2Ewh8duMhbO5XqnTILQvyu4Ob0Hsw5nqQkRdddquWdPeScw9VX9cN5M7BKFd"
    crossorigin="anonymous"></script>
  <script>
    const status = document.getElementById('status');
    try {
      if (!window.IUI) throw new Error('界面库加载失败，请检查网络或固定 CDN 链接。');
      if (!document.getElementById('iui-style').sheet) throw new Error('样式加载失败，请检查 CDN 链接。');
      const spec = JSON.parse(document.getElementById('spec').textContent);
      const result = IUI.validateDocument(spec);
      if (!result.ok) {
        status.textContent = result.issues.map(i => i.code + ' ' + i.path + ': ' + i.message).join('\n');
      } else {
        IUI.mount(document.getElementById('answer'), result.document, { styles: false });
      }
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error);
    }
  </script>
</body>
</html>
```

嵌在 HTML 数据块中的 JSON 字符串如包含 `<`，须写为 `\u003c`，防止提前关闭数据块。不要添加模型生成的事件函数、任意 CSS/HTML 或额外脚本。错误信息只通过 `textContent` 显示。

[完整可保存示例](../examples/browser/cdn-minimal.html) 与 [正常报错示例](../examples/browser/cdn-invalid.html) 使用相同调用壳。报错页故意引用不存在的 `missing` 状态，应显示 `UNKNOWN_REFERENCE` 及 `/body/0/value/$`，而不是静默空白。

## 浏览器 API 合同

- `IUI.validateDocument(unknown)`：返回 `{ ok: true, document }`，或 `{ ok: false, issues: [{ code, path, message }] }`。
- `IUI.mount(element, spec, { styles: false })`：JSON → HTML DOM；返回 `update(nextDoc)`、`setState(patch)`、`getState()`、`dispose()`。
- `mount` 本身也会校验，无效输入抛出 `InvalidDocumentError`，其中有 `issues`。
- `compileHtml` 是 Node API，不能写进无安装浏览器调用壳。
- JSON 文档保留在当前页面，本库不会将它上传给 jsDelivr。CDN 加载仍会产生普通 HTTP 请求，服务方可以看到 IP 等常规连接信息。

## HTTP 与浏览器验收分别记录

固定提交的两个 JS、CSS、Schema 已分别取回并核对 SHA-256：均为 HTTP 200，MIME 分别为 JavaScript/CSS/JSON，`Access-Control-Allow-Origin: *`，缓存为一年 `immutable`。机器可读锁定信息见 [`cdn-lock.json`](../cdn-lock.json)。

真实浏览器是否通过，以 `tests/browser/cdn.spec.mjs` 对应的 [GitHub Actions](https://github.com/Micraow/Inform-UI/actions/workflows/ci.yml) 结果为准。该测试从新上下文打开本地 `file://` HTML，禁用浏览器缓存并阻止 service worker，只允许固定 CDN JS/CSS/Schema 及字体，不注入本地运行库；另外验证计算、重置、MathML、错误提示和网络字节哈希。HTTP 200 本身不算渲染通过。

普通网页聊天是否能够凭 Skill/Schema 独立生成合适的新页面，是另一层作者使用验收；基础 CDN smoke test 不代替这项测试。

## 分发与更新边界

jsDelivr 支持 GitHub 完整 commit 路径，固定提交文件具有长期缓存；修复时请发布到新提交并同时更新 URL 与 SRI，不覆盖旧链接。它将 HTML 按纯文本提供，因此应把这里生成的 HTML 保存到本地或放到自己的站点，不能把 CDN HTML 链接当成页面托管。[官方说明](https://github.com/jsdelivr/jsdelivr#github)

当前没有 npm 发布或正式 release。使用相同 CSS/JS/Schema 提交，不混搭版本；CDN 暂不可达时会显示加载错误，本地 agent 仍可使用[源码构建方式](../README.md#源码与本地-agent)。

独立文档壳使用 `body.iui-page` 与匹配的 `data-theme`（auto/light/dark），让页面外围背景也跟随主题；嵌入现有网页时不要给宿主添加这个类。`mount` 的样式保持局部作用域，不修改宿主背景。

当前固定50节点资产包含体育、测验/闪卡、金融快照/历史/共同基准比较/热图及校准后的配色，源代码CI：[11a5dac](https://github.com/Micraow/Inform-UI/actions/runs/37876233005)。本次也包含微量自动Y域与编辑后清理旧表单成功提示。旧f372c71固定46节点页面仍可用，不会自动随新分支升级。

- [体育与学习HTML](../examples/browser/domains-preview.html) · [JSON](../examples/domains-preview.json)
- [金融组件HTML](../examples/browser/finance-preview.html) · [JSON](../examples/finance-preview.json)

页面只引用同一固定JS/CSS/字体。新的file://实载记录以当前PR的CI为准，HTTP200本身不代替浏览器验收。

热图选中框独立绘制在最上层并内缩，鼠标为2px；键盘使用同一块的3px focus色内框，无合适可见面积时才显示整图备用焦点。12组DPR1/2、亮暗和整数/分数尺寸已执行逐边像素检查，图块权重面积保持不变。该修复不改变50节点的数据合同。

新品牌提交064ab51的JS/CSS/Schema与已验11a5dac逐字一致。Inform-UI新仓库的固定global/ESM/CSS/Schema路径已实际取得HTTP200并核对MIME、CORS与SHA-256；不依赖对旧仓库重定向的假设。新的file://验证仍以当前CI结果为准。
