import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export const suppliedLinkProps={url:string(2048,1),title:short,status:choice('pending','resolved','failed'),fallback:short,disabled:bool,source:short,snippet:string(2000,1),faviconSrc:string(200000,1),imageSrc:string(200000,1),mobile:bool,hostLink:bool,copyLabel:short,loadImageLabel:short};
export function install({node,defs}) {
node('link', { value: ref('Value'), href: string(2048, 1) }, ['value', 'href']);
Object.assign(defs.LinkNode.properties,{...suppliedLinkProps,children:array(ref('Node'),0,32)});defs.LinkNode.required=['type'];defs.LinkNode.anyOf=[object(defs.LinkNode.properties,['value','href']),object(defs.LinkNode.properties,['url']),object({...defs.LinkNode.properties,status:choice('pending','failed')},['status'])];
node('favicon',{label:short,src:string(12000,1),fallback:string(2,1),size:choice('sm','md','lg')},['label']);
node('image', { src: string(500000, 1), alt: string(), aspectRatio: choice('1:1', '4:3', '16:9', '3:4'), fit: choice('cover', 'contain') }, ['src', 'alt']);
const layout = { gap: integer(0, 16), padding: integer(0, 16), radius: choice('none', 'sm', 'md', 'lg', 'xl', '2xl'), border: bool, background: choice('none', 'surface', 'surface-secondary', 'surface-tertiary', 'success-soft', 'danger-soft', 'info-soft'), align: choice('start', 'center', 'end', 'stretch'), justify: choice('start', 'center', 'end', 'between', 'around'), width: { anyOf: [integer(30, 1400), choice('100%', 'auto')] }, children };
for (const name of ['box', 'card', 'row', 'col', 'grid']) node(name, { ...layout, ...(name === 'grid' ? { columns: integer(1, 6), mobileColumns: integer(1, 6) } : {}) }, ['children']);
node('grid-item', { colSpan: integer(1, 6), rowSpan: integer(1, 20), mobileColSpan: integer(1, 6), children: array(ref('Node'), 1, 30) }, ['children']);
node('blockquote', { children: array(ref('Node'), 1, 30), attribution: string(500), cite: string(2048, 1) }, ['children']);
node('section', { heading: string(), children }, ['children']);
node('figure', { children, caption: string() }, ['children']);
node('details', { summary: short, children }, ['summary', 'children']);
node('tooltip', { label: short, value: string(2000), placement: choice('top', 'bottom') }, ['label', 'value']);
node('popover', { label: short, title: short, children: array(ref('Node'), 1, 20), placement: choice('top', 'bottom') }, ['label', 'children']);
node('flow', { children: array(ref('Node'), 1, 50), gap: choice('none','sm','md','lg'), align: choice('start','center','end'), justify: choice('start','center','end','between') }, ['children']);
node('icon', { name: choice('info','check','warning','error','plus','minus','arrow-left','arrow-right','external-link','clock'), size: choice('sm','md','lg'), tone: choice('default','muted','info','success','warning','danger'), label: short }, ['name']);
node('pulse-indicator', { label: short, status: choice('idle','busy','success','warning','error'), animate: bool }, ['label','status']);
node('loading', { label: short, progress: ref('Value'), size: choice('sm','md','lg'), showValue: bool }, ['label']);
node('loading-block', { label: short, shape: choice('text','card','circle'), lines: integer(1,10), animate: bool }, ['label']);
const { lines: _textOnlyLines, ...nonTextLoadingBlock } = defs.LoadingBlockNode.properties;
defs.LoadingBlockNode.oneOf = [
  object({ ...defs.LoadingBlockNode.properties, shape: { const: 'text' } }),
  object({ ...nonTextLoadingBlock, shape: choice('card','circle') }, ['shape'])
];
const sourceFields = { title: string(300,1), url: string(2048,1), publisher: string(200,1), description: string(1000,1) };
defs.SourceRecord = object(sourceFields, ['title','url']);
node('citation', { ...sourceFields, number: integer(1,999) }, ['title','url']);
node('web-link-cards', { label: short, items: array(ref('SourceRecord'),1,20) }, ['label','items']);
// Original supplied prompt suggestions: explicit DOM handoff, no generated/chat content.
defs.PromptSuggestion=object({id:key,text:string(2000,1)},['id','text']);
node('prompt-suggestions',{label:short,description:string(1000),items:array(ref('PromptSuggestion'),1,12),initialVisible:integer(1,12)},['label','items']);
// Original bounded previews; no automatic playback or arbitrary animation payloads.
node('animate', { label:short, children:array(ref('Node'),0,50), effect:choice('fade','rise'), duration:integer(100,1000), disabled:bool }, ['label','children']);
node('celebration', { label:short, message:string(1000,1), duration:integer(300,1800), disabled:bool }, ['label','message']);
node('carousel', { children, label: short, controls: bool }, ['children']);
node('tab-panel', { label: short, disabled: bool, children }, ['id','label','children']);
node('tab-group', { label: short, initial: short, children: array(ref('TabPanelNode'),1,20) }, ['label','children']);
node('list', { ordered: bool, items: array({ anyOf: [ref('Value'), ref('Node')] }, 0, 100) }, ['items']);
defs.TableCellObject = object({ value: ref('Value'), rowSpan: integer(1, 200), colSpan: integer(1, 20), header: bool, scope: choice('row', 'col', 'rowgroup'), align }, ['value']);
defs.TableCell = { anyOf: [ref('Value'), ref('TableCellObject')] };
defs.TableSection = object({ kind: choice('head', 'body', 'foot'), rows: array(array(ref('TableCell'), 0, 20), 0, 200) }, ['kind', 'rows']);
// Original supplied-data menu. All records are finite, local and strictly declarative.
defs.MenuItem = object({id:key,name:short,description:string(2000),price:{anyOf:[{type:'number',minimum:0},{type:'null'}]},tags:array(string(40,1),0,8),status:choice('available','unavailable')},['id','name','price']);
defs.MenuSection = object({id:key,title:short,items:array(ref('MenuItem'),0,40)},['id','title','items']);
node('restaurant-menu',{title:short,description:string(2000),currency:{type:'string',pattern:'^[A-Z]{3}$'},source:object({label:short,url:string(2048,1)},['label']),sections:array(ref('MenuSection'),0,20)},['title','currency','sections']);
node('table', { columns: array(short, 1, 20), rows: array(array(ref('TableCell'), 0, 20), 0, 200), sections: array(ref('TableSection'), 1, 12), caption: string(), status: choice('ready', 'loading', 'error'), message: string() }, ['columns']);
defs.TableNode.oneOf = [object(defs.TableNode.properties, ['rows']), object(defs.TableNode.properties, ['sections'])];
node('metric', { variant: choice('plain', 'card'), label: short, value: ref('Value'), unit: short, hint: string(), precision: integer(0, 6), color }, ['label', 'value']);
node('metric-grid', { children: array(ref('Node'), 1, 12), columns: integer(1, 4) }, ['children']);
node('steps', { items: array(object({ title: short, detail: string(), latex: string() }, ['title']), 1, 20) }, ['items']);
node('callout', { value: string(), tone: choice('neutral', 'info', 'caution') }, ['value']);
node('label', { text: short, target: short }, ['text', 'target']);
node('slider', { label: short, bind: short, min: number, max: number, step: { ...number, exclusiveMinimum: 0 }, unit: short, marks: array(object({ value: number, label: string() }, ['value', 'label']), 0, 30) }, ['label', 'bind', 'min', 'max', 'step']);
defs.ChecklistItem=object({id:key,label:short,bind:key,hint:string(1000),disabled:ref('Value')},['id','label','bind']);
node('checklist',{label:short,items:array(ref('ChecklistItem'),0,50),disabled:ref('Value'),filter:bool,bulk:bool,emptyText:string(1000)},['label','items']);
node('rating', { label: short, bind: key, max: integer(2, 10), disabled: ref('Value'), clearable: bool, hint: string(1000) }, ['label', 'bind']);
node('toggle', { label: short, bind: short }, ['label', 'bind']);
node('select', { label: short, bind: short, options: array(object({ value: { anyOf: [string(), number] }, label: short }, ['value', 'label']), 1, 40) }, ['label', 'bind', 'options']);

}
