import type{ConversationalOnboardingStudyNode}from'../schema/document.js';import type{Issue}from'./index.js';import{inspectLearning}from'./learning.js';
export function inspectStudyOnboarding(node:ConversationalOnboardingStudyNode,path:string,add:(issue:Issue)=>void):void{
 const text=(s:string|undefined,p:string)=>{if(s!==undefined&&!s.trim())add({code:'STUDY_TEXT',path:path+p,message:'Supply nonblank labels and questions.'});};text(node.label,'/label');for(const key of['visual','quiz','mathGraph']as const){text(node[key]?.label,'/'+key+'/label');text(node[key]?.question,'/'+key+'/question');}
 const ids=new Set<string>();node.visual?.orbits.forEach((orbit,i)=>{if(ids.has(orbit.id))add({code:'STUDY_ORBIT',path:path+'/visual/orbits/'+i+'/id',message:'Orbit IDs must be unique.'});ids.add(orbit.id);text(orbit.label,'/visual/orbits/'+i+'/label');});
 if(node.quiz)inspectLearning({type:'quiz',title:node.quiz.title,description:node.quiz.description,questions:node.quiz.questions},path+'/quiz',add);
 node.mathGraph?.data.forEach((point,i)=>{if(i&&point.x<=node.mathGraph!.data[i-1].x)add({code:'STUDY_GRAPH',path:path+'/mathGraph/data/'+i+'/x',message:'Supply strictly increasing x values; no sorting or interpolation is inferred.'});});
}
