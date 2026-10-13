/** Select a catalog closure for an editable example; strict runtime validation remains authoritative. */
export function selectShowcaseProfile(source, catalog) {
  const calls = new Set([...source.matchAll(/(?:^|[^\w$])([A-Z][A-Za-z0-9_]*)\s*\(/g)].map(match => match[1]));
  const select = new Set(['base/layout']);
  const views = new Set();
  for (const component of catalog.components) if (calls.has(component.name)) {
    select.add(component.moduleId);
    if (component.moduleId.startsWith('views/')) views.add(component.name);
  }
  for (const shape of catalog.dataShapes) if (calls.has(shape.name)) {
    select.add(shape.moduleId);
    if (shape.moduleId.startsWith('views/') && !catalog.components.some(c => c.moduleId === shape.moduleId && views.has(c.name))) {
      // A standalone data constructor still needs its actual owning module.
      for (const component of catalog.components) if (component.moduleId === shape.moduleId) views.add(component.name);
    }
  }
  return {select: [...select], viewNames: [...views]};
}
