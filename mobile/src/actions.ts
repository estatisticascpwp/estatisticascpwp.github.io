/** Ações partilhadas por vários ecrãs (precisam de diálogos + estado). */
import { useEffect, useState } from 'react';
import { clockNow } from './domain/clock';
import { PERIODS } from './domain/constants';
import { fileStampOf, fmtClock } from './domain/format';
import { normalizeGame } from './domain/model';
import type { Game, Period } from './domain/types';
import { addGame, G, getState, mutate, openGame, settings } from './store/store';
import { ask, confirm, toast } from './ui/dialogs';
import { exportText, importText } from './ui/files';

export const fileStamp = () => { const g = G(); return fileStampOf(g.date, g.opponent); };

/** Muda o período ativo (com aviso se já houver movimentos em períodos posteriores). */
export async function setPeriod(p: Period) {
  const g = G(); if (g.period === p) return;
  const later = g.timer.events.filter(e => PERIODS.indexOf(e.period) > PERIODS.indexOf(p));
  if (later.length) {
    const last = PERIODS[Math.max(...later.map(e => PERIODS.indexOf(e.period)))];
    const ok = await confirm('Voltar a um período anterior?', `Já há ${later.length} entrada(s)/saída(s) registadas até ao **${last} período**. Se voltares ao ${p} período e registares mais movimentos, os tempos de jogo ficam errados.\n\nPara experimentar a app, cria antes um jogo novo em Início.`, 'Mudar mesmo assim');
    if (!ok) return;
  }
  const reset = settings().resetClockOnPeriod;
  mutate(x => { x.period = p; if (reset) { x.timer.running = false; x.timer.remaining = x.periodLength; } });
  toast(p + ' período ativo' + (reset ? ' · relógio reposto a ' + fmtClock(g.periodLength) : ''));
}

/** Pergunta se junta ou substitui ao importar. */
export function askImportMode(n: number, what: string) {
  return ask<'merge' | 'replace'>(`Importar ${what}`, `O ficheiro tem **${n}** registo(s).\n\nQueres juntá-los aos registos atuais ou substituir os atuais?`, [
    { label: 'Cancelar', value: null as any, style: 'ghost' }, { label: 'Substituir', value: 'replace', style: 'danger' }, { label: 'Juntar', value: 'merge', style: 'primary' },
  ]);
}

export function exportGameJSON(g: Game = G()) {
  return exportText('scp_stat_' + fileStampOf(g.date, g.opponent) + '.json', JSON.stringify({ app: 'scp-stat-polo', version: 1, exported: new Date().toISOString(), game: g }, null, 1), 'json');
}
/** Importa um jogo exportado (pela app móvel ou pela versão web) ou uma cópia de segurança completa. */
export async function importGameJSON() {
  const f = await importText('json'); if (!f) return;
  let d: any;
  try { d = JSON.parse(f.text); } catch { toast('Este ficheiro não é um jogo exportado pela SCP Stat (.json).', 'bad'); return; }
  if (!d || d.app !== 'scp-stat-polo') { toast('Este ficheiro não é um jogo exportado pela SCP Stat (.json).', 'bad'); return; }
  const incoming: any[] = d.kind === 'backup' ? Object.values(d.games || {}) : d.game ? [d.game] : [];
  if (!incoming.length) { toast('O ficheiro não tem jogos.', 'warn'); return; }
  for (const raw of incoming) {
    const game = normalizeGame(raw);
    if (getState().games[game.id]) {
      const m = await ask<'copy' | 'replace'>('Jogo já existe', `Já tens o jogo de ${game.date} vs ${game.opponent}. Substituir o que está guardado ou importar como cópia?`, [
        { label: 'Cancelar', value: null as any, style: 'ghost' }, { label: 'Importar como cópia', value: 'copy', style: 'outline' }, { label: 'Substituir', value: 'replace', style: 'danger' }]);
      if (!m) continue;
      if (m === 'copy') game.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    addGame(game, false);
  }
  openGame(normalizeGame(incoming[incoming.length - 1]).id);
  toast(incoming.length + ' jogo(s) importado(s)');
}

/** Força um novo desenho periódico enquanto `active` (relógio a correr). */
export function useTicker(active: boolean, ms = 250) {
  const [, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setT(t => t + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}
export const clockOf = () => clockNow(G());
