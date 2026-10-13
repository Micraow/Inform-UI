import React, { Component, Suspense, useId, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../vendor/openui/packages/react-ui/src/components/ThemeProvider/ThemeProvider';
import type { Theme } from '../vendor/openui/packages/react-ui/src/components/ThemeProvider/types';
import {themeTokens,spacing,radii,controlSizes,typography} from '@inform/foundation-tokens';
import type { RendererAdapter } from '../../component-contract/src/types';
export type ChartComponents=Readonly<Record<string,ComponentType<any>>>;
export type ChartProps={title:string;labels?:string[];series?:{name:string;values:(number|null)[]}[];slices?:{label:string;value:number}[];datasets?:{name:string;points:{x:number;y:number}[]}[];days?:{date:string;value:number}[];values?:number[];options?:Record<string,any>};
// The host Intelligent foundation is the only theme source. Upstream variables are an adapter ABI.
export function readChartTheme(el:HTMLElement):{theme:Theme;mode:'light'|'dark'}{
 const css=getComputedStyle(el);const mode=el.closest('[data-theme]')?.getAttribute('data-theme')==='dark'?'dark':'light';const base=themeTokens[mode];
 const read=(key:string,fallbackValue:string)=>css.getPropertyValue('--if-'+key).trim()||fallbackValue;
 const foreground=read('text',base.text),background=read('background',base.background),muted=read('muted',base.muted),border=read('border',base.border),surface=read('surface',base.surface),focus=read('focus',base.focus);
 const font=read('font',css.fontFamily||typography.family);const px=(n:number)=>n+'px';
 // Axis/legend labels are captions, not inherited body text. Both the SVG CSS
 // and upstream canvas measurement receive the same Intelligent font role.
 const text=(size:number,weight:number=typography.regular)=>weight+' '+px(size)+'/'+typography.lineHeight+' '+font;
 const caption=text(typography.caption),captionHeavy=text(typography.caption,typography.semibold),small=text(typography.small),body=text(typography.base);
 const palette=[base.chart1,base.chart2,base.chart3,base.chart4].map((value,i)=>read('chart-'+(i+1),value));
 return {mode,theme:{background,foreground:background,popoverBackground:background,textNeutralPrimary:foreground,textNeutralSecondary:muted,textNeutralTertiary:muted,borderDefault:border,borderInteractive:border,borderAccentEmphasis:focus,sunk:surface,sunkLight:surface,elevated:surface,elevatedLight:surface,interactiveAccentDefault:read('accent',base.accent),interactiveAccentHover:read('hover',base.hover),interactiveAccentPressed:read('pressed',base.pressed),borderInteractiveSelected:focus,defaultChartPalette:palette,barChartPalette:palette,lineChartPalette:palette,areaChartPalette:palette,pieChartPalette:palette,radarChartPalette:palette,radialChartPalette:palette,horizontalBarChartPalette:palette,fontBody:font,fontLabel:font,fontNumbers:font,fontHeading:font,textLabelSm:small,textLabelXs:caption,textLabelXsHeavy:captionHeavy,textLabelDefault:body,textBodyDefault:body,textBodySm:small,textLabelXsLetterSpacing:'normal',textLabelXsHeavyLetterSpacing:'normal',textLabelSmLetterSpacing:'normal',textBodyDefaultLetterSpacing:'normal',fontVariationRegular:'"wght" '+typography.regular,fontVariationMedium:'"wght" '+typography.semibold,space3xs:px(spacing.xs),space2xs:px(spacing.xs),spaceXs:px(spacing.sm),spaceS:px(spacing.md),spaceM:px(spacing.lg),spaceL:px(spacing.xl),radius2xs:px(radii.sm),radiusXs:px(radii.sm),radiusS:px(radii.sm),radiusM:px(radii.md),radiusL:px(radii.lg),shadowS:read('shadow',base.shadow)} as Theme};
}
const frameVars={'--if-chart-gap':spacing.md+'px','--if-chart-space-sm':spacing.sm+'px','--if-chart-space-md':spacing.md+'px','--if-chart-space-lg':spacing.lg+'px','--if-chart-radius':radii.md+'px','--if-chart-hit':controlSizes.hit+'px','--if-chart-control':controlSizes.md+'px'} as React.CSSProperties;
export function chartTable(p:ChartProps):{headers:string[];rows:(string|number|null)[][]}{
 if(p.series)return{headers:['Category',...p.series.map(s=>s.name)],rows:(p.labels??[]).map((label,i)=>[label,...p.series!.map(s=>s.values[i])])};
 if(p.slices)return{headers:['Label','Value'],rows:p.slices.map(s=>[s.label,s.value])};
 if(p.datasets)return{headers:['Dataset','X','Y'],rows:p.datasets.flatMap(s=>s.points.map(pt=>[s.name,pt.x,pt.y]))};
 if(p.days)return{headers:['Date','Value'],rows:p.days.map(d=>[d.date,d.value])};
 return{headers:['Position','Value'],rows:(p.values??[]).map((v,i)=>[i+1,v])};
}
export function toUpstreamProps(name:string,p:ChartProps):Record<string,unknown>{
 const {animate,patterns,...options}=p.options??{};const common={isAnimationActive:animate??false,...options};
 if(p.series){const data=(p.labels??[]).map((label,i)=>Object.fromEntries([['__if_label__',label],...p.series!.map(s=>[s.name,s.values[i]])]));return{height:280,condensed:true,...(name==='RadarChart'?{minChartSize:120}:{}),...common,data,categoryKey:'__if_label__',...(name==='HorizontalBarChart'?{orientation:'horizontal'}:{})};}
 if(p.slices)return{height:280,minChartSize:120,...common,data:p.slices.map(s=>({label:s.label,value:s.value})),categoryKey:'label',dataKey:'value'};
 if(p.datasets)return{height:280,...common,data:p.datasets.map(s=>({name:s.name,data:s.points}))};
 if(p.days)return{...common,data:p.days,...(patterns?{levelStyles:patterns.map((pattern:string|null)=>pattern?{pattern}:null)}:{})};
 return{size:160,...common,data:p.values??[]};
}
class ChartBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 render(){return this.state.failed?<p role="alert">This chart could not be rendered. The supplied values remain available below.</p>:this.props.children;}
}
function ChartFrame({name,component:Chart,p}:{name:string;component:ComponentType<any>;p:ChartProps}){
 const id='if-chart-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');const ref=useRef<HTMLElement>(null);const [theme,setTheme]=useState<ReturnType<typeof readChartTheme>|null>(null);
 useLayoutEffect(()=>{if(!ref.current)return;const el=ref.current;const update=()=>setTheme(readChartTheme(el));update();const observer=new MutationObserver(update);let ancestor:HTMLElement|null=el;while(ancestor){observer.observe(ancestor,{attributes:true,attributeFilter:['data-theme','style','class']});ancestor=ancestor.parentElement;}return()=>observer.disconnect();},[]);
 const table=chartTable(p);const empty=!table.rows.length||(p.series!==undefined&&!p.series.length);const zeroMagnitude=p.slices!==undefined&&p.slices.length>0&&p.slices.every(s=>s.value===0);
 return <figure ref={ref} className={`if-openui-chart ${id}`} style={frameVars} data-chart={name} aria-labelledby={id+'-title'}>
  <figcaption className="if-card-title" id={id+'-title'}>{p.title||name}</figcaption>
  {/* Mount only after resolving the host theme. Otherwise the first geometry
      pass can measure the provider's old default CSS before its update commits. */}
  {theme&&<ThemeProvider mode={theme.mode} lightTheme={theme.theme} darkTheme={theme.theme} cssSelector={'.'+id}>
   <div className="if-openui-chart-visual" aria-describedby={id+'-data'}>
    {empty?<p className="if-chart-empty" role="status">No data available</p>:zeroMagnitude?<p className="if-chart-empty" role="status">All values are zero</p>:<ChartBoundary><Suspense fallback={<p role="status">Loading chart…</p>}><Chart {...toUpstreamProps(name,p)}/></Suspense></ChartBoundary>}
   </div>
  </ThemeProvider>}
  <details id={id+'-data'} className="if-chart-data"><summary>View data: {p.title||name}</summary><div className="if-chart-data-scroll if-table-wrap"><table className="if-table"><caption>{p.title||name} · supplied values</caption><thead><tr>{table.headers.map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{table.rows.map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j}>{v===null?'No value':v}</td>)}</tr>)}</tbody></table></div></details>
 </figure>;
}
export function createChartAdapters(components:ChartComponents):Readonly<Record<string,RendererAdapter>>{
 return Object.freeze(Object.fromEntries(Object.entries(components).map(([name,component])=>[name,Object.freeze({kind:'dom' as const,key:'openui/'+name,create(props:Record<string,unknown>,context:any){const element=context.document.createElement('div');element.className='if-chart-mount';const root=createRoot(element);let disposed=false;root.render(<ChartFrame name={name} component={component} p={props as ChartProps}/>);let lastProps=JSON.stringify(props);return{element,update(next:Record<string,unknown>){if(disposed)return;const key=JSON.stringify(next);if(key===lastProps)return;lastProps=key;root.render(<ChartFrame name={name} component={component} p={next as ChartProps}/>);},dispose(){if(disposed)return;disposed=true;root.unmount();}};}})])));
}
