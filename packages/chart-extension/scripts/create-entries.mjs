import fs from 'node:fs';
const names=['AreaChart','BarChart','CalendarHeatmap','FunnelChart','HeatmapChart','LineChart','MiniAreaChart','MiniBarChart','MiniLineChart','PieChart','RadarChart','RadialChart','ScatterChart','SegmentedBar'];
const aliases={HorizontalBarChart:'BarChart',SingleStackedBar:'SegmentedBar'};
const imports=names.map(n=>`import { ${n} } from '../vendor/openui/packages/react-ui/src/components/Charts/${n}/${n}';`).join('\n');
const common=`import { createChartModules } from './definitions';\nimport { createChartAdapters } from './renderers';\nexport * from './definitions';\nexport { chartTable,toUpstreamProps } from './renderers';\n`;
fs.writeFileSync('src/eager.ts',imports+'\n'+common+`export const chartAdapters=createChartAdapters({${names.join(',')},HorizontalBarChart:BarChart,SingleStackedBar:SegmentedBar});\nexport const chartModules=createChartModules(chartAdapters);\n`);
fs.writeFileSync('src/index.ts',`import { lazy } from 'react';\n`+common+names.map(n=>`const ${n}=lazy(()=>import('../vendor/openui/packages/react-ui/src/components/Charts/${n}/${n}').then(m=>({default:m.${n}})));`).join('\n')+`\nexport const chartAdapters=createChartAdapters({${names.join(',')},HorizontalBarChart:BarChart,SingleStackedBar:SegmentedBar});\nexport const chartModules=createChartModules(chartAdapters);\n`);
