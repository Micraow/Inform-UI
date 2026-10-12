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
