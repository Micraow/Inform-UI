import type {RenderGeneration} from './generation.js';
import {suppliedReaderContext,suppliedReaderPainter,suppliedReaderInput} from './supplied-reader-lifecycle.js';
import type {BasketballTournamentNode,ElectionResultsNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {SuppliedResultsLabels} from './supplied-results-labels.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
interface Filter {control:HTMLInputElement|HTMLSelectElement;initial:string;allowed?:string[];}


function source(c:RendererContext,parent:HTMLElement,value:{label:string;url:string}|undefined,t:SuppliedResultsLabels){
  if(!value)return;const text=c.element('p','iui-results-source',t.source+': '),link=c.element('a','',`${value.label} (${t.newTab})`);
  link.href=value.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';text.append(link);parent.append(text);
}
function time(c:RendererContext,parent:HTMLElement,label:string,value:string|undefined){if(value===undefined)return;const text=c.element('p','',label+': '),stamp=c.element('time','',value);stamp.dateTime=value;stamp.dir='ltr';text.append(stamp);parent.append(text);}
function shell(c:RendererContext,node:BasketballTournamentNode|ElectionResultsNode,note:string,t:SuppliedResultsLabels,kind:string){
  const root=c.element('section','iui-supplied-results '+kind);c=suppliedReaderContext(c,root);const e=c.element,base=c.allocateInternalId?.('supplied-results')??`${c.prefix}-supplied-results`,heading=e('h2','',node.label);
  heading.id=base+'-heading';root.dir='auto';root.setAttribute('aria-labelledby',heading.id);root.append(heading,e('p','iui-results-note',note));
  if(node.description!==undefined)root.append(e('p','iui-results-text',node.description));time(c,root,t.observed,node.observedAt);source(c,root,node.source,t);return{root,base,local:c};
}
function query(c:RendererContext,parent:HTMLElement,id:string,text:string):Filter {
  const label=c.element('label','',text),control=c.element('input');control.type='search';control.maxLength=200;label.htmlFor=control.id=id;parent.append(label,control);return{control,initial:''};
}
function select(c:RendererContext,parent:HTMLElement,id:string,text:string,options:readonly(readonly[string,string])[],initial=''):Filter {
  const label=c.element('label','',text),control=c.element('select');label.htmlFor=control.id=id;
  for(const[value,text]of options){const option=c.element('option','',text);option.value=value;option.defaultSelected=value===initial;control.append(option);}parent.append(label,control);return{control,initial,allowed:options.map(([value])=>value)};
}
function bind(c:RendererContext,root:HTMLElement,filters:Filter[],reset:HTMLButtonElement,paintValues:(values:readonly string[],scope:RenderGeneration)=>void){
 let alive=true,revision=0,values=filters.map(filter=>filter.initial);const controls=filters.map(filter=>filter.control),toolbar=reset.parentElement;
 const owned=(control:HTMLElement)=>control.parentElement===toolbar&&toolbar?.parentElement===root;
 const runPaint=suppliedReaderPainter(c),input=suppliedReaderInput(c);
 const restoreFields=(scope:RenderGeneration)=>controls.forEach((control,i)=>{if(scope.during(()=>owned(control)))scope.during(()=>{control.value=values[i];});});
 const restore=()=>{if(alive)runPaint(restoreFields);};
 const paint=()=>{if(!alive||!c.lifecycle.current())return;runPaint(scope=>{restoreFields(scope);paintValues([...values],scope);if(scope.during(()=>owned(reset)))scope.during(()=>reset.setAttribute('aria-disabled',String(values.every((value,i)=>value===filters[i].initial))));});};
 filters.forEach((filter,i)=>c.on(filter.control,i===0?'input':'change',()=>input.run(scope=>{
  if(!alive)return;const control=filter.control;
  const valid=filter.allowed?scope.during(()=>(control as HTMLSelectElement).selectedIndex>=0)&&scope.during(()=>filter.allowed!.includes(control.value)):scope.during(()=>control.value.length<=200);
  if(!scope.during(()=>owned(control))||scope.during(()=>readerBlocked(root,control,scope.current()))||!valid){restore();return;}
  const next=scope.during(()=>control.value);values[i]=next;revision++;paint();
 })));
 const resetFilters=()=>{input.retire();if(!c.lifecycle.during(()=>controls.every(owned))){restore();return;}values=filters.map(filter=>filter.initial);revision++;paint();};
 c.on(reset,'click',()=>input.run(scope=>{if(!scope.during(()=>[reset,...controls].some(control=>!owned(control)||readerBlocked(root,control,scope.current()))))resetFilters();}));
 readerNativeReset(c,root,controls,()=>revision,restore,resetFilters);c.cleanup(()=>{alive=false;});paint();
}

export function renderTournament(c:RendererContext,node:BasketballTournamentNode,t:SuppliedResultsLabels):HTMLElement {
  const {root,base,local}=shell(c,node,t.tournamentNote,t,'iui-basketball-tournament');c=local;const e=c.element,toolbar=e('div','iui-results-toolbar');root.append(toolbar);
  const filters=[query(c,toolbar,base+'-search',t.searchMatches),select(c,toolbar,base+'-round',t.round,[['',t.all],...node.rounds.map((round,i)=>['r'+i,round.label]as const)]),select(c,toolbar,base+'-team',t.team,[['',t.all],...node.teams.map((team,i)=>['t'+i,team.label]as const)]),select(c,toolbar,base+'-status',t.status,[['',t.all],...Object.entries(t.matchStatuses)])];
  const reset=e('button','iui-results-reset',t.reset);reset.type='button';toolbar.append(reset);
  const count=e('p','iui-results-count'),empty=e('p','iui-results-empty'),board=e('div','iui-tournament-board');count.setAttribute('role','status');board.tabIndex=0;board.setAttribute('role','region');board.setAttribute('aria-label',node.label+' · '+t.round);root.append(count,empty,board);
  const teamNames=new Map(node.teams.map(team=>[team.id,team.label])),matchNames=new Map(node.rounds.flatMap(round=>round.matches.map(match=>[match.id,match.label]as const)));
  const rounds=node.rounds.map((round,index)=>{
    const section=e('section','iui-tournament-round'),heading=e('h3','',round.label),list=e('ol','iui-tournament-matches');section.dataset.roundId=round.id;heading.id=base+'-round-title-'+index;section.setAttribute('aria-labelledby',heading.id);section.append(heading,list);if(!round.matches.length)section.append(e('p','',t.noRoundMatches));board.append(section);
    const matches=round.matches.map(match=>{
      const card=e('li','iui-tournament-match');card.dataset.matchId=match.id;card.append(e('h4','',match.label),e('p','',`${t.status}: ${t.matchStatuses[match.status]}`));const participants=e('ul','iui-tournament-participants'),names:string[]=[];
      for(const participant of match.participants){const name=participant.teamId===null?(participant.placeholder??t.unknown):(teamNames.get(participant.teamId)!+(participant.placeholder===undefined?'':` (${participant.placeholder})`));names.push(name);const item=e('li'),label=e('span','',name),score=e('strong','iui-results-number',participant.score??t.unknown);item.append(label,c.doc.createTextNode(': '),score);participants.append(item);}card.append(participants,e('p','iui-tournament-winner',`${t.winner}: ${match.winnerTeamId===null?t.unknown:teamNames.get(match.winnerTeamId)!}`));
      time(c,card,t.starts,match.startsAt);if(match.advancesTo!==undefined)card.append(e('p','iui-tournament-advance',`${t.advance}: ${matchNames.get(match.advancesTo)!}`));
      if(match.note!==undefined){const details=e('details');details.append(e('summary','',t.context),e('p','iui-results-text',match.note));card.append(details);}source(c,card,match.source,t);list.append(card);return{match,card,haystack:[match.label,...names].join(' ').toLowerCase()};
    });return{section,list,index,matches};
  });
  const total=node.rounds.reduce((sum,round)=>sum+round.matches.length,0);
  bind(c,root,filters,reset,(values,scope)=>{
    const alive=()=>scope.current();
    let shown=0;
    for(const round of rounds){if(!alive())return;const owned=()=>alive()&&board.parentElement===root&&round.section.parentElement===board&&round.list.parentElement===round.section;if(!owned())continue;let inRound=0;const roundMatches=!values[1]||values[1]==='r'+round.index,teamId=values[2]?node.teams[Number(values[2].slice(1))].id:null;
      for(const item of round.matches){if(!alive())return;if(!owned())break;if(item.card.parentElement!==round.list)continue;const visible=roundMatches&&(!teamId||item.match.participants.some(participant=>participant.teamId===teamId))&&(!values[3]||item.match.status===values[3])&&item.haystack.includes(values[0].toLowerCase());scope.during(()=>{item.card.hidden=!visible;});if(owned()&&item.card.parentElement===round.list&&visible){inRound++;shown++;}}
      if(owned())scope.during(()=>{round.section.hidden=inRound===0&&!(round.matches.length===0&&roundMatches&&!values[0]&&!values[2]&&!values[3]);});
    }
    // A synchronous host hook on hidden can move this node or retire this paint.
    if(alive()&&count.parentElement===root)scope.during(()=>{count.textContent=t.matchCount(shown,total);});if(alive()&&empty.parentElement===root){scope.during(()=>{empty.hidden=shown>0;});if(alive()&&empty.parentElement===root)scope.during(()=>{empty.textContent=node.rounds.length?t.noMatches:t.noRounds;});}
  });return root;
}

export function renderElectionResults(c:RendererContext,node:ElectionResultsNode,t:SuppliedResultsLabels):HTMLElement {
  const {root,base,local}=shell(c,node,t.electionNote,t,'iui-election-results');c=local;const e=c.element,toolbar=e('div','iui-results-toolbar');root.append(toolbar);
  const filters=[query(c,toolbar,base+'-search',t.searchCandidates),select(c,toolbar,base+'-contest',t.contest,node.contests.length?node.contests.map((contest,i)=>['c'+i,contest.label]as const):[['',t.noContests]],node.contests.length?'c0':''),select(c,toolbar,base+'-outcome',t.outcome,[['',t.all],...Object.entries(t.outcomes)]),select(c,toolbar,base+'-order',t.order,[['source',t.sourceOrder],['name',t.nameOrder],['votes',t.votesOrder],['voteShare',t.shareOrder]],'source')];
  const reset=e('button','iui-results-reset',t.reset);reset.type='button';toolbar.append(reset);
  const list=e('div','iui-election-contests');root.append(list);if(!node.contests.length)list.append(e('p','',t.noContests));
  const views=node.contests.map((contest,index)=>{
    const section=e('section','iui-election-contest'),heading=e('h3','',contest.label);section.dataset.contestId=contest.id;heading.id=base+'-contest-title-'+index;section.setAttribute('aria-labelledby',heading.id);section.append(heading,e('p','',`${t.status}: ${t.contestStatuses[contest.status]}`),e('p','iui-election-total',`${t.totalVotes}: ${contest.totalVotes??t.unknown}`));
    const reported=e('p','iui-election-reported',`${t.reported}: ${contest.reportedPercent===null?t.unknown:contest.reportedPercent+'%'}`);
    if(contest.reportedPercent!==null){const meter=e('meter');meter.min=0;meter.max=100;meter.value=contest.reportedPercent;meter.setAttribute('aria-label',contest.label+' · '+t.reported);meter.textContent=contest.reportedPercent+'%';reported.append(meter);}section.append(reported);
    time(c,section,t.observed,contest.observedAt);if(contest.note!==undefined)section.append(e('p','iui-results-text',contest.note));source(c,section,contest.source,t);
    const count=e('p','iui-results-count'),empty=e('p','iui-results-empty'),scroll=e('div','iui-election-table-scroll'),table=e('table'),caption=e('caption','',contest.label),head=e('thead'),header=e('tr'),body=e('tbody');count.setAttribute('role','status');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',contest.label+' · '+t.candidate);
    const heads=[t.candidate,t.party,t.votes,t.share,t.outcome,t.context].map(label=>{const th=e('th','',label);th.scope='col';header.append(th);return th;});head.append(header);table.append(caption,head,body);scroll.append(table);section.append(count,empty,scroll);list.append(section);
    const rows=contest.candidates.map((candidate,position)=>{
      const row=e('tr');row.dataset.candidateId=candidate.id;const name=e('th','',candidate.label);name.scope='row';row.append(name,e('td','',candidate.party??t.unknown),e('td','iui-results-number',candidate.votes??t.unknown),e('td','iui-results-number',candidate.voteShare===null?t.unknown:candidate.voteShare+'%'),e('td','iui-election-outcome',t.outcomes[candidate.outcome]));
      const context=e('td');if(candidate.note!==undefined||candidate.source){const details=e('details');details.append(e('summary','',t.context));if(candidate.note!==undefined)details.append(e('p','iui-results-text',candidate.note));source(c,details,candidate.source,t);context.append(details);}else context.textContent=t.noContext;row.append(context);body.append(row);return{candidate,position,row,haystack:[candidate.label,candidate.party??''].join(' ').toLowerCase()};
    });return{section,index,scroll,table,head,header,heads,body,count,empty,rows};
  });
  bind(c,root,filters,reset,(values,scope)=>{
    const alive=()=>scope.current();
    for(const view of views){
      if(!alive())return;const ownsSection=()=>alive()&&list.parentElement===root&&view.section.parentElement===list,ownsTable=()=>ownsSection()&&view.body.parentElement===view.table&&view.table.parentElement===view.scroll&&view.scroll.parentElement===view.section;if(!ownsSection())continue;scope.during(()=>{view.section.hidden=values[1]!=='c'+view.index;});
      if(!ownsTable())continue;
      const metric=values[3],sorted=[...view.rows].sort((a,b)=>{if(metric==='source')return a.position-b.position;if(metric==='name'){const x=a.candidate.label.toLowerCase(),y=b.candidate.label.toLowerCase();return(x<y?-1:x>y?1:0)||a.position-b.position;}const x=metric==='votes'?a.candidate.votes:a.candidate.voteShare,y=metric==='votes'?b.candidate.votes:b.candidate.voteShare;return(x===null?(y===null?0:1):y===null?-1:y-x)||a.position-b.position;});
      let shown=0,previous:HTMLElement|null=null;for(const item of sorted){if(!alive())return;if(!ownsTable())break;if(item.row.parentElement!==view.body)continue;scope.during(()=>{item.row.hidden=Boolean(values[2]&&item.candidate.outcome!==values[2])||!item.haystack.includes(values[0].toLowerCase());});if(!ownsTable()||item.row.parentElement!==view.body)continue;if(!item.row.hidden)shown++;const expected:Element|null=scope.during(()=>previous?previous.nextElementSibling:view.body.firstElementChild);if(!scope.during(ownsTable)||!scope.during(()=>item.row.parentElement===view.body))return;if(expected&&!scope.during(()=>expected.parentElement===view.body))return;if(expected!==item.row)scope.during(()=>view.body.insertBefore(item.row,expected));if(ownsTable()&&item.row.parentElement===view.body)previous=item.row;}
      view.heads.forEach((th,i)=>{if(!ownsTable()||th.parentElement!==view.header||view.header.parentElement!==view.head||view.head.parentElement!==view.table)return;const active=(metric==='name'&&i===0)||(metric==='votes'&&i===2)||(metric==='voteShare'&&i===3);if(active)scope.during(()=>th.setAttribute('aria-sort',metric==='name'?'ascending':'descending'));else scope.during(()=>th.removeAttribute('aria-sort'));});
      // Recheck the whole section chain between the two empty-state writes.
      if(ownsSection()&&view.count.parentElement===view.section)scope.during(()=>{view.count.textContent=t.candidateCount(shown,view.rows.length);});if(ownsSection()&&view.empty.parentElement===view.section){scope.during(()=>{view.empty.hidden=shown>0;});if(ownsSection()&&view.empty.parentElement===view.section)scope.during(()=>{view.empty.textContent=view.rows.length?t.noCandidateMatches:t.noCandidates;});}
    }
  });return root;
}
