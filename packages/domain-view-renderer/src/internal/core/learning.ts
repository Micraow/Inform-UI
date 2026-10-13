import type {Node} from '../schema/document.js';
import type {Issue} from './index.js';
export type LearningNode=Extract<Node,{type:'quiz'|'flashcards'}>;
export function isLearning(n:Node):n is LearningNode{return n.type==='quiz'||n.type==='flashcards';}
export function inspectLearning(n:LearningNode,path:string,add:(issue:Issue)=>void){
 const error=(code:string,p:string,message:string)=>add({code,path:path+p,message});
 const ids=new Set<string>();
 if(n.type==='quiz')n.questions.forEach((q,i)=>{
  const p=`/questions/${i}`;if(ids.has(q.id))error('LEARNING_ID',p+'/id','Question ids must be unique.');ids.add(q.id);
  const choices=new Set<string>();q.choices.forEach((v,j)=>{if(choices.has(v.id))error('LEARNING_ID',p+`/choices/${j}/id`,'Choice ids must be unique within a question.');choices.add(v.id);});
  if(new Set(q.correct).size!==q.correct.length)error('QUIZ_ANSWER',p+'/correct','Correct answer ids must not repeat.');
  q.correct.forEach((id,j)=>{if(!choices.has(id))error('QUIZ_ANSWER',p+`/correct/${j}`,'Each correct answer must reference a supplied choice.');});
  if(q.kind==='single'&&q.correct.length!==1)error('QUIZ_ANSWER',p+'/correct','Single-choice questions have exactly one correct answer.');
 });else n.cards.forEach((card,i)=>{if(ids.has(card.id))error('LEARNING_ID',`/cards/${i}/id`,'Flashcard ids must be unique.');ids.add(card.id);});
}
