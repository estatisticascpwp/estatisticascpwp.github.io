import { DEFAULT_SETTINGS, PERIODS } from './constants';
import { todayISO, uid } from './format';
import type { ExclState, Game, OppPlayer, Player, Settings, Team } from './types';

export function defaultRoster(): Player[] {
  return Array.from({ length: 15 }, (_, i) => ({ n: i + 1, name: '', gr: i === 0 || i === 12, pos: i === 0 || i === 12 ? 'Guarda-redes' : '', hand: '' }));
}
export function defaultOpp(): OppPlayer[] {
  return Array.from({ length: 13 }, (_, i) => ({ n: i + 1, name: '' }));
}
export function newGame(settings: Settings = DEFAULT_SETTINGS, base?: Game | null, keepRoster = false): Game {
  const L = settings.periodLength || 480;
  return {
    id: uid(), scpName: settings.teamName || 'Sporting CP', opponent: 'Adversário', date: todayISO(), competition: '', venue: '',
    period: '1º', periodLength: L,
    roster: base && keepRoster ? base.roster.map(p => ({ ...p })) : defaultRoster(),
    oppRoster: defaultOpp(),
    individual: [], collective: [],
    timer: { events: [], remaining: L, running: false, startedAt: 0, seq: 0 },
    excl: { scp: {}, opp: {} }, exclLog: [],
    sprints: PERIODS.map(p => ({ period: p, winner: '', player: '' })),
    demo: false, created: Date.now(), updated: Date.now(),
  };
}
/** Completa jogos antigos/importados (também os exportados pela versão web). */
export function normalizeGame(g: any): Game {
  const b = newGame();
  for (const k of Object.keys(b) as (keyof Game)[]) if (g[k] === undefined || g[k] === null) g[k] = b[k];
  const r = defaultRoster();
  (Array.isArray(g.roster) ? g.roster : []).forEach((p: any) => { if (p && p.n >= 1 && p.n <= 15) r[p.n - 1] = { ...r[p.n - 1], ...p }; });
  g.roster = r;
  const o = defaultOpp();
  (Array.isArray(g.oppRoster) ? g.oppRoster : []).forEach((p: any) => { if (p && p.n >= 1 && p.n <= 13) o[p.n - 1] = { ...o[p.n - 1], ...p }; });
  g.oppRoster = o;
  g.timer = { ...b.timer, ...g.timer };
  if (!Array.isArray(g.timer.events)) g.timer.events = [];
  g.excl = g.excl || {}; g.excl.scp = g.excl.scp || {}; g.excl.opp = g.excl.opp || {};
  if (!Array.isArray(g.sprints) || g.sprints.length !== 4) g.sprints = b.sprints;
  for (const k of ['individual', 'collective', 'exclLog']) if (!Array.isArray(g[k])) g[k] = [];
  if (!PERIODS.includes(g.period)) g.period = '1º';
  return g as Game;
}

export const player = (g: Game, n: number | string) => g.roster.find(p => p.n === +n);
export const pname = (g: Game, n: number | string) => { const p = player(g, n); return p && p.name ? p.name : 'Jogador ' + n; };
export const plabel = (g: Game, n: number | string | null | undefined) => (n ? `${n} · ${pname(g, n)}` : '—');
/** Jogadores que aparecem nos programas: 1–13 sempre, 14 e 15 só com nome. */
export const namedRoster = (g: Game) => g.roster.filter(p => p.n <= 13 || p.name);

export function exOf(g: Game, team: Team, n: number): ExclState {
  const t = g.excl[team];
  if (!t[n]) t[n] = { ex: 0, red: false, goals: 0 };
  return t[n];
}
export const peekEx = (g: Game, team: Team, n: number): ExclState => g.excl[team][n] || { ex: 0, red: false, goals: 0 };
export const teamName = (g: Game, t: Team) => (t === 'scp' ? g.scpName || 'Sporting CP' : g.opponent || 'Adversário');
export const exName = (g: Game, t: Team, n: number) => {
  const r = t === 'scp' ? player(g, n) : g.oppRoster[n - 1];
  return r && r.name ? r.name : 'Jogador ' + n;
};
export function scoreOf(g: Game) {
  const sum = (t: Team) => Object.values(g.excl[t] || {}).reduce((a, x) => a + (x.goals || 0), 0);
  return { scp: sum('scp'), opp: sum('opp') };
}
