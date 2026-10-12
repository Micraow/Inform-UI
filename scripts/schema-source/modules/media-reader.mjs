import {readFileSync} from 'node:fs';
const definitions=JSON.parse(readFileSync(new URL('../../media-reader-definitions.json',import.meta.url),'utf8'));
/** Existing authored JSON remains the only definition source. Preserve definition and node order independently. */
export function install({defs,registerDefinedNode}){for(const[name,value]of Object.entries(definitions))defs[name]=structuredClone(value);for(const name of ["SearchImageNode", "YoutubeNode"])registerDefinedNode(name,'base');}
