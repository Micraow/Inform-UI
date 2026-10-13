import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import ts from 'typescript';
import {gzipSync} from 'node:zlib';
import {jsxAttributeNames,validateIconDefinition} from '../src/icons/svg-policy.mjs';
const base = new URL('../src/icons/',import.meta.url);
export const PINNED_COMMIT = '0f00143c7a639906f1621fe58e1b6be7b5bea46d';
export const PINNED_LICENSE_BLOB = 'b8ac8dc0f960bbe0b0cc90cd06d58b672151773f';
export const gitBlob = bytes => createHash('sha1').update('blob '+Buffer.byteLength(bytes)+'\0').update(bytes).digest('hex');
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function reject(name,message) { throw new TypeError(`${name}: unsupported upstream TSX (${message})`); }
/** Parse only the pinned, static React wrapper. No eval, transpilation or React import. */
export function parseIconSource(source,name) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) reject(name,'name');
  const ast = ts.createSourceFile(name+'.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  if (ast.parseDiagnostics.length || ast.statements.length!==3) reject(name,'syntax or statements');
  const [imp,statement,exp] = ast.statements;
  if (!ts.isImportDeclaration(imp) || imp.moduleSpecifier.text!=='react' || !imp.importClause?.isTypeOnly || imp.importClause.getText(ast)!=='type { SVGProps }') reject(name,'type-only import');
  if (!ts.isVariableStatement(statement) || statement.declarationList.declarations.length!==1) reject(name,'declaration');
  const declaration=statement.declarationList.declarations[0],arrow=declaration.initializer;
  if (declaration.name.getText(ast)!==name || !arrow || !ts.isArrowFunction(arrow) || arrow.parameters.length!==1 || arrow.parameters[0].getText(ast)!=='props: SVGProps<SVGSVGElement>' || arrow.modifiers?.length) reject(name,'component');
  if (!ts.isExportAssignment(exp) || exp.isExportEquals || exp.expression.getText(ast)!==name) reject(name,'default export');
  let root=arrow.body;while(ts.isParenthesizedExpression(root))root=root.expression;
  if (!ts.isJsxElement(root) || root.openingElement.tagName.getText(ast)!=='svg') reject(name,'root');
  let spreads=0;
  const attributes=(node,isRoot=false)=> {
    const out=Object.create(null);
    for(const attr of node.attributes.properties) {
      if(ts.isJsxSpreadAttribute(attr)) { if(!isRoot || attr.expression.getText(ast)!=='props' || ++spreads>1)reject(name,'spread');continue; }
      if(!ts.isJsxAttribute(attr) || !ts.isIdentifier(attr.name))reject(name,'attribute');
      const key=jsxAttributeNames[attr.name.text]??attr.name.text;
      if(Object.hasOwn(out,key))reject(name,'duplicate attribute');
      const value=attr.initializer;
      if(value && ts.isStringLiteral(value))out[key]=value.text;
      else if(value && ts.isJsxExpression(value) && value.expression && ts.isNumericLiteral(value.expression))out[key]=String(Number(value.expression.text));
      else reject(name,'dynamic attribute '+key);
    }
    return out;
  };
  const children=node=>node.children.flatMap(child=> {
    if(ts.isJsxText(child)) {if(child.text.trim())reject(name,'text');return [];}
    if(ts.isJsxSelfClosingElement(child))return [[child.tagName.getText(ast),attributes(child)]];
    if(ts.isJsxElement(child)) {const tag=child.openingElement.tagName.getText(ast);if(child.closingElement.tagName.getText(ast)!==tag)reject(name,'closing tag');return [[tag,attributes(child.openingElement),children(child)]];}
    reject(name,'dynamic child');
  });
  const definition={name,attrs:attributes(root.openingElement,true),shapes:children(root)};
  if(spreads!==1)reject(name,'missing root spread');
  validateIconDefinition(definition);
  return definition;
}
export const categories = [
  ['arrows-navigation','Arrows and navigation'],['actions-editing','Actions and editing'],['status-feedback','Status and feedback'],['files-folders','Files and folders'],['communication','Communication'],['people-access','People and access'],['media-audio-video','Media, audio and video'],['layout-interface','Layout and interface'],['data-code','Data and code'],['time-planning','Time and planning'],['places-travel','Places and travel'],['commerce-work','Commerce and work'],['learning-health','Learning and health'],['appearance-nature','Appearance and nature'],['brands-products','Brands and products'],['general','General and miscellaneous']
].map(([id,label])=>({id,label}));
/** Inform UI browsing groups, inferred from official names; not upstream categories. */
export function categoryFor(name) {
  if (/^(Openai|Instagram|Inkedin|Jira|Linear$|Mcp$|Snapchat|Tiktok|Wechat|Whatsapp|Youtube|Zendesk|Sora|ExploreSora)/.test(name))return 'brands-products';
  if (/^(Arrow|Chevron|Caret|Back(?:Large|Small|ToApp)|DoubleChevron|ExternalLink|Forward$|Enter|Exit|Go(?:Filled)?$|Home|Minimize|OpenLeft|OpenRight)/.test(name))return 'arrows-navigation';
  if (/^(File|Folder|Document|PageBlank|Archive|Unarchive|Cabinet|Paperclip|UploadDocument|PastedText|Storage)/.test(name))return 'files-folders';
  if (/^(Play|Pause|Stop|Record|Rewind|Back\d|Forward\d|Skip|Shuffle|Loop|Sound|Voice|Video|Image|Camera|Mic|Music|Caption|Clapping|Speech|Speak|Whisper|Headphone|Screen|Resolution|AspectRatio|Thumbnail|Storyboard|Blend|Download.*(?:Gif|Video)|TextToSpeech|PictureInPicture|Scissor|Remix|Variation|Upscale|Inpaint)/.test(name))return 'media-audio-video';
  if (/^(User|Member|Group|Avatar|Profile|Identity|Lock|Key|Shield|Privacy|ParentControl|ApiKey|Logout|NoTraining|MyGpt)/.test(name))return 'people-access';
  if (/^(Chat|Comment|Forum|Reply|Quote|Mail|Email|AtSign|Phone|Notification|Bell|Messaging|ShareChat|Followup)/.test(name))return 'communication';
  if (/^(Clock|Calendar|Timer|Stopwatch|History|ManageHistory|Tasks|Sleep)/.test(name))return 'time-planning';
  if (/^(Map|Globe|Earth|Plane|Compass|Location|LocalService|Dining)/.test(name))return 'places-travel';
  if (/^(Dollar|Credit|Paid|Bills|Invoice|Card$|Shopping|ProductTag|Subscription|Business|Building|Workspace|Suitcase|Upgrade|BalancingScale|Scales|Order|Pro.*Diamond)/.test(name))return 'commerce-work';
  if (/^(Book|Notebook|Notepad|Education|Graduate|Graduation|Reading|Health|Stethoscope|Pulse|Dumbbell|Kettlebell|Brain|Flask|Lab$|Atom|Certificate|Spelling|Translate|Language)/.test(name))return 'learning-health';
  if (/^(Check|XCircle|XSquare|Error|Info|Warning|TriangleExclamation|Exclamation|Help|Question|CircleQuestion|Complete|Status|Star|StartStroke|Heart|Love|Thumb|Confetti|FeaturedWreath|Wreath|Trophy|Lifesaver|Simple)/.test(name))return 'status-feedback';
  if (/^(BarChart|Chart|Analytics|Analyze|Data|Code|SquareCode|Terminal|Branch|Commit|PullRequest|Function|Boolean|Array|Enum|Number|Object|String|Nodes|Batch|FineTuning|Latency|Speed|Usage|Trending|Marker|Table|Bug)/.test(name))return 'data-code';
  if (/^(Layout|Sidebar|Menu|Hamburger|Grid|Widget|Window|Desktop|Mobile|Dock|Collapse|Expand|Square|Circle|EmptyCircle|Radio|Dot|Category|Compare|PictureInPicture|PopOut|PinWindow)/.test(name))return 'layout-interface';
  if (/^(Dark|LightMode|ColorTheme|Moon|Sun|SystemMode|Snow|Frozen|Plant|Paw|Lotus|Astronout|Snorkle|TBone|Hand|FistBump|Whisk)/.test(name))return 'appearance-nature';
  if (/^(Add|Plus|Minus|X$|XX|XCrossed|Close|Clear|Delete|Trash|Remove|Restore|Edit|Write|Writing|Pencil|Pens|Compose|Copy|Clipboard|Download|Upload|Share|Link|Unlink|Pin|Unpin|Saved|Search|Magnifying|Filter|Settings|Tools|Tool|Customize|Cursor|Click|Tap|Select|Text|Sparkle|Regenerate|Reload|Undo|Resend|Reset|Shortcuts|Keyboard|Connect|Auto|Generate|Suggest|Cleanup|Clip$)/.test(name))return 'actions-editing';
  return 'general';
}
export async function generateIconCatalog({check=false}={}) {
  const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
  if(manifest.commit!==PINNED_COMMIT || manifest.iconCount!==755 || manifest.icons.length!==755 || manifest.repository!=='https://github.com/openai/apps-sdk-ui')throw Error('Pinned catalog identity differs');
  const license=await readFile(new URL('LICENSE',base),'utf8');
  if(gitBlob(license)!==PINNED_LICENSE_BLOB || manifest.license.gitBlobSha!==PINNED_LICENSE_BLOB || sha256(license)!==manifest.license.sha256)throw Error('Official MIT license differs');
  const upstreamNames=(await readdir(new URL('upstream/',base))).sort();
  if(JSON.stringify(upstreamNames)!==JSON.stringify(manifest.icons.map(icon=>icon.name+'.tsx.txt').sort()))throw Error('Missing or surplus upstream sources');
  const aliasConfig=JSON.parse(await readFile(new URL('aliases.json',base),'utf8'));
  const names=new Set(manifest.icons.map(icon=>icon.name)),seenAliases=new Set();
  if(names.size!==755)throw Error('Duplicate canonical names');
  for(const entry of aliasConfig.aliases) {
    if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.alias) || names.has(entry.alias) || seenAliases.has(entry.alias) || !names.has(entry.name) || !entry.purpose?.trim())throw Error('Invalid semantic alias '+entry.alias);
    seenAliases.add(entry.alias);
  }
  const outputs=new Map(),definitions=[];
  const banner='/*!\nOpenAI Apps SDK UI icons; pinned commit '+PINNED_COMMIT+'.\n'+license.trimEnd()+'\n*/\n';
  for(const icon of manifest.icons) {
    if(icon.path!=='src/components/Icon/svg/'+icon.name+'.tsx')throw Error('Source path differs: '+icon.name);
    const source=await readFile(new URL('upstream/'+icon.name+'.tsx.txt',base),'utf8');
    if(gitBlob(source)!==icon.gitBlobSha || sha256(source)!==icon.sha256 || Buffer.byteLength(source)!==icon.bytes)throw Error('Source hash differs: '+icon.name);
    const definition=parseIconSource(source,icon.name);definitions.push(definition);
    outputs.set('definitions/'+icon.name+'.ts',banner+"import type { IconDefinition } from '../types.js';\n/** Generated by scripts/build-icon-catalog.mjs. */\nexport const "+icon.name+' = '+JSON.stringify(definition)+' as const satisfies IconDefinition;\nexport default '+icon.name+';\n');
  }
  const aliases=Object.fromEntries(aliasConfig.aliases.map(({alias,name})=>[alias,name]));
  outputs.set('names.ts','/** Generated stable official names and Inform UI aliases. */\nexport type IconName = '+manifest.icons.map(i=>JSON.stringify(i.name)).join(' | ')+';\nexport type IconAlias = '+[...seenAliases].map(a=>JSON.stringify(a)).join(' | ')+';\nexport type IconCategory = '+categories.map(c=>JSON.stringify(c.id)).join(' | ')+';\n');
  outputs.set('all.ts',"/** Explicit full registry. For lean bundles, import a single icons/<Name> definition instead. */\nimport type { IconDefinition } from './types.js';\nimport type { IconName, IconAlias } from './names.js';\n"+manifest.icons.map(({name})=>`import ${name} from './definitions/${name}.js';`).join('\n')+'\nexport const icons: Readonly<Record<IconName, IconDefinition>> = Object.freeze({'+manifest.icons.map(i=>i.name).join(',')+'});\nexport const iconNames: readonly IconName[] = Object.freeze(Object.keys(icons) as IconName[]);\nexport const iconAliases: Readonly<Record<IconAlias, IconName>> = Object.freeze('+JSON.stringify(aliases)+');\n/** Resolve only exact canonical names or documented semantic aliases; never fetch URLs. */\nexport function getIcon(name: string): IconDefinition {\n  if (typeof name !== "string") throw new TypeError("Unknown icon name");\n  if (Object.hasOwn(icons,name)) return icons[name as IconName];\n  if (Object.hasOwn(iconAliases,name)) return icons[iconAliases[name as IconAlias]];\n  throw new TypeError("Unknown icon name: " + name.slice(0,100));\n}\nexport function isIconName(name: string): name is IconName { return typeof name === "string" && Object.hasOwn(icons,name); }\n');
  const catalog={schemaVersion:1,repository:manifest.repository,commit:manifest.commit,license:'MIT',iconCount:definitions.length,canonicalNames:'Exact upstream component exports, case-sensitive; upstream spelling is preserved.',categoriesOrigin:'Inform UI browsing categories inferred from official names, not upstream metadata.',categories:categories.map(category=>({...category,count:manifest.icons.filter(icon=>categoryFor(icon.name)===category.id).length})),aliasesOrigin:aliasConfig.description,aliases:aliasConfig.aliases,icons:manifest.icons.map((icon,index)=>({name:icon.name,category:categoryFor(icon.name),aliases:aliasConfig.aliases.filter(alias=>alias.name===icon.name).map(alias=>alias.alias),keywords:icon.name.replace(/([a-z0-9])([A-Z])/g,'$1 $2').toLowerCase().split(' '),viewBox:definitions[index].attrs.viewBox,importSubpath:'@micraow/inform-ui/icons/'+icon.name,source:{path:icon.path,url:manifest.repository+'/blob/'+manifest.commit+'/'+icon.path,gitBlobSha:icon.gitBlobSha,sha256:icon.sha256}}))};
  outputs.set('catalog.json',JSON.stringify(catalog,null,2)+'\n');
  if(check) {
    const actual=(await readdir(new URL('definitions/',base))).sort(),expected=manifest.icons.map(i=>i.name+'.ts').sort();
    if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Missing or surplus generated icon modules');
  } else await mkdir(new URL('definitions/',base),{recursive:true});
  for(const [file,content]of outputs) { if(check) {if(await readFile(new URL(file,base),'utf8')!==content)throw Error('Stale icon output: '+file);} else await writeFile(new URL(file,base),content); }
  return {iconCount:definitions.length,aliasCount:seenAliases.size,definitions,catalog};
}
/** Reproducible minified public entry measurements, including the retained MIT notice. */
export async function measureIconBundles() {
  const {build,version}=await import('esbuild');
  const resolveDir=fileURLToPath(new URL('../',import.meta.url));
  const samples=[['runtime-api',"export {createIcon} from './src/icons/index.ts';"],['single-check-definition',"export {default as Check} from './src/icons/definitions/Check.ts';"],['single-check-with-runtime',"export {createIcon} from './src/icons/index.ts';export {default as Check} from './src/icons/definitions/Check.ts';"],['all-definitions-registry',"export * from './src/icons/all.ts';"],['all-definitions-with-runtime',"export * from './src/icons/all.ts';export {createIcon} from './src/icons/index.ts';"]];
  const bundles=[];
  for(const [name,contents]of samples) {
    const bundle=await build({stdin:{contents,resolveDir},bundle:true,minify:true,write:false,format:'esm',target:'es2022',legalComments:'eof',metafile:true});
    const bytes=bundle.outputFiles[0].contents;
    bundles.push({name,rawBytes:bytes.length,gzipBytes:gzipSync(bytes).length,definitionModules:Object.keys(bundle.metafile.inputs).filter(p=>p.includes('icons/definitions/')).length});
  }
  const readAll=async directory=>Promise.all((await readdir(new URL(directory,base))).sort().map(file=>readFile(new URL(directory+'/'+file,base))));
  const generated=await readAll('definitions'),sources=await readAll('upstream'),catalog=await readFile(new URL('catalog.json',base));
  const report={commit:PINNED_COMMIT,iconCount:755,tool:{esbuild:version,target:'es2022',format:'esm',minify:true,legalComments:'eof',gzip:'node:zlib gzipSync default level'},scope:'Self-contained public ESM bundles, retaining the MIT license; excludes raw source snapshots and catalog JSON.',bundles,sourceStorage:{upstreamTsxBytes:sources.reduce((n,b)=>n+b.length,0),adaptedTsModulesBytes:generated.reduce((n,b)=>n+b.length,0)},catalog:{rawBytes:catalog.length,gzipBytes:gzipSync(catalog).length}};
  await writeFile(new URL('bundle-sizes.json',base),JSON.stringify(report,null,2)+'\n');
  return report;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await generateIconCatalog({check:process.argv.includes('--check')});
  if(process.argv.includes('--measure')) console.log(JSON.stringify(await measureIconBundles(),null,2));
  console.log(`${process.argv.includes('--check')?'Verified':'Generated'} ${result.iconCount} official icons and ${result.aliasCount} semantic aliases.`);
}
