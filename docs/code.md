# 代码块增强：后批候选

增强已有 `code`，不增加协议节点。可选 `copy` 与 `highlight` 均默认false，旧代码/行内代码保持原结构。`inline:true` 不允许任一增强为true。当前仍待真实浏览器和分发验收。

```json
{"type":"code","language":"javascript","value":"const sample = 7;\n","copy":true,"highlight":true}
```

`value` 必须是字面字符串，最多12000 Unicode码点；language为1–200字符。高亮只识别大小写不敏感的精确别名js/javascript、ts/typescript、json、py/python。缺失/未知语言保留纯文本。原创有限词法着色不是语法验证器；不解析完整正则、模板插值、JSX、装饰器或f-string等语法。文本、换行、CRLF、tab和Unicode保持原样，无执行/网络功能。

复制只由明确的原生可信按钮激活触发，向当前ownerDocument的Clipboard API提交原始字符串；浏览器/OS决定最终系统剪贴板编码。不读剪贴板，不申请权限，也不自动复制。缺失/不安全/拒绝/失败时显示手动选择复制提示。忙态保持按钮焦点、只允许一个请求；下一次明确点击可重试。卸载/更新后的旧promise不会改动旧或新UI。

增强块使用无名 `.iui-code-block` 外壳；作者id/data-iui在此壳，实际可原生滚动和选择的pre仍为 `.iui-code`。默认代码仍直接返回pre，行内仍为code。颜色来自共享主题tokens，无外部资源；同时进入DOM注入与离线compiler样式。

[完整原创示例](../examples/code.json)与[窄容器组合](../examples/code-contained.json)均只需base分域。JSDOM中的clipboard测试明确使用stub，不代表真实系统剪贴板已写入；真实浏览器套件不请求权限，也不读取已有剪贴板。
