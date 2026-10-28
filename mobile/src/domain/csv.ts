/** CSV com ";" e BOM, para abrir diretamente no Excel em português. */
function cell(v: unknown) {
  const s = v == null ? '' : String(v);
  return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
export function toCSV(rows: unknown[][]) {
  return '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n');
}
export function parseCSV(text: string): string[][] {
  text = String(text).replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const sep = first.split(';').length >= first.split(',').length ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}
export function csvObjects(text: string): Record<string, string>[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const h = rows[0].map(x => x.trim());
  return rows.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, String(r[i] ?? '').trim()])));
}
