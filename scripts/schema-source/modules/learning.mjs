import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
// Local learning components: supplied answers are teaching data, never secure exam secrets.
defs.QuizQuestion=object({id:key,kind:choice('single','multiple'),prompt:string(6000,1),latex:string(6000,1),choices:array(object({id:key,label:string(2000,1)},['id','label']),2,20),correct:array(key,1,20),explanation:string(6000),explanationLatex:string(6000,1),points:integer(1,100)},['id','kind','prompt','choices','correct','explanation']);
node('quiz',{title:short,description:string(),questions:array(ref('QuizQuestion'),0,100),status:choice('ready','loading','error'),message:string()},['title','questions'], 'learning');
defs.Flashcard=object({id:key,front:string(6000,1),back:string(6000,1),frontLatex:string(6000,1),backLatex:string(6000,1),hint:string(2000)},['id','front','back']);
node('flashcards',{title:short,description:string(),cards:array(ref('Flashcard'),0,100),status:choice('ready','loading','error'),message:string()},['title','cards'], 'learning');
// Original finite sentence-embedded fill-in practice. Answer data is public teaching material.
defs.FillBlankPart = { anyOf: [string(2000), object({blank:key}, ['blank'])] };
defs.FillBlankEntry = object({id:key,label:short,answers:array(string(200,1),1,8),hint:string(1000),explanation:string(2000)},['id','label','answers']);
node('fill-blank',{title:short,description:string(2000),parts:array(ref('FillBlankPart'),1,50),blanks:array(ref('FillBlankEntry'),1,12)},['title','parts','blanks'],'learning');
// Original finite local sentence-builder; answers are public authored teaching data.
defs.SentenceToken=object({id:key,text:short},['id','text']);
node('sentence-builder',{title:short,prompt:string(2000),tokens:array(ref('SentenceToken'),1,30),answer:array(key,1,30),joiner:choice(' ',''),explanation:string(2000)},['title','tokens','answer'], 'learning');
// Finite supplied vocabulary; no generated meaning or remote lookup.
defs.VocabSense=object({id:key,meaning:string(2000,1),translation:string(1000),examples:array(string(2000,1),0,5)},['id','meaning']);
node('vocab-card',{term:short,languageLabel:short,pronunciation:string(500,1),partOfSpeech:short,senses:array(ref('VocabSense'),1,10)},['term','senses'],'learning');

}
