import type {RendererContext} from './context.js';
import {renderOfficialIcon} from './official-icons.js';
/** Static UI symbols use the same canonical icon catalog. Authored content stays text. */
export function officialSymbol(c:RendererContext,className:string,name:string,size=20):HTMLSpanElement {const span=c.element('span',className);span.setAttribute('aria-hidden','true');span.append(renderOfficialIcon(c,name,{size}));return span;}
