import type {WeatherNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {timestamp} from './extensions.js';
export interface WeatherTemperatureLabels {celsius:string;fahrenheit:string;a11yCelsius?:string;a11yFahrenheit?:string}
export interface WeatherFollowUp {id:string;label:string;query:string;disabled?:boolean}
export interface WeatherSuppliedOptions {
 presentation?:'chart'|'table'|'compact';initialMetric?:'temperature'|'precipitation';initialUnit?:'celsius'|'fahrenheit';useCurrent?:boolean;showDatePicker?:boolean;disabled?:boolean;regionLabel?:string;tableDateLabel?:string;resetLabel?:string;requestedLabel?:string;cancelledLabel?:string;
 labels?:Partial<Record<'current'|'hourly'|'daily'|'temperature'|'precipitation'|'conditions'|'time'|'unit'|'metric'|'view'|'high'|'low'|'observation'|'selected'|'chartView'|'tableView'|'missing'|'source'|'updated',string>>;
 share?:{label:string;available?:boolean;placement?:'top'|'bottom'};locationAction?:{label:string;available?:boolean;query?:string};followUps?:WeatherFollowUp[];chartWindow?:{points:number;startTime?:string};
}
export type WeatherSuppliedNode=Omit<WeatherNode,'current'|'daily'|'hourly'>&WeatherSuppliedOptions&{
 current:WeatherNode['current']&{description?:string;temperatureLabels?:WeatherTemperatureLabels};
 daily:(WeatherNode['daily'][number]&{label?:string;description?:string;highLabels?:WeatherTemperatureLabels;lowLabels?:WeatherTemperatureLabels;followUps?:WeatherFollowUp[]})[];
 hourly:(WeatherNode['hourly'][number]&{label?:string;description?:string;condition?:WeatherNode['current']['condition'];temperatureLabels?:WeatherTemperatureLabels})[];
};
export interface WeatherActionDetail {readonly id:string|null;readonly intent:'share'|'request-location'|'follow-up';readonly date:string;readonly unit:'celsius'|'fahrenheit';readonly metric:'temperature'|'precipitation';readonly actionId?:string;readonly query?:string}
export function inspectWeatherSupplied(node:WeatherSuppliedNode,path:string,add:(issue:Issue)=>void):void {
 const issue=(at:string,message:string)=>add({code:'WEATHER_SUPPLIED_DATA',path:path+at,message});
 const nonblank=(record:object|undefined,at:string)=>{for(const[key,value]of Object.entries(record??{}))if(typeof value==='string'&&!value.trim())issue(at+'/'+key,'Supply nonblank display text.');};
 const followUps=(items:WeatherFollowUp[]|undefined,at:string)=>{const ids=new Set<string>();items?.forEach((item,index)=>{nonblank(item,at+'/'+index);if(ids.has(item.id))issue(at+'/'+index+'/id','Follow-up IDs must be unique within the list.');ids.add(item.id);});};
 const display=<T extends object>(record:T,keys:readonly (keyof T)[],at:string)=>nonblank(Object.fromEntries(keys.map(key=>[key,record[key]])),at);
 display(node,['regionLabel','tableDateLabel','resetLabel','requestedLabel','cancelledLabel'],'');nonblank(node.labels,'/labels');nonblank(node.share,'/share');nonblank(node.locationAction,'/locationAction');display(node.current,['description'],'/current');nonblank(node.current.temperatureLabels,'/current/temperatureLabels');followUps(node.followUps,'/followUps');
 node.daily.forEach((day,index)=>{const at='/daily/'+index;display(day,['label','description'],at);nonblank(day.highLabels,at+'/highLabels');nonblank(day.lowLabels,at+'/lowLabels');followUps(day.followUps,at+'/followUps');});
 node.hourly.forEach((hour,index)=>{display(hour,['label','description'],'/hourly/'+index);nonblank(hour.temperatureLabels,'/hourly/'+index+'/temperatureLabels');});
 if(node.chartWindow?.startTime!==undefined){const time=timestamp(node.chartWindow.startTime);if(!Number.isFinite(time)||!node.hourly.some(hour=>timestamp(hour.time)===time))issue('/chartWindow/startTime','The chart start must identify a supplied hourly instant.');}
}
