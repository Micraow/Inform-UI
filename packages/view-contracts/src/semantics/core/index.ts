// Public Inform pure data helpers. The old document/state runtime is intentionally absent.
export interface Issue {code:string;path:string;message:string}
export type Scalar=string|number|boolean|null;
export function isSafeURL(value: string, kind: 'link' | 'image' = 'link'): boolean {
  if (!value || value.trim() !== value || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (kind === 'image' && /^data:image\/(?:png|jpeg|gif|webp);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i.test(value)) return value.split(',')[1].length > 0;
  if (kind === 'link' && /^#[A-Za-z0-9_.:-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    if (url.protocol === 'https:' || url.protocol === 'http:') return !!url.hostname;
    if (kind === 'link' && url.protocol === 'mailto:') return !!url.pathname && !/[?]/.test(value) && !/%0[ad]/i.test(value);
    if (kind === 'link' && url.protocol === 'tel:') return /^tel:\+?[0-9().-]+$/i.test(value);
    return false;
  } catch { return false; }
}

/** Inspector-only scalar lookup: no expression execution and no mutable store. */
export function evaluateValue(value:unknown,state:Readonly<Record<string,unknown>>={},computed:Readonly<Record<string,unknown>>={}):Scalar {
 if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===1&&'$'in value){const key=String(value.$);value=Object.hasOwn(state,key)?state[key]:computed[key];}
 if(value===null||typeof value==='string'||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value)))return value;
 throw Error('Domain data must contain already-evaluated scalars; use the OpenUI DSL runtime for expressions.');
}
