# 单位与货币换算

开发分支新增 `unit-converter` 与 `currency-converter`。源码已接入，九个浏览器场景通过；52节点固定CDN为4b6c1f0，真实file://六组亮暗/尺寸验收在[run37878019661](https://github.com/Micraow/Inform-UI/actions/runs/37878019661)通过。

两个组件都在本地运行，不写入文档 state，不请求报价，不执行交易。[完整教学 JSON](../examples/converters.json) 与 [状态 fixture](../examples/converters/states.json) 可用于本地编译及统一组件 Demo。

## 单位

最小节点：

```json
{"type":"unit-converter","category":"length","amount":1,"from":"m","to":"cm"}
```

必填 `category`、有限数字 `amount`、同类别的 `from` 和 `to`。可选 `title`、`id`、`precision`（1–12个有效数字，默认8），以及仅用于温度的 `temperatureMode`（默认 `absolute`）。类别与单位 ID 如下；大小写有意义。

| category | 类别 | 单位 ID |
|---|---|---|
| length | 长度 | `m`, `cm`, `mm`, `km`, `in`, `ft`, `yd`, `mi`, `nmi` |
| mass | 质量 | `kg`, `g`, `mg`, `t`, `lb`, `oz` |
| temperature | 温度 | `K`, `C`, `F` |
| speed | 速度 | `m-s`, `km-h`, `ft-s`, `mph`, `kn` |
| area | 面积 | `m2`, `cm2`, `km2`, `ft2`, `ha`, `acre` |
| volume | 体积 | `L`, `mL`, `m3`, `gal-us`, `gal-imp` |
| time | 时长 | `s`, `ms`, `min`, `h`, `d` |
| pressure | 压强 | `Pa`, `kPa`, `MPa`, `bar`, `atm`, `psi` |
| data | 数据量 | `B`, `bit`, `kB`, `MB`, `GB`, `KiB`, `MiB`, `GiB` |

`absolute` 包含温标偏移，不能低于 0 K / −273.15 °C / −459.67 °F。`difference` 只换算带符号的温差，以 Δ 标注：10 Δ°C = 18 Δ°F。其他类别允许负值，适用于带方向的量。日是86400秒固定时长；不提供日历月份/年份或时区换算。美制液体与英制加仑分别命名；不支持美制干量加仑或美国测量英尺。

输入接受十进制和科学记数法；空串、未完成的 `1e`、千位分隔符、十六进制及非有限数字不会被解释成0。界面保留输入草稿并显示错误。极小非零数使用科学记数法，超出 JavaScript Number 可表示范围明确报错。显示经过舍入，原始结果保留在提示和 `data-raw-value` 中。

类别切换保留数值并选用该类别有效单位；“互换”只交换单位，数值保持不变；“重置”恢复节点初始类别、单位、模式与数值。

## 货币快照

```json
{"type":"currency-converter","amount":100,"base":"USD","from":"USD","to":"EUR","asOf":"2026-10-09T09:00:00+08:00","source":{"label":"原创合成汇率","synthetic":true},"rates":[{"currency":"EUR","rate":0.8},{"currency":"GBP","rate":null}]}
```

必填有限 `amount`、3位大写 `base`、`rates`、带显式时区的真实日期格式 `asOf`，以及 `source`（必填 `label`、`synthetic`，可选安全 URL）。币种代码是调用方标识；本库不维护实时 ISO 名单，也不据代码推断可交易性。

`rate` 表示1单位 base 可换得多少该币种，必须正有限或 null（缺测）。base隐含汇率1，若显式提供也必须为1。列表币种不得重复。`from` 默认base；`to` 默认第一个其他币种，若没有则相同币种。初始选择必须是base或列表中的币种。相同币种保持原数值，缺测跨币种汇率即使输入0也仍为“不可换算”。

金额经两个相对base的汇率换算，数值核心避免极端有限比值的中间溢出；最终无法表示的结果仍明确报错。未计入费用、点差、税务或结算规则。所有汇率、缺测、来源与原始带时区时刻在数据表/页脚可见；不根据当前时钟冒称实时或自动判定新旧。

`status` 为 ready/loading/error（默认ready），可选 `message`。空rates显示空态；loading/error保留来源/时刻并隐藏计算控件。换新快照通过标准 `controller.update(nextDocument)`，旧事件随更新/销毁移除。

## 校验与验收

结构错误为 `SCHEMA`；语义错误包含 `UNIT_ID`、`UNIT_MODE`、`UNIT_RANGE`、`CURRENCY_ID`、`CURRENCY_RATE`、`CURRENCY_DATE`、`CURRENCY_RANGE`、`UNSAFE_URL`，均带 JSON pointer 路径。输入之后的非法草稿/不可表示结果直接显示在当前组件，不改上次文档数据。

Node测试覆盖九类独立已知值、绝对零度、温差、空/坏输入、缺测/零值/同币种、极端汇率、重置、焦点、来源、update/dispose及离线编译。Chromium矩阵覆盖390/768/1100亮暗、键盘、状态、无溢出与无网络请求，执行结论以CI为准。

## 数值来源

常量为公开事实，代码与界面为原创；没有复制抓取网站实现。单位注册表是 [`src/data/units.json`](../src/data/units.json)，与校验、Schema说明和控件共用。

- [NIST SI温度说明](https://www.nist.gov/pml/owm/si-units-temperature)：Kelvin/Celsius与温差
- [NIST SP811换算因子](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8)：国际英尺、英里、海里、加仑、英亩、压力等
- [NIST SP811脚注](https://www.nist.gov/pml/special-publication-811/nist-guide-si-footnotes)：国际磅0.45359237 kg等精确定义
- [NIST二进制前缀](https://physics.nist.gov/cuu/Units/binary.html)：kB/MB与KiB/MiB的区别

## 源模块与不收紧的历史边界

`converters/local` 维护既有两个换算节点，依赖 `shared/value` 与仅提供 `FinanceSource` 的 `shared/finance-source`。单位代码和 Schema 中的类别说明直接读取维护中的 `src/data/units.json`，不从全量 Schema 反切或另存一份常量表。模块读取注册表后同步安装声明；所选结构 Schema 后仍须执行原有完整 `validateDocument`。

单位 Schema 的 from/to 枚举包含注册表的所有单位；同一类别检查由语义层完成。跨类别代码即使分别是有效单位也会被拒绝。amount 可为负数和零；绝对温度按各原温标阈值校验，温差可为负。非温度类别只要出现 temperatureMode 就报错，不能因为值为 absolute 而忽略它。换算溢出及非零值下溢成零均报数值范围错误；不会悄悄返回 Infinity 或把非零量当作零。已有浮点策略和默认精度保持不变。

货币 rates 为0–200条，币种必须三位大写 ASCII 字母；不校验 ISO 名单或可交易性。重复条目总会被拒绝，显式 base 条目必须恰为1，不能为 null。初始 from/to 必须存在于 base 或已供列表；其汇率可以为 null。相同币种直接保留 amount；跨币种缺测返回未知，输入为0也不补成结果0。有限极端汇率使用既有数值实现，最终溢出或非零结果下溢报错；金额不被默认理解为交易、账户余额或支付指令。

`asOf` 使用原有通用 timestamp 规则，真实日期、显式 `Z` 或偏移，允许秒和1–3位小数秒且须能解析成有限瞬间；不套用 `flightAt` 的仅分钟、1000年起点或14小时偏移上限。非空来源 URL 使用通用安全链接策略（受限 HTTP(S)/mailto/tel/片段），可省略或为空；这里不强加供源 reader 的 HTTP(S) 专用规则。可选 title 与必填 source.label 为1–200字符，不额外 trim 或判定 nonblank；message（≤12000）可为空。不同状态仍做相同结构和语义检查，无当前时钟、汇率新鲜度、舍入费用、税务或交易规则推断。
