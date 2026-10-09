export interface AgendaLabels {
  filter: string;
  allDates: string;
  noEvents: string;
  noTime: string;
  cancelled: string;
  details: string;
  location: string;
  eventLink: string;
  opensNewTab: string;
  floatingNote: string;
}
export const agendaEnglish: Readonly<AgendaLabels> = Object.freeze({
  filter:'Filter by date', allDates:'All dates', noEvents:'No events supplied.', noTime:'Time not supplied', cancelled:'Cancelled', details:'Event details', location:'Location', eventLink:'Event link', opensNewTab:'Opens in a new tab', floatingNote:'Dates and times are shown as supplied. No timezone conversion is performed.'
});
export const agendaChinese: Readonly<AgendaLabels> = Object.freeze({
  filter:'按日期筛选', allDates:'所有日期', noEvents:'未提供日程。', noTime:'未提供时间', cancelled:'已取消', details:'日程详情', location:'地点', eventLink:'日程链接', opensNewTab:'在新标签页中打开', floatingNote:'日期和时间按提供的内容显示，不进行时区转换。'
});
