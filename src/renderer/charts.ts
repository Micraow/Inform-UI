import type { Node,Value } from '../schema/document.js';
import { timestamp,chartXDomain } from '../core/extensions.js';
import type { RendererContext } from './context.js';
const colors=['blue','green','orange','red','purple','gray'] as const;
const palette={blue:'var(--iui-series-blue)',green:'var(--iui-series-green)',orange:'var(--iui-series-orange)',red:'var(--iui-series-red)',purple:'var(--iui-series-purple)',gray:'var(--iui-series-gray)'};
const shorten=(s:string)=>Array.from(s).length>12?Array.from(s).slice(0,11).join('')+'…':s;
/** Cartesian coordinates are calculated from data, while text formatting is presentation-only. */
export function renderChart(c:RendererContext,n:Extract<Node,{type:'chart'}>):HTMLElement {
  const {element:e,svg,on}=c,l=c.labels(),figure=e('figure','iui-chart');if(n.title)figure.append(e('figcaption','iui-chart-title',n.title));
  const controls=e('div','iui-chart-controls'),visible=n.series.map(()=>true),graphic=svg('svg',{role:'img','aria-label':n.title??l.chartData,tabindex:0});
  const state=e('p','iui-data-status'),readout=e('output','iui-chart-readout');readout.setAttribute('aria-live','polite');
  const details=e('details'),tableHost=e('div');details.append(e('summary','',l.viewChartData),tableHost);figure.append(state,graphic,controls,readout,details);if(n.note)figure.append(e('p','iui-caption',n.note));
  const scale=n.xScale??'category';let active=0;let xPositions:number[]=[];let width=640;
  const formatX=(raw:unknown,full=false)=>scale==='time'?new Intl.DateTimeFormat(l.axisValue==='横轴值'?'zh-CN':'en-US',{timeZone:n.timezone??'UTC',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,...(full?{year:'numeric',second:'2-digit',fractionalSecondDigits:3,timeZoneName:'longOffset'} as const:{})}).format(new Date(timestamp(raw))):c.display(raw);
  const summary=(i:number)=>{const row=n.data[i];if(!row)return '';return [formatX(c.value(row[n.xKey] as Value),true),...n.series.map(s=>`${s.label}: ${c.display(c.value(row[s.key] as Value)??l.missing)}${n.unit??''}`)].join(' · ');};
  const focusPoint=(i:number)=>{if(!n.data.length)return;active=Math.max(0,Math.min(n.data.length-1,i));readout.value=summary(active);for(const point of graphic.querySelectorAll('[data-point]'))point.classList.toggle('iui-point-active',Number(point.getAttribute('data-point'))===active);};
  on(graphic,'keydown',((ev:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(ev.key)){ev.preventDefault();focusPoint(ev.key==='Home'?0:ev.key==='End'?n.data.length-1:active+(ev.key==='ArrowRight'?1:-1));}}) as EventListener);
  on(graphic,'focus',()=>focusPoint(active));
  on(graphic,'pointermove',((ev:PointerEvent)=>{const box=graphic.getBoundingClientRect();if(!box.width||!xPositions.length)return;const at=(ev.clientX-box.left)/box.width*width;let near=0;xPositions.forEach((x,i)=>{if(Math.abs(x-at)<Math.abs(xPositions[near]-at))near=i;});focusPoint(near);}) as EventListener);
  const paint=()=>{
    graphic.replaceChildren();width=Math.max(290,figure.clientWidth||640);const height=240,pad={l:48,r:16,t:16,b:34},plotW=width-pad.l-pad.r,plotH=height-pad.t-pad.b;graphic.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const rows=n.data.map(row=>({x:c.value(row[n.xKey] as Value),ys:n.series.map(s=>c.value(row[s.key] as Value))}));const nums=rows.flatMap(r=>r.ys).filter((v):v is number=>typeof v==='number');
    const ready=(n.status??'ready')==='ready',empty=!nums.length||(n.kind==='donut'&&nums.every(v=>v===0));
    state.textContent=n.status==='loading'?n.message??l.loading:n.status==='error'?n.message??l.loadError:empty?n.message??l.empty:'';state.hidden=!state.textContent;state.dataset.state=n.status??(empty?'empty':'ready');state.setAttribute('role',n.status==='error'?'alert':'status');figure.setAttribute('aria-busy',String(n.status==='loading'));
    graphic.style.display=ready&&!empty?'block':'none';controls.hidden=!ready||empty;details.hidden=!ready;readout.hidden=!ready||empty;
    if(ready&&!empty){
      if(n.kind==='donut') {
        const total=nums.reduce((a,b)=>a+b,0),cx=width/2,cy=112,r=85,inner=54;let angle=-Math.PI/2;
        rows.forEach((row,i)=>{const v=row.ys[0];if(typeof v!=='number'||v<=0)return;const end=angle+v/total*Math.PI*2;const polar=(a:number,radius:number)=>`${cx+Math.cos(a)*radius} ${cy+Math.sin(a)*radius}`;const large=end-angle>Math.PI?1:0;
          const path=v===total?`M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx} ${cy+r} A ${r} ${r} 0 1 1 ${cx} ${cy-r} M ${cx} ${cy-inner} A ${inner} ${inner} 0 1 0 ${cx} ${cy+inner} A ${inner} ${inner} 0 1 0 ${cx} ${cy-inner}`:`M ${polar(angle,r)} A ${r} ${r} 0 ${large} 1 ${polar(end,r)} L ${polar(end,inner)} A ${inner} ${inner} 0 ${large} 0 ${polar(angle,inner)} Z`;
          const slice=svg('path',{d:path,fill:palette[colors[i%colors.length]],'fill-rule':'evenodd','data-point':i,'data-value':v,'data-share':v/total});const title=svg('title');title.textContent=`${c.display(row.x)}: ${c.display(v)} (${(v/total*100).toFixed(1)}%)`;slice.append(title);graphic.append(slice);angle=end;
        });const number=svg('text',{x:cx,y:cy,'text-anchor':'middle','font-size':24,'font-weight':600});number.textContent=c.display(total);const label=svg('text',{x:cx,y:cy+23,'text-anchor':'middle','font-size':12});label.textContent=l.total+(n.unit?` (${n.unit})`:'');graphic.append(number,label);xPositions=[];
      } else {
        const min=n.yMin??Math.min(0,...nums),max=n.yMax??Math.max(1,...nums),span=max-min||1,y=(v:number)=>pad.t+(1-(v-min)/span)*plotH;
        const xs=rows.map((row,i)=>scale==='category'?i:scale==='time'?timestamp(row.x):row.x as number);const [low,high]=chartXDomain(xs,n.xMin,n.xMax,scale==='time');
        const x=(i:number)=>scale==='category'?pad.l+(n.kind==='bar'?plotW*(i+.5)/rows.length:rows.length===1?plotW/2:i/(rows.length-1)*plotW):pad.l+(xs[i]-low)/(high-low)*plotW;
        xPositions=rows.map((_,i)=>x(i));figure.dataset.xScale=scale;figure.dataset.xMin=String(low);figure.dataset.xMax=String(high);
        for(let tick=0;tick<=4;tick++){const v=min+span*(tick/4),yy=y(v);graphic.append(svg('line',{x1:pad.l,x2:width-pad.r,y1:yy,y2:yy,stroke:'var(--iui-line)','stroke-dasharray':'3 4'}));const label=svg('text',{x:pad.l-8,y:yy+4,'text-anchor':'end','font-size':11});const step=span/4||Number.MIN_VALUE,precision=v===0?1:Math.max(1,Math.min(17,Math.floor(Math.log10(Math.abs(v)))-Math.floor(Math.log10(step))+2));label.textContent=c.display(Number(v.toPrecision(precision)));graphic.append(label);}
        const ticks=scale==='category'?rows.map((row,i)=>({x:x(i),label:formatX(row.x),i})).filter(t=>t.i%Math.max(1,Math.ceil(rows.length/(width<400?4:7)))===0||t.i===rows.length-1):Array.from({length:width<400?3:5},(_,i)=>{const tickCount=width<400?3:5,value=low+(high-low)*(i/(tickCount-1));return {x:pad.l+plotW*i/(tickCount-1),label:formatX(scale==='time'?value:Number(value.toPrecision(5))),i};});
        ticks.forEach((tick,i)=>{const label=svg('text',{x:tick.x,y:height-8,'text-anchor':i===0?'start':i===ticks.length-1?'end':'middle','font-size':11});label.textContent=shorten(tick.label);const tip=svg('title');tip.textContent=tick.label;label.append(tip);graphic.append(label);});
        const baseline=y(Math.max(min,Math.min(max,0)));const minimumDistance=xPositions.length>1?Math.min(...xPositions.slice(1).map((x,i)=>Math.abs(x-xPositions[i]))):plotW;
        for(const [s,series]of n.series.entries()) {
          if(!visible[s])continue;const group=svg('g',{'data-series':series.key}),color=palette[series.color??colors[s]],points:{x:number,y:number}[]=[];
          const flush=()=>{if(!points.length)return;const d=points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');if(n.kind==='area')group.prepend(svg('path',{d:`${d} L ${points.at(-1)!.x} ${baseline} L ${points[0].x} ${baseline} Z`,fill:color,'fill-opacity':.14,'data-area':'true'}));group.append(svg('path',{d,fill:'none',stroke:color,'stroke-width':2.25}));points.length=0;};
          rows.forEach((row,i)=>{const v=row.ys[s];if(typeof v!=='number'){flush();return;}const attrs={'data-point':i,'data-value':v,'data-x':String(row.x)};
            if(n.kind==='bar'){const groupWidth=scale==='category'?plotW/rows.length*.72:Math.min(28,minimumDistance*.72),bw=groupWidth/n.series.length;const rect=svg('rect',{...attrs,x:x(i)-groupWidth/2+s*bw,y:Math.min(baseline,y(v)),width:Math.max(.5,bw-2),height:Math.abs(y(v)-baseline),fill:color,rx:2});const title=svg('title');title.textContent=summary(i);rect.append(title);group.append(rect);}
            else{if(n.kind!=='scatter')points.push({x:x(i),y:y(v)});const dot=svg('circle',{...attrs,cx:x(i),cy:y(v),r:n.kind==='scatter'?4:3,fill:color});const title=svg('title');title.textContent=summary(i);dot.append(title);group.append(dot);}
          });flush();graphic.append(group);
        }
      }
    }
    const wrap=e('div','iui-table-wrap'),table=e('table'),head=e('thead'),tr=e('tr');table.setAttribute('aria-label',n.title?`${l.chartData}: ${n.title}`:l.chartData);
    for(const name of [n.xLabel??(n.kind==='bar'||n.kind==='donut'?l.category:l.axisValue),...n.series.map(s=>s.label+(n.unit?.trim()?` (${n.unit.trim()})`:''))]){const th=e('th','',name);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const tbody=e('tbody');
    for(const row of rows){const tr=e('tr');for(const [i,v]of [row.x,...row.ys].entries()){const td=e('td');c.showValue(td,v===null?l.missing:i===0&&scale==='time'?formatX(v,true):v);if(i===0&&scale==='time'){td.dataset.rawValue=String(v);td.title=String(v);}tr.append(td);}tbody.append(tr);}table.append(tbody);wrap.append(table);tableHost.replaceChildren(wrap);
    if(n.kind==='donut'){controls.replaceChildren();rows.forEach((row,i)=>{const label=e('span','iui-chart-key');const dot=e('span','iui-swatch');dot.style.background=palette[colors[i%colors.length]];label.append(dot,c.doc.createTextNode(`${c.display(row.x)}: ${c.display(row.ys[0]??l.missing)}`));controls.append(label);});}
    if(readout.value)focusPoint(active);
  };
  if(n.kind!=='donut')n.series.forEach((series,i)=>{const label=e('label'),checkbox=e('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.setAttribute('aria-label',`${l.show} ${series.label}`);const swatch=e('span','iui-swatch');swatch.style.background=palette[series.color??colors[i]];label.append(checkbox,swatch,c.doc.createTextNode(series.label));on(checkbox,'change',()=>{visible[i]=checkbox.checked;paint();});controls.append(label);});
  c.bind(paint);return figure;
}
