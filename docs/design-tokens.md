# 视觉依据与原创边界

全局变量以 [公开 Apps SDK UI 语义变量](https://github.com/openai/apps-sdk-ui/blob/main/src/styles/variables-semantic.css)及[基础变量](https://github.com/openai/apps-sdk-ui/blob/main/src/styles/variables-primitive.css)为参考；其 [MIT 许可](https://github.com/openai/apps-sdk-ui/blob/main/LICENSE)已核对。项目不引入该 SDK 运行时，不需要任何服务账号。这份公开基线不等于私有 Intelligent UI 的完整官方规范。

| 用途 | 亮色 | 深色 |
| --- | --- | --- |
| 主背景 | `#ffffff` | `#212121` |
| 次级背景 | `#f9f9f9` | `#181818` |
| 三级背景 | `#f3f3f3` | `#131313` |
| 主文字 | `#0d0d0d` | `#ffffff` |
| 次级文字 | `#5d5d5d` | `#afafaf` |
| 聚焦轮廓 | `#0169cc` | `#0285ff` |

4px 是间距单位；16/24、14/20、12/18 是正文与辅助文字的字号/行高组合。字重使用 400/500/600/700。三级文字、分隔线、hover/active 等局部颜色是本项目原创取值，不能视作对未公开设计稿的精确测量。

参考可见排版关系后，默认纵向相邻块间距为8px；标题后一般16px、标题后正文/列表8px；连续正文与caption后正文0px，caption前4px，分隔线相邻16px。字段label至控件2px、hint4px、相邻操作6px。JSON中明确的gap/padding覆盖默认关系间距。

指标默认使用开放排版，`metric.variant:"card"` 可显式保留卡片；不强制每项指标都有灰底框。天气的120px图高、64px日期最小宽和28px日期图标是该领域视图的局部规格，不提升为所有组件的通则。

已观察的参考截图仅含亮色；深色基于公开变量和本项目可读性测试。中文使用明确的系统无衬线后备字体；CI安装官方发行源的Noto CJK以稳定检查中文排版，库不下载或复制商业字体。数学公式另使用官方MIT KaTeX字体，其实际字形与CDN运输均有专门测试。
