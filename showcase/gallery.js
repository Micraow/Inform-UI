import { mount, validateDocument } from './runtime/iui.min.js';
import { pages } from './gallery-data.js';
const collection=document.getElementById('collection'),controllers=[];
const element=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
let timer;
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{el.hidden=true;},3200);}
const query=new URLSearchParams(location.search);if(query.has('capture'))document.documentElement.classList.add('capture');
try {
for (const [pageIndex,data] of pages.entries()) {
 const page=element('section',undefined,'page');page.id=data.id;page.dataset.color=data.color;page.setAttribute('aria-label',data.title.replace('\n',' '));
 const header=element('div',undefined,'page-head');header.append(element('span','INFORM UI  /  '+data.eyebrow),element('span','ORIGINAL COMPOSITIONS · LIVE RUNTIME'));
 const masonry=element('div',undefined,'masonry');
 for(const [index,samples] of data.columns.entries()) {
  const column=element('div',undefined,'column');
  if(index===0){const intro=element('div',undefined,'intro');intro.append(element('h1',data.title),element('p',data.description),element('span','iui/1  ·  OPEN SOURCE','format'));column.append(intro);}
  for(const sample of samples){const tile=element('article',undefined,`tile ${sample.tone}`);tile.dataset.sample=sample.id;const label=element('div',undefined,'tile-label');label.append(element('span',sample.label));const download=element('a','↓');download.href='#';download.setAttribute('aria-label',`Download ${sample.label} JSON`);download.addEventListener('click',event=>{event.preventDefault();const url=URL.createObjectURL(new Blob([JSON.stringify(sample.document,null,2)+'\n'],{type:'application/json'}));const a=element('a');a.href=url;a.download=`${sample.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});label.append(download);const host=element('div',undefined,'tile-host');host.lang='en';const result=validateDocument(sample.document);if(!result.ok)throw Error(`${sample.id}: ${JSON.stringify(result.issues)}`);tile.append(label,host);column.append(tile);controllers.push(mount(host,sample.document));tile.dataset.status='mounted';}
  masonry.append(column);
 }
 const foot=element('div',undefined,'page-foot');foot.append(element('span','Rendered by Inform UI · Original, fictional sample data · Local interactions only'),element('strong',`${String(pageIndex+1).padStart(2,'0')} / 03   →`));page.append(header,masonry,foot);collection.append(page);
}
function select(){const id=location.hash.slice(1)||'create';const target=pages.some(p=>p.id===id)?id:'create';collection.scrollTo({left:document.getElementById(target).offsetLeft,behavior:'instant'});document.querySelectorAll('.navigation nav a').forEach(a=>a.toggleAttribute('aria-current',a.hash===`#${target}`));document.querySelector(`.navigation nav a[href="#${target}"]`)?.setAttribute('aria-current','page');}
window.addEventListener('hashchange',select);window.addEventListener('resize',select);select();
collection.addEventListener('click',event=>{const link=event.target.closest('.tile-host a[href]');if(link){event.preventDefault();event.stopPropagation();toast('Sample links stay in this gallery.');}},true);
window.addEventListener('pagehide',()=>controllers.forEach(c=>c.dispose()));document.documentElement.dataset.ready='true';
} catch(error){const el=document.getElementById('error');el.textContent=`The gallery could not render: ${error.message}`;el.hidden=false;document.documentElement.dataset.ready='error';}
