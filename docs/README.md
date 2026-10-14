# 文档

Inform UI 的公开输入是 DSL 文本，界面源文件使用 `.openui`。当前为未发布的源码预览。

## 接入与创作

- [快速开始与浏览器接入](v2/quick-start.md)
- [API 与 CLI](api.md) · [浏览器 CDN](cdn.md)
- [DSL 语法、状态与安全边界](v2/dsl-compatibility.md)
- [DSL 展示页与示例](showcase.md)
- [主题、语义色与视觉组合](v2/design-foundations.md)
- [图标目录与使用方式](icons.md)
- [组件定义](../packages/component-contract/README.md) · [解释器](../packages/parser-runtime/README.md)
- [图表](../packages/chart-extension/README.md) · [领域视图](../packages/view-contracts/README.md)

组件签名与可用参数以所选 DSL profile 的生成契约为准。目录中保留的历史数据契约与回归记录用于实现维护，不是额外的公开输入格式。

## 内部实现参考

[Schema 源模块](schema-source-modules.md) 与本目录中的历史组件数据契约记录用于维护内部实现和回归测试。它们不定义公开 JSON API；创作时应使用所选 DSL profile 的实际签名。

## 项目

- [开发与目录结构](development.md)
- [架构](architecture.md) · [DSL 安全边界](v2/dsl-compatibility.md)
- [许可与素材来源](../THIRD_PARTY_NOTICES.md) · [截图来源](assets/README.md)
- [CI 配置与范围](ci-validation.md)
- [配套创作 Skill](https://github.com/Micraow/Inform-UI-skill)
