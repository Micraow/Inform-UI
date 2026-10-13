/** Inform's audited name registry; no executable code or telemetry is imported. */
const names = new Set(['Count','First','Last','Sum','Avg','Min','Max','Sort','Filter','Round','Abs','Floor','Ceil','Each','Action','Set','Reset','Run','OpenUrl','ToAssistant']);
export const isBuiltin = (name: string): boolean => names.has(name);
