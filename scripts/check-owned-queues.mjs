import ts from 'typescript';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const printer=ts.createPrinter({removeComments:true});
export const queueFingerprint=(node,file)=>createHash('sha256').update(printer.printNode(ts.EmitHint.Unspecified,node,file)).digest('hex');
const unwrap=value=>{while(value&&(ts.isParenthesizedExpression(value)||ts.isAsExpression(value)||ts.isNonNullExpression(value)||ts.isTypeAssertionExpression(value)))value=value.expression;return value;};
const declarations=symbol=>symbol?.declarations??[];
const nativeQueue=symbol=>declarations(symbol).some(d=>/[/\\](?:lib\.(?:dom|webworker)\.d\.ts|@types[/\\]node[/\\].*\.d\.ts)$/.test(d.getSourceFile().fileName)&&d.name?.getText()==='queueMicrotask');
function queuedArgument(call,checker){
 const globalOwner=node=>{node=unwrap(node);return ts.isIdentifier(node)&&['globalThis','window','self'].includes(node.text)&&!declarations(checker.getSymbolAtLocation(node)).some(d=>!d.getSourceFile().isDeclarationFile);};
 const isQueue=(node,seen=new Set())=>{
  node=unwrap(node);if(!node)return false;
  if(ts.isPropertyAccessExpression(node)&&nativeQueue(checker.getSymbolAtLocation(node.name)))return true;
  if(ts.isElementAccessExpression(node)&&ts.isStringLiteralLike(node.argumentExpression)&&node.argumentExpression.text==='queueMicrotask'&&nativeQueue(checker.getTypeAtLocation(node.expression).getProperty('queueMicrotask')))return true;
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='bind')return isQueue(node.expression.expression,seen);
  if(!ts.isIdentifier(node))return false;
  let symbol=checker.getSymbolAtLocation(node);if(symbol&&(symbol.flags&ts.SymbolFlags.Alias))symbol=checker.getAliasedSymbol(symbol);
  if(nativeQueue(symbol))return true;if(!symbol||seen.has(symbol))return false;seen.add(symbol);
  return declarations(symbol).some(d=>{
   if(ts.isVariableDeclaration(d)&&d.initializer)return isQueue(d.initializer,seen);
   if(ts.isBindingElement(d)&&ts.isObjectBindingPattern(d.parent)&&ts.isVariableDeclaration(d.parent.parent))return (d.propertyName??d.name).getText()==='queueMicrotask'&&globalOwner(d.parent.parent.initializer);
   return false;
  });
 };
 if(isQueue(call.expression))return {callback:call.arguments[0]};
 if(ts.isPropertyAccessExpression(call.expression)&&isQueue(call.expression.expression)){
  if(call.expression.name.text==='call')return {callback:call.arguments[1]};
  if(call.expression.name.text==='apply'){const args=unwrap(call.arguments[1]);return {callback:args&&ts.isArrayLiteralExpression(args)?args.elements[0]:undefined};}
 }
 return null;
}
function isGenerationGuard(expression,checker){
 expression=unwrap(expression);if(!expression||!ts.isCallExpression(expression))return false;
 const declaration=checker.getResolvedSignature(expression)?.declaration;
 return !!declaration&&declaration.name?.getText()==='guard'&&ts.isInterfaceDeclaration(declaration.parent)&&declaration.parent.name.text==='RenderGeneration'&&/[/\\]src[/\\]renderer[/\\]generation\.ts$/.test(declaration.getSourceFile().fileName);
}
export function inspectOwnedQueues({directory=root,overrides={},files,exceptions=[]}={}){
 directory=resolve(directory);const sourceRoot=resolve(directory,'src/renderer');
 const paths=files??readdirSync(sourceRoot,{recursive:true}).filter(name=>name.endsWith('.ts')&&!name.endsWith('.d.ts')).map(name=>'src/renderer/'+name);
 const selected=paths.filter(path=>path.replaceAll('\\','/').startsWith('src/renderer/')).map(path=>resolve(directory,path));
 const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,skipLibCheck:true};
 const host=ts.createCompilerHost(options),originalRead=host.readFile.bind(host),originalExists=host.fileExists.bind(host),virtual=new Map(Object.entries(overrides).map(([path,text])=>[resolve(directory,path),text]));
 host.readFile=path=>virtual.get(resolve(path))??originalRead(path);host.fileExists=path=>virtual.has(resolve(path))||originalExists(path);
 const program=ts.createProgram(selected,options,host),checker=program.getTypeChecker(),findings=[],sites=[],used=new Set();
 for(const filename of selected){const file=program.getSourceFile(filename);if(!file)throw new Error('Cannot parse renderer '+filename);const path=relative(directory,filename).replaceAll('\\','/');
  const visit=node=>{if(ts.isCallExpression(node)){const queued=queuedArgument(node,checker);if(queued){const fingerprint=queueFingerprint(node,file),point=file.getLineAndCharacterOfPosition(node.getStart(file)),site={path,line:point.line+1,column:point.character+1,fingerprint};sites.push(site);
    if(!isGenerationGuard(queued.callback,checker)){const exception=exceptions.find(x=>x.path===path&&x.fingerprint===fingerprint);if(exception){if(!exception.reason?.trim())throw new Error('Queue exception needs an explicit rationale');used.add(exception);}else findings.push({...site,message:'Deferred renderer callback must enter through RenderGeneration.guard; aliases and wrappers do not change this requirement.'});}
   }}ts.forEachChild(node,visit);};visit(file);
 }
 for(const item of exceptions)if(!used.has(item))findings.push({path:item.path,line:0,column:0,fingerprint:item.fingerprint,message:'Unused or changed queue exception must be reviewed rather than silently retained.'});
 return {files:selected.length,sites,findings};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const exceptions=JSON.parse(readFileSync(new URL('./owned-queue-exceptions.json',import.meta.url),'utf8')),result=inspectOwnedQueues({exceptions});
 for(const finding of result.findings)console.error(`${finding.path}:${finding.line}:${finding.column} ${finding.message} [${finding.fingerprint}]`);
 console.log(`Owned queue check: ${result.files} renderer files, ${result.sites.length} deferred sites, ${exceptions.length} exact exceptions, ${result.findings.length} violations.`);
 process.exitCode=result.findings.length?1:0;
}
