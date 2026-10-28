import { PERIODS } from './constants';
import type { Game, Period } from './types';

/** Tempo que falta no relógio (segundos), a contar com o tempo a correr. */
export function clockNow(g: Game, now = Date.now()): number {
  const t = g.timer;
  if (!t.running) return t.remaining;
  return Math.max(0, t.remaining - (now - t.startedAt) / 1000);
}
/** Segundos de jogo desde o início do 1º período. */
export function absTime(g: Game, period: Period | string, clock: number): number {
  const L = g.periodLength;
  return Math.max(0, PERIODS.indexOf(period as Period)) * L + (L - clock);
}
export const nowAbs = (g: Game, now = Date.now()) => absTime(g, g.period, clockNow(g, now));

export interface ShiftInfo {
  inSince: number | null; inEv: string | null;
  shifts: { from: number; to: number; dur: number }[]; closed: number;
  on: boolean; ahead: boolean; open: number; total: number; count: number; last: number;
}
/**
 * Quem está na água é decidido pela ORDEM em que os movimentos foram registados (seq),
 * não pelo relógio — mudar de período ou acertar o relógio nunca baralha o estado.
 * A duração de cada turno vem do período + relógio de cada movimento.
 */
export function computeShifts(g: Game, now = Date.now()): { byPlayer: Record<number, ShiftInfo>; issues: Set<string> } {
  const ev = g.timer.events.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0) || (a.ts || 0) - (b.ts || 0));
  const res: Record<number, ShiftInfo> = {};
  const issues = new Set<string>();
  g.roster.forEach(p => { res[p.n] = { inSince: null, inEv: null, shifts: [], closed: 0, on: false, ahead: false, open: 0, total: 0, count: 0, last: 0 }; });
  ev.forEach(e => {
    const s = res[e.n]; if (!s) return;
    const t = absTime(g, e.period, e.clock);
    if (e.type === 'in') {
      if (s.inSince == null) { s.inSince = t; s.inEv = e.id; } else issues.add(e.id);
    } else if (s.inSince != null) {
      const raw = t - s.inSince;
      if (raw < 0) { issues.add(e.id); if (s.inEv) issues.add(s.inEv); }
      const d = Math.max(0, raw);
      s.shifts.push({ from: s.inSince, to: t, dur: d }); s.closed += d; s.inSince = null; s.inEv = null;
    } else issues.add(e.id);
  });
  const na = nowAbs(g, now);
  Object.values(res).forEach(s => {
    s.on = s.inSince != null;
    s.ahead = s.on && na < (s.inSince as number);
    s.open = s.on ? Math.max(0, na - (s.inSince as number)) : 0;
    s.total = s.closed + s.open;
    s.count = s.shifts.length + (s.on ? 1 : 0);
    s.last = s.on ? s.open : s.shifts.length ? s.shifts[s.shifts.length - 1].dur : 0;
  });
  return { byPlayer: res, issues };
}
export const inPool = (sh: Record<number, ShiftInfo>) => Object.keys(sh).map(Number).filter(k => sh[k].on);
