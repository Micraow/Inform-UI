import type {NbaGameBoxscoreNode,CricketMatchBoxscoreNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {BoxscoreLabels} from './boxscore-labels.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';

type Cell=string|number|null;
interface Column {key:string;label:string;numeric?:boolean;ascending?:boolean;}
interface RecordRow {id:string;label:string;cells:Record<string,Cell>;note?:string;source?:{label:string;url:string};haystack:string;group?:string;role?:string;}
interface Filter {control:HTMLInputElement|HTMLSelectElement;allowed?:string[];initial:string;}
let serial=0;

function appendSource(c:RendererContext,parent:HTMLElement,source:{label:string;url:string}|undefined,t:BoxscoreLabels):void {
  if(!source)return;
  const text=c.element('p','iui-boxscore-source',t.source+': '),link=c.element('a','',`${source.label} (${t.newTab})`);
  link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';text.append(link);parent.append(text);
}
function shell(c:RendererContext,node:NbaGameBoxscoreNode|CricketMatchBoxscoreNode,t:BoxscoreLabels,kind:string){
  const e=c.element,root=e('section','iui-boxscore '+kind),base=`iui-boxscore-${c.prefix}${++serial}`,title=e('h2','',node.label);
  title.id=base+'-title';root.dir='auto';root.setAttribute('aria-labelledby',title.id);root.append(title,e('p','iui-boxscore-note',t.note),e('p','',`${t.status}: ${t.statuses[node.status]}`));
  if(node.description!==undefined)root.append(e('p','iui-boxscore-text',node.description));
  if(node.statusText!==undefined)root.append(e('p','iui-boxscore-text',node.statusText));
  if(node.observedAt!==undefined){const text=e('p','',t.observed+': '),stamp=e('time','',node.observedAt);stamp.dateTime=node.observedAt;stamp.dir='ltr';text.append(stamp);root.append(text);}
  appendSource(c,root,node.source,t);return{root,base};
}
function query(c:RendererContext,parent:HTMLElement,id:string,t:BoxscoreLabels):Filter {
  const label=c.element('label','',t.search),control=c.element('input');control.type='search';control.maxLength=200;label.htmlFor=control.id=id;parent.append(label,control);return{control,initial:''};
}
function select(c:RendererContext,parent:HTMLElement,id:string,label:string,choices:readonly (readonly [string,string])[],initial=''):Filter {
  const caption=c.element('label','',label),control=c.element('select');caption.htmlFor=control.id=id;
  for(const[value,text]of choices){const option=c.element('option','',text);option.value=value;option.defaultSelected=value===initial;control.append(option);}
  parent.append(caption,control);return{control,initial,allowed:choices.map(([value])=>value)};
}
function bindReader(c:RendererContext,root:HTMLElement,filters:Filter[],reset:HTMLButtonElement,render:(values:readonly string[],alive:()=>boolean)=>void):void {
  let alive=true,revision=0,values=filters.map(filter=>filter.initial);const controls=filters.map(filter=>filter.control);
  const restore=()=>controls.forEach((control,i)=>{if(alive&&root.contains(control))control.value=values[i];});
  const paint=()=>{if(!alive)return;restore();if(!alive)return;render(values,()=>alive);if(alive&&root.contains(reset))reset.setAttribute('aria-disabled',String(values.every((value,i)=>value===filters[i].initial)));};
  filters.forEach((filter,i)=>c.on(filter.control,i===0?'input':'change',()=>{
    const control=filter.control;if(!alive)return;
    const valid=filter.allowed?(control as HTMLSelectElement).selectedIndex>=0&&filter.allowed.includes(control.value):control.value.length<=200;
    if(readerBlocked(root,control,alive)||!valid){restore();return;}
    values[i]=control.value;revision++;paint();
  }));
  const resetFilters=()=>{values=filters.map(filter=>filter.initial);revision++;paint();};
  c.on(reset,'click',()=>{if(![reset,...controls].some(control=>readerBlocked(root,control,alive)))resetFilters();});
  readerNativeReset(c,root,controls,()=>revision,restore,resetFilters);c.cleanup(()=>{alive=false;});paint();
}
function table(c:RendererContext,parent:HTMLElement,label:string,columns:Column[],records:RecordRow[],t:BoxscoreLabels,kind:string){
  const e=c.element,count=e('p','iui-boxscore-count'),empty=e('p','iui-boxscore-empty'),scroll=e('div','iui-boxscore-table-scroll'),table=e('table',kind),caption=e('caption','',label),head=e('thead'),header=e('tr'),body=e('tbody');
  count.setAttribute('role','status');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',label);
  const heads=columns.map(column=>{const th=e('th','',column.label);th.scope='col';header.append(th);return th;});
  const context=e('th','',t.context);context.scope='col';header.append(context);head.append(header);table.append(caption,head,body);scroll.append(table);parent.append(count,empty,scroll);
  const rows=records.map((record,index)=>{
    const row=e('tr');row.dataset.playerId=record.id;
    columns.forEach((column,i)=>{const cell=e(i===0?'th':'td',column.numeric?'iui-boxscore-number':'',record.cells[column.key]??t.unknown);if(i===0)(cell as HTMLTableCellElement).scope='row';row.append(cell);});
    const context=e('td');
    if(record.note!==undefined||record.source){const detail=e('details');detail.append(e('summary','',t.context));if(record.note!==undefined)detail.append(e('p','iui-boxscore-text',record.note));appendSource(c,detail,record.source,t);context.append(detail);}else context.textContent=t.noContext;
    row.append(context);body.append(row);return{record,index,row};
  });
  return{paint(root:HTMLElement,metric:string,predicate:(record:RecordRow)=>boolean,alive:()=>boolean){
    if(!alive()||!root.contains(parent)||body.parentElement!==table||table.parentElement!==scroll||scroll.parentElement!==parent)return;
    const column=columns.find(column=>column.key===metric),sorted=[...rows].sort((a,b)=>{
      if(metric==='source')return a.index-b.index;
      const x=a.record.cells[metric],y=b.record.cells[metric];
      if(x===null||y===null)return(x===null?(y===null?0:1):-1)||a.index-b.index;
      if(typeof x!=='number'||typeof y!=='number')return a.index-b.index;
      return(column?.ascending?x-y:y-x)||a.index-b.index;
    });
    let shown=0;
    for(const item of sorted){if(!alive())return;if(!root.contains(body)||item.row.parentElement!==body)continue;item.row.hidden=!predicate(item.record);if(!item.row.hidden)shown++;body.append(item.row);}
    heads.forEach((th,i)=>{if(!alive()||!root.contains(th)||th.parentElement!==header||header.parentElement!==head||head.parentElement!==table)return;if(columns[i].key===metric)th.setAttribute('aria-sort',column?.ascending?'ascending':'descending');else th.removeAttribute('aria-sort');});
    if(alive()&&root.contains(count))count.textContent=t.count(shown,rows.length);
    if(alive()&&root.contains(empty)){empty.hidden=shown>0;empty.textContent=rows.length?t.noMatches:t.emptyPlayers;}
  }};
}
const metricChoices=(columns:Column[],t:BoxscoreLabels)=>[['source',t.sourceOrder]as const,...columns.filter(column=>column.numeric).map(column=>[column.key,`${column.label}, ${column.ascending?t.ascending:t.descending}`]as const)];

export function renderBasketballBoxscore(c:RendererContext,node:NbaGameBoxscoreNode,t:BoxscoreLabels):HTMLElement {
  const e=c.element,{root,base}=shell(c,node,t,'iui-nba-boxscore'),scores=e('div','iui-boxscore-scores');
  for(const team of node.teams){const panel=e('section','iui-boxscore-team-score');panel.dataset.teamId=team.id;panel.append(e('h3','',team.label),e('p','',`${t.score}: ${team.score??t.unknown}`));if(team.note!==undefined)panel.append(e('p','iui-boxscore-text',team.note));scores.append(panel);}root.append(scores);
  const periodDetails=e('details','iui-boxscore-periods');periodDetails.append(e('summary','',t.periods));
  if(node.periods.length){const periods=e('table'),caption=e('caption','',t.periods),head=e('thead'),header=e('tr'),body=e('tbody');for(const label of[t.period,...node.teams.map(team=>team.label)]){const th=e('th','',label);th.scope='col';header.append(th);}head.append(header);for(const period of node.periods){const row=e('tr'),label=e('th','',period.label);label.scope='row';row.append(label,...period.scores.map(score=>e('td','iui-boxscore-number',score??t.unknown)));body.append(row);}periods.append(caption,head,body);periodDetails.append(periods);}else periodDetails.append(e('p','',t.noPeriods));root.append(periodDetails);
  const columns:Column[]=[{key:'label',label:t.player},{key:'team',label:t.team},{key:'role',label:t.starterFilter},{key:'minutes',label:t.minutes},...(['points','rebounds','assists','steals','blocks','turnovers','plusMinus']as const).map(key=>({key,label:t[key],numeric:true})),...(['fieldGoals','threePointers','freeThrows']as const).map(key=>({key,label:t[key]}))];
  const toolbar=e('div','iui-boxscore-toolbar');root.append(toolbar);
  const filters=[query(c,toolbar,base+'-search',t),select(c,toolbar,base+'-team',t.team,[['',t.all],...node.teams.map((team,i)=>['t'+i,team.label]as const)]),select(c,toolbar,base+'-role',t.starterFilter,[['',t.all],['starter',t.starter],['bench',t.bench],['unknown',t.unknownRole]]),select(c,toolbar,base+'-order',t.order,metricChoices(columns,t),'source')];
  const reset=e('button','iui-boxscore-reset',t.reset);reset.type='button';toolbar.append(reset);
  const records:RecordRow[]=node.teams.flatMap((team,i)=>team.players.map(player=>{
    const role=player.starter===null?'unknown':player.starter?'starter':'bench';
    return{id:player.id,label:player.label,group:'t'+i,role,note:player.note,source:player.source,haystack:[player.label,team.label,player.note??''].join(' ').toLowerCase(),cells:{label:player.label,team:team.label,role:role==='unknown'?t.unknownRole:role==='starter'?t.starter:t.bench,minutes:player.minutes,points:player.points,rebounds:player.rebounds,assists:player.assists,steals:player.steals,blocks:player.blocks,turnovers:player.turnovers,plusMinus:player.plusMinus,fieldGoals:player.fieldGoals??null,threePointers:player.threePointers??null,freeThrows:player.freeThrows??null}};
  }));
  const players=table(c,root,node.label+' · '+t.player,columns,records,t,'iui-basketball-players');
  bindReader(c,root,filters,reset,(values,alive)=>players.paint(root,values[3],record=>(!values[1]||record.group===values[1])&&(!values[2]||record.role===values[2])&&record.haystack.includes(values[0].toLowerCase()),alive));
  return root;
}

export function renderCricketBoxscore(c:RendererContext,node:CricketMatchBoxscoreNode,t:BoxscoreLabels):HTMLElement {
  const e=c.element,{root,base}=shell(c,node,t,'iui-cricket-boxscore');root.append(e('p','',node.teams.map(team=>team.label).join(' · ')));
  const battingColumns:Column[]=[{key:'label',label:t.player},{key:'dismissal',label:t.dismissal},...(['runs','balls','fours','sixes','strikeRate']as const).map(key=>({key,label:t[key],numeric:true}))];
  const bowlingColumns:Column[]=[{key:'label',label:t.player},{key:'overs',label:t.overs},...(['maidens','runs','wickets','economy']as const).map(key=>({key,label:t[key],numeric:true,ascending:key==='runs'||key==='economy'}))];
  const toolbar=e('div','iui-boxscore-toolbar');root.append(toolbar);
  const filters=[query(c,toolbar,base+'-search',t),select(c,toolbar,base+'-innings',t.innings,node.innings.length?node.innings.map((innings,i)=>['i'+i,innings.label]as const):[['',t.noInnings]],node.innings.length?'i0':''),select(c,toolbar,base+'-batting-order',t.battingOrder,metricChoices(battingColumns,t),'source'),select(c,toolbar,base+'-bowling-order',t.bowlingOrder,metricChoices(bowlingColumns,t),'source')];
  const reset=e('button','iui-boxscore-reset',t.reset);reset.type='button';toolbar.append(reset);
  const list=e('div','iui-cricket-innings-list');root.append(list);if(!node.innings.length)list.append(e('p','',t.noInnings));
  const inningsViews=node.innings.map((innings,index)=>{
    const section=e('section','iui-cricket-innings'),team=node.teams.find(team=>team.id===innings.teamId)!;section.dataset.inningsId=innings.id;
    section.append(e('h3','',innings.label+' · '+team.label),e('p','',`${t.runs}: ${innings.runs??t.unknown} · ${t.wickets}: ${innings.wickets??t.unknown} · ${t.overs}: ${innings.overs??t.unknown} · ${t.extras}: ${innings.extras??t.unknown}`));
    if(innings.note!==undefined)section.append(e('p','iui-boxscore-text',innings.note));appendSource(c,section,innings.source,t);
    section.append(e('h4','',t.batting));
    const batting=table(c,section,innings.label+' · '+t.batting,battingColumns,innings.batting.map(player=>({id:player.id,label:player.label,note:player.note,source:player.source,haystack:[player.label,player.dismissal??'',player.note??''].join(' ').toLowerCase(),cells:{label:player.label,dismissal:player.dismissal,runs:player.runs,balls:player.balls,fours:player.fours,sixes:player.sixes,strikeRate:player.strikeRate}})),t,'iui-cricket-batting');
    section.append(e('h4','',t.bowling));
    const bowling=table(c,section,innings.label+' · '+t.bowling,bowlingColumns,innings.bowling.map(player=>({id:player.id,label:player.label,note:player.note,source:player.source,haystack:[player.label,player.note??''].join(' ').toLowerCase(),cells:{label:player.label,overs:player.overs,maidens:player.maidens,runs:player.runs,wickets:player.wickets,economy:player.economy}})),t,'iui-cricket-bowling');
    list.append(section);return{section,index,batting,bowling};
  });
  bindReader(c,root,filters,reset,(values,alive)=>{
    for(const view of inningsViews){if(!alive())return;if(!root.contains(list)||view.section.parentElement!==list)continue;view.section.hidden=values[1]!=='i'+view.index;const predicate=(record:RecordRow)=>record.haystack.includes(values[0].toLowerCase());view.batting.paint(root,values[2],predicate,alive);view.bowling.paint(root,values[3],predicate,alive);}
  });
  return root;
}
