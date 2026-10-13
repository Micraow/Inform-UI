/** Original bounded lexical aid, not a parser/validator. Never normalizes input. */
export type TokenKind = 'text'|'comment'|'string'|'number'|'keyword';
export interface CodeToken { kind:TokenKind; text:string }
type Language = 'js'|'ts'|'json'|'py';
const keywords:Record<Language,ReadonlySet<string>> = {
 js:new Set('async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while with yield'.split(' ')),
 ts:new Set('abstract any as async await boolean break case catch class const constructor continue declare default delete do else enum export extends false finally for from function if implements import in infer instanceof interface is keyof let namespace never new null number of private protected public readonly return static string super switch symbol this throw true try type typeof undefined unknown var void while yield'.split(' ')),
 json:new Set(['true','false','null']),
 py:new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '))
};
function languageOf(language?:string):Language|undefined {
 switch(language?.toLowerCase()) { case 'js':case 'javascript':return 'js';case 'ts':case 'typescript':return 'ts';case 'json':return 'json';case 'py':case 'python':return 'py';default:return undefined; }
}
const wordStart=(s:string)=>/[A-Za-z_$]/.test(s);
const wordPart=(s:string)=>/[A-Za-z0-9_$]/.test(s);
const digit=(s:string)=>s>='0'&&s<='9';
/** Each cursor advance is charged once. Fixed-size lookahead only; O(n) time/space.
 * Public generator limit: 12,000 Unicode code points (at most 24,000 UTF-16 units).
 * Out-of-contract larger strings fail open to exact plain text, without lexing.
 */
export function scanCode(value:string, language?:string):{tokens:CodeToken[];steps:number} {
 const lang=languageOf(language);
 if(!lang||value.length>24000) return {tokens:value?[{kind:'text',text:value}]:[],steps:0};
 const ranges:{kind:TokenKind;start:number;end:number}[]=[];
 let i=0,steps=0;
 const at=(offset=0)=>value[i+offset]??'';
 const advance=(n=1)=>{const count=Math.min(n,value.length-i);i+=count;steps+=count;};
 const emit=(kind:TokenKind,start:number)=>{const last=ranges.at(-1);if(last?.kind===kind)last.end=i;else ranges.push({kind,start,end:i});};
 while(i<value.length) {
  const start=i,ch=at();let kind:TokenKind='text';
  if((lang==='py'&&ch==='#')||((lang==='js'||lang==='ts')&&ch==='/'&&at(1)==='/')) {
   kind='comment';while(i<value.length&&at()!=='\r'&&at()!=='\n')advance();
  } else if((lang==='js'||lang==='ts')&&ch==='/'&&at(1)==='*') {
   kind='comment';advance(2);while(i<value.length&&!(at()==='*'&&at(1)==='/'))advance();if(i<value.length)advance(2);
  } else if(ch==='"'||(lang!=='json'&&ch==="'")||((lang==='js'||lang==='ts')&&ch==='`')) {
   kind='string';const triple=lang==='py'&&at(1)===ch&&at(2)===ch;advance(triple?3:1);
   while(i<value.length) {
    if(at()==='\\'){advance();if(i<value.length)advance();continue;}
    if(at()===ch&&(!triple||(at(1)===ch&&at(2)===ch))){advance(triple?3:1);break;}
    if(!triple&&ch!=='`'&&(at()==='\r'||at()==='\n'))break;
    advance();
   }
  } else if(digit(ch)) {
   kind='number';while(digit(at()))advance();
   if(at()==='.'&&digit(at(1))){advance();while(digit(at()))advance();}
   if((at()==='e'||at()==='E')&&(digit(at(1))||((at(1)==='+'||at(1)==='-')&&digit(at(2))))){advance();if(at()==='+'||at()==='-')advance();while(digit(at()))advance();}
  } else if(wordStart(ch)) {
   advance();while(i<value.length&&wordPart(at()))advance();
   if(keywords[lang].has(value.slice(start,i)))kind='keyword';
  } else advance();
  emit(kind,start);
 }
 return {tokens:ranges.map(({kind,start,end})=>({kind,text:value.slice(start,end)})),steps};
}
