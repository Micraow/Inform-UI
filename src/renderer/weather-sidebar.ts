import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import type {WeatherSidebarTitleNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {weatherTemperature} from './weather.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';

/** A finite supplied-place header, independent of weather's forecast/body and host state. */
export function renderWeatherSidebar(c:RendererContext,node:WeatherSidebarTitleNode):HTMLElement {
  const root=c.element('section','iui-weather-sidebar-title');c=suppliedReaderContext(c,root);const e=c.element,zh=c.labels().temperature==='温度',locale=zh?'zh-CN':'en-US';
  const t=zh?{
    place:'已提供地点',unit:'温度单位',reset:'重置地点和单位',unknown:'未提供',empty:'未提供地点。',time:'当地观测时间',source:'来源',newTab:'在新标签页打开',
    note:'仅展示提供的天气快照。地点切换与单位换算在本地完成，不定位、搜索或自动更新。',
    conditions:{clear:'晴','partly-cloudy':'局部多云',cloudy:'多云',rain:'雨',snow:'雪',storm:'雷暴',fog:'雾',unknown:'天气状况未知'},
  }:{
    place:'Supplied place',unit:'Temperature unit',reset:'Reset place and unit',unknown:'Not supplied',empty:'No places supplied.',time:'Local observation time',source:'Source',newTab:'opens a new tab',
    note:'Supplied weather snapshots only. Place selection and unit conversion are local; no location lookup, search or automatic update.',
    conditions:{clear:'Clear','partly-cloudy':'Partly cloudy',cloudy:'Cloudy',rain:'Rain',snow:'Snow',storm:'Storm',fog:'Fog',unknown:'Unknown conditions'},
  };
  const base=c.allocateInternalId?.('weather-title')??`${c.prefix}-weather-title`,title=e('h2','',node.label);title.id=base+'-title';root.dir='auto';root.setAttribute('aria-labelledby',title.id);root.append(title,e('p','iui-weather-title-note',t.note));
  if(node.description!==undefined)root.append(e('p','iui-weather-title-text',node.description));
  const toolbar=e('div','iui-weather-title-toolbar'),placeLabel=e('label','',t.place),select=e('select'),units=e('div','iui-weather-title-units'),celsius=e('button','','°C'),fahrenheit=e('button','','°F'),reset=e('button','iui-weather-title-reset',t.reset),status=e('p','iui-weather-title-status'),cards=e('div','iui-weather-title-places');
  const first=node.initialPlaceId===undefined?0:node.places.findIndex(place=>place.id===node.initialPlaceId),initial=node.places.length?'p'+first:'';
  let selected=initial,unit=node.unit,revision=0,alive=true;
  placeLabel.htmlFor=select.id=base+'-place';select.dataset.weatherTitleControl='place';
  const choices=new Set<string>();node.places.forEach((place,index)=>{const value='p'+index,option=e('option','',place.label);option.value=value;option.defaultSelected=value===initial;select.append(option);choices.add(value);});select.disabled=!node.places.length;
  for(const[button,value,label]of[[celsius,'celsius',zh?'摄氏度':'Celsius'],[fahrenheit,'fahrenheit',zh?'华氏度':'Fahrenheit']]as const){button.type='button';button.dataset.weatherTitleUnit=value;button.setAttribute('aria-label',label);button.disabled=!node.places.length;units.append(button);}
  units.setAttribute('role','group');units.setAttribute('aria-label',t.unit);reset.type='button';reset.disabled=!node.places.length;toolbar.append(placeLabel,select,units,reset);status.setAttribute('role','status');status.setAttribute('aria-atomic','true');root.append(toolbar,status,cards);
  const views=node.places.map((place,index)=>{
    const article=e('article','iui-weather-title-place'),heading=e('h3','',place.label),zone=e('p','iui-weather-title-zone',place.timezone),summary=e('div','iui-weather-title-summary'),temperature=e('strong','iui-weather-title-temperature'),condition=e('p','',place.condition===null?t.unknown:t.conditions[place.condition]);
    article.dataset.placeId=place.id;heading.id=base+'-place-'+index;article.setAttribute('aria-labelledby',heading.id);summary.append(temperature,condition);article.append(heading,zone,summary);
    const at=e('p','iui-weather-title-observed',t.time+': ');
    if(place.observedAt===null)at.append(c.doc.createTextNode(t.unknown));else{const time=e('time','',new Intl.DateTimeFormat(locale,{timeZone:place.timezone,year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'}).format(new Date(place.observedAt)));time.dateTime=place.observedAt;time.title=place.observedAt;at.append(time);}article.append(at);
    if(place.source){const p=e('p','iui-weather-title-source',t.source+': '),link=e('a','',`${place.source.label} (${t.newTab})`);link.href=place.source.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';p.append(link);article.append(p);}
    cards.append(article);return{article,summary,temperature,place};
  });
  const owned=(control:HTMLElement)=>toolbar.parentElement===root&&(control===celsius||control===fahrenheit?control.parentElement===units&&units.parentElement===toolbar:control.parentElement===toolbar);
  const restore=()=>{if(alive&&owned(select))select.value=selected;};
  const format=(place:WeatherSidebarTitleNode['places'][number])=>{const result=weatherTemperature(place.temperature,place.unit,unit);return result===null?t.unknown:new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(Object.is(result,-0)?0:result)+(unit==='celsius'?'°C':'°F');};
  const paint=()=>{
    if(!alive)return;restore();if(!alive)return;
    for(const[button,value]of[[celsius,'celsius'],[fahrenheit,'fahrenheit']]as const)if(alive&&owned(button))button.setAttribute('aria-pressed',String(unit===value));
    for(const[ i,view ]of views.entries()){
      if(!alive)return;const ownsArticle=()=>alive&&cards.parentElement===root&&view.article.parentElement===cards;if(!ownsArticle())continue;view.article.hidden='p'+i!==selected;
      if(ownsArticle()&&view.summary.parentElement===view.article&&view.temperature.parentElement===view.summary)view.temperature.textContent=format(view.place);
    }
    if(alive&&status.parentElement===root){const view=views[Number(selected.slice(1))];status.textContent=selected&&view?`${view.place.label} · ${format(view.place)}`:t.empty;}
    if(alive&&owned(reset))reset.setAttribute('aria-disabled',String(selected===initial&&unit===node.unit));
  };
  c.on(select,'change',()=>{if(!alive)return;const value=select.value;if(!owned(select)||readerBlocked(root,select,alive)||select.selectedIndex<0||!choices.has(value)){restore();return;}selected=value;revision++;paint();});
  for(const[button,value]of[[celsius,'celsius'],[fahrenheit,'fahrenheit']]as const)c.on(button,'click',()=>{if(!owned(button)||readerBlocked(root,button,alive))return;unit=value;revision++;paint();});
  const resetLocal=()=>{if(![select,celsius,fahrenheit,reset].every(owned)){restore();return;}selected=initial;unit=node.unit;revision++;paint();};
  c.on(reset,'click',()=>{if([select,celsius,fahrenheit,reset].some(control=>!owned(control)||readerBlocked(root,control,alive)))return;resetLocal();});
  readerNativeReset(c,root,[select],()=>revision,restore,()=>{if([celsius,fahrenheit,reset].some(control=>readerBlocked(root,control,alive))){restore();return;}resetLocal();});
  c.cleanup(()=>{alive=false;});paint();return root;
}
