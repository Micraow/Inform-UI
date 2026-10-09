import type { TableNode, TableCell, TableCellObject, Value } from '../schema/document.js';

export interface PlacedTableCell {
  value: Value;
  row: number;
  column: number;
  rowSpan: number;
  colSpan: number;
  header: boolean;
  scope?: 'row' | 'col' | 'rowgroup';
  align?: 'start' | 'center' | 'end';
  /** JSON pointer relative to this table node, useful for exact semantic errors. */
  path: string;
}
export interface TableLayoutSection {
  kind: 'head' | 'body' | 'foot';
  generated: boolean;
  rows: PlacedTableCell[][];
}
export class TableLayoutError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message); this.name = 'TableLayoutError';
  }
}
export function isTableCellObject(cell: TableCell): cell is TableCellObject {
  return cell !== null && typeof cell === 'object' && Object.hasOwn(cell, 'value');
}

/** One shared occupancy model for validation and native table rendering. No input mutation. */
export function tableLayout(node: TableNode): TableLayoutSection[] {
  const reject = (code: string, path: string, message: string): never => { throw new TableLayoutError(code, path, message); };
  const explicit = node.sections;
  const sections = explicit ?? [{ kind: 'body' as const, rows: node.rows ?? [] }];
  if ((node.rows === undefined) === (explicit === undefined)) reject('TABLE_SOURCE', '', 'Choose exactly one of rows or sections.');
  const kinds = sections.map(section => section.kind);
  if (!kinds.includes('body') || kinds.filter(kind => kind === 'head').length > 1 || kinds.filter(kind => kind === 'foot').length > 1 || kinds.some((kind, index) => kind === 'head' && index !== 0 || kind === 'foot' && index !== sections.length - 1)) reject('TABLE_SECTION', '/sections', 'Use optional head first, one or more body sections, and optional foot last.');
  if (sections.reduce((total, section) => total + section.rows.length, 0) > 200) reject('TABLE_LIMIT', explicit ? '/sections' : '/rows', 'Tables support at most 200 supplied rows across all sections.');
  const width = node.columns.length;
  const layout = sections.map((section, sectionIndex): TableLayoutSection => {
    const prefix = explicit ? `/sections/${sectionIndex}/rows` : '/rows';
    const occupied = section.rows.map(() => Array<boolean>(width).fill(false));
    const rows = section.rows.map((row, rowIndex) => {
      let column = 0;
      const placed = row.map((source, cellIndex): PlacedTableCell => {
        while (column < width && occupied[rowIndex]![column]) column++;
        const path = `${prefix}/${rowIndex}/${cellIndex}`;
        const cell = isTableCellObject(source) ? source : { value: source };
        const rowSpan = cell.rowSpan ?? 1, colSpan = cell.colSpan ?? 1;
        if (!Number.isInteger(rowSpan) || rowSpan < 1 || rowSpan > 200 || !Number.isInteger(colSpan) || colSpan < 1 || colSpan > 20) reject('TABLE_SPAN', path, 'Cell spans must be positive supported integers.');
        if (column + colSpan > width) reject('TABLE_WIDTH', path, 'Cell spans exceed the declared column count.');
        if (rowIndex + rowSpan > section.rows.length) reject('TABLE_SPAN', path, 'A row span cannot extend beyond its section.');
        for (let r = rowIndex; r < rowIndex + rowSpan; r++) for (let col = column; col < column + colSpan; col++) {
          if (occupied[r]![col]) reject('TABLE_OVERLAP', path, 'Merged cells must not overlap.');
          occupied[r]![col] = true;
        }
        const header = section.kind === 'head' || cell.header === true;
        if (section.kind === 'head' && cell.header === false) reject('TABLE_SCOPE', path + '/header', 'Head-section cells are always column headers.');
        if (cell.scope && (!header || section.kind === 'head' && cell.scope !== 'col' || section.kind !== 'head' && cell.scope === 'col')) reject('TABLE_SCOPE', path + '/scope', 'Scope must match a header cell and its row or column role.');
        if (cell.scope === 'rowgroup' && (rowIndex !== 0 || rowSpan !== section.rows.length)) reject('TABLE_SCOPE', path + '/scope', 'An explicit rowgroup header must span its complete section from the first row.');
        const result: PlacedTableCell = { value: cell.value, row: rowIndex, column, rowSpan, colSpan, header, path };
        if (header) result.scope = cell.scope ?? (section.kind === 'head' ? 'col' : 'row');
        if (cell.align) result.align = cell.align;
        column += colSpan;
        return result;
      });
      if (occupied[rowIndex]!.some(filled => !filled)) reject('TABLE_WIDTH', `${prefix}/${rowIndex}`, 'Every logical row must be completely covered by cells or preceding row spans.');
      return placed;
    });
    return { kind: section.kind, generated: false, rows };
  });
  if (layout[0]?.kind !== 'head') layout.unshift({ kind: 'head', generated: true, rows: [node.columns.map((value, column) => ({ value, row: 0, column, rowSpan: 1, colSpan: 1, header: true, scope: 'col', path: `/columns/${column}` }))] });
  return layout;
}
