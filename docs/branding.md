# Inform UI：名称与兼容性

项目与仓库现名为 **Inform UI / Inform-UI**，配套技能仓库为 **Inform-UI-skill**。开发包名为 `@micraow/inform-ui`，目前仍未发布 npm 包或正式 release。

品牌调整不改变现有 JSON 文档协议。以下技术标识保留兼容性，不表示与原参考产品有关联：

- `iui/1`、`IUIDocument` 和 Schema 的历史 URN
- 浏览器全局 `IUI`、`validateDocument`、`mount` 及控制器方法
- CLI `iui` 与 `.iui-*` CSS 类、CSS 自定义属性
- 分发文件名 `iui.global.min.js`、`iui.min.js`、`iui.css`、`iui.schema.json`

当前原创示例与用户入口使用新品牌。历史冻结的盲测 HTML/JSON、哈希、截图与提交保持原字节，可能包含旧项目名或旧 CDN 路径；它们属于历史快照。新交付使用实际验证过的新仓库固定提交路径和 SRI，不能只依据 GitHub 的重定向推断 CDN 可用。

OpenAI Intelligent UI 是本项目所研究的原始视觉与交互参考对象，该名称不随本项目改名替换。独立实现、无官方关联和第三方权利边界见 [README 中英文声明](../README.md) 与 [来源说明](provenance.md)。声明不授予任何第三方授权，项目 MIT 许可也不覆盖不属于本项目的素材或代码。
