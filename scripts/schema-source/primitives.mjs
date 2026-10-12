/** Shared source builders; definitions are installed separately. */
export const string = (maxLength = 12000, minLength) => ({ type: 'string', ...(minLength === undefined ? {} : { minLength }), maxLength });
export const short = string(200, 1);
export const number = { type: 'number' };
export const bool = { type: 'boolean' };
export const integer = (minimum, maximum) => ({ type: 'integer', minimum, maximum });
export const choice = (...values) => ({ enum: values });
export const array = (items, minItems = 0, maxItems = 500) => ({ type: 'array', items, minItems, maxItems });
export const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
export const ref = (name) => ({ $ref: `#/$defs/${name}` });
export const key = { type: 'string', pattern: '^[A-Za-z_][A-Za-z0-9_.-]{0,79}$' };
export const color = choice('default', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info', 'accent');
export const weight = choice('normal', 'medium', 'semibold', 'bold');
export const align = choice('start', 'center', 'end');
export const children = array(ref('Node'));
export const scalar = { anyOf: [string(), number, bool] };

export const nullableNumber = { anyOf: [number, { type: 'null' }] };
export const probability = { anyOf: [{ type: 'number', minimum: 0, maximum: 100 }, { type: 'null' }] };
export const condition = choice('clear', 'partly-cloudy', 'cloudy', 'rain', 'snow', 'storm', 'fog', 'unknown');
export const timestamp = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d{1,3})?)?(?:Z|[+-]\\d{2}:\\d{2})$', maxLength: 40 };
export const date = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };

export const agendaDate = { type:'string', pattern:'^(?!0000)\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$' };
export const agendaTime = { type:'string', pattern:'^(?:[01]\\d|2[0-3]):[0-5]\\d$' };

export const suppliedKey = {...key, pattern:'^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\\s\\S])'};
