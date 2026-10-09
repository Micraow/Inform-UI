# 调用方提供的加载状态与占位

这是下一批64节点源码候选。当前推荐固定CDN仍为已验的62节点01ae版本，不接受这里的两个新节点。公共单源校验与实际DOM测试已接入，真实浏览器和同版CDN将在后批集中验收；不提前增加49项已验组件计数。

## loading

必填 `label` 为1–200字的原样可见标签，也是进度条的无障碍名称。可选 `progress` 是普通Value：常数、已声明state/computed引用或现有受限表达式。解析结果必须是0–100的有限数值；零是明确进度，省略才是不确定状态。null、数值字符串、布尔值、越界、未知引用、除零与非有限结果均拒绝，不转换、不夹取、不补零。

`size` 为sm/md/lg，默认md，分别使用4/8/12px条高或16/20/28px不确定转圈。`showValue` 默认true，只控制冗余可见百分数，false也保留标签和准确ARIA数值。ARIA、data-value和条形比例保留JS解析后的原数值；例如25.125/100*100是25.124999999999996，不承诺十进制代数化简。

省略progress时，转圈旁明确显示“未提供进度”，没有aria-valuenow或伪造百分比。动画尊重减动态偏好；它不观察网络、启动任务、自动递增、宣布成功、设置宿主aria-busy或反复live播报。达到100仅表示调用方提供了100，不证明外部任务完成。

## loading-block

必填 `label` 仍为1–200字可见说明。`shape` 为text/card/circle，默认text；`animate` 默认true，只使用CSS轻微脉冲并支持减动态/强制配色。

- text：`lines` 为1–10整数，默认3；多行末行68%宽，单行为100%。
- card：一个有界媒体块和两行文字占位，总宽不超过24rem。
- circle：不超过48px的圆形占位。

card/circle不得提供lines，避免接受被忽略的参数。装饰几何整体aria-hidden，可见标签在其外。没有status/progressbar/live角色、任意尺寸/CSS/HTML、真实媒体、自动替换内容或隐式准备就绪判断。

## 更新与局部状态

动态progress在候选state被接受之前检查。setState或update若令某个progress越界，旧state、DOM、控件草稿和焦点整体保留；合法更新原位刷新进度，不重新创建组件。字段min/max/step仍约束数字草稿；全局progress范围是额外的文档语义约束，不能靠控件自己的范围绕过。

无关state更新不会改变字面shape/label，也不会让不确定状态凭空获得进度。多个挂载实例、不同ownerDocument和最近宿主语言/主题保持独立；dispose移除绑定，不创建全局计时器或监听器。

[原生JSON示例](../examples/loading-states.json)只需base Document分片。完整schema、派生分片、类型与独立结构校验仍从同一个生成器产生；结构合法不替代公共validateDocument的引用和数值语义检查。
