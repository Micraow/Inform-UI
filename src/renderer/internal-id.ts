import type {RendererContext} from './context.js';

let standaloneSerial = 0;
/** Shared mount allocator, with a unique fallback for direct-renderer consumers. */
export function internalId(context: RendererContext, role: string): string {
  return context.allocateInternalId?.(role) ?? `iui-${role}-internal-${context.prefix}${++standaloneSerial}`;
}
