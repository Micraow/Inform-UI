import type {RenderGeneration} from './generation.js';
import {suppliedReaderContext,suppliedReaderPainter,suppliedReaderInput} from './supplied-reader-lifecycle.js';
import type {NbaScoreGame,SoccerScoreGame,FootballGame,ScorePair} from '../schema/document.js';
import type {MatchScoresNode} from '../core/match-scores.js';
import type {RendererContext} from './context.js';
import type {MatchScoresLabels} from './match-scores-labels.js';
import {dateInZone} from '../core/extensions.js';
import {flightInstant} from '../core/travel-events.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';

type Game=NbaScoreGame|SoccerScoreGame|FootballGame;
interface Filter {key:string;control:HTMLInputElement|HTMLSelectElement;initial:string;allowed?:Set<string>}

export function renderMatchScores(c:RendererContext,node:MatchScoresNode,t:MatchScoresLabels):HTMLElement {
  const root=c.element('section','iui-match-scores iui-'+node.type);c=suppliedReaderContext(c,root);const e=c.element,base=c.allocateInternalId?.('match-scores')??`${c.prefix}-match-scores`;
  const title=e('h2','',node.label);title.id=base+'-title';root.dir='auto';root.setAttribute('aria-labelledby',title.id);root.append(title,e('p','iui-score-note',t.note));
  if(node.description!==undefined)root.append(e('p','iui-score-text',node.description));
  const source=(parent:HTMLElement,value:{label:string;url:string}|undefined)=>{
    if(!value)return;const p=e('p','iui-score-source',t.source+': '),link=e('a','',`${value.label} (${t.newTab})`);
    link.href=value.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';p.append(link);parent.append(p);
  };
  if(node.observedAt!==undefined){const p=e('p','',t.observed+': '),time=e('time','',node.observedAt);time.dateTime=node.observedAt;p.append(time);root.append(p);}source(root,node.source);
  const timezone=e('p','iui-score-note',node.timezone),toolbar=e('div','iui-score-toolbar'),count=e('p','iui-score-count'),empty=e('p','iui-score-empty'),list=e('ol','iui-score-list');count.setAttribute('role','status');root.append(timezone,toolbar,count,empty,list);
  const filters:Filter[]=[],values:Record<string,string>={};
  const addSelect=(key:string,labelText:string,choices:readonly(readonly[string,string])[],initial='')=>{
    const label=e('label','',labelText),control=e('select');label.htmlFor=control.id=base+'-'+key;control.dataset.scoreFilter=key;
    for(const[value,text]of choices){const option=e('option','',text);option.value=value;option.defaultSelected=value===initial;control.append(option);}toolbar.append(label,control);filters.push({key,control,initial,allowed:new Set(choices.map(([value])=>value))});values[key]=initial;
  };
  const queryLabel=e('label','',t.search),query=e('input');query.type='search';query.maxLength=200;queryLabel.htmlFor=query.id=base+'-search';query.dataset.scoreFilter='search';toolbar.append(queryLabel,query);filters.push({key:'search',control:query,initial:''});values.search='';
  const teams=new Map(node.teams.map(team=>[team.id,team]));
  const dates=[...new Set(node.games.map(game=>game.startsAt===null?'unknown':dateInZone(game.startsAt,node.timezone)))].sort((a,b)=>a==='unknown'?1:b==='unknown'?-1:a.localeCompare(b));
  const competitions=[...new Set(node.games.map(game=>game.competition))];
  addSelect('date',t.date,[['',t.all],...dates.map(date=>[date,date==='unknown'?t.unknownDate:date]as const)]);
  addSelect('team',t.team,[['',t.all],...node.teams.map((team,i)=>['t'+i,team.label]as const)]);
  addSelect('competition',t.competition,[['',t.all],...competitions.map((name,i)=>['c'+i,name]as const)]);
  addSelect('status',t.status,[['',t.all],...Object.entries(t.statuses)]);
  addSelect('order',t.order,[['time',t.timeOrder],['source',t.sourceOrder]],'time');
  if(node.type!=='nba-scores')addSelect('event',t.eventKind,[['',t.all],...Object.entries(node.type==='american-football-games'?t.footballKinds:t.kinds)]);
  const reset=e('button','iui-score-reset',t.reset);reset.type='button';toolbar.append(reset);
  const number=(value:number|null)=>value===null?t.unknown:String(value);
  const table=(parent:HTMLElement,captionText:string,headings:string[],rows:readonly(readonly(string|number)[])[])=>{
    const scroll=e('div','iui-score-table-scroll'),table=e('table'),caption=e('caption','',captionText),head=e('thead'),tr=e('tr'),body=e('tbody');
    scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',captionText);for(const heading of headings){const th=e('th','',heading);th.scope='col';tr.append(th);}head.append(tr);
    for(const row of rows){const tr=e('tr');row.forEach((value,i)=>{const cell=e(i===0?'th':'td',i===0?'':'iui-score-number',value);if(i===0)(cell as HTMLTableCellElement).scope='row';tr.append(cell);});body.append(tr);}table.append(caption,head,body);scroll.append(table);parent.append(scroll);
  };
  const pair=(parent:HTMLElement,label:string,value:ScorePair|null,home:string,away:string)=>{const section=e('section','iui-score-pair');section.append(e('h4','',label));if(value===null)section.append(e('p','',t.unknown));else section.append(e('p','',`${home}: ${number(value.home)} · ${away}: ${number(value.away)}`));parent.append(section);};
  const views=node.games.map((game:Game,index)=>{
    const card=e('li','iui-score-game'),article=e('article'),heading=e('h3','',game.label),meta=e('p','iui-score-meta',game.competition+' · '+t.statuses[game.status]);card.dataset.gameId=game.id;heading.id=base+'-game-'+index;article.setAttribute('aria-labelledby',heading.id);article.append(heading,meta);card.append(article);
    const home=teams.get(game.homeTeamId)!,away=teams.get(game.awayTeamId)!;
    if(game.startsAt===null)article.append(e('p','',t.unknownDate));else{const time=e('time','iui-score-time',new Intl.DateTimeFormat(t.home==='主队'?'zh-CN':'en-US',{timeZone:node.timezone,year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'}).format(new Date(game.startsAt)));time.dateTime=game.startsAt;time.title=game.startsAt;article.append(time);}
    const board=e('div','iui-score-board');for(const[team,side,score]of[[home,t.home,game.homeScore],[away,t.away,game.awayScore]]as const){const panel=e('div','iui-score-side');panel.append(e('p','iui-score-note',side),e('h4','',team.label),e('strong','iui-score-value',number(score)));if(team.record!==undefined)panel.append(e('p','iui-score-note',t.record+': '+team.record));board.append(panel);}article.append(board,e('p','iui-score-outcome',t.outcome+': '+t.outcomes[game.outcome]));
    if(game.periodLabel!==undefined)article.append(e('p','',t.period+': '+game.periodLabel));if(game.clock!==undefined)article.append(e('p','iui-score-clock',t.clock+': '+game.clock));
    const detail=e('details','iui-score-details'),summary=e('summary','',t.details),content=e('div','iui-score-detail-content');detail.append(summary,content);article.append(detail);if(game.venue!==undefined)content.append(e('p','',t.venue+': '+game.venue));if(game.note!==undefined)content.append(e('p','iui-score-text',game.note));source(content,game.source);
    let eventView:{container:HTMLOListElement;count:HTMLParagraphElement;empty:HTMLParagraphElement;rows:{item:HTMLLIElement;kind:string}[]}|undefined;
    if('leaders'in game){
      if(game.periods.length)table(content,t.periods,[t.period,home.label,away.label],game.periods.map(period=>[period.label,number(period.home),number(period.away)]));else content.append(e('p','',t.noPeriods));
      if(game.leaders.length)table(content,t.leaders,[t.player,t.team,t.points,t.rebounds,t.assists],game.leaders.map(player=>[player.label,teams.get(player.teamId)!.label,number(player.points),number(player.rebounds),number(player.assists)]));else content.append(e('p','',t.noLeaders));
    }else{
      if('possessionTeamId'in game){
        article.insertBefore(e('p','iui-football-possession',t.possession+': '+(game.possessionTeamId===null?t.unknown:teams.get(game.possessionTeamId)!.label)),detail);
        const situation=e('section','iui-football-situation');situation.append(e('h4','',t.situation));
        if(game.situation===null)situation.append(e('p','',t.unknown));else{const facts=e('dl');for(const[label,value]of[[t.down,number(game.situation.down)],[t.distance,number(game.situation.distance)],[t.ballOn,game.situation.ballOn??t.unknown]]){const row=e('div');row.append(e('dt','',label),e('dd','',value));facts.append(row);}situation.append(facts);}article.insertBefore(situation,detail);
        if(game.periods.length)table(content,t.periods,[t.period,home.label,away.label],game.periods.map(period=>[`${period.kind==='quarter'?t.quarter:t.overtime} ${period.number} · ${period.label}`,number(period.home),number(period.away)]));else content.append(e('p','',t.noPeriods));
      }else{pair(content,t.aggregate,game.aggregate,home.label,away.label);pair(content,t.penalties,game.penalties,home.label,away.label);}
      const events=e('ol','iui-score-events'),eventCount=e('p','iui-score-event-count'),eventEmpty=e('p','iui-score-event-empty');content.append(e('h5','',t.events),eventCount,eventEmpty,events);eventCount.setAttribute('role','status');
      const rows=game.events.map(event=>{const item=e('li','iui-score-event');item.dataset.eventId=event.id;if('minute'in event){item.append(e('strong','',`${t.minute}: ${event.minute} · ${t.kinds[event.kind]}`));if(event.player!==undefined)item.append(e('p','',event.player));}else{const period='periods'in game?game.periods.find(period=>period.id===event.periodId):undefined;item.append(e('strong','',t.footballKinds[event.kind]),e('p','',t.period+': '+(period?.label??t.unknown)),e('p','',t.clock+': '+(event.clock??t.unknown)),e('p','iui-football-event-points',t.points+': '+number(event.points)));}item.append(e('p','',t.team+': '+(event.teamId===null?t.unknown:teams.get(event.teamId)!.label)));if(event.note!==undefined)item.append(e('p','iui-score-text',event.note));events.append(item);return{item,kind:event.kind};});eventView={container:events,count:eventCount,empty:eventEmpty,rows};
    }
    list.append(card);return{game,index,card,article,detail,content,eventView,date:game.startsAt===null?'unknown':dateInZone(game.startsAt,node.timezone),instant:game.startsAt===null?null:flightInstant(game.startsAt),haystack:[game.label,game.competition,home.label,away.label].join(' ').toLowerCase()};
  });
  let alive=true,revision=0;
  const owned=(control:HTMLElement)=>control.parentElement===toolbar&&toolbar.parentElement===root;
  const controls=filters.map(filter=>filter.control);
  const runPaint=suppliedReaderPainter(c),input=suppliedReaderInput(c);
  const restoreFields=(scope:RenderGeneration)=>filters.forEach(filter=>{if(scope.during(()=>owned(filter.control)))scope.during(()=>{filter.control.value=values[filter.key];});});
  const restore=()=>{if(alive)runPaint(restoreFields);};
  const paint=()=>{if(!alive||!c.lifecycle.current())return;runPaint(scope=>{
    const current=()=>scope.current();restoreFields(scope);let shown=0;
    const sorted=[...views].sort((a,b)=>values.order==='source'?a.index-b.index:(a.instant===null?(b.instant===null?0:1):b.instant===null?-1:a.instant-b.instant)||a.index-b.index);
    const team=values.team?node.teams[Number(values.team.slice(1))].id:null,competition=values.competition?competitions[Number(values.competition.slice(1))]:null;
    let previous:HTMLElement|null=null;
    for(const view of sorted){
      if(!current())return;const ownsCard=()=>current()&&list.parentElement===root&&view.card.parentElement===list;if(!ownsCard())continue;
      const visible=(!values.date||view.date===values.date)&&(!team||view.game.homeTeamId===team||view.game.awayTeamId===team)&&(!competition||view.game.competition===competition)&&(!values.status||view.game.status===values.status)&&view.haystack.includes(values.search.toLowerCase());scope.during(()=>{view.card.hidden=!visible;});if(!ownsCard())continue;if(visible)shown++;
      // Preserve native disclosure focus when the supplied/current order is already correct.
      const expected:Element|null=scope.during(()=>previous?previous.nextElementSibling:list.firstElementChild);if(!scope.during(ownsCard))return;if(expected&&!scope.during(()=>expected.parentElement===list))return;if(expected!==view.card)scope.during(()=>list.insertBefore(view.card,expected));if(!ownsCard())continue;previous=view.card;
      const events=view.eventView;if(!events)continue;const ownsEvents=()=>ownsCard()&&view.article.parentElement===view.card&&view.detail.parentElement===view.article&&view.content.parentElement===view.detail&&events.container.parentElement===view.content;if(!ownsEvents())continue;
      let eventShown=0;for(const row of events.rows){if(!current())return;if(!ownsEvents())break;if(row.item.parentElement!==events.container)continue;scope.during(()=>{row.item.hidden=Boolean(values.event&&row.kind!==values.event);});if(ownsEvents()&&row.item.parentElement===events.container&&!row.item.hidden)eventShown++;}
      // A host hook on hidden can move the timeline or retire this paint.
      if(ownsEvents()&&events.count.parentElement===view.content)scope.during(()=>{events.count.textContent=t.eventCount(eventShown,events.rows.length);});if(ownsEvents()&&events.empty.parentElement===view.content){scope.during(()=>{events.empty.hidden=eventShown>0;});if(ownsEvents()&&events.empty.parentElement===view.content)scope.during(()=>{events.empty.textContent=events.rows.length?t.noEventMatches:t.noEvents;});}
    }
    // Keep the second empty-state write under its own current-owner check.
    if(current()&&count.parentElement===root)scope.during(()=>{count.textContent=t.count(shown,node.games.length);});if(current()&&empty.parentElement===root){scope.during(()=>{empty.hidden=shown>0;});if(current()&&empty.parentElement===root)scope.during(()=>{empty.textContent=node.games.length?t.noMatches:t.noGames;});}if(current()&&owned(reset))scope.during(()=>{reset.setAttribute('aria-disabled',String(filters.every(filter=>values[filter.key]===filter.initial)));});
  });};
  for(const filter of filters)c.on(filter.control,filter.key==='search'?'input':'change',()=>input.run(scope=>{
    if(!alive)return;const value=scope.during(()=>filter.control.value),valid=filter.allowed?scope.during(()=>(filter.control as HTMLSelectElement).selectedIndex>=0)&&filter.allowed.has(value):value.length<=200;
    if(!scope.during(()=>owned(filter.control))||scope.during(()=>readerBlocked(root,filter.control,scope.current()))||!valid){restore();return;}values[filter.key]=value;revision++;paint();
  }));
  const resetFilters=()=>{input.retire();if(!c.lifecycle.during(()=>controls.every(owned))){restore();return;}for(const filter of filters)values[filter.key]=filter.initial;revision++;paint();};
  c.on(reset,'click',()=>input.run(scope=>{if(scope.during(()=>[reset,...controls].some(control=>!owned(control)||readerBlocked(root,control,scope.current()))))return;resetFilters();}));
  readerNativeReset(c,root,controls,()=>revision,restore,resetFilters);c.cleanup(()=>{alive=false;});paint();return root;
}
