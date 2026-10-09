# 有限轮播内容集合：后批候选

增强已有 `carousel`，不增加协议节点数。当前公共验收计数仍以组件进度记录为准；本增强尚未完成浏览器/CDN验收。

```json
{"type":"carousel","label":"作者给定的笔记","controls":true,"children":[{"type":"text","value":"第一条"},{"type":"text","value":"第二条"}]}
```

- `children` 保持0–500个普通节点，沿用全局节点/深度预算及嵌套语义校验。0项有明确空提示；1项没有无用按钮。
- 可选 `label` 为1–200字符，省略时用本地化“可滚动内容集合”；`controls` 默认true，false只去掉按钮，保留原生滚动。
- 按钮每次前进/后退一个当前可视宽度，精确停在边界。边界按钮以 `aria-disabled` 保留焦点且操作无效果；没有循环、自动播放、选中项、复制内容或远程请求。
- `.iui-carousel` 是实际滚动区域，保留 `role=region`，可见label提供唯一名称。有溢出才额外进入Tab顺序。外层无名shell持有作者 `id`/`data-iui`，因此需要滚动元素的选择器应使用 `.iui-carousel`。
- 内容按作者顺序只渲染一次。滚动和无关 `setState` 保留子字段草稿、时间控件、展开面板、DOM和焦点。普通 `controller.update` 仍按主库生命周期重建；子组件照常清理。
- 页数提示表示部分可见的作者条目范围，不代表选中的slide。原生键盘、横向滚轮和触摸滚动不被拦截。代码/表格可继续在子组件内局部滚动。
- 同版base闭包示例：[carousel-basic.json](../examples/carousel-basic.json)。含表单/时间示例：[carousel.json](../examples/carousel.json)，需base+forms+time。领域卡片示例：[carousel-contained.json](../examples/carousel-contained.json)，需base+weather+finance+converters。

所有示例为原创合成数据。本地23项隔离/公共API检查已通过；实际Chromium场景另备，未将待运行测试计为验收。
