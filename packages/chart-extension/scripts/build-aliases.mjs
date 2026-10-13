import path from 'node:path';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export const iconRoot=process.env.INFORM_ICON_ROOT??path.join(root,'src/icons/definitions');
export const foundationTokensPath=process.env.INFORM_FOUNDATION_TOKENS??path.join(root,'src/v2/foundation/tokens.ts');
export const iconAliases=Object.fromEntries(['ChevronDown','ChevronUp','ChevronLeft','ChevronRight'].map(name=>['@inform/official-icons/'+name,path.join(iconRoot,name+'.ts')]));
iconAliases['@inform/foundation-tokens']=foundationTokensPath;
