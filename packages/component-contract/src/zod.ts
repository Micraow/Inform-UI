import { z } from 'zod/v4';
/** Must execute before defining component schemas. Never depend on unsafe-eval. */
z.config({ jitless: true });
export { z };
