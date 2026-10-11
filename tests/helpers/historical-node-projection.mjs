import {readFileSync} from 'node:fs';
// Explicit reviewed registrations after the frozen130 source, not a dynamic allowlist.
const added=new Set(JSON.parse(readFileSync(new URL('./post130-node-refs.json',import.meta.url),'utf8')));
export const projectHistorical130=refs=>refs.filter(ref=>!added.has(ref.$ref));
