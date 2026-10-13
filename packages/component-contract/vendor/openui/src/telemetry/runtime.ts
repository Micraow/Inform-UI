/** Inform patch: telemetry is unconditionally disabled. See PATCHES.md. */
export function recordSystemPromptGeneration(..._args: unknown[]): void {}
export function prepareParserParseTelemetry(): undefined { return undefined; }
export function captureParserParseResult(..._args: unknown[]): void {}
export function captureParserParseException(..._args: unknown[]): void {}
