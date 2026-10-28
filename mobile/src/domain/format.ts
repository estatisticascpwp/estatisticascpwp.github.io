export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);
export const fmtPct = (a: number, b: number) => (b ? pct(a, b) + '%' : '—');
export const r3 = (v: number) => Math.round(v * 1000) / 1000;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export function fmtClock(s: number) {
  s = Math.max(0, Math.round(s || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
/** "5:32", "5.32", "5" → segundos; null se inválido. */
export function parseClock(str: unknown): number | null {
  const m = String(str ?? '').trim().match(/^(\d{1,2})(?:\s*[:.,'h]\s*(\d{1,2}))?$/);
  if (!m) return null;
  const sec = +(m[2] || 0);
  if (sec > 59) return null;
  return +m[1] * 60 + sec;
}
export function fmtDate(iso: string) {
  if (!iso) return '';
  const p = String(iso).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}
/** dd/mm/aaaa ou aaaa-mm-dd → aaaa-mm-dd */
export function parseDate(s: string): string | null {
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}
export function numPT(v: number | null | undefined, dec = 1) {
  if (v == null || isNaN(v)) return '';
  const k = Math.pow(10, dec);
  return String(Math.round(v * k) / k).replace('.', ',');
}
export function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}
export function groupBy<T>(rows: T[], key: keyof T | ((r: T) => string | null | undefined)): Map<string, T[]> {
  const m = new Map<string, T[]>();
  rows.forEach(r => {
    const k = typeof key === 'function' ? key(r) : (r[key] as unknown as string);
    if (k == null || k === '') return;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  });
  return m;
}
export interface EffRow { k: string; n: number; g: number; e: number }
export function effRows<T>(map: Map<string, T[]>, isGood: (r: T) => boolean): EffRow[] {
  return [...map].map(([k, rs]) => { const g = rs.filter(isGood).length; return { k, n: rs.length, g, e: pct(g, rs.length) }; });
}
export function fileStampOf(date: string, opponent: string) {
  return (date || todayISO()) + '_vs_' + String(opponent || 'adversario').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_');
}
