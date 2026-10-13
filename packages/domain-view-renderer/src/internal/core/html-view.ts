/** Explicit reference resource roles. This is scriptable author content, never sanitized text. */
export const HTML_VIEW_SCRIPT_ORIGINS=Object.freeze(['https://cdn.jsdelivr.net','https://unpkg.com','https://esm.sh','https://cdn.skypack.dev','https://cdnjs.cloudflare.com','https://cdn.tailwindcss.com']);
export const HTML_VIEW_STYLE_ORIGINS=Object.freeze(['https://cdn.jsdelivr.net','https://unpkg.com','https://cdnjs.cloudflare.com','https://fonts.googleapis.com']);
export const HTML_VIEW_FONT_ORIGINS=Object.freeze(['https://fonts.gstatic.com','https://cdn.jsdelivr.net','https://cdnjs.cloudflare.com']);
export const HTML_VIEW_CONNECT_ORIGINS=Object.freeze(HTML_VIEW_SCRIPT_ORIGINS.filter(origin=>origin!=='https://cdn.tailwindcss.com'));
export const HTML_VIEW_POLICY=`default-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-src 'none'; script-src 'unsafe-inline' ${HTML_VIEW_SCRIPT_ORIGINS.join(' ')}; style-src 'unsafe-inline' ${HTML_VIEW_STYLE_ORIGINS.join(' ')}; img-src data: blob: https:; font-src data: ${HTML_VIEW_FONT_ORIGINS.join(' ')}; connect-src ${HTML_VIEW_CONNECT_ORIGINS.join(' ')}; media-src data: blob: https:; worker-src blob:`;
const attribute=(value:string)=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
/** Policy precedes every authored byte; later meta policies can only further restrict it. */
export function htmlViewDocument(html:string):string {
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${attribute(HTML_VIEW_POLICY)}"><meta name="referrer" content="no-referrer"></head><body>${html}</body></html>`;
}
