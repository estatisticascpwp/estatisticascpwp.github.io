/**
 * Estado da app: jogos, definições e ecrã ativo.
 * Os jogos são mutados no lugar (como na versão web) e cada alteração incrementa uma versão
 * que faz os ecrãs voltarem a desenhar. A gravação em SQLite é agrupada (debounce).
 */
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_SETTINGS } from '../domain/constants';
import { buildDemoGame } from '../domain/demo';
import { newGame, normalizeGame } from '../domain/model';
import type { Game, Settings } from '../domain/types';
import * as db from './db';

export type ScreenId = 'inicio' | 'individual' | 'remates' | 'jogadores' | 'guardaredes' | 'coletiva' | 'tempo' | 'exclusoes' | 'analise' | 'definicoes';

interface State { ready: boolean; currentId: string; games: Record<string, Game>; settings: Settings; screen: ScreenId; storageError: string | null }
const S: State = { ready: false, currentId: '', games: {}, settings: { ...DEFAULT_SETTINGS }, screen: 'inicio', storageError: null };

let version = 0;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export function emit() { version++; listeners.forEach(l => l()); }
/** Hook: devolve o estado e volta a desenhar o componente sempre que algo muda. */
export function useStore(): State { useSyncExternalStore(subscribe, () => version, () => version); return S; }
export const getState = () => S;
export const G = (): Game => S.games[S.currentId];
export const settings = () => S.settings;

/* ---------- gravação ---------- */
const pending = new Map<string, ReturnType<typeof setTimeout>>();
function scheduleSave(id: string) {
  const t = pending.get(id); if (t) clearTimeout(t);
  pending.set(id, setTimeout(() => { pending.delete(id); const g = S.games[id]; if (g) db.writeGame(g).catch(onStorageError); }, 350));
}
function onStorageError(e: unknown) { S.storageError = String(e); emit(); }
export async function flushSaves() {
  const ids = [...pending.keys()];
  ids.forEach(id => { clearTimeout(pending.get(id)!); pending.delete(id); });
  await Promise.all(ids.map(id => (S.games[id] ? db.writeGame(S.games[id]) : Promise.resolve()))).catch(onStorageError);
}
AppState.addEventListener('change', (s: string) => { if (s !== 'active') flushSaves(); });

/* ---------- alterações ---------- */
/** Altera o jogo aberto e grava. */
export function mutate(fn: (g: Game) => void, opts: { silent?: boolean } = {}) {
  const g = G(); if (!g) return;
  fn(g);
  if (!opts.silent) g.updated = Date.now();
  emit(); scheduleSave(g.id);
}
export function mutateGame(id: string, fn: (g: Game) => void) { const g = S.games[id]; if (!g) return; fn(g); g.updated = Date.now(); emit(); scheduleSave(id); }
export function mutateSettings(fn: (s: Settings) => void) { fn(S.settings); emit(); db.writeKV('settings', JSON.stringify(S.settings)).catch(onStorageError); }
export function setScreen(id: ScreenId) { if (S.screen !== id) { S.screen = id; emit(); } }

export function openGame(id: string) { if (!S.games[id]) return; S.currentId = id; resetScreenState(); emit(); db.writeKV('currentId', id).catch(onStorageError); }
export function addGame(g: Game, open = true) {
  S.games[g.id] = g; emit(); db.writeGame(g).catch(onStorageError);
  if (open) openGame(g.id);
}
export function createGame(keepRoster: boolean) { addGame(newGame(S.settings, G(), keepRoster)); }
export async function deleteGame(id: string) {
  delete S.games[id];
  const t = pending.get(id); if (t) { clearTimeout(t); pending.delete(id); }
  await db.removeGame(id).catch(onStorageError);
  if (!Object.keys(S.games).length) addGame(newGame(S.settings));
  else if (S.currentId === id) openGame(Object.keys(S.games)[0]);
  emit();
}
export async function replaceAllGames(games: Game[], currentId?: string, newSettings?: Settings) {
  await flushSaves();
  await db.clearGames().catch(onStorageError);
  S.games = {};
  for (const g of games) { S.games[g.id] = g; await db.writeGame(g).catch(onStorageError); }
  if (newSettings) mutateSettings(s => Object.assign(s, DEFAULT_SETTINGS, newSettings));
  openGame(currentId && S.games[currentId] ? currentId : games[0].id);
}

/* ---------- arranque ---------- */
export async function initStore() {
  try {
    const { games, kv } = await db.loadAll();
    games.forEach(raw => { const g = normalizeGame(raw); S.games[g.id] = g; });
    try { if (kv.settings) S.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(kv.settings) }; } catch { /* manter predefinições */ }
    if (!Object.keys(S.games).length) { const d = buildDemoGame(S.settings); S.games[d.id] = d; await db.writeGame(d); }
    S.currentId = kv.currentId && S.games[kv.currentId] ? kv.currentId : Object.values(S.games).sort((a, b) => b.updated - a.updated)[0].id;
  } catch (e) {
    // sem armazenamento: a app continua a funcionar em memória e avisa
    S.storageError = String(e);
    if (!Object.keys(S.games).length) { const d = buildDemoGame(S.settings); S.games[d.id] = d; S.currentId = d.id; }
  }
  S.ready = true; emit();
}

/* ---------- estado de cada ecrã que sobrevive à navegação ---------- */
const screenState = new Map<string, unknown>();
export function resetScreenState() { screenState.clear(); }
/** Como useState, mas o valor mantém-se ao mudar de ecrã (é limpo ao abrir outro jogo). */
export function useScreenState<T>(key: string, init: T | (() => T)): [T, (v: T | ((p: T) => T)) => void] {
  const [, force] = useState(0);
  const initRef = useRef(init);
  if (!screenState.has(key)) screenState.set(key, typeof initRef.current === 'function' ? (initRef.current as () => T)() : initRef.current);
  const set = useCallback((v: T | ((p: T) => T)) => {
    const prev = (screenState.has(key) ? screenState.get(key) : (typeof initRef.current === 'function' ? (initRef.current as () => T)() : initRef.current)) as T;
    screenState.set(key, typeof v === 'function' ? (v as (p: T) => T)(prev) : v);
    force(x => x + 1);
  }, [key]);
  return [screenState.get(key) as T, set];
}
