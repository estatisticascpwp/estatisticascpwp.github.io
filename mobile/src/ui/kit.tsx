/**
 * Componentes de interface nativos com o aspeto da versão web:
 * painéis brancos sobre fundo verde-acinzentado, títulos condensados em maiúsculas, verde e amarelo SCP.
 */
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { C, F, TONE } from '../theme';
import { Icon, type IconName } from './Icon';

export const useWide = (min = 900) => useWindowDimensions().width >= min;

/* ---------- estrutura ---------- */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}
export function Panel({ children, style }: { children: ReactNode; style?: any }) {
  return <View style={[s.panel, style]}>{children}</View>;
}
/** Colunas lado a lado em ecrãs largos; empilhadas no telemóvel. */
export function Cols({ children, min = 900, gap = 16, flex }: { children: ReactNode; min?: number; gap?: number; flex?: number[] }) {
  const wide = useWide(min);
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', gap, alignItems: wide ? 'flex-start' : 'stretch' }}>
      {items.map((c, i) => <View key={i} style={wide ? { flex: flex?.[i] ?? 1, minWidth: 0 } : undefined}>{c}</View>)}
    </View>
  );
}
export function Row({ children, gap = 8, wrap = true, style }: { children: ReactNode; gap?: number; wrap?: boolean; style?: any }) {
  return <View style={[{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap, alignItems: 'center' }, style]}>{children}</View>;
}

/* ---------- texto ---------- */
export function Title({ children }: { children: ReactNode }) { return <Text style={s.title}>{children}</Text>; }
export function Lead({ children, style }: { children: ReactNode; style?: any }) { return <Text style={[s.lead, style]}>{children}</Text>; }
export function Sub({ children, style }: { children: ReactNode; style?: any }) { return <Text style={[s.sub, style]}>{children}</Text>; }
export function Mini({ children, style }: { children: ReactNode; style?: any }) { return <Text style={[s.mini, style]}>{children}</Text>; }
export function Muted({ children, style }: { children: ReactNode; style?: any }) { return <Text style={[s.muted, style]}>{children}</Text>; }
export function B({ children, style }: { children: ReactNode; style?: any }) { return <Text style={[{ fontFamily: F.bodyBold }, style]}>{children}</Text>; }
export function ViewHead({ title, lead, right }: { title: string; lead?: string; right?: ReactNode }) {
  return (
    <View style={s.viewHead}>
      <View style={{ flexShrink: 1, flexGrow: 1, minWidth: 220 }}>
        <Title>{title}</Title>
        {lead ? <Lead>{lead}</Lead> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
export function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={s.recHead}>
      <Sub>{title}</Sub>
      {right}
    </View>
  );
}

/* ---------- controlos ---------- */
type BtnVariant = 'default' | 'primary' | 'green' | 'outline' | 'danger' | 'ghost';
export function Btn({ label, icon, onPress, variant = 'default', small, disabled, style, onLongPress }: {
  label?: string; icon?: IconName; onPress?: () => void; onLongPress?: () => void; variant?: BtnVariant; small?: boolean; disabled?: boolean; style?: any;
}) {
  const v = BTN[variant];
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }: { pressed: boolean }) => [s.btn, small && s.btnSm, { backgroundColor: v.bg, borderColor: v.border }, pressed && { opacity: 0.8 }, disabled && { opacity: 0.45 }, style]}>
      {icon ? <Icon name={icon} size={small ? 16 : 18} color={v.fg} /> : null}
      {label ? <Text style={[s.btnText, small && { fontSize: 13 }, { color: v.fg }]} numberOfLines={1}>{label}</Text> : null}
    </Pressable>
  );
}
const BTN: Record<BtnVariant, { bg: string; border: string; fg: string }> = {
  default: { bg: C.white, border: C.line, fg: C.ink },
  primary: { bg: C.yellow, border: C.yellow2, fg: '#13331f' },
  green: { bg: C.green, border: C.green, fg: C.white },
  outline: { bg: C.white, border: C.green, fg: C.green },
  danger: { bg: C.red, border: C.red, fg: C.white },
  ghost: { bg: C.soft, border: C.soft, fg: C.ink },
};
export function Chip({ label, on, onPress, left, onColor = C.green2, disabled, style, onLongPress }: {
  label: string; on?: boolean; onPress?: () => void; onLongPress?: () => void; left?: ReactNode; onColor?: string; disabled?: boolean; style?: any;
}) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: !!on }}
      style={[s.chip, on && { backgroundColor: onColor, borderColor: onColor }, disabled && { opacity: 0.45 }, style]}>
      {left}
      <Text style={[s.chipText, on && { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}
export function Seg<T extends string>({ options, value, onChange, labels }: { options: readonly T[]; value: T | null | ''; onChange: (v: T) => void; labels?: Record<string, string> }) {
  return (
    <View style={s.seg}>
      {options.map(o => (
        <Pressable key={o} onPress={() => onChange(o)} style={[s.segBtn, value === o && { backgroundColor: C.green }]} accessibilityRole="button" accessibilityState={{ selected: value === o }}>
          <Text style={[s.segText, value === o && { color: C.white }]}>{labels?.[o] ?? o}</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function ModeSwitch<T extends string>({ options, value, onChange }: { options: { value: T; label: string; danger?: boolean }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.modeSwitch}>
      {options.map(o => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.modeBtn, value === o.value && s.modeOn]}>
          <Text style={[s.modeText, value === o.value && { color: o.danger ? C.red : C.green }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Field({ label, children, style }: { label: string; children: ReactNode; style?: any }) {
  return (
    <View style={[{ gap: 6, minWidth: 140, flexGrow: 1, flexBasis: 150 }, style]}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}
export function Input(props: { value: string; onChangeText: (t: string) => void; placeholder?: string; style?: any; keyboardType?: string; onEndEditing?: () => void; onSubmitEditing?: () => void; autoCapitalize?: string; small?: boolean; accessibilityLabel?: string }) {
  const { small, style, ...rest } = props;
  return <TextInput {...rest} placeholderTextColor="#8a9b97" style={[s.input, small && s.inputSm, style]} />;
}
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <Switch value={value} onValueChange={onChange} trackColor={{ false: '#c8d4d0', true: C.green2 }} thumbColor={C.white} accessibilityLabel={label} />;
}

/* ---------- dados ---------- */
export function Kpi({ k, v, sub }: { k: string; v: string | number; sub?: string }) {
  return (
    <View style={s.kpi}>
      <Text style={s.kpiK}>{k}</Text>
      <Text style={s.kpiV}>{v}</Text>
      {sub ? <Text style={s.kpiS}>{sub}</Text> : null}
    </View>
  );
}
export function Kpis({ children }: { children: ReactNode }) { return <View style={s.kpis}>{children}</View>; }
export function Badge({ text, tone = 'neutral', minWidth = 84 }: { text: string; tone?: keyof typeof TONE; minWidth?: number }) {
  const t = TONE[tone];
  return <View style={[s.badge, { backgroundColor: t.bg, minWidth }]}><Text style={[s.badgeText, { color: t.fg }]} numberOfLines={1}>{text}</Text></View>;
}
export function CapNum({ n, gk, size = 30, on }: { n: number; gk?: boolean; size?: number; on?: boolean }) {
  const bg = on ? (gk ? C.red : C.green) : gk ? C.gkCapBg : C.capBg;
  const fg = on ? C.white : gk ? C.gkCapText : C.deep;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.dispX, fontSize: size * 0.5, color: fg }}>{n}</Text>
    </View>
  );
}

export interface Col { title: string; w: number; align?: 'left' | 'center' | 'right' }
/** Tabela com cabeçalho verde e deslocamento horizontal no telemóvel. */
export function Table({ cols, rows, empty, highlight, rowStyle }: { cols: Col[]; rows: ReactNode[][]; empty?: string; highlight?: (i: number) => boolean; rowStyle?: (i: number) => any }) {
  const total = cols.reduce((a, c) => a + c.w, 0);
  return (
    <ScrollView horizontal style={s.tableWrap} contentContainerStyle={{ minWidth: '100%' }} showsHorizontalScrollIndicator>
      <View style={{ minWidth: total, flexGrow: 1 }}>
        <View style={s.thRow}>
          {cols.map((c, i) => <Text key={i} style={[s.th, { width: c.w, flexGrow: c.align === 'left' ? 1 : 0, textAlign: c.align || 'center' }]}>{c.title}</Text>)}
        </View>
        {rows.length ? rows.map((r, ri) => (
          <View key={ri} style={[s.tr, ri % 2 === 1 && { backgroundColor: C.rowAlt }, highlight?.(ri) && { backgroundColor: C.rowHl }, rowStyle?.(ri)]}>
            {r.map((cell, ci) => (
              <View key={ci} style={[s.td, { width: cols[ci].w, flexGrow: cols[ci].align === 'left' ? 1 : 0, alignItems: cols[ci].align === 'left' ? 'flex-start' : cols[ci].align === 'right' ? 'flex-end' : 'center' }]}>
                {typeof cell === 'string' || typeof cell === 'number' ? <Text style={s.tdText}>{cell}</Text> : cell}
              </View>
            ))}
          </View>
        )) : <Text style={s.empty}>{empty || 'Sem registos.'}</Text>}
      </View>
    </ScrollView>
  );
}
export function RowBtn({ icon, onPress, danger, label }: { icon: IconName; onPress: () => void; danger?: boolean; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={6} style={[s.rowBtn, danger && { backgroundColor: C.red }]}>
      <Icon name={icon} size={16} color={C.white} />
    </Pressable>
  );
}

export interface BarDatum { label: string; v: number; g?: number; n?: number; bad?: boolean }
export function Bars({ items, max, pctFmt }: { items: BarDatum[]; max?: number; pctFmt?: boolean }) {
  if (!items.length) return <Muted style={{ paddingVertical: 8 }}>Ainda sem registos suficientes.</Muted>;
  const M = max || Math.max(...items.map(i => i.v), 1);
  return (
    <View style={{ gap: 8 }}>
      {items.map((i, k) => (
        <View key={k} style={s.barRow}>
          <Text style={s.barLabel} numberOfLines={1}>{i.label}</Text>
          <View style={s.bar}><View style={[s.barFill, { width: `${Math.max(2, (i.v * 100) / M)}%` }, i.bad && { backgroundColor: '#d65b4f' }]} /></View>
          <Text style={s.barVal}>{pctFmt ? `${i.v}%` : i.v}{pctFmt && i.n != null ? <Text style={s.barSmall}> {i.g}/{i.n}</Text> : null}</Text>
        </View>
      ))}
    </View>
  );
}
export function InsightCard({ tone, title, text }: { tone: 'good' | 'bad' | 'info'; title: string; text: string }) {
  const t = tone === 'good' ? { bg: C.okbg, fg: C.ok, s: '↑' } : tone === 'bad' ? { bg: C.badbg, fg: C.bad, s: '!' } : { bg: '#dfeaf5', fg: '#1d4f7a', s: 'i' };
  return (
    <View style={s.ins}>
      <View style={[s.insDot, { backgroundColor: t.bg }]}><Text style={{ color: t.fg, fontFamily: F.bodyBold, fontSize: 15 }}>{t.s}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.insTitle}>{title}</Text>
        <Text style={s.insText}>{text}</Text>
      </View>
    </View>
  );
}
export function Insights({ items }: { items: { tone: 'good' | 'bad' | 'info'; title: string; text: string }[] }) {
  const wide = useWide(700);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
      {items.map((i, k) => <View key={k} style={{ width: wide ? '48.8%' : '100%' }}><InsightCard {...i} /></View>)}
    </View>
  );
}
export function WarnBox({ children }: { children: ReactNode }) { return <View style={s.warnBox}><Text style={s.warnText}>{children}</Text></View>; }
export function NoteBox({ children }: { children: ReactNode }) { return <View style={s.noteBox}><Text style={{ color: '#1d4f7a', fontSize: 13.5, fontFamily: F.body }}>{children}</Text></View>; }

export const s = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48, gap: 16 },
  panel: { backgroundColor: C.panel, borderRadius: 14, padding: 18, shadowColor: '#103c2d', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  viewHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, marginBottom: 14 },
  title: { fontFamily: F.dispX, fontSize: 34, lineHeight: 36, color: C.green, textTransform: 'uppercase', letterSpacing: 0.3 },
  lead: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.muted, marginTop: 6, maxWidth: 680 },
  sub: { fontFamily: F.dispX, fontSize: 24, lineHeight: 27, color: C.deep },
  mini: { fontFamily: F.disp, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 10 },
  muted: { fontFamily: F.body, fontSize: 13.5, color: C.muted, lineHeight: 19 },
  recHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  label: { fontFamily: F.bodyBold, fontSize: 13, color: '#28443c' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 9, paddingHorizontal: 15, minHeight: 44 },
  btnSm: { minHeight: 36, paddingHorizontal: 11 },
  btnText: { fontFamily: F.bodyBold, fontSize: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, backgroundColor: '#f4f7f6', paddingHorizontal: 12, minHeight: 42, borderRadius: 8 },
  chipText: { fontFamily: F.bodyBold, fontSize: 14, color: C.ink },
  seg: { flexDirection: 'row', gap: 4, backgroundColor: C.soft, padding: 4, borderRadius: 10 },
  segBtn: { flex: 1, minHeight: 42, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segText: { fontFamily: F.disp, fontSize: 17, color: C.ink },
  modeSwitch: { flexDirection: 'row', backgroundColor: C.soft, padding: 4, borderRadius: 10, gap: 4, alignSelf: 'flex-start' },
  modeBtn: { paddingHorizontal: 14, minHeight: 40, borderRadius: 7, justifyContent: 'center' },
  modeOn: { backgroundColor: C.white, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  modeText: { fontFamily: F.bodyBold, fontSize: 14, color: C.ink },
  input: { borderWidth: 1, borderColor: '#c7d5cf', borderRadius: 8, paddingHorizontal: 11, minHeight: 44, backgroundColor: C.white, fontFamily: F.body, fontSize: 15, color: C.ink },
  inputSm: { minHeight: 36, paddingHorizontal: 8, fontSize: 14 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.panelAlt, flexGrow: 1, flexBasis: 150, minWidth: 140 },
  kpiK: { fontFamily: F.disp, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.muted },
  kpiV: { fontFamily: F.dispX, fontSize: 34, lineHeight: 38, color: C.deep },
  kpiS: { fontFamily: F.body, fontSize: 12.5, color: C.muted },
  badge: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4, alignItems: 'center' },
  badgeText: { fontFamily: F.bodyBold, fontSize: 12 },
  tableWrap: { borderWidth: 1, borderColor: C.line, borderRadius: 10 },
  thRow: { flexDirection: 'row', backgroundColor: C.deep },
  th: { color: C.white, fontFamily: F.bodyBold, fontSize: 12.5, paddingVertical: 10, paddingHorizontal: 8 },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#dde5e2', alignItems: 'center' },
  td: { paddingVertical: 8, paddingHorizontal: 8, justifyContent: 'center' },
  tdText: { fontFamily: F.body, fontSize: 13.5, color: C.ink, fontVariant: ['tabular-nums'] },
  empty: { padding: 20, color: '#6f8380', fontFamily: F.body, fontSize: 14 },
  rowBtn: { width: 34, height: 32, borderRadius: 6, backgroundColor: C.green2, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 118, fontFamily: F.body, fontSize: 13.5, color: C.ink },
  bar: { flex: 1, height: 12, backgroundColor: C.soft, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.green2, borderRadius: 6 },
  barVal: { width: 78, textAlign: 'right', fontFamily: F.bodyBold, fontSize: 13.5, color: C.ink, fontVariant: ['tabular-nums'] },
  barSmall: { fontFamily: F.body, color: C.muted, fontSize: 12 },
  ins: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#f5f8f7', borderWidth: 1, borderColor: C.line },
  insDot: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  insTitle: { fontFamily: F.disp, fontSize: 17, color: C.ink, marginBottom: 2 },
  insText: { fontFamily: F.body, fontSize: 13.5, color: '#33504a', lineHeight: 19 },
  warnBox: { backgroundColor: '#fff6d6', borderWidth: 1, borderColor: '#efd067', borderRadius: 9, padding: 10, marginTop: 12 },
  warnText: { color: '#5d4600', fontFamily: F.body, fontSize: 14 },
  noteBox: { backgroundColor: '#e3f0fb', borderRadius: 9, padding: 10, marginTop: 10 },
});
