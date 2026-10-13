/** Original finite subset, not CommonMark. No recursion or executable node input. */
export const MARKDOWN_LIMITS = Object.freeze({ codeUnits: 24000, lines: 4096, nodes: 2048, work: 192000 });
export type Inline = { kind: 'text' | 'code' | 'em' | 'strong'; text: string } | { kind: 'link'; text: string; href: string; source: string };
export type Block = { kind: 'paragraph' | 'literal' | 'quote'; content: Inline[] } | { kind: 'heading'; level: number; content: Inline[] } | { kind: 'code'; text: string; language: string } | { kind: 'list'; ordered: boolean; items: { value?: number; content: Inline[] }[] };
export interface MarkdownPlan { blocks: Block[]; fallback: boolean }
class Exhausted extends Error {}
class Budget {
  work = 0; nodes = 0;
  tick(n = 1): void { this.work += n; if (this.work > MARKDOWN_LIMITS.work) throw new Exhausted(); }
  node(): void { if (++this.nodes > MARKDOWN_LIMITS.nodes) throw new Exhausted(); }
}
const escapeChars = '\\`*_[]()!#>+-.';
function inline(s: string, b: Budget): Inline[] {
  if (s.startsWith('<') || s.startsWith('|')) { b.node(); return [{ kind: 'text', text: s }]; }
  const out: Inline[] = []; let start = 0, i = 0;
  const add = (v: Inline) => { b.node(); out.push(v); };
  const flush = (end: number) => { if (end > start) add({ kind: 'text', text: s.slice(start, end) }); };
  // Every search consumes the shared work budget, including unsuccessful scans.
  const find = (mark: string, from: number, escapes = true): number => {
    for (let j = from; j < s.length; j++) { b.tick(); if (escapes && s[j] === '\\') { j++; continue; } b.tick(mark.length); if (s.startsWith(mark, j)) return j; } return -1;
  };
  while (i < s.length) {
    b.tick(); const c = s[i];
    if (c === '\\' && escapeChars.includes(s[i + 1] ?? '\0')) { flush(i); add({ kind: 'text', text: s[i + 1] }); i += 2; start = i; continue; }
    if (c === '[' || (c === '!' && s[i + 1] === '[')) {
      const image = c === '!', labelStart = i + (image ? 2 : 1), close = find('](', labelStart);
      if (close >= 0) {
        const end = find(')', close + 2);
        if (end >= 0) {
          const source = s.slice(i, end + 1), label = s.slice(labelStart, close), href = s.slice(close + 2, end);
          flush(i);
          // Labels/destinations are flat, literal, unescaped. No nested syntax.
          const simple = !/[\[\]\\`*_]/.test(label) && !/[()\\]/.test(href);
          add(!image && simple && label.length > 0 ? { kind: 'link', text: label, href, source } : { kind: 'text', text: source });
          i = end + 1; start = i; continue;
        }
      }
      // Malformed links/images remain literal, including internal delimiters.
      flush(i); add({ kind: 'text', text: s.slice(i) }); i = s.length; start = i; continue;
    }
    if (c === '*' || c === '_' || c === '`') {
      let run = 1; while (s[i + run] === c) { b.tick(); run++; }
      if (run > (c === '`' ? 1 : 2)) {
        const close = find(c.repeat(run), i + run, c !== '`'), end = close < 0 ? s.length : close + run;
        flush(i); add({ kind: 'text', text: s.slice(i, end) }); i = end; start = i; continue;
      }
      const mark = c.repeat(run), end = find(mark, i + run, c !== '`');
      if (end >= 0) {
        const inside = s.slice(i + run, end), after = s[end + run];
        // Delimiter nesting and intraword emphasis are deliberately unsupported.
        const valid = inside.length > 0 && after !== c && (c === '`' || (!/[`*_\[\]\\]/.test(inside) && !/^\s|\s$/.test(inside) && !/[\p{L}\p{N}]/u.test(s[i - 1] ?? '') && !/[\p{L}\p{N}]/u.test(after ?? '')));
        flush(i); add({ kind: valid ? (c === '`' ? 'code' : run === 2 ? 'strong' : 'em') : 'text', text: valid ? inside : s.slice(i, end + run) });
        i = end + run; start = i; continue;
      }
      i += run; continue;
    }
    i++;
  }
  flush(s.length); return out;
}
interface Line { text: string; start: number; end: number }
/** CRLF/LF separators are recognized without rewriting code or literal slices. */
export function parseMarkdown(source: string): MarkdownPlan {
  const fallback = (): MarkdownPlan => ({ fallback: true, blocks: [{ kind: 'literal', content: [{ kind: 'text', text: source }] }] });
  if (source.length > MARKDOWN_LIMITS.codeUnits) return fallback();
  const b = new Budget();
  try {
    const lines: Line[] = []; let start = 0;
    for (let i = 0; i <= source.length; i++) {
      b.tick(); if (i === source.length || source[i] === '\n') {
        const end = i < source.length ? i + 1 : i, textEnd = i > start && source[i - 1] === '\r' && i < source.length ? i - 1 : i;
        if (lines.length === MARKDOWN_LIMITS.lines) throw new Exhausted();
        lines.push({ text: source.slice(start, textEnd), start, end }); start = end;
      }
    }
    const blocks: Block[] = []; const add = (v: Block) => { b.node(); blocks.push(v); };
    const literal = (text: string) => { b.node(); add({ kind: 'literal', content: [{ kind: 'text', text }] }); };
    const fence = (s: string) => /^(`{3}|~{3})([^`~]*)$/.exec(s);
    const list = (s: string) => /^(?:([-+*]) |([0-9]{1,9})[.)] )(.*)$/.exec(s);
    const special = (s: string) => !s.trim() || /^(?:#{1,6} |>|[ \t]|```|~~~)/.test(s) || !!list(s) || s.startsWith('<') || s.startsWith('|');
    for (let i = 0; i < lines.length;) {
      b.tick(); const line = lines[i], s = line.text;
      if (!s.trim()) { i++; continue; }
      const f = fence(s);
      if (f) {
        let close = i + 1; while (close < lines.length && lines[close].text !== f[1]) { b.tick(); close++; }
        if (close === lines.length) { literal(source.slice(line.start)); break; }
        add({ kind: 'code', language: f[2].trim(), text: source.slice(line.end, lines[close].start) }); i = close + 1; continue;
      }
      const h = /^(#{1,6}) (.*)$/.exec(s);
      if (h) { add({ kind: 'heading', level: h[1].length, content: inline(h[2], b) }); i++; continue; }
      // Unsupported indented/nested blocks, tables, raw HTML, extended fences and tasks stay literal.
      if (/^[ \t]|^> *>|^>>|^```|^~~~/.test(s) || s.startsWith('<') || s.startsWith('|') || /^(?:[-+*]|[0-9]{1,9}[.)]) \[[ xX]\]/.test(s)) { literal(s); i++; continue; }
      if (s.startsWith('> ')) { add({ kind: 'quote', content: inline(s.slice(2), b) }); i++; continue; }
      const li = list(s);
      if (li) {
        const ordered = !!li[2], items: Extract<Block, {kind:'list'}>['items'] = [];
        while (i < lines.length) {
          const item = list(lines[i].text); b.tick();
          if (!item || !!item[2] !== ordered || /^\[[ xX]\]/.test(item[3])) break;
          b.node(); items.push({ ...(ordered ? {value: Number(item[2])} : {}), content: inline(item[3], b) }); i++;
        }
        add({ kind: 'list', ordered, items }); continue;
      }
      let end = i + 1; while (end < lines.length && !special(lines[end].text)) { b.tick(); end++; }
      // Preserve authored soft line endings; omit the final block separator.
      add({ kind: 'paragraph', content: inline(source.slice(line.start, lines[end - 1].start + lines[end - 1].text.length), b) }); i = end;
    }
    return { blocks, fallback: false };
  } catch (e) { if (e instanceof Exhausted) return fallback(); throw e; }
}
