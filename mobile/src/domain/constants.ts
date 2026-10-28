import type { ActionDef, ColField, ColTable, Mode, Period, Settings } from './types';

export const PERIODS: Period[] = ['1º', '2º', '3º', '4º'];
export const STD = ['6x6', '+1', '-1', 'CA', '6M', 'PEN'];
export const EXCS = ['Natação', 'Pivot s/ bola', 'Pivot c/ bola'];
export const POSITIONS = ['Guarda-redes', 'Pivot', 'Defesa-pivot', 'Ponta', 'Lateral', 'Central', 'Universal'];
export const HANDS = ['', 'Direita', 'Esquerda'];

export const DEFAULT_SETTINGS: Settings = {
  teamName: 'Sporting CP', periodLength: 480, maxInPool: 7,
  assistRequired: true, autoAttack: true, resetClockOnPeriod: true,
};

/** Ações da Estatística Individual (regras do documento "Esquema app STAT SCP"). */
export const ACTIONS: Record<Mode, ActionDef[]> = {
  field: [
    { id: 'Golo', sits: STD, assist: true, goal: true, shape: 'circle', color: '#1e9e4a' },
    { id: 'Defesa', sits: STD, goal: true, shape: 'circle', color: '#d93232' },
    { id: 'Bloco', sits: STD, shape: 'circle', color: '#f08a24' },
    { id: 'Fora', sits: STD, shape: 'circle', color: '#8a3fc2' },
    { id: 'EXC ganha', sits: EXCS, assist: true, shape: 'square', color: '#a6e3b8', stroke: '#2d8a4c' },
    { id: 'EXC sofrida', sits: EXCS, shape: 'square', color: '#f5b3b1', stroke: '#b53b38' },
    { id: 'Falta Atacante', sits: ['6x6', ...EXCS], sitOpt: true, shape: 'triangle', color: '#f5c518' },
    { id: 'Perda Bola', sits: [...STD, 'Pivot c/ bola'], sitOpt: true, shape: 'circle', color: '#8d9699' },
    { id: 'Roubo Bola', sits: STD, sitOpt: true, shape: 'circle', color: '#2f6fd6' },
    { id: 'Passe Falhado', sits: STD, shape: 'triangle', color: '#d93232' },
    { id: 'Bloco Defensivo', sits: STD, shape: 'triangle', color: '#1e9e4a' },
    { id: 'Canto', sits: [], shape: 'diamond', color: '#0e8c8c' },
  ],
  gk: [
    { id: 'Golo Sofrido', sits: STD, goal: true, shape: 'circle', color: '#d93232' },
    { id: 'Defesa GR', sits: STD, goal: true, shape: 'circle', color: '#1e9e4a' },
    { id: 'Defesa p/ Fora GR', sits: STD, goal: true, shape: 'circle', color: '#f5c518' },
    { id: 'Fora', sits: STD, shape: 'circle', color: '#8a3fc2' },
  ],
};
export const actDef = (mode: Mode, id: string) => ACTIONS[mode].find(a => a.id === id);
export const SHOT_ACTS = ['Golo', 'Defesa', 'Bloco', 'Fora'];
export const GR_SAVE = ['Defesa GR', 'Defesa p/ Fora GR'];

export const GOAL_CELLS = [
  ['Canto Superior Esquerdo', 'Meio Superior', 'Canto Superior Direito'],
  ['Meio Esquerdo', 'Figura', 'Meio Direito'],
  ['Canto Inferior Esquerdo', 'Meio Inferior', 'Canto Inferior Direito'],
];
export const FIELD_ZONES = ['Zona 2M', 'Ponta Esquerda', 'Pivot', 'Ponta Direita', 'Lateral Esquerda', 'Central', 'Lateral Direita', 'Meio-campo (+12M)'];
export const GOAL_ZONES = ['Barra', 'Poste Esquerdo', 'Poste Direito', ...GOAL_CELLS.flat()];
export const DIST_BANDS: [string, number, number][] = [['0–2 m', 0, 2], ['2–6 m', 2, 6], ['6–12 m', 6, 12], ['+12 m', 12, 99]];

/* ---------- Estatística Coletiva (de estatistica_coletiva.js) ---------- */
export const COL_OPTS = {
  attacks: Array.from({ length: 25 }, (_, i) => String(i + 1)),
  positions: ['Posição 1', 'Posição 2', 'Posição 3', 'Posição 4', 'Posição 5', '1º Pivot', '2º Pivot', '6m P2', '6m P3', '6m P4', 'PENALTI'],
  outcomes: ['GOLO', 'DEFESA', 'FALHOU', 'EXCLUSÃO', 'PENALTI', 'ROUBO BOLA', 'PERDA BOLA', 'FALTA ATACANTE', 'FORA DE JOGO', 'TEMPO ATAQUE ACABOU'],
  offSCP: ['1 para pivot', '2 para 1', '2 cruzada', '2 entra a pivot', '3 para 1', '3 para 5', '3 para pivot', '4 para 5', '4 para 1', '4 entra a pivot', '5 para pivot', 'Bloqueio Esq', 'Bloqueio Direita', 'Bloqueio Central', '2 Pivots (puro)', 'Ataque contra M', 'Jogada 1x1', 'Estático'],
  offOther: ['1 para pivot', '2 para 1', '2 cruzada', '2 entra a pivot', '3 para 1', '3 para 5', '3 para pivot', '4 para 5', '4 para 1', '4 entra a pivot', '5 para pivot', 'Bloqueio Esq', 'Bloqueio Direita', 'Bloqueio Central', '2 Pivots (puro)', 'Ataque contra M', 'Jogada 1x1'],
  defense: ['Zona 1', 'Zona 12', 'Zona 123', 'Zona 234', 'Zona M pura', 'Zona M para a Dir', 'Zona M Risco', 'Zona Total', 'P + Zona 1', 'P + Zona 12', 'P + Zona 123', 'P + Zona 234', 'P + Zona M', 'P + Zona M Risco', 'P + Zona Total', 'Pressão Total', 'Zona 45', 'Zona 34', 'Zona 4 2'],
  systems: ['3-3', '4-2', 'Puxar dir', 'Puxar esq'],
  defPlus: ['Blocos', '1 a sair', '2 a sair', '3 a sair', '4 a sair', 'Saltar no 3 passe', 'Pressão esq', 'Pressão direita'],
  ca: ['1-0', '2-1', '3-2', '4-3', '5-4', '2-0', '3-1', '4-2', '5-3'],
};
const F_POS: ColField = { key: 'position', label: 'Posição Remate', options: COL_OPTS.positions, kind: 'select' };
const F_OUT: ColField = { key: 'outcome', label: 'Outcome', options: COL_OPTS.outcomes, kind: 'select' };
const F_TIME: ColField = { key: 'timing', label: 'Tempo de ATQ', options: ['+10s', '-10s'], kind: 'toggle' };
const F_NOTES: ColField = { key: 'notes', label: 'Notas', options: null, kind: 'notes' };
export const COL_TABLES: ColTable[] = [
  { id: 'scp', tab: 'Ataque SCP', side: 'att', title: 'Ataque SCP vs Defesa Adversária', fields: [
    { key: 'offense', label: 'Jogada Ofensiva SCP', options: COL_OPTS.offSCP, kind: 'combo' },
    { key: 'defense', label: 'Jogada Defensiva Adversário', options: COL_OPTS.defense, kind: 'combo' }, F_POS, F_OUT, F_TIME] },
  { id: 'other', tab: 'Ataque Adversário', side: 'def', title: 'Ataque Adversário vs Defesa SCP', fields: [
    { key: 'offense', label: 'Jogada Ofensiva Adversário', options: COL_OPTS.offOther, kind: 'combo' },
    { key: 'defense', label: 'Jogada Defensiva SCP', options: COL_OPTS.defense, kind: 'combo' }, F_POS, F_OUT, F_TIME] },
  { id: 'plus', tab: 'SCP +1', side: 'att', title: 'Superioridade SCP (+1)', fields: [
    { key: 'system', label: 'SCP +1', options: COL_OPTS.systems, kind: 'select' },
    { key: 'defense', label: 'Defesa Adversário', options: COL_OPTS.defPlus, kind: 'select' }, F_POS, F_OUT, F_NOTES] },
  { id: 'minus', tab: 'Adversário +1', side: 'def', title: 'Inferioridade SCP (−1)', fields: [
    { key: 'system', label: 'Adversário +1', options: COL_OPTS.systems, kind: 'select' },
    { key: 'defense', label: 'Defesa SCP (−1)', options: COL_OPTS.defPlus, kind: 'select' }, F_POS, F_OUT, F_NOTES] },
  { id: 'caSCP', tab: 'Contra-ataque SCP', side: 'att', title: 'Contra-ataque SCP', fields: [
    { key: 'ca', label: 'CA SCP', options: COL_OPTS.ca, kind: 'select' }, F_POS, F_OUT, F_NOTES] },
  { id: 'caOther', tab: 'Contra-ataque Adv.', side: 'def', title: 'Contra-ataque Adversário', fields: [
    { key: 'ca', label: 'CA Adversário', options: COL_OPTS.ca, kind: 'select' }, F_POS, F_OUT, F_NOTES] },
];
export const COL_CSV: [string, string][] = [['table', 'Tabela'], ['period', 'Período'], ['attack', 'Nº Ataque'], ['offense', 'Jogada Ofensiva'], ['defense', 'Jogada Defensiva / Defesa'], ['system', 'Sistema +1'], ['ca', 'Contra-ataque'], ['position', 'Posição Remate'], ['outcome', 'Outcome'], ['timing', 'Tempo ATQ'], ['notes', 'Notas']];
export const IND_CSV = ['Tipo', 'Período', 'Nº Jogador', 'Jogador', 'Ação', 'Situação', 'Assistência Nº', 'Assistência', 'Zona Campo', 'Campo X (%)', 'Campo Y (%)', 'Zona Baliza', 'Baliza X (%)', 'Baliza Y (%)', 'Registado em'];

export function outcomeTone(o: string | undefined, side: 'att' | 'def'): 'good' | 'bad' | 'warn' | 'neutral' {
  if (o === 'EXCLUSÃO' || o === 'PENALTI') return 'warn';
  if (o === 'GOLO') return side === 'att' ? 'good' : 'bad';
  if (['DEFESA', 'FALHOU', 'ROUBO BOLA', 'PERDA BOLA', 'FALTA ATACANTE', 'FORA DE JOGO', 'TEMPO ATAQUE ACABOU'].includes(o || '')) return side === 'att' ? 'bad' : 'good';
  return 'neutral';
}
