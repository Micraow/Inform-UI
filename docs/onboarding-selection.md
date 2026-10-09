# 本地引导选择

`onboarding-selection` 是原创有限的单选/多选内容卡。没有账户、偏好保存、服务调用或导航。此后批只有本地实现和测试证据，尚未真实浏览器/视觉验收；不改变当前已验计数。

必填 `label` 与2至12个 `options`，每项 `{id,label,description?}`；ID局部唯一。`mode` 默认 `single`；`multiple` 使用原生复选框。`initial` 默认为空数组，必须是存在的不同ID。`minimum` 默认1；`maximum` 单选固定1、多选默认选项数；最小值可为0，但不得超过最大值，最大值不得超过选项数。单选最多一个初始项。初值少于 minimum 是允许的草稿，点击继续时再校验。

可选 `description`、`continueLabel` 和字面量布尔 `disabled`。选项标题最多200 Unicode码点、说明1000，组件说明2000。所有内容是安全字面文本。

达到多选上限后，额外选择被恢复并提示先取消一项，既有作答不丢失。继续时不足最少项会提示并聚焦首个原生选项；满足时从组件发出 `iui:onboarding-choice`，冒泡、可取消、不跨Shadow边界。只读detail为 `{componentId: authored id or null, selectedIds: source-order IDs}`，对象和数组均冻结。preventDefault只阻止本次本地确认，不清草稿；“已准备好”不意味着保存、开户或后端成功。重试是用户再次显式继续，不自动重发。

重置按钮恢复 initial 并清反馈。无绑定、不进入Forms快照或原生FormData；原生单选组使用独立保留名称和无宿主表单关联的内部ID。外层原生form.reset不改变这张卡的本地作答。无关setState及隐藏/重新显示保留DOM和选择；update/dispose清理。祖先fieldset disabled、原生首legend例外、隐藏/inert、脱离文档、事件构造钩子和同步重入均有定向测试。

原生键盘单选导航、复选框Space、标签整卡点击、触摸、RTL、强制颜色与响应式主题须在真实浏览器矩阵验收。源代码中没有键盘重写、网络、存储或任意回调字符串。
