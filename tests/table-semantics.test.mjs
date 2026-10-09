import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDocument, evaluateState } from '../dist/index.js';

const spec = table => ({ version: 'iui/1', state: { amount: 0 }, body: [{ type: 'table', columns: ['Name', 'A', 'B'], ...table }] });
const accepted = table => assert.equal(validateDocument(spec(table)).ok, true, JSON.stringify(validateDocument(spec(table))));
const rejected = (table, code, path) => {
  const result = validateDocument(spec(table)); assert.equal(result.ok, false);
  assert.ok(result.issues.some(issue => issue.code === code && (!path || issue.path === path)), JSON.stringify(result.issues));
};
test('legacy table rows and merged cells preserve primitive, zero, null and expression values', () => {
  accepted({ rows: [['row', 0, null], [{ value: 'both', colSpan: 2 }, { $: 'amount' }]] });
  accepted({ rows: [[{ value: 'group', rowSpan: 2, header: true }, 1, 2], [3, 4]] });
  accepted({ rows: [[{ value: 'everything', rowSpan: 2, colSpan: 3 }], []] });
});
test('table sections support explicit merged column headers, independent body groups and supplied footer values', () => {
  accepted({ sections: [
    { kind: 'head', rows: [[{ value: 'Name', rowSpan: 2 }, { value: 'Measurements', colSpan: 2 }], ['A', 'B']] },
    { kind: 'body', rows: [[{ value: 'first', header: true, rowSpan: 2, scope: 'rowgroup' }, 0, null], [1, 2]] },
    { kind: 'body', rows: [['second', { value: 'No inferred totals', colSpan: 2 }]] },
    { kind: 'foot', rows: [[{ value: 'Caller footer', header: true }, { value: 5, colSpan: 2, align: 'end' }]] },
  ] });
});
test('empty and non-ready tables remain structurally complete documents', () => {
  for (const status of ['ready', 'loading', 'error']) {
    accepted({ rows: [], status }); accepted({ sections: [{ kind: 'body', rows: [] }], status });
  }
});
test('table schema requires exactly one data source and rejects unsupported cell properties', () => {
  rejected({}, 'SCHEMA'); rejected({ rows: [], sections: [{ kind: 'body', rows: [] }] }, 'SCHEMA');
  rejected({ rows: [[{ value: 'x', html: '<b>raw</b>' }, 1, 2]] }, 'SCHEMA');
  rejected({ rows: [[{ value: 'x', rowSpan: 0 }, 1, 2]] }, 'SCHEMA');
  rejected({ rows: [[{ value: 'x', colSpan: 1.5 }, 1, 2]] }, 'SCHEMA');
});
test('table sections reject head/body/foot ordering mistakes and excess total rows', () => {
  for (const kinds of [['head'], ['foot', 'body'], ['body', 'head'], ['body', 'foot', 'foot'], ['head', 'head', 'body']]) rejected({ sections: kinds.map(kind => ({ kind, rows: [] })) }, 'TABLE_SECTION');
  rejected({ sections: [{ kind: 'body', rows: Array.from({ length: 101 }, () => [1, 2, 3]) }, { kind: 'body', rows: Array.from({ length: 100 }, () => [1, 2, 3]) }] }, 'TABLE_LIMIT');
});
test('table occupancy rejects missing columns, overflow, overlap and spans outside a section', () => {
  rejected({ rows: [[1, 2]] }, 'TABLE_WIDTH', '/body/0/rows/0');
  rejected({ rows: [[{ value: 1, colSpan: 3 }, 2]] }, 'TABLE_WIDTH');
  rejected({ rows: [[1, { value: 2, rowSpan: 2 }, 3], [{ value: 4, colSpan: 2 }, 5]] }, 'TABLE_OVERLAP', '/body/0/rows/1/0');
  rejected({ sections: [{ kind: 'body', rows: [[{ value: 1, rowSpan: 2 }, 2, 3]] }, { kind: 'body', rows: [[4, 5, 6]] }] }, 'TABLE_SPAN');
});
test('header scope never mislabels ordinary data or a partial row group', () => {
  rejected({ rows: [[{ value: 'name', scope: 'row' }, 1, 2]] }, 'TABLE_SCOPE');
  rejected({ rows: [[{ value: 'name', header: true, scope: 'col' }, 1, 2]] }, 'TABLE_SCOPE');
  rejected({ rows: [[{ value: 'name', header: true, scope: 'rowgroup' }, 1, 2], [3, 4, 5]] }, 'TABLE_SCOPE');
  rejected({ sections: [{ kind: 'head', rows: [[{ value: 'Name', header: false }, 'A', 'B']] }, { kind: 'body', rows: [] }] }, 'TABLE_SCOPE');
  rejected({ rows: [[{ value: 'name', header: true, scope: 'colgroup' }, 1, 2]] }, 'SCHEMA');
});
test('table value references are validated in all section and object paths', () => {
  rejected({ rows: [[{ value: { $: 'missing' } }, 1, 2]] }, 'UNKNOWN_REFERENCE', '/body/0/rows/0/0/value/$');
  rejected({ sections: [{ kind: 'body', rows: [[0, 1, { value: { $: 'missing' } }]] }] }, 'UNKNOWN_REFERENCE', '/body/0/sections/0/rows/0/2/value/$');
  const document = spec({ rows: [[{ value: { $: 'amount' } }, 0, null]] });
  const before = structuredClone(document); assert.equal(evaluateState(document, { amount: 12 }).ok, true); assert.deepEqual(document, before);
});
