import {object,string,key,scalar,ref,array,choice} from './primitives.mjs';
/** One Document envelope shared by full and selected source builds. */
export function createDocumentSchema(defs){
return { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'urn:micraow:intelligent-ui:schema:iui:1', title: 'IUIDocument', description: 'The project-defined iui/1 wire contract. Semantic validation additionally enforces safe expressions, data and URLs. Native nodes are recognized but unsupported by the portable renderer.', ...object({ version: { const: 'iui/1' }, title: string(), description: string(), theme: choice('auto', 'light', 'dark'), state: { type: 'object', propertyNames: key, maxProperties: 80, additionalProperties: scalar }, computed: { type: 'object', propertyNames: key, maxProperties: 80, additionalProperties: ref('Value') }, body: array(ref('Node'), 1, 150) }, ['version', 'body']), $defs: defs };
}
