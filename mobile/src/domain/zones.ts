import { DIST_BANDS, GOAL_CELLS } from './constants';
import type { IndRecord } from './types';

/**
 * Meio-campo de 16m × 8m (x: 0 = esquerda, y: 0 = linha de golo).
 * y × 12,5 = metros à linha de golo (o desenho mostra 12,8 m de profundidade).
 */
export function fieldZone(x: number, y: number): string {
  const m = y * 12.5, c = Math.min(2, Math.floor(x * 3));
  if (m < 2) return 'Zona 2M';
  if (m < 6) return ['Ponta Esquerda', 'Pivot', 'Ponta Direita'][c];
  if (m < 12) return ['Lateral Esquerda', 'Central', 'Lateral Direita'][c];
  return 'Meio-campo (+12M)';
}
/** Baliza desenhada em 160×80: postes de 10 de largura, barra de 10 de altura, 9 quadrantes. */
export function goalZone(x: number, y: number): string {
  const X = x * 160, Y = y * 80;
  if (Y < 10) return 'Barra';
  if (X < 10) return 'Poste Esquerdo';
  if (X > 150) return 'Poste Direito';
  const c = Math.min(2, Math.floor((X - 10) / (140 / 3)));
  const r = Math.min(2, Math.floor((Y - 10) / (70 / 3)));
  return GOAL_CELLS[r][c];
}
export function distBand(r: Pick<IndRecord, 'fy'>): string | null {
  if (r.fy == null) return null;
  const m = r.fy * 12.5;
  const b = DIST_BANDS.find(([, a, z]) => m >= a && m < z);
  return b ? b[0] : null;
}
