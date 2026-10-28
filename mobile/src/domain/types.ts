export type Period = '1º' | '2º' | '3º' | '4º';
export type Mode = 'field' | 'gk';
export type Team = 'scp' | 'opp';

export interface Player { n: number; name: string; gr: boolean; pos: string; hand: string }
export interface OppPlayer { n: number; name: string }

/** Registo da Estatística Individual. Coordenadas normalizadas 0–1 (campo 16:8 e baliza). */
export interface IndRecord {
  id: string; mode: Mode; period: Period; player: number; playerName: string; action: string;
  sit: string; assist: number | 'none' | '';
  fx: number | null; fy: number | null; fzone: string;
  gx: number | null; gy: number | null; gzone: string; ts: number;
}

/** Registo da Estatística Coletiva (campos variam por tabela). */
export interface ColRecord {
  id: string; table: ColTableId; period: Period | string; attack: string; ts: number;
  offense?: string; defense?: string; system?: string; ca?: string;
  position?: string; outcome?: string; timing?: string; notes?: string;
}
export type ColTableId = 'scp' | 'other' | 'plus' | 'minus' | 'caSCP' | 'caOther';

export interface TimerEvent { id: string; n: number; type: 'in' | 'out'; period: Period; clock: number; seq: number; ts: number }
export interface Timer { events: TimerEvent[]; remaining: number; running: boolean; startedAt: number; seq: number }

export interface ExclState { ex: number; red: boolean; goals: number }
export interface ExclLog { id: string; team: Team; n: number; type: string; period: Period; clock: number; ts: number }
export interface Sprint { period: Period; winner: '' | 'SCP' | 'ADV'; player: string }

export interface Game {
  id: string; scpName: string; opponent: string; date: string; competition: string; venue: string;
  period: Period; periodLength: number;
  roster: Player[]; oppRoster: OppPlayer[];
  individual: IndRecord[]; collective: ColRecord[];
  timer: Timer;
  excl: { scp: Record<string, ExclState>; opp: Record<string, ExclState> }; exclLog: ExclLog[];
  sprints: Sprint[];
  demo: boolean; created: number; updated: number;
}

export interface Settings {
  teamName: string; periodLength: number; maxInPool: number;
  assistRequired: boolean; autoAttack: boolean; resetClockOnPeriod: boolean;
}

export type Shape = 'circle' | 'square' | 'triangle' | 'diamond';
export interface ActionDef { id: string; sits: string[]; sitOpt?: boolean; assist?: boolean; goal?: boolean; shape: Shape; color: string; stroke?: string }

export type ColFieldKind = 'select' | 'combo' | 'toggle' | 'notes';
export interface ColField { key: keyof ColRecord; label: string; options: string[] | null; kind: ColFieldKind }
export interface ColTable { id: ColTableId; tab: string; side: 'att' | 'def'; title: string; fields: ColField[] }
