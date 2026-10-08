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
  maximumLoad: 'Maximum load', to: 'to',
  loading:'Loading…', empty:'No data available', loadError:'Data is unavailable', temperature:'Temperature', precipitation:'Precipitation probability', hourly:'Hourly forecast', daily:'Daily forecast', updated:'Updated', synthetic:'Synthetic demonstration', source:'Source', current:'Current', feelsLike:'Feels like', humidity:'Humidity', chartView:'Chart', tableView:'Table', submit:'Submit', cancel:'Cancel', submitted:'Submitted locally', submitting:'Submitting…', cancelled:'Cancelled', submitError:'Submission failed. Try again.', required:'This field is required.', invalidEmail:'Enter a valid email address.', invalidNumber:'Enter a valid number.', tooShort:'The text is too short.', tooLong:'The text is too long.', belowMin:'The value is below the minimum.', aboveMax:'The value is above the maximum.', stepMismatch:'The value does not match the required step.', invalidChoice:'Choose an available option.', formInvalid:'Check the highlighted fields.', noAdapter:'The requested action is not configured.', total:'Total'
};
const chinese: typeof english = {
  viewChartData: '查看图表数据', chartData: '图表数据', category: '类别', axisValue: '横轴值',
  missing: '缺测', show: '显示', rawValue: '原始数值',
  formulaSource: '公式源码（不支持的语法）', plainText: '纯文本显示', code: '代码',
  externalImage: '外部图片', loadImage: '加载外部图片',
  imageDisclosure: (hostname: string) => `加载图片会向 ${hostname} 提供你的 IP 地址。`,
  collection: '可横向滚动的内容', diagram: '示意图', topology: '网络拓扑',
  maximumLoad: '最大负载', to: '到',
  loading:'正在加载…', empty:'暂无数据', loadError:'数据暂不可用', temperature:'温度', precipitation:'降水概率', hourly:'逐小时预报', daily:'逐日预报', updated:'更新时间', synthetic:'合成演示', source:'数据来源', current:'当前', feelsLike:'体感', humidity:'湿度', chartView:'图表', tableView:'表格', submit:'提交', cancel:'取消', submitted:'已完成本地提交', submitting:'正在提交…', cancelled:'已取消', submitError:'提交失败，请重试。', required:'请填写此项。', invalidEmail:'请输入有效的邮箱地址。', invalidNumber:'请输入有效数字。', tooShort:'内容未达到最小长度。', tooLong:'内容超过最大长度。', belowMin:'数值低于下限。', aboveMax:'数值超过上限。', stepMismatch:'数值不符合步长要求。', invalidChoice:'请选择可用选项。', formInvalid:'请检查标出的字段。', noAdapter:'此操作尚未配置。', total:'合计'
};

/** Built-in labels follow the nearest host language; unsupported languages use English. */
export function presentationLabels(container: HTMLElement) {
  const language = container.closest('[lang]')?.getAttribute('lang')
    || container.ownerDocument.documentElement.lang || 'en';
  return /^zh(?:-|$)/i.test(language) ? chinese : english;
}
