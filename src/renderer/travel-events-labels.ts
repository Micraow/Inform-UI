export interface TravelEventsLabels {
  source: string; opensNewTab: string; flightDisclosure: string; select: string; clear: string;
  noSelection: string; selected: string; cleared: string; rejected: string; legDetails: string;
  departure: string; arrival: string; cabin: string; suppliedPrice: string; eventsLabel: string;
  eventsDisclosure: string; filter: string; allMonths: string; empty: string; noMatch: string;
  eventDetails: string; eventLink: string; timeZone: string;
  duration: (minutes:number)=>string; count:(visible:number,total:number)=>string;
}
export const travelEventsEnglish: Readonly<TravelEventsLabels> = Object.freeze({
  source:'Source',opensNewTab:'Opens in a new tab',
  flightDisclosure:'Supplied flight details and price only; no live search, fare verification or booking. Selection is local and does not reserve a flight. Times retain their supplied UTC offsets.',
  select:'Select locally',clear:'Clear local selection',noSelection:'No local selection.',selected:'Selected locally. No flight has been reserved.',cleared:'Local selection cleared.',rejected:'The local change was not accepted.',legDetails:'Flight leg details',
  departure:'Departure',arrival:'Arrival',cabin:'Supplied cabin',suppliedPrice:'Supplied price',
  eventsLabel:'Supplied events',eventsDisclosure:'Dates, venues, times and time-zone labels are supplied and shown without conversion or current-date filtering. These entries do not verify upcoming dates, availability or tickets.',
  filter:'Filter by month',allMonths:'All months',empty:'No events supplied.',noMatch:'No supplied events match this month.',eventDetails:'Event description',eventLink:'Event information',timeZone:'Supplied time zone',
  duration:(minutes:number)=>`Duration: ${minutes} minutes`,count:(visible:number,total:number)=>`Showing ${visible} of ${total} supplied events.`
});
export const travelEventsChinese: Readonly<TravelEventsLabels> = Object.freeze({
  source:'来源',opensNewTab:'在新标签页中打开',
  flightDisclosure:'仅展示提供的航班信息和价格，不进行实时搜索、票价核实或预订。选择仅在本地记录，不会预留航班。时间保留提供的 UTC 偏移量。',
  select:'在本地选择',clear:'清除本地选择',noSelection:'尚未进行本地选择。',selected:'已在本地选择，尚未预留任何航班。',cleared:'已清除本地选择。',rejected:'本地更改未被接受。',legDetails:'航段详情',
  departure:'出发',arrival:'抵达',cabin:'提供的舱位',suppliedPrice:'提供的价格',
  eventsLabel:'提供的活动',eventsDisclosure:'日期、场地、时间及时区标签均为提供的内容，按原样显示，不进行转换或按当前日期筛选。这些条目不核实未来日期、可用性或门票。',
  filter:'按月份筛选',allMonths:'所有月份',empty:'未提供活动。',noMatch:'此月份没有匹配的已提供活动。',eventDetails:'活动说明',eventLink:'活动信息',timeZone:'提供的时区',
  duration:(minutes:number)=>`时长：${minutes} 分钟`,count:(visible:number,total:number)=>`显示 ${total} 个已提供活动中的 ${visible} 个。`
});
