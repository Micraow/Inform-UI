import { createHash } from 'node:crypto';
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha256 = value => createHash('sha256').update(value).digest('hex');
/** Build-time only. Input is an already-closed profile with actual trusted renderer bindings. */
export function generateArtifacts(profile) {
  const schema = serialize(profile.schema), prompt = profile.prompt();
  const signature = Object.fromEntries(Object.entries(profile.componentRules).map(([name, rule]) => [name, { orderedProps: rule.orderedProps, childSlots: rule.childSlots, slots: rule.slots, bindingProps: rule.bindingProps, actionProps: rule.actionProps }]));
  const docs = ['# Inform UI component reference', '', `Profile: ${profile.id}`, `Root: ${profile.root}`, '', 'Generated from the same component definitions as the schema and prompt.', '', ...Object.values(profile.components).flatMap(def => [
    `## ${def.name}`, '', `Layer: ${def.layer}. Renderer: ${def.renderer.kind}/${def.renderer.key}.`, '', def.description, '', def.docs, '',
    `Parameter order: ${def.orderedProps.join(', ') || '(none)'}.`, '', ...def.limitations.map(limit => `- ${limit}`), '',
    ...def.examples.flatMap(example => [`### ${example.id}`, '', example.description, '', '```openui-lang', example.source, '```', '']),
  ]), '## Data constructors', '', ...Object.values(profile.data).flatMap(def => [`- ${def.name}(${def.orderedProps.join(', ')}): ${def.description}`]), ''].join('\n');
  const manifest = { ...profile.manifest(), schemaSha256: sha256(schema), promptSha256: sha256(prompt), signatureSha256: sha256(serialize(signature)), docsSha256: sha256(docs) };
  return Object.freeze({ 'schema.json': schema, 'prompt.txt': prompt, 'signatures.json': serialize(signature), 'component-reference.md': docs, 'manifest.json': serialize(manifest) });
}
