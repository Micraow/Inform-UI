import type {RenderGeneration} from './generation.js';
import {suppliedReaderContext,suppliedReaderReset,suppliedReaderPainter,suppliedReaderInput} from './supplied-reader-lifecycle.js';
import type {NbaPlayerSummaryNode,TennisPlayerSummaryNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {PlayerSummaryLabels} from './player-summary-labels.js';
import {readerBlocked} from './reader-controls.js';

type PlayerNode=NbaPlayerSummaryNode|TennisPlayerSummaryNode;
type Cell=string|number|null;
interface Column {key:string;label:string;numeric?:boolean;ascending?:boolean;}


export function renderPlayerSummary(c:RendererContext,node:PlayerNode,t:PlayerSummaryLabels):HTMLElement {
  const e=c.element,root=e('section','iui-player-summary '+(node.type==='nba-player-summary'?'iui-nba-player':'iui-tennis-player'));
  c=suppliedReaderContext(c,root);
  const base=c.allocateInternalId?.('player-summary')??`${c.prefix}-player-summary`,title=e('h2','',node.label),player=e('p','iui-player-name',node.player);
  title.id=base+'-title';root.dir='auto';root.setAttribute('aria-labelledby',title.id);
  root.append(title,player,e('p','iui-player-note',t.note));
  if(node.description!==undefined)root.append(e('p','iui-player-text',node.description));
  if(node.observedAt!==undefined){
    const observed=e('p','',t.observed+': '),stamp=e('time','',node.observedAt);
    stamp.dateTime=node.observedAt;stamp.dir='ltr';observed.append(stamp);root.append(observed);
  }
  const appendSource=(parent:HTMLElement,source:{label:string;url:string}|undefined)=>{
    if(!source)return;
    const text=e('p','iui-player-source',t.source+': '),link=e('a','',`${source.label} (${t.newTab})`);
    link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
    text.append(link);parent.append(text);
  };
  appendSource(root,node.source);
  const basketball=node.type==='nba-player-summary';
  const groupLabels:Record<string,string>=basketball?t.scopes:t.surfaces;
  const columns:Column[]=[{key:'season',label:t.season},...(basketball?
    [{key:'team',label:t.team},{key:'group',label:t.scope},...(['games','minutesPerGame','pointsPerGame','reboundsPerGame','assistsPerGame']as const).map(key=>({key,label:t[key],numeric:true}))]:
    [{key:'group',label:t.surface},...(['matches','wins','losses','titles','rank']as const).map(key=>({key,label:t[key],numeric:true,ascending:key==='rank'}))])];
  const seasons=[...new Set(node.records.map(record=>record.season))];
  const toolbar=e('div','iui-player-toolbar'),queryLabel=e('label','',t.search),query=e('input');
  query.type='search';query.maxLength=200;queryLabel.htmlFor=query.id=base+'-search';toolbar.append(queryLabel,query);
  const select=(suffix:string,label:string,options:readonly (readonly [string,string])[],initial='')=>{
    const caption=e('label','',label),control=e('select');caption.htmlFor=control.id=base+'-'+suffix;
    for(const[value,text]of options){const option=e('option','',text);option.value=value;option.defaultSelected=value===initial;control.append(option);}
    toolbar.append(caption,control);return control;
  };
  const season=select('season',t.season,[['',t.all],...seasons.map((label,i)=>['s'+i,label]as const)]);
  const group=select('group',basketball?t.scope:t.surface,[['',t.all],...Object.entries(groupLabels)]);
  const order=select('order',t.order,[['source',t.sourceOrder],['season',t.seasonOrder],...columns.filter(column=>column.numeric).map(column=>[column.key,`${column.label}, ${column.ascending?t.ascending:t.descending}`]as const)],'source');
  const reset=e('button','iui-player-reset',t.reset);reset.type='button';toolbar.append(reset);root.append(toolbar);
  const count=e('p','iui-player-count'),empty=e('p','iui-player-empty'),scroll=e('div','iui-player-table-scroll'),table=e('table'),caption=e('caption','',node.player),head=e('thead'),header=e('tr'),body=e('tbody');
  count.setAttribute('role','status');
  const heads=columns.map(column=>{const th=e('th','',column.label);th.scope='col';header.append(th);return th;});
  const contextHeader=e('th','',t.context);contextHeader.scope='col';header.append(contextHeader);head.append(header);table.append(caption,head,body);scroll.append(table);root.append(count,empty,scroll);
  const rows=node.records.map((record,index)=>{
    const groupValue='scope'in record?record.scope:record.surface;
    const cells:Record<string,Cell>={season:record.season,group:groupLabels[groupValue]};
    if('scope'in record)Object.assign(cells,{team:record.team,games:record.games,minutesPerGame:record.minutesPerGame,pointsPerGame:record.pointsPerGame,reboundsPerGame:record.reboundsPerGame,assistsPerGame:record.assistsPerGame});
    else Object.assign(cells,{matches:record.matches,wins:record.wins,losses:record.losses,titles:record.titles,rank:record.rank});
    const row=e('tr');row.dataset.recordId=record.id;
    columns.forEach((column,i)=>{const cell=e(i===0?'th':'td','',cells[column.key]??t.unknown);if(i===0)(cell as HTMLTableCellElement).scope='row';if(column.numeric)cell.className='iui-player-number';row.append(cell);});
    const context=e('td');
    if(record.note!==undefined||record.source){const detail=e('details');detail.append(e('summary','',t.context));if(record.note!==undefined)detail.append(e('p','iui-player-text',record.note));appendSource(detail,record.source);context.append(detail);}
    else context.textContent=t.noContext;
    row.append(context);body.append(row);
    return {record,index,row,cells,group:groupValue,haystack:[record.season,'team'in record?record.team:'',record.note??''].join(' ').toLowerCase()};
  });
  let alive=true,revision=0,values=['','','','source'];
  const controls=[query,season,group,order];
  const allowed=[[],['',...seasons.map((_,i)=>'s'+i)],['',...Object.keys(groupLabels)],['source','season',...columns.filter(column=>column.numeric).map(column=>column.key)]];
  const runPaint=suppliedReaderPainter(c);
  const restoreFields=(scope:RenderGeneration)=>controls.forEach((control,i)=>{if(scope.during(()=>root.contains(control)))scope.during(()=>{control.value=values[i];});});
  const restore=()=>{if(alive)runPaint(restoreFields);};
  const paint=()=>{if(!alive||!c.lifecycle.current())return;runPaint(scope=>{
    restoreFields(scope);
    if(!scope.during(()=>root.contains(scroll)&&scroll.parentElement===root&&table.parentElement===scroll&&body.parentElement===table))return;
    const metric=values[3],column=columns.find(column=>column.key===metric);
    const sorted=[...rows].sort((a,b)=>{
      if(metric==='source')return a.index-b.index;
      if(metric==='season'){const x=a.record.season.toLowerCase(),y=b.record.season.toLowerCase();return(x<y?-1:x>y?1:0)||a.index-b.index;}
      const x=a.cells[metric],y=b.cells[metric];
      if(x===null||y===null)return(x===null?(y===null?0:1):-1)||a.index-b.index;
      if(typeof x!=='number'||typeof y!=='number')return a.index-b.index;
      return(column?.ascending?x-y:y-x)||a.index-b.index;
    });
    let shown=0;
    for(const item of sorted){
      if(!scope.during(()=>root.contains(body)&&item.row.parentElement===body))continue;
      scope.during(()=>{item.row.hidden=Boolean(values[1]&&item.record.season!==seasons[Number(values[1].slice(1))])||Boolean(values[2]&&item.group!==values[2])||!item.haystack.includes(values[0].toLowerCase());});
      if(scope.during(()=>!item.row.hidden))shown++;
      scope.during(()=>body.append(item.row));
    }
    heads.forEach((th,i)=>{if(!scope.during(()=>root.contains(th)&&th.parentElement===header&&header.parentElement===head&&head.parentElement===table))return;scope.during(()=>{if(columns[i].key===metric)th.setAttribute('aria-sort',metric==='season'||column?.ascending?'ascending':'descending');else th.removeAttribute('aria-sort');});});
    if(scope.during(()=>root.contains(count)))scope.during(()=>{count.textContent=t.count(shown,rows.length);});
    if(scope.during(()=>root.contains(empty))){scope.during(()=>{empty.hidden=shown>0;});scope.during(()=>{empty.textContent=rows.length?t.noMatches:t.empty;});}
    if(scope.during(()=>root.contains(reset)))scope.during(()=>reset.setAttribute('aria-disabled',String(!values[0]&&!values[1]&&!values[2]&&values[3]==='source')));
  });};
  const input=suppliedReaderInput(c);
  controls.forEach((control,i)=>c.on(control,i===0?'input':'change',()=>input.run(scope=>{
    if(!alive)return;
    const valid=i===0?scope.during(()=>control.value.length<=200):scope.during(()=>(control as HTMLSelectElement).selectedIndex>=0)&&scope.during(()=>allowed[i].includes(control.value));
    if(scope.during(()=>readerBlocked(root,control,scope.current()))||!valid){restore();return;}
    const next=scope.during(()=>control.value);values[i]=next;revision++;paint();
  })));
  const resetFilters=()=>{input.retire();values=['','','','source'];revision++;paint();};
  c.on(reset,'click',()=>input.run(scope=>{if(!scope.during(()=>[reset,...controls].some(control=>readerBlocked(root,control,scope.current()))))resetFilters();}));
  suppliedReaderReset(c,root,controls,()=>revision,restore,resetFilters);
  c.cleanup(()=>{alive=false;});paint();return root;
}
