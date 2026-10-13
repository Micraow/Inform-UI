/** Caller-supplied snapshots. No completion inference, account access or prompt execution. */
export type ChecklistIcon='info'|'check'|'warning'|'error'|'plus'|'minus'|'arrow-left'|'arrow-right'|'external-link'|'clock';
export interface ChecklistPrompt {id:string;label:string;promptText:string;summary?:string;icon?:ChecklistIcon;imageData?:string}
export interface ChecklistTask {id:string;title:string;prompts:ChecklistPrompt[];tryOwnPromptText:string;tryOwnLabel?:string}
export interface PromptChecklistData {
 title:string;mode:'full'|'compact';tasks:ChecklistTask[];completedTaskIds:string[];
 selectedTaskId?:string|null;completedItemsExpanded?:boolean;latestCompletedTaskId?:string;latestCompletedTaskTitle?:string;
 showCompletedItemsLabel:string;tryOwnLabel:string;
 completion:{headline:string;body:string;showCompletedItemsLabel:string};
}
export interface PromptChecklistLocal {mode?:'full'|'compact';selectedTaskId?:string|null;completedItemsExpanded?:boolean}
export interface PromptChecklistView {
 mode:'full'|'compact';selectedTaskId:string|null;completedItemsExpanded:boolean;
 finished:boolean;compact:boolean;fullReady:boolean;visibleTasks:readonly ChecklistTask[];olderCompletedTasks:readonly ChecklistTask[];
}
/** Literal reference mode predicates; empty snapshots never become completed states. */
export function promptChecklistView(data:PromptChecklistData,local:PromptChecklistLocal={}):PromptChecklistView {
 const mode=local.mode??data.mode,selectedTaskId=local.selectedTaskId===undefined?data.selectedTaskId??null:local.selectedTaskId;
 const completedItemsExpanded=local.completedItemsExpanded??data.completedItemsExpanded??false,completed=new Set(data.completedTaskIds);
 const finished=mode==='compact'&&data.tasks.length>0&&data.tasks.every(task=>completed.has(task.id));
 const compact=mode==='compact'&&!finished&&Boolean(data.latestCompletedTaskTitle||data.tasks.some(task=>task.id===data.latestCompletedTaskId));
 const fullReady=mode!=='compact'&&data.tasks.length>0;
 const visibleTasks=compact?data.tasks.filter(task=>!completed.has(task.id)||task.id===data.latestCompletedTaskId||completedItemsExpanded):fullReady?[...data.tasks]:[];
 return Object.freeze({mode,selectedTaskId,completedItemsExpanded,finished,compact,fullReady,visibleTasks:Object.freeze(visibleTasks),olderCompletedTasks:Object.freeze(data.tasks.filter(task=>completed.has(task.id)&&task.id!==data.latestCompletedTaskId))});
}
export type PromptChecklistAction={kind:'task';taskId:string}|{kind:'show-completed'}|{kind:'show-all'};
/** A task is never marked complete by expanding it or choosing a prompt. */
export function updatePromptChecklistLocal(data:PromptChecklistData,local:PromptChecklistLocal,action:PromptChecklistAction):PromptChecklistLocal {
 if(action.kind==='show-completed')return Object.freeze({...local,completedItemsExpanded:true});
 if(action.kind==='show-all')return Object.freeze({...local,mode:'full',selectedTaskId:null});
 const task=data.tasks.find(task=>task.id===action.taskId);if(!task?.prompts.length)return Object.freeze({...local});
 const view=promptChecklistView(data,local),selectedTaskId=view.compact?task.id:view.selectedTaskId===task.id?null:task.id;
 return Object.freeze({...local,mode:'full',selectedTaskId});
}
/** The original details surface shows at most three supplied choices, in source order. */
export function promptChecklistDetails(task:ChecklistTask){return Object.freeze({prompts:Object.freeze(task.prompts.slice(0,3)),hasIcons:task.prompts.some(p=>Boolean(p.icon)),hasImages:task.prompts.some(p=>Boolean(p.imageData))});}
export type PromptChecklistNode={type:'prompt-checklist';id?:string;label:string;fallback?:string;disabled?:boolean}&({status:'pending'|'failed';data?:never}|{status:'resolved';data:PromptChecklistData});
export interface PromptChecklistIssue {code:string;path:string;message:string}
export function inspectPromptChecklist(node:PromptChecklistNode,path:string,add:(issue:PromptChecklistIssue)=>void,safeURL:(url:string,kind?:'link'|'image')=>boolean):void {
 const text=(value:string,at:string)=>{if(!value.trim())add({code:'PROMPT_CHECKLIST_TEXT',path:at,message:'Supply nonblank text.'});};text(node.label,path+'/label');if(node.status!=='resolved')return;
 const data=node.data,ids=new Set<string>();text(data.title,path+'/data/title');
 data.tasks.forEach((task,i)=>{const at=path+'/data/tasks/'+i;if(ids.has(task.id))add({code:'DUPLICATE_ID',path:at+'/id',message:'Task IDs must be unique.'});ids.add(task.id);text(task.title,at+'/title');text(task.tryOwnPromptText,at+'/tryOwnPromptText');const promptIds=new Set<string>();task.prompts.forEach((prompt,j)=>{const pp=at+'/prompts/'+j;if(promptIds.has(prompt.id))add({code:'DUPLICATE_ID',path:pp+'/id',message:'Prompt IDs must be unique within a task.'});promptIds.add(prompt.id);text(prompt.label,pp+'/label');text(prompt.promptText,pp+'/promptText');if(prompt.imageData!==undefined&&(!/^data:/i.test(prompt.imageData)||!safeURL(prompt.imageData,'image')))add({code:'UNSAFE_URL',path:pp+'/imageData',message:'Supply inline raster image data.'});});});
}
/** Standard-web button background press scale; content is never scaled. */
export function promptChecklistPressScale(width:number):number {
 if(!Number.isFinite(width)||width<0)return .985;
 return width<=80?.96:width<=150?.97:width<=220?.98:width>600?.995:.985;
}
