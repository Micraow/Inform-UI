import type * as z from 'zod/v4/core';

/**
 * Preserve tuple arity omitted by the pinned Zod 4.1.12 JSON Schema exporter.
 * This describes accepted JSON inputs. Child refinements still need the normal
 * semantic validation; this override never runs user-authored callbacks.
 */
export function preserveTupleInputArity({ zodSchema, jsonSchema }: {
  zodSchema: z.$ZodType;
  jsonSchema: Record<string, unknown>;
}): void {
  const def = zodSchema._zod.def;
  if (def.type !== 'tuple') return;
  const tuple = def as z.$ZodTupleDef;
  const items = tuple.items;
  // Draft 2020-12 disallows an empty prefixItems array.
  if (items.length === 0) delete jsonSchema.prefixItems;
  let minimum = 0;
  if (!tuple.rest) {
    // Mirror the pinned parser's optStart guard, including all-optional tuples.
    // Zod 4.1.12 requires their full length when there is no rest schema.
    const trailingOptional = [...items].reverse().findIndex(item => item._zod.optin !== 'optional');
    minimum = trailingOptional === -1 ? items.length : items.length - trailingOptional;
  } else {
    for (let index = 0; index < items.length; index++) {
      if (!allowsMissingInput(items[index])) minimum = index + 1;
    }
  }
  const currentMin = typeof jsonSchema.minItems === 'number' ? jsonSchema.minItems : 0;
  jsonSchema.minItems = Math.max(currentMin, minimum);
  if (!tuple.rest) {
    const currentMax = typeof jsonSchema.maxItems === 'number' ? jsonSchema.maxItems : items.length;
    jsonSchema.maxItems = Math.min(currentMax, items.length);
    // This helper is for the canonical draft-2020-12 export. Zod emits prefixItems.
    jsonSchema.items = false;
  }
  // A rest schema is already exported as items. Do not overwrite it or invent a maximum.
}

function allowsMissingInput(schema: z.$ZodType, seen = new Set<z.$ZodType>()): boolean {
  if (schema._zod.optin === 'optional') return true;
  if (seen.has(schema)) return false;
  const branchSeen = new Set(seen).add(schema);
  const def = schema._zod.def;
  if (def.type === 'any' || def.type === 'unknown' || def.type === 'catch') return true;
  if (def.type === 'nullable' || def.type === 'readonly') {
    return allowsMissingInput((def as z.$ZodNullableDef | z.$ZodReadonlyDef).innerType, branchSeen);
  }
  if (def.type === 'union') return (def as z.$ZodUnionDef).options.some(item => allowsMissingInput(item, branchSeen));
  if (def.type === 'intersection') {
    const both = def as z.$ZodIntersectionDef;
    return allowsMissingInput(both.left, branchSeen) && allowsMissingInput(both.right, branchSeen);
  }
  if (def.type === 'lazy') return allowsMissingInput((schema as z.$ZodLazy)._zod.innerType, branchSeen);
  return false;
}
