import {readFileSync} from 'node:fs';
const definitions=JSON.parse(readFileSync(new URL('../../async-image-definitions.json',import.meta.url),'utf8'));
const ownDefinitions=new Set(['AsyncImageGroupNode','AsyncImageNode']);
/** Keep the original JSON source and validate its historical shared-definition copies. */
export function install({defs,registerDefinedNode}) {
  for(const[name,value]of Object.entries(definitions)) {
    if(ownDefinitions.has(name))defs[name]=structuredClone(value);
    else if(JSON.stringify(defs[name])!==JSON.stringify(value))throw Error('Conflicting async image dependency: '+name);
  }
  // Definition order is group then single; wire union order is single then group.
  registerDefinedNode('AsyncImageNode','base');
  registerDefinedNode('AsyncImageGroupNode','base');
}
