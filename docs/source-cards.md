# 调用方提供的引用与链接卡

这四项加载/占位/引用/链接卡已通过66节点同版批次验收，固定CDN为d370。338项Node、241项Chromium及42+18消费者视图通过，实际亮暗窄宽原图已复核。[证据与有限范围](verification-66.md)。

## 有限数据合同

`citation` 必填title（1–300字）及url（1–2048字），可选publisher（1–200）、description（1–1000）和number（1–999整数）。这是独立来源条目，标题是单一原生链接；数字由作者指定，不自动编号或表示排序。

`web-link-cards` 必填label（1–200）及items（1–20条）。每条包含title/url，以及可选publisher/description，同样范围。保留重复条目和调用方顺序，不去重。条目不支持id、number、children、图像、favicon、日期、状态表达式、检索词或自定义HTML。

所有文字都是原样文本。URL只接受绝对HTTP(S)，复用核心isSafeURL后进一步收窄协议；凭据、空白/控制符、反斜杠、无效主机/端口和其他协议被拒绝。来源节点不支持普通link所允许的fragment/mailto/tel。完整文档在mount/update替换DOM前检查，并给出准确url字段路径。

原生链接使用新标签页、noopener noreferrer、no-referrer，并提供本地化无障碍新标签页说明。显示的目标主机/端口由URL解析器提取，使用LTR bdi隔离混合方向；publisher仍是作者提供的独立信息。库不抓取页面、不加载图片、不检查链接是否存在，也不判断来源是否支持某个论点。

## 真实水平滚动

链接卡保留原生ul/li和一条可水平滚动的轨道。按钮按当前轨道一页宽度前后移动，在首尾截断，不循环、不克隆、不自动播放。原生键盘、触摸、触控板、链接Enter/修饰键/上下文菜单不被拦截。

边界按钮使用aria-disabled=true，保持已有焦点和Tab站；Click/Enter/Space在边界是精确无操作。轨道仅在存在溢出时额外可聚焦，缩放后移除Tab属性也不主动移走焦点。可见范围说明是非live文字，包含部分可见的首末条目，不伪造selected/current项。

按实际子卡片矩形计算边界和可见范围，缩放下统一坐标空间；逻辑前后方向兼容负值、反向正值和默认正值RTL模型。程序滚动始终即时，因此无动画等待、自动变化或减动态偏好冲突。几何/字体/窗口变化重新检查边界；浏览器节点归其ownerDocument，所有监听、观察器和帧在update/dispose清理。

无关setState不重建卡片，保留原生链接焦点和轨道位置。文档update按现有合同重建；无效update保持旧DOM、state与焦点。空来源列表被拒绝，单条列表没有伪造可滚动状态。

[完整原创JSON](../examples/source-cards.json)只需base Document分片。示例全部使用虚构说明与example.invalid地址；测试不会向这些外部目的地发请求。合同及测试不构成全浏览器、读屏器或来源真实性认证。
