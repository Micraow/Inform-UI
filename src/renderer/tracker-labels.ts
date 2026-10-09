export interface TrackerLabels {
 packageNote:string;flightNote:string;observed:string;carrier:string;tracking:string;destination:string;expected:string;source:string;newTab:string;
 milestones:string;updates:string;filter:string;all:string;reset:string;empty:string;noMatch:string;details:string;notSupplied:string;
 departure:string;arrival:string;scheduled:string;estimated:string;actual:string;terminal:string;gate:string;flight:string;
 packageStatus:Record<string,string>;flightStatus:Record<string,string>;milestoneState:Record<string,string>;updateKind:Record<string,string>;
 count:(shown:number,total:number)=>string;
}
export const trackerEnglish:TrackerLabels={
 packageNote:'Supplied shipment snapshot. No carrier connection, live tracking, delivery guarantee or inferred progress.',flightNote:'Supplied flight snapshot. Times and status are not live or verified; no booking, alerts or location tracking.',
 observed:'Supplied observation time',carrier:'Carrier',tracking:'Supplied tracking reference',destination:'Supplied destination',expected:'Supplied delivery estimate',source:'Source',newTab:'Opens in a new tab',milestones:'Supplied milestones',updates:'Supplied updates',filter:'Filter supplied records',all:'All records',reset:'Reset filter',empty:'No records supplied.',noMatch:'No supplied records match this filter.',details:'Supplied details',notSupplied:'Not supplied',departure:'Departure',arrival:'Arrival',scheduled:'Scheduled',estimated:'Estimated',actual:'Actual',terminal:'Terminal',gate:'Gate',flight:'Flight',
 packageStatus:{'pre-transit':'Pre-transit','in-transit':'In transit','out-for-delivery':'Out for delivery',delivered:'Delivered',exception:'Exception',unknown:'Status unknown'},
 flightStatus:{scheduled:'Scheduled',boarding:'Boarding',departed:'Departed',landed:'Landed',cancelled:'Cancelled',diverted:'Diverted',unknown:'Status unknown'},milestoneState:{complete:'Complete',current:'Current',pending:'Pending'},updateKind:{information:'Information',change:'Change',disruption:'Disruption'},count:(shown,total)=>`Showing ${shown} of ${total} supplied records.`
};
export const trackerChinese:TrackerLabels={
 packageNote:'所提供的物流快照。未连接承运商，无实时跟踪、送达保证或推断进度。',flightNote:'所提供的航班快照。时间和状态不是实时或已核验数据；不预订、不发送提醒、不跟踪位置。',
 observed:'所提供的观察时间',carrier:'承运方',tracking:'所提供的运单编号',destination:'所提供的目的地',expected:'所提供的预计送达时间',source:'来源',newTab:'在新标签页打开',milestones:'所提供的物流节点',updates:'所提供的更新',filter:'筛选所提供的记录',all:'全部记录',reset:'重置筛选',empty:'未提供记录。',noMatch:'没有符合此筛选的记录。',details:'所提供的详情',notSupplied:'未提供',departure:'出发',arrival:'到达',scheduled:'计划',estimated:'预计',actual:'实际',terminal:'航站楼',gate:'登机口',flight:'航班',
 packageStatus:{'pre-transit':'待运输','in-transit':'运输中','out-for-delivery':'派送中',delivered:'已送达',exception:'异常',unknown:'状态未知'},flightStatus:{scheduled:'计划中',boarding:'登机中',departed:'已出发',landed:'已降落',cancelled:'已取消',diverted:'已备降',unknown:'状态未知'},milestoneState:{complete:'已完成',current:'当前',pending:'待进行'},updateKind:{information:'信息',change:'变更',disruption:'异常'},count:(shown,total)=>`显示所提供 ${total} 条记录中的 ${shown} 条。`
};
