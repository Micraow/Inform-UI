# 工具提示与非模态面板

`tooltip` 和 `popover` 是62节点开发源码里的base候选。公开推荐的6797固定CDN仍为52节点，不接收它们；源码、实际浏览器和新固定CDN必须分别验收。

## 合同

`tooltip` 是带可见原生按钮的小提示，必填 `label`（1–200字）和 `value`（最多2000字的纯文本）。可选 `placement:"top"|"bottom"`，默认top。它不是承载交互控件的容器，不接收HTML、children或任意事件。

```json
{"type":"tooltip","label":"合成数据是什么意思？","value":"这里的数据由作者编造，仅用于解释交互。"}
```

`popover` 必填 `label`（1–200字）与1–20个普通 `children`，可选 `title`（1–200字）和 `placement`（top/bottom，默认bottom）。它是有明确关闭按钮的非模态说明面板，允许现有输入和其他安全节点。子节点仍受同一Schema、引用、深度及资源规则约束；组件不会替调用方创建action适配器或请求远程数据。

```json
{"type":"popover","label":"展开说明","title":"本地面板","children":[{"type":"text","value":"背景内容仍可使用。"}]}
```

两者都可以提供普通 `id`。内部ARIA标识与用户id使用独立命名域。

## 行为

- Tooltip在悬停或触发按钮聚焦时显示，指针可以跨过间隔移到提示内容；离开/失焦或Escape关闭。触摸和键盘激活可切换，避免focus与click叠加导致双开关。内容本身不能聚焦。
- Popover打开后聚焦关闭按钮；Close/Escape返回其触发按钮。点击外部或焦点离开整个分支时关闭，不抢回用户刚选的焦点。回到自身触发按钮可以继续保持打开，Tab不被限制在面板内。
- 同一document只保留一条popover分支。开启同级关闭旧分支；嵌套保持祖先打开，Escape逐层关闭最内层，关闭祖先时清理所有后代。
- 支持原生Popover API时，在浏览器top layer内显示，DOM仍留在原宿主，继承它的主题和语言。位置根据视口边界钳制或上下翻转；长内容在面板内滚动。滚动/resize重新定位，锚点不可见或脱离文档时关闭。
- 不支持原生API时，明确降级为有界流式展开内容，保留按钮、关闭和可访问关系；这不是浮层定位的完整替代。
- `setState()` 仅更新已有子节点与位置，保留打开状态/焦点/输入选择。`update()` 和 `dispose()` 清理监听器、定时器、观察器和旧面板。
- 关闭面板只是隐藏，不等于卸载子节点：已开始的页内计时继续进行，子表单操作也不会自动取消。需要停止时使用子组件的暂停/取消，或由宿主update/dispose。

完整原创[示例JSON](../examples/overlays.json)包含嵌套面板和表单输入，需base+forms；单纯提示和文本面板只需base。没有网络加载、HTML注入或服务调用。

实现参考[WAI-ARIA工具提示模式](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)与浏览器原生语义，未复制第三方实现。自动化语义检查不等同人工屏幕阅读器、全部浏览器或WCAG审计通过。
