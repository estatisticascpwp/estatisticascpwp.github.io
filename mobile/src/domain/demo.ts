import { actDef, COL_TABLES, PERIODS, SHOT_ACTS, STD } from './constants';
import { r3, uid } from './format';
import { exOf, newGame } from './model';
import { fieldZone, goalZone } from './zones';
import type { ColRecord, Game, Period, Settings } from './types';

/** Jogo de exemplo com dados fictícios (mesma semente da versão web). */
export function buildDemoGame(settings?: Settings): Game {
  let s = 20261024;
  const R = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
  const wpick = <T,>(w: [T, number][]) => { const tot = w.reduce((a, x) => a + x[1], 0); let r = R() * tot; for (const [v, p] of w) { if ((r -= p) < 0) return v; } return w[0][0]; };
  const rng = (a: number, b: number) => a + R() * (b - a);
  const g = newGame(settings);
  g.demo = true; g.opponent = 'CN Exemplo'; g.competition = 'Jogo de exemplo'; g.venue = 'Piscina (exemplo)'; g.period = '4º';
  ['Martim C.', 'Rui A.', 'Tiago M.', 'Duarte S.', 'Gonçalo P.', 'André L.', 'Miguel F.', 'Pedro R.', 'João V.', 'Bernardo T.', 'Diogo N.', 'Francisco B.', 'Henrique G.'].forEach((n, i) => (g.roster[i].name = n));
  ['A. Costa', 'B. Silva', 'C. Rocha', 'D. Lima', 'E. Faria', 'F. Sousa', 'G. Pinto', 'H. Neves', 'I. Matos', 'J. Cruz', 'L. Reis', 'M. Dias', 'N. Brito'].forEach((n, i) => (g.oppRoster[i].name = n));
  let ts = Date.now() - 3 * 3600e3;
  const fieldXY = (kind: string) => {
    const m = kind === 'exc' ? rng(2.3, 5.2) : kind === 'turn' ? rng(3, 11) : wpick<number>([[rng(2.4, 5.8), 0.45], [rng(6.2, 10.5), 0.5], [rng(12.2, 12.4), 0.05]]);
    return { x: r3(rng(0.06, 0.94)), y: r3(m / 12.5) };
  };
  const goalXY = (act: string) => {
    if (act === 'Golo' || act === 'Golo Sofrido') {
      const x = R() < 0.7 ? pick([rng(0.1, 0.3), rng(0.7, 0.9)]) : rng(0.35, 0.65);
      return { x: r3(x), y: r3(wpick<number>([[rng(0.68, 0.95), 0.5], [rng(0.15, 0.38), 0.35], [rng(0.42, 0.64), 0.15]])) };
    }
    return { x: r3(rng(0.3, 0.7)), y: r3(rng(0.3, 0.75)) };
  };
  const field = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const fa: [string, number][] = [['Golo', 22], ['Defesa', 18], ['Bloco', 10], ['Fora', 9], ['EXC ganha', 10], ['EXC sofrida', 5], ['Perda Bola', 7], ['Roubo Bola', 6], ['Passe Falhado', 4], ['Falta Atacante', 3], ['Bloco Defensivo', 3], ['Canto', 2]];
  for (let i = 0; i < 56; i++) {
    const act = wpick(fa), a = actDef('field', act)!;
    const n = wpick(field.map(x => [x, x === 4 || x === 7 ? 3 : x === 9 || x === 5 ? 2 : 1] as [number, number]));
    const period = PERIODS[Math.min(3, Math.floor(i / 14))];
    const f = fieldXY(/EXC/.test(act) ? 'exc' : SHOT_ACTS.includes(act) ? 'shot' : 'turn'), gl = a.goal ? goalXY(act) : null;
    let sit = '';
    if (a.sits.length && (!a.sitOpt || R() < 0.7)) sit = a.sits.includes('6x6') ? wpick(a.sits.map(x => [x, x === '6x6' ? 6 : x === '+1' ? 2 : 1] as [string, number])) : pick(a.sits);
    let assist: number | 'none' | '' = '';
    if (a.assist) assist = R() < 0.6 ? pick(field.filter(x => x !== n)) : 'none';
    g.individual.push({ id: uid(), mode: 'field', period, player: n, playerName: g.roster[n - 1].name, action: act, sit, assist, fx: f.x, fy: f.y, fzone: fieldZone(f.x, f.y), gx: gl ? gl.x : null, gy: gl ? gl.y : null, gzone: gl ? goalZone(gl.x, gl.y) : '', ts: (ts += 60e3) });
  }
  const ka: [string, number][] = [['Golo Sofrido', 7], ['Defesa GR', 8], ['Defesa p/ Fora GR', 3], ['Fora', 3]];
  for (let i = 0; i < 21; i++) {
    const act = wpick(ka), a = actDef('gk', act)!;
    const period = PERIODS[Math.min(3, Math.floor(i / 5.3))], n = period === '4º' ? 13 : 1;
    const f = fieldXY('shot'), gl = a.goal ? goalXY(act) : null;
    g.individual.push({ id: uid(), mode: 'gk', period, player: n, playerName: g.roster[n - 1].name, action: act, sit: wpick(STD.map(x => [x, x === '6x6' ? 6 : 1] as [string, number])), assist: '', fx: f.x, fy: f.y, fzone: fieldZone(f.x, f.y), gx: gl ? gl.x : null, gy: gl ? gl.y : null, gzone: gl ? goalZone(gl.x, gl.y) : '', ts: (ts += 60e3) });
  }
  const outW = (side: string): [string, number][] => side === 'att'
    ? [['GOLO', 30], ['DEFESA', 20], ['FALHOU', 12], ['EXCLUSÃO', 14], ['PENALTI', 3], ['ROUBO BOLA', 6], ['PERDA BOLA', 6], ['FALTA ATACANTE', 3], ['TEMPO ATAQUE ACABOU', 4]]
    : [['GOLO', 26], ['DEFESA', 22], ['FALHOU', 14], ['EXCLUSÃO', 12], ['ROUBO BOLA', 10], ['PERDA BOLA', 8], ['TEMPO ATAQUE ACABOU', 5]];
  const plan: Record<string, number> = { scp: 16, other: 14, plus: 6, minus: 5, caSCP: 4, caOther: 3 };
  Object.entries(plan).forEach(([tid, count]) => {
    const t = COL_TABLES.find(x => x.id === tid)!, per: Record<string, number> = {};
    for (let i = 0; i < count; i++) {
      const period = PERIODS[Math.min(3, Math.floor((i * 4) / count))];
      per[period] = (per[period] || 0) + 1;
      const r: ColRecord = { id: uid(), table: t.id, period, attack: String(per[period]), ts: (ts += 30e3) };
      t.fields.forEach(f => {
        if (f.kind === 'toggle') (r as any)[f.key] = R() < 0.55 ? '+10s' : '-10s';
        else if (f.kind === 'notes') (r as any)[f.key] = R() < 0.25 ? pick(['Boa circulação', 'Remate apressado', 'GR adiantado', 'Pivot bem marcado']) : '';
        else if (f.key === 'outcome') (r as any)[f.key] = wpick(outW(t.side));
        else (r as any)[f.key] = pick((f.options || []).slice(0, f.key === 'offense' ? 9 : undefined));
      });
      g.collective.push(r);
    }
  });
  // tempo de jogo
  const L = g.periodLength, on = new Set([1, 2, 3, 4, 5, 6, 7]), bench = new Set([8, 9, 10, 11, 12, 13]);
  let seq = 0;
  const ev = (n: number, type: 'in' | 'out', period: Period, clock: number) => g.timer.events.push({ id: uid(), n, type, period, clock, seq: ++seq, ts: (ts += 1e3) });
  [...on].forEach(n => ev(n, 'in', '1º', L));
  PERIODS.forEach(p => {
    const times = p === '4º' ? [372, 228] : [390, 214, 75];
    if (p === '4º') { ev(1, 'out', p, L); on.delete(1); bench.add(1); ev(13, 'in', p, L); on.add(13); bench.delete(13); }
    times.forEach(c => {
      const o = pick([...on].filter(x => x !== 1 && x !== 13)), i = pick([...bench].filter(x => x !== 13 && x !== 1));
      ev(o, 'out', p, c); on.delete(o); bench.add(o); ev(i, 'in', p, c); on.add(i); bench.delete(i);
    });
  });
  g.timer.seq = seq; g.timer.remaining = 192; g.timer.running = false;
  // exclusões e golos coerentes com os registos
  g.individual.filter(r => r.mode === 'field' && r.action === 'Golo').forEach(r => { exOf(g, 'scp', r.player).goals++; });
  g.individual.filter(r => r.mode === 'gk' && r.action === 'Golo Sofrido').forEach(() => { exOf(g, 'opp', pick([2, 3, 4, 5, 6, 7, 8, 9])).goals++; });
  g.individual.filter(r => r.mode === 'field' && r.action === 'EXC sofrida').forEach(r => { const o = exOf(g, 'scp', r.player); if (o.ex < 3) o.ex++; });
  ([[4, 3], [6, 1], [2, 2], [9, 1], [5, 1]] as [number, number][]).forEach(([n, k]) => (exOf(g, 'opp', n).ex = k));
  g.sprints = [{ period: '1º', winner: 'SCP', player: '8' }, { period: '2º', winner: 'ADV', player: '' }, { period: '3º', winner: 'SCP', player: '8' }, { period: '4º', winner: 'SCP', player: '10' }];
  return g;
}
