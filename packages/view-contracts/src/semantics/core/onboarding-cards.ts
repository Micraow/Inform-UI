import type {Issue} from './index.js';
export interface OnboardingCardBase {id?:string;label:string;status?:'resolved'|'pending'|'failed';fallback?:string;disabled?:boolean;requestedLabel?:string;cancelledLabel?:string;emptyLabel?:string}
export interface OnboardingArtwork {imageSrc?:string;darkImageSrc?:string}
export interface OnboardingFeature extends OnboardingArtwork {id:string;featureId:string;title:string;description:string;artworkLabel?:string;tooltip?:string;disabled?:boolean}
export interface OnboardingBenefit {id:string;featureId?:string;title:string;description:string;symbol?:string;disabled?:boolean}
export interface OnboardingFeatureCard extends OnboardingCardBase {type:'onboarding-feature-card';title?:string;welcomeHeading?:string;welcomeBody?:string;features?:OnboardingFeature[];benefits?:OnboardingBenefit[];previousLabel?:string;nextLabel?:string}
export interface OnboardingPlugin extends OnboardingArtwork {id:string;label:string;description?:string;status:'available'|'connected'|'unavailable';statusLabel?:string;connectLabel?:string;disabled?:boolean}
export interface OnboardingPluginSuggestions extends OnboardingCardBase {type:'onboarding-plugin-suggestions';title?:string;plugins?:OnboardingPlugin[];canBrowse?:boolean;canConnect?:boolean;browseLabel?:string}
export interface OnboardingStarterTask extends OnboardingArtwork {id:string;label:string;description?:string;prompt?:string;starterPromptId?:string;requiresSitePreview?:boolean;completed?:boolean;disabled?:boolean;imageWidth?:number;symbol?:string}
export interface OnboardingStarterTasks extends OnboardingCardBase {type:'onboarding-starter-tasks';heading?:string;variant?:'pills'|'cards'|'selection';tasks?:OnboardingStarterTask[];selectedTaskId?:string;canRequestSitePreview?:boolean;actionLabel?:string;resetLabel?:string}
export type OnboardingCardsNode=OnboardingFeatureCard|OnboardingPluginSuggestions|OnboardingStarterTasks;
export interface OnboardingFeatureDetail {readonly id:string|null;readonly target:'feature'|'benefit';readonly itemId:string;readonly featureId:string;readonly intent:'open-feature'|'set-thinking-effort'|'open-image-composer';readonly tooltip?:string}
export interface OnboardingPluginDetail {readonly id:string|null;readonly intent:'browse'|'connect';readonly pluginId?:string;readonly position?:number}
export interface OnboardingTaskDetail {readonly id:string|null;readonly intent:'select'|'submit-prompt';readonly taskId:string;readonly prompt?:string;readonly starterPromptId?:string;readonly requiresSitePreview?:boolean}
export function inspectOnboardingCards(node:OnboardingCardsNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void {
 const issue=(at:string,message:string)=>add({code:'ONBOARDING_CARD_DATA',path:path+at,message});
 const text=(value:object,at:string)=>{for(const[key,item]of Object.entries(value))if(typeof item==='string'&&!item.trim())issue(at+'/'+key,'Supply nonblank text.');};
 text(node,'');
 const rows=(values:readonly object[]|undefined,at:string)=>{const ids=new Set<string>();values?.forEach((value,index)=>{const item=value as {id:string;imageSrc?:string;darkImageSrc?:string},p=at+'/'+index;text(value,p);if(ids.has(item.id))issue(p+'/id','IDs must be unique in the supplied list.');ids.add(item.id);for(const key of ['imageSrc','darkImageSrc'] as const)if(item[key]!==undefined&&!safe(item[key],'image'))issue(p+'/'+key,'Supply a safe image source.');});};
 if(node.type==='onboarding-feature-card'){rows(node.features,'/features');rows(node.benefits,'/benefits');}
 else if(node.type==='onboarding-plugin-suggestions'){rows(node.plugins,'/plugins');if(node.canBrowse&&!node.browseLabel?.trim())issue('/browseLabel','Browse capability needs an accessible label.');}
 else{
  rows(node.tasks,'/tasks');
  if(node.variant!=='selection'){
   if(node.selectedTaskId!==undefined)issue('/selectedTaskId','Selection belongs to the selection presentation.');
   node.tasks?.forEach((task,index)=>{if(!task.prompt?.trim())issue('/tasks/'+index+'/prompt','Prompt presentations need supplied prompt text.');});
  }else{
   if(node.selectedTaskId!==undefined&&!node.tasks?.some(task=>task.id===node.selectedTaskId))issue('/selectedTaskId','Selection must identify a supplied task.');
   node.tasks?.forEach((task,index)=>{if(task.requiresSitePreview||task.prompt!==undefined||task.starterPromptId!==undefined)issue('/tasks/'+index,'Selection cards do not submit prompt or preview payloads.');});
  }
 }
}
