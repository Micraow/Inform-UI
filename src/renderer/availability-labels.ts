export interface AvailabilityLabels {
  venue: string; partySize: string; timeZone: string; filter: string; allDates: string;
  available: string; unavailable: string; empty: string; noMatch: string; clear: string;
  noSelection: string; selected: string; notAccepted: string; localChoice: string;
  source: string; opensNewTab: string; disclosure: string;
  counts: (total: number, available: number, unavailable: number) => string;
}
export const availabilityEnglish: Readonly<AvailabilityLabels> = Object.freeze({
  venue:'Venue',partySize:'Party size',timeZone:'Supplied time zone',filter:'Filter by date',allDates:'All dates',
  available:'Available',unavailable:'Unavailable',empty:'No time options supplied.',noMatch:'No supplied time options match this date.',clear:'Clear local selection',
  noSelection:'No local selection.',selected:'Local selection',notAccepted:'The local choice was not accepted.',localChoice:'Local choice selected. No reservation has been made.',
  source:'Source',opensNewTab:'Opens in a new tab',disclosure:'These are supplied time options. Selecting a time only records a local choice; no reservation is made. Dates and times are shown as supplied, without time zone conversion.',
  counts:(total:number,available:number,unavailable:number)=>`Showing ${total} supplied options: ${available} available; ${unavailable} unavailable.`
});
export const availabilityChinese: Readonly<AvailabilityLabels> = Object.freeze({
  venue:'餐厅',partySize:'用餐人数',timeZone:'提供的时区',filter:'按日期筛选',allDates:'所有日期',
  available:'可选',unavailable:'不可选',empty:'未提供时间选项。',noMatch:'此日期没有匹配的已提供时间选项。',clear:'清除本地选择',
  noSelection:'尚未进行本地选择。',selected:'本地选择',notAccepted:'本地选择未被接受。',localChoice:'已进行本地选择，尚未完成任何预订。',
  source:'来源',opensNewTab:'在新标签页中打开',disclosure:'这些是提供的时间选项。选择时间仅记录本地选择，不会进行预订。日期和时间按提供的内容显示，不进行时区转换。',
  counts:(total:number,available:number,unavailable:number)=>`显示 ${total} 个已提供选项：${available} 个可选，${unavailable} 个不可选。`
});
