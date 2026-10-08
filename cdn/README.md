# 可直接加载的浏览器构建

这里是同一套 Intelligent-UI 库的公开预构建产物，不需要使用者安装 Node 或执行构建。只包含本项目原创实现及许可明确的 Ajv/KaTeX 依赖。

- `iui.global.min.js`：普通 `<script>`，提供 `window.IUI`；适合无 agent 的网页聊天模型输出 HTML。
- `iui.min.js`：ES module，供 `import { mount, validateDocument } from ...` 使用。
- `iui.css`：同版本样式；加载后使用 `mount(container, spec, { styles: false })`。
- `iui.schema.json`：公开 `iui/1` JSON Schema；使用者可以只读协议，无需阅读实现。
- `integrity.json`：逐文件大小、SHA-256 和 SHA-384 SRI。
- `LICENSE.txt` / `THIRD_PARTY_NOTICES.md`：随构建保留的许可。

两个 JavaScript 文件是同一套库的模块格式，不是两种产品版本。MathML 使用浏览器/系统字体，没有字体 CDN、OpenAI 服务或账号依赖。

浏览器接口：`validateDocument(input)` 返回 `{ ok: true, document }` 或 `{ ok: false, issues }`；`mount(element,input,options?)` 将 JSON 渲染为 HTML DOM，返回 `update`、`dispose`、`getState`、`setState` 控制器。`compileHtml` 是 Node API，不包含在浏览器入口中。

固定 commit 的 jsDelivr URL 形如 `https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@<完整提交SHA>/cdn/iui.global.min.js`。请使用已验证的完整 SHA，不使用 `main`、`master` 或 `latest`。jsDelivr 会持久缓存固定提交文件；发布修复时应更新到新的 SHA。

CDN 只分发脚本、样式和协议。HTML 页面应保存为本地 `.html` 或放在你的站点；jsDelivr 出于安全原因将 HTML 按纯文本提供。初次 CDN 加载需要联网，通常会向 CDN 发送 IP 等常规 HTTP 请求；文档 JSON 不会由本库上传给 CDN。

官方规则：[jsDelivr GitHub 用法与缓存](https://github.com/jsdelivr/jsdelivr#github)。可直接复制的固定链接和 HTML 示例见浏览器使用文档；HTTP 可访问与实际浏览器渲染是分别验证的。

维护者：`npm run build:cdn` 重新生成，CI 检查源码与公开构建未发生漂移。不要手改生成文件。
