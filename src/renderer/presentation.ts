/** Human-readable presentation only. Evaluation and chart coordinates retain the original number. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return '0';
  const compact = Number(value.toPrecision(12));
  const tolerance = Math.max(Number.MIN_VALUE, Math.abs(value) * Number.EPSILON * 4);
  return Number.isFinite(compact) && Math.abs(value - compact) <= tolerance
    ? String(compact)
    : String(value);
}

const english = {
  viewChartData: 'View chart data', chartData: 'Chart data', category: 'Category', axisValue: 'X-axis value',
  missing: 'Missing', show: 'Show', rawValue: 'Original value',
  formulaSource: 'Formula source (unsupported syntax)', plainText: 'Plain-text fallback', code: 'code',
  externalImage: 'External image', loadImage: 'Load external image',
  imageDisclosure: (hostname: string) => `Loading shares your IP address with ${hostname}.`,
  collection: 'Scrollable collection', diagram: 'Diagram', topology: 'Network topology',
  maximumLoad: 'Maximum load', to: 'to', loading:'Loading…',empty:'No data available',loadError:'Data is unavailable',total:'Total'
};
const chinese: typeof english = {
  viewChartData: '查看图表数据', chartData: '图表数据', category: '类别', axisValue: '横轴值',
  missing: '缺测', show: '显示', rawValue: '原始数值',
  formulaSource: '公式源码（不支持的语法）', plainText: '纯文本显示', code: '代码',
  externalImage: '外部图片', loadImage: '加载外部图片',
  imageDisclosure: (hostname: string) => `加载图片会向 ${hostname} 提供你的 IP 地址。`,
  collection: '可横向滚动的内容', diagram: '示意图', topology: '网络拓扑',
  maximumLoad: '最大负载', to: '到', loading:'正在加载…',empty:'暂无数据',loadError:'数据暂不可用',total:'合计'
};

/** Built-in labels follow the nearest host language; unsupported languages use English. */
export function presentationLabels(container: HTMLElement) {
  const language = container.closest('[lang]')?.getAttribute('lang')
    || container.ownerDocument.documentElement.lang || 'en';
  return /^zh(?:-|$)/i.test(language) ? chinese : english;
}
