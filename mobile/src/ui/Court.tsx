/**
 * Meio-campo (16:8) e baliza desenhados em SVG nativo, com o mesmo sistema de coordenadas
 * da versão web (viewBox 160×80; coordenadas guardadas entre 0 e 1).
 */
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { actDef, GOAL_CELLS } from '../domain/constants';
import { clamp, groupBy, r3 } from '../domain/format';
import type { IndRecord, Shape } from '../domain/types';
import { F } from '../theme';

export interface Pt { x: number; y: number }
const f2 = (n: number) => Math.round(n * 100) / 100;

export function ShapeMark({ shape, x, y, s, fill, stroke, sw }: { shape: Shape; x: number; y: number; s: number; fill: string; stroke: string; sw?: number }) {
  const w = sw ?? s * 0.3;
  const p = { fill, stroke, strokeWidth: w };
  if (shape === 'square') return <Rect x={f2(x - s)} y={f2(y - s)} width={f2(2 * s)} height={f2(2 * s)} rx={f2(s * 0.18)} {...p} />;
  if (shape === 'triangle') return <Polygon points={`${f2(x)},${f2(y - s * 1.2)} ${f2(x + s * 1.15)},${f2(y + s * 0.85)} ${f2(x - s * 1.15)},${f2(y + s * 0.85)}`} strokeLinejoin="round" {...p} />;
  if (shape === 'diamond') return <Polygon points={`${f2(x)},${f2(y - s * 1.2)} ${f2(x + s * 1.2)},${f2(y)} ${f2(x)},${f2(y + s * 1.2)} ${f2(x - s * 1.2)},${f2(y)}`} {...p} />;
  return <Circle cx={f2(x)} cy={f2(y)} r={f2(s)} {...p} />;
}
/** Ícone pequeno da forma/cor de uma ação (legendas, botões, tabelas). */
export function ActIcon({ mode, action, size = 14 }: { mode: 'field' | 'gk'; action: string; size?: number }) {
  const a = actDef(mode, action) || { shape: 'circle' as Shape, color: '#999', stroke: undefined };
  return (
    <Svg width={size} height={size} viewBox="-5 -5 10 10">
      <ShapeMark shape={a.shape} x={0} y={0} s={3.3} fill={a.color} stroke={a.stroke || 'rgba(0,0,0,0.35)'} sw={0.8} />
    </Svg>
  );
}
/** Marcadores dos registos guardados. which: 'f' = campo, 'g' = baliza. */
export function Markers({ rows, which, stroke, size = 2.5, hl }: { rows: IndRecord[]; which: 'f' | 'g'; stroke: string; size?: number; hl?: string | null }) {
  return (
    <G>
      {rows.map(r => {
        const x = which === 'f' ? r.fx : r.gx, y = which === 'f' ? r.fy : r.gy;
        if (x == null || y == null) return null;
        const a = actDef(r.mode, r.action) || { shape: 'circle' as Shape, color: '#999', stroke: undefined };
        const big = hl === r.id;
        return <ShapeMark key={r.id + which} shape={a.shape} x={x * 160} y={y * 80} s={big ? size * 1.9 : size} fill={a.color} stroke={big ? '#0b2e1d' : a.stroke || stroke} sw={big ? 1 : 0.7} />;
      })}
    </G>
  );
}
const TempMarker = ({ p }: { p: Pt }) => (
  <G>
    <Circle cx={p.x * 160} cy={p.y * 80} r={3.3} fill="none" stroke="#0b2e1d" strokeWidth={1.5} />
    <Circle cx={p.x * 160} cy={p.y * 80} r={3.3} fill="none" stroke="#fcd116" strokeWidth={0.8} />
  </G>
);

/** Área tocável com proporção 2:1; devolve coordenadas normalizadas. */
function TapArea({ onTap, disabled, children, dim }: { onTap?: (p: Pt) => void; disabled?: boolean; children: ReactNode; dim?: boolean }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <Pressable
      onLayout={(e: any) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onPress={(e: any) => {
        if (!onTap || disabled || !size.w) return;
        const { locationX, locationY } = e.nativeEvent;
        onTap({ x: r3(clamp(locationX / size.w, 0, 1)), y: r3(clamp(locationY / size.h, 0, 1)) });
      }}
      disabled={!onTap}
      style={{ width: '100%', aspectRatio: 2, borderRadius: 8, overflow: 'hidden', opacity: dim ? 0.35 : 1 }}>
      <View pointerEvents="none" style={{ flex: 1 }}>
        <Svg width="100%" height="100%" viewBox="0 0 160 80" preserveAspectRatio="none">{children}</Svg>
      </View>
    </Pressable>
  );
}

const t1 = 160 / 3, t2 = 320 / 3, Y2 = 12.8, Y6 = 38.4, Y12 = 76.8;
function PitchBase({ labels = true }: { labels?: boolean }) {
  return (
    <G>
      {Array.from({ length: 16 }, (_, i) => <Rect key={i} x={0} y={i * 5} width={160} height={5} fill={i % 2 ? '#2777ae' : '#2a7db5'} />)}
      <Line x1={t1} y1={Y2} x2={t1} y2={Y12} stroke="#fff" strokeOpacity={0.28} strokeWidth={0.4} strokeDasharray="1.5 1.5" />
      <Line x1={t2} y1={Y2} x2={t2} y2={Y12} stroke="#fff" strokeOpacity={0.28} strokeWidth={0.4} strokeDasharray="1.5 1.5" />
      <Line x1={0} y1={Y2} x2={160} y2={Y2} stroke="#ff4b4b" strokeWidth={0.9} />
      <Line x1={0} y1={Y6} x2={160} y2={Y6} stroke="#fcd116" strokeWidth={0.9} />
      <Line x1={0} y1={Y12} x2={160} y2={Y12} stroke="#ffffff" strokeWidth={0.7} strokeDasharray="3 1.5" />
      <SvgText x={2} y={Y2 - 1.2} fontSize={3.6} fill="#ffd2d2" fontFamily={F.disp}>2M</SvgText>
      <SvgText x={2} y={Y6 - 1.2} fontSize={3.6} fill="#fff1a8" fontFamily={F.disp}>6M</SvgText>
      <SvgText x={2} y={Y12 - 1.2} fontSize={3.6} fill="#ffffff" fontFamily={F.disp}>12M</SvgText>
      {labels ? (
        <G fill="#ffffff" fillOpacity={0.42}>
          {[['PONTA ESQ.', t1 / 2, 26.8], ['PIVOT', 80, 26.8], ['PONTA DIR.', (t2 + 160) / 2, 26.8], ['LATERAL ESQ.', t1 / 2, 58.8], ['CENTRAL', 80, 58.8], ['LATERAL DIR.', (t2 + 160) / 2, 58.8]].map(([t, x, y]) => (
            <SvgText key={t as string} x={x as number} y={y as number} fontSize={3.4} textAnchor="middle" fontFamily={F.disp}>{t as string}</SvgText>
          ))}
        </G>
      ) : null}
      <Path d={`M${t1} 0 V3.2 H${t2} V0`} fill="rgba(255,255,255,0.28)" stroke="#fff" strokeWidth={0.9} />
    </G>
  );
}
export function Pitch({ rows = [], temp, onTap, hl, markerSize = 2.5 }: { rows?: IndRecord[]; temp?: Pt | null; onTap?: (p: Pt) => void; hl?: string | null; markerSize?: number }) {
  return (
    <TapArea onTap={onTap}>
      <PitchBase />
      <Markers rows={rows} which="f" stroke="#ffffff" size={markerSize} hl={hl} />
      {temp ? <TempMarker p={temp} /> : null}
    </TapArea>
  );
}

const cw = 140 / 3, ch = 70 / 3;
const shortCell = (n: string) => n.replace('Canto ', '').replace('Superior', 'Sup.').replace('Inferior', 'Inf.').replace('Esquerdo', 'Esq.').replace('Direito', 'Dir.').toUpperCase();
function GoalBase({ labels = true }: { labels?: boolean }) {
  return (
    <G>
      <Rect x={10} y={10} width={140} height={70} fill="#e8f0f3" />
      {Array.from({ length: 28 }, (_, i) => <Line key={'v' + i} x1={10 + i * 5} y1={10} x2={10 + i * 5} y2={80} stroke="#c4d3da" strokeWidth={0.35} />)}
      {Array.from({ length: 14 }, (_, i) => <Line key={'h' + i} x1={10} y1={10 + i * 5} x2={150} y2={10 + i * 5} stroke="#c4d3da" strokeWidth={0.35} />)}
      <G stroke="#7e98a4" strokeWidth={0.4} strokeDasharray="1.6 1.4">
        <Line x1={10 + cw} y1={10} x2={10 + cw} y2={80} /><Line x1={10 + 2 * cw} y1={10} x2={10 + 2 * cw} y2={80} />
        <Line x1={10} y1={10 + ch} x2={150} y2={10 + ch} /><Line x1={10} y1={10 + 2 * ch} x2={150} y2={10 + 2 * ch} />
      </G>
      {labels ? (
        <G fill="#5d7884" fillOpacity={0.55}>
          {GOAL_CELLS.map((row, r) => row.map((n, c) => (
            <SvgText key={n} x={10 + cw * c + cw / 2} y={10 + ch * r + ch / 2 + 1.2} fontSize={3.2} textAnchor="middle" fontFamily={F.disp}>{shortCell(n)}</SvgText>
          )))}
        </G>
      ) : null}
      <Rect x={0} y={0} width={10} height={80} fill="#fafafa" stroke="#8aa0a8" strokeWidth={0.5} />
      <Rect x={150} y={0} width={10} height={80} fill="#fafafa" stroke="#8aa0a8" strokeWidth={0.5} />
      <Rect x={0} y={0} width={160} height={10} fill="#fafafa" stroke="#8aa0a8" strokeWidth={0.5} />
      <SvgText x={80} y={6.6} fontSize={3.6} fill="#8aa0a8" textAnchor="middle" fontFamily={F.disp}>BARRA</SvgText>
      <SvgText x={5} y={45} fontSize={3.2} fill="#8aa0a8" textAnchor="middle" fontFamily={F.disp} transform="rotate(-90 5 45)">POSTE</SvgText>
      <SvgText x={155} y={45} fontSize={3.2} fill="#8aa0a8" textAnchor="middle" fontFamily={F.disp} transform="rotate(90 155 45)">POSTE</SvgText>
    </G>
  );
}
export function GoalView({ rows = [], temp, onTap, disabled, hl, markerSize = 2.5 }: { rows?: IndRecord[]; temp?: Pt | null; onTap?: (p: Pt) => void; disabled?: boolean; hl?: string | null; markerSize?: number }) {
  return (
    <TapArea onTap={onTap} dim={disabled}>
      <GoalBase />
      <Markers rows={rows} which="g" stroke="#203631" size={markerSize} hl={hl} />
      {temp ? <TempMarker p={temp} /> : null}
    </TapArea>
  );
}

/* ---------- mapas de análise ---------- */
const ZONE_RECTS: [string, number, number, number, number][] = [['Zona 2M', 0, 0, 160, 12.8], ['Ponta Esquerda', 0, 12.8, t1, 25.6], ['Pivot', t1, 12.8, t1, 25.6], ['Ponta Direita', t2, 12.8, t1, 25.6], ['Lateral Esquerda', 0, 38.4, t1, 38.4], ['Central', t1, 38.4, t1, 38.4], ['Lateral Direita', t2, 38.4, t1, 38.4], ['Meio-campo (+12M)', 0, 76.8, 160, 3.2]];
/** Eficácia de remate por zona: amarelo mais forte = maior % de golo. */
export function ZoneMap({ shots }: { shots: IndRecord[] }) {
  const by = groupBy(shots, 'fzone');
  return (
    <TapArea>
      <Rect x={0} y={0} width={160} height={80} fill="#2a7db5" />
      {ZONE_RECTS.map(([z, x, y, w, h]) => {
        const rs = by.get(z) || [], n = rs.length, gg = rs.filter(r => r.action === 'Golo').length, e = n ? gg / n : 0;
        return (
          <G key={z}>
            <Rect x={x} y={y} width={w} height={h} fill={n ? '#fcd116' : 'none'} fillOpacity={n ? 0.12 + 0.75 * e : 0} stroke="rgba(255,255,255,0.5)" strokeWidth={0.4} />
            {h > 8 && n ? (
              <G>
                <SvgText x={x + w / 2} y={y + h / 2 - 1} textAnchor="middle" fontSize={7} fill="#fff" stroke="#0b3a55" strokeWidth={0.5} fontFamily={F.dispX}>{Math.round(e * 100) + '%'}</SvgText>
                <SvgText x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize={3.6} fill="#fff" fontFamily={F.disp}>{`${gg}/${n} golos`}</SvgText>
              </G>
            ) : null}
          </G>
        );
      })}
      <Line x1={0} y1={12.8} x2={160} y2={12.8} stroke="#ff4b4b" strokeWidth={0.8} />
      <Line x1={0} y1={38.4} x2={160} y2={38.4} stroke="#fcd116" strokeWidth={0.8} />
      <Path d={`M${t1} 0 V3.2 H${t2} V0`} fill="rgba(255,255,255,0.3)" stroke="#fff" strokeWidth={0.8} />
    </TapArea>
  );
}
/** Número de remates por zona da baliza, com intensidade de cor. */
export function GoalHeat({ rows, color }: { rows: IndRecord[]; color: string }) {
  const by = groupBy(rows, 'gzone');
  const max = Math.max(1, ...[...by.values()].map(x => x.length));
  const cell = (z: string, x: number, y: number, w: number, h: number, fs: number) => {
    const n = (by.get(z) || []).length;
    return (
      <G key={z}>
        <Rect x={x} y={y} width={w} height={h} fill={n ? color : 'none'} fillOpacity={n ? 0.15 + (0.7 * n) / max : 0} stroke="#a9bcc4" strokeWidth={0.4} />
        {n ? <SvgText x={x + w / 2} y={y + h / 2 + fs * 0.35} textAnchor="middle" fontSize={fs} fill="#102b24" fontFamily={F.dispX}>{String(n)}</SvgText> : null}
      </G>
    );
  };
  return (
    <TapArea>
      <Rect x={10} y={10} width={140} height={70} fill="#eef4f6" />
      {GOAL_CELLS.map((row, r) => row.map((z, c) => cell(z, 10 + cw * c, 10 + ch * r, cw, ch, 9)))}
      <Rect x={0} y={0} width={10} height={80} fill="#fafafa" stroke="#8aa0a8" strokeWidth={0.5} />{cell('Poste Esquerdo', 0, 10, 10, 70, 5)}
      <Rect x={150} y={0} width={10} height={80} fill="#fafafa" stroke="#8aa0a8" strokeWidth={0.5} />{cell('Poste Direito', 150, 10, 10, 70, 5)}
      <Rect x={0} y={0} width={160} height={10} fill="#fafafa" stroke="#8aa0a8" strokeWidth={0.5} />{cell('Barra', 10, 0, 140, 10, 6)}
    </TapArea>
  );
}
