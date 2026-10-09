export const menuEnglish = {
  kind: 'Supplied menu', search: 'Search menu', category: 'Section', all: 'All sections', clear: 'Clear search',
  source: 'Source', external: 'opens in a new tab', missingPrice: 'Price not supplied', available: 'Available (supplied status)', unavailable: 'Unavailable (supplied status)', unknownStatus: 'Status not supplied',
  tags: 'Supplied tags', empty: 'No menu items supplied.', noMatch: 'No items match this search and section.',
  tooLong: 'Use at most 200 characters. Your draft is kept; results use the last valid search.',
  rules: 'Search names, descriptions and tags. Prices, currency codes, tags and statuses are supplied data; availability and dietary safety have not been verified.',
  privacy: 'Search and section selection stay on this page. No ordering or payment.',
  details: (name: string) => `Details: ${name}`,
  count: (visible: number, total: number) => `${visible} of ${total} items shown`,
};
export const menuChinese: typeof menuEnglish = {
  kind: '提供的菜单', search: '搜索菜单', category: '分类', all: '全部分类', clear: '清除搜索',
  source: '来源', external: '在新标签页打开', missingPrice: '未提供价格', available: '可供应（提供的状态）', unavailable: '不可供应（提供的状态）', unknownStatus: '未提供状态',
  tags: '提供的标签', empty: '未提供菜单项目。', noMatch: '没有符合搜索和分类条件的项目。',
  tooLong: '最多输入 200 个字符。已保留草稿，结果仍使用上一次有效搜索。',
  rules: '搜索名称、描述和标签。价格、货币代码、标签和状态均来自提供的数据，供应情况和饮食安全未经核实。',
  privacy: '搜索和分类选择仅保留在本页，不提供下单或付款。',
  details: (name: string) => `详情：${name}`,
  count: (visible: number, total: number) => `显示 ${visible} / ${total} 个项目`,
};
export type MenuLabels = typeof menuEnglish;
