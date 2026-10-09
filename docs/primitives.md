# 流式布局、有限图标与显式状态

这是62节点协议的base增强，已通过源码、固定CDN与消费者整批验收。按canonical合同计入flow/icon/pulse-indicator三项；[验收证据与范围](verification-62.md)。

## Flow

`flow` 包含1–50个普通children。横向按DOM顺序折行，`gap` 为none/sm/md/lg（0/4/8/16px，默认md），`align` 为start/center/end（默认center），`justify` 为start/center/end/between（默认start）。它不做密集重排、瀑布流或断点脚本测量。

普通子节点保留自身状态、焦点、绑定和清理；无关setState不重新创建它们。time/weather/finance/converter的直属大小包含容器有界地使用20rem基础宽度，仍受父级100%限制，避免auto固有宽度丢失。其他children保留自然宽度。grid-item仍只能直属grid；flow不能绕过任何子节点域、URL或状态语义校验。

## Icon

`icon.name` 只允许10个原创符号：info、check、warning、error、plus、minus、arrow-left、arrow-right、external-link、clock。没有外部图标包、URL、任意path或HTML输入。clock只是静态符号，不显示时间；左右箭头表示物理方向，不会自动镜像。

`size` 为sm/md/lg（16/20/24px，默认md），`tone` 为default/muted/info/success/warning/danger（默认default）。没有label时图标是装饰并从无障碍树隐藏；提供1–200字label时输出带准确名称的图像语义。图标不获取键盘焦点，也没有点击行为。

## Pulse indicator

`pulse-indicator` 必须带1–200字label以及idle/busy/success/warning/error之一的status。作者标签与本地化状态文字均可见，色点仅作装饰，不能只靠颜色表达含义。

`animate` 默认true；只有busy状态有CSS脉冲，减动态偏好会停用动画。没有计时器、网络请求、自动状态转换、估算进度、隐式aria-busy或反复live播报。status是调用方给定的字面量，不证明服务真实状态；无关setState不会改变它。要改status须普通update，这也会按现有合同重建文档中的本地组件状态。

## 示例与边界

- [基础原生JSON](../examples/local-status-primitives.json)：只需base Document分片
- [表单与时间混合JSON](../examples/primitives-with-form-and-time.json)：需完整Schema，或base+forms+time明确并集
- [当前组合JSON](../examples/current-components.json)：数字草稿保护、表格、计时与有限基础节点

所有新字段仍由单一Schema生成器及公共validateDocument检查。自动化标签/几何回归不等同人工屏幕阅读器、全部浏览器或WCAG审计。
