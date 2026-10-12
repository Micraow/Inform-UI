import {readFileSync} from 'node:fs';
const definitions=JSON.parse(readFileSync(new URL('../../learning-media-definitions.json',import.meta.url),'utf8'));
/** The original authored JSON remains the only maintained definition source. */
export function install({defs,registerDefinedNode}) {
  for(const[name,value]of Object.entries(definitions))defs[name]=structuredClone(value);
  for(const name of ["LearningAudioLabelCardNode", "LearningImageChoiceCardNode", "LearningImageLabelCardNode"])registerDefinedNode(name,'learning');
}
