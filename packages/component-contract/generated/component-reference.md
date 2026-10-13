# Inform UI component reference

Profile: inform/representative-2
Root: BarChart

Generated from the same component definitions as the schema and prompt.

## BarChart

Layer: chart. Renderer: dom/BarChart.

Categorical supplied-data bar chart with named finite series.

Series(name, values) is data, not a UI child. Every values array has exactly one value per category. Negative values require a zero baseline.

Parameter order: title, labels, series.

- This profile only declares the chart kinds with an actual bound renderer. Other OpenUI chart exports are not implied.

### bar-chart

Minimal bar-chart example using supplied data.

```openui-lang
root = BarChart("Quarterly", ["Q1", "Q2"], [Series("Revenue", [20, 30])])
```

## Text

Layer: base. Renderer: dom/Text.

Plain text with a semantic tone. HTML is displayed literally.

Use for prose. Newlines remain text; markup and code are not executed.

Parameter order: content, tone.


### text

Minimal text example using supplied data.

```openui-lang
root = Text("Hello")
```

## Data constructors

- Series(name, values): Named finite numeric series, one value per category.
- Slice(label, value): Labeled nonnegative share. Data only; no Pie renderer is implied.
- Point(x, y): Finite Cartesian point. Data only; no Scatter renderer is implied.
