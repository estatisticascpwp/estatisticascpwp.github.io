import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { askImportMode, fileStamp, setPeriod } from '../actions';
import { ACTIONS, actDef, IND_CSV, PERIODS } from '../domain/constants';
import { csvObjects, toCSV } from '../domain/csv';
import { numPT, parseNum, r3, uid } from '../domain/format';
import { namedRoster, player, plabel, pname } from '../domain/model';
import type { IndRecord, Mode, Period } from '../domain/types';
import { fieldZone, goalZone } from '../domain/zones';
import { G, mutate, settings, useScreenState, useStore } from '../store/store';
import { C, F } from '../theme';
import { ActIcon, GoalView, Pitch, type Pt } from '../ui/Court';
import { confirm, toast } from '../ui/dialogs';
import { exportText, importText } from '../ui/files';
import { Btn, CapNum, Chip, Field, ModeSwitch, Muted, NoteBox, Panel, Row, RowBtn, Screen, SectionHead, Seg, Table, ViewHead, WarnBox } from '../ui/kit';
import { Select } from '../ui/Select';

interface FormState {
  mode: Mode; editing: string | null; period: Period | null; player: number | null; action: string | null;
  sit: string | null; assist: number | 'none' | null; f: Pt | null; g: Pt | null; showWarn: boolean;
  filters: { period: string; player: string; action: string }; hl: string | null;
}
const INIT: FormState = { mode: 'field', editing: null, period: null, player: null, action: null, sit: null, assist: null, f: null, g: null, showWarn: false, filters: { period: '', player: '', action: '' }, hl: null };
const CLEAR = { editing: null, period: null, player: null, action: null, sit: null, assist: null, f: null, g: null, showWarn: false };

export default function Individual() {
  useStore();
  const g = G();
  const { width } = useWindowDimensions();
  const three = width >= 1150, two = width >= 760;
  const [st, setSt] = useScreenState<FormState>('individual', INIT);
  const set = (p: Partial<FormState>) => setSt(prev => ({ ...prev, ...p }));
  const gk = st.mode === 'gk';
  const a = st.action ? actDef(st.mode, st.action) : undefined;
  const period = (st.editing ? st.period : g.period) as Period;

  const reqs: [string, boolean][] = [['Período', !!period], ['Jogador', !!st.player], ['Local no campo', !!st.f], ['Tipo de ação', !!a]];
  if (a) {
    if (a.goal) reqs.push(['Local na baliza', !!st.g]);
    if (a.sits.length && !a.sitOpt) reqs.push(['Situação de jogo', !!st.sit]);
    if (a.assist && settings().assistRequired) reqs.push(['Assistência', !!st.assist]);
  }
  const miss = reqs.filter(r => !r[1]).map(r => r[0].toLowerCase());
  const naGoal = !!a && !a.goal;

  const pickPlayer = (n: number) => {
    const p = player(g, n)!; const m: Mode = p.gr ? 'gk' : 'field';
    if (m !== st.mode) {
      setSt(prev => ({ ...prev, mode: m, action: null, sit: null, assist: null, player: n, editing: null, period: null, filters: { period: '', player: '', action: '' } }));
      toast(m === 'gk' ? 'Guarda-redes selecionado: ações e registos de GR' : 'Jogador de campo selecionado');
      return;
    }
    set({ player: st.player === n ? null : n, assist: st.assist === n ? null : st.assist });
  };
  const pickAction = (id: string) => {
    const next = st.action === id ? null : id; const d = next ? actDef(st.mode, next) : undefined;
    set({ action: next, sit: d && d.sits.includes(st.sit || '') ? st.sit : null, assist: d && d.assist ? st.assist : null, g: d && !d.goal ? null : st.g });
  };
  const save = () => {
    if (miss.length) { set({ showWarn: true }); toast('Faltam pressupostos: ' + miss.join(', '), 'warn'); return; }
    const prev = st.editing ? g.individual.find(x => x.id === st.editing) : undefined;
    const rec: IndRecord = {
      id: st.editing || uid(), mode: st.mode, period, player: st.player!, playerName: pname(g, st.player!), action: st.action!,
      sit: a!.sits.length ? st.sit || '' : '', assist: a!.assist ? (st.assist ?? '') : '',
      fx: st.f!.x, fy: st.f!.y, fzone: fieldZone(st.f!.x, st.f!.y),
      gx: a!.goal && st.g ? st.g.x : null, gy: a!.goal && st.g ? st.g.y : null, gzone: a!.goal && st.g ? goalZone(st.g.x, st.g.y) : '',
      ts: prev ? prev.ts : Date.now(),
    };
    mutate(x => { if (prev) x.individual = x.individual.map(r => (r.id === rec.id ? rec : r)); else x.individual.push(rec); });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast(prev ? 'Registo atualizado' : `Guardado: ${plabel(g, rec.player)} · ${rec.action}`);
    set(CLEAR);
  };
  const f = st.filters;
  const rows = g.individual.filter(r => r.mode === st.mode && (!f.period || r.period === f.period) && (!f.player || String(r.player) === f.player) && (!f.action || r.action === f.action));
  const markerRows = rows.filter(r => r.id !== st.editing);
  const playersWithRecs = [...new Set(g.individual.filter(r => r.mode === st.mode).map(r => r.player))].sort((x, y) => x - y);
  const setF = (p: Partial<FormState['filters']>) => set({ filters: { ...f, ...p } });

  const sits = a ? a.sits : gk ? ACTIONS.gk[0].sits : [...new Set(ACTIONS.field.flatMap(x => x.sits))];
  const capW = three ? '48%' : two ? '31.5%' : '48%';

  const stepPeriod = (
    <Step n={1} done={!!period} title="Período">
      <Seg options={PERIODS} value={period} onChange={p => (st.editing ? set({ period: p }) : setPeriod(p))} />
    </Step>
  );
  const stepPlayer = (
    <Step n={2} done={!!st.player} title="Jogador" hint="nomes de Jogadores / Exclusões">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {namedRoster(g).map(p => {
          const on = st.player === p.n, dim = (p.gr ? 'gk' : 'field') !== st.mode;
          return (
            <Pressable key={p.n} onPress={() => pickPlayer(p.n)} style={[is.cap, { width: capW as any }, on && (p.gr ? is.capOnGk : is.capOn), dim && { opacity: 0.4 }]} accessibilityLabel={plabel(g, p.n)}>
              <CapNum n={p.n} gk={p.gr} on={on} />
              <Text style={is.capName} numberOfLines={1}>{p.name || (p.gr ? 'GR' : '—')}</Text>
            </Pressable>
          );
        })}
      </View>
    </Step>
  );
  const pitchCard = (
    <View style={is.pitchCard}>
      <View style={is.pcHead}><StepTitle n={3} done={!!st.f} title="Localização do jogador" /><ZoneTag text={st.f ? fieldZone(st.f.x, st.f.y) : 'Toca no campo'} set={!!st.f} /></View>
      <Pitch rows={markerRows} temp={st.f} hl={st.hl} onTap={p => set({ f: p })} />
      <View style={is.legend}>{ACTIONS[st.mode].map(x => <View key={x.id} style={is.legendItem}><ActIcon mode={st.mode} action={x.id} /><Text style={is.legendText}>{x.id}</Text></View>)}</View>
    </View>
  );
  const goalCard = (
    <View style={is.pitchCard}>
      <View style={is.pcHead}><StepTitle n={4} done={!!st.g && !naGoal} title="Local do remate na baliza" /><ZoneTag text={naGoal ? 'Não aplicável' : st.g ? goalZone(st.g.x, st.g.y) : 'Toca na baliza'} set={!!st.g && !naGoal} /></View>
      <GoalView rows={markerRows} temp={naGoal ? null : st.g} hl={st.hl} disabled={naGoal}
        onTap={p => { if (naGoal) { toast(`"${a!.id}" não regista local na baliza.`, 'warn'); return; } set({ g: p }); }} />
      {naGoal ? <Muted style={{ marginTop: 6 }}>Esta ação não regista local na baliza.</Muted> : null}
    </View>
  );
  const stepAction = (
    <Step n={5} done={!!a} title="Tipo de ação">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {ACTIONS[st.mode].map(x => (
          <Pressable key={x.id} onPress={() => pickAction(x.id)} style={[is.act, st.action === x.id && is.actOn]}>
            <ActIcon mode={st.mode} action={x.id} />
            <Text style={[is.actText, st.action === x.id && { color: C.white }]} numberOfLines={2}>{x.id}</Text>
          </Pressable>
        ))}
      </View>
    </Step>
  );
  const stepSit = a && !a.sits.length ? null : (
    <Step n={6} done={!!st.sit} title="Situação de jogo" hint={a ? (a.sitOpt ? 'opcional' : '') : 'escolhe primeiro a ação'}>
      <Row gap={6}>{sits.map(s => <Chip key={s} label={s} on={st.sit === s} disabled={!a} onPress={() => set({ sit: st.sit === s ? null : s })} />)}</Row>
    </Step>
  );
  const stepAssist = a && a.assist ? (
    <Step n={7} done={!!st.assist} title="Assistência" hint={settings().assistRequired ? '' : 'opcional'}>
      <Row gap={6}>
        <Chip label="Sem assistência" on={st.assist === 'none'} onPress={() => set({ assist: st.assist === 'none' ? null : 'none' })} />
        {namedRoster(g).filter(p => p.n !== st.player).map(p => <Chip key={p.n} label={`${p.n}${p.name ? ' · ' + p.name : ''}`} on={st.assist === p.n} onPress={() => set({ assist: st.assist === p.n ? null : p.n })} />)}
      </Row>
    </Step>
  ) : null;
  const stepSave = (
    <View style={is.step}>
      <Text style={is.stepTitle}>Pressupostos</Text>
      <Row gap={6}>{reqs.map(([l, ok]) => <Text key={l} style={[is.req, ok && is.reqOk]}>{ok ? '✓' : '•'} {l}</Text>)}</Row>
      {st.showWarn && miss.length ? <WarnBox>Faltam pressupostos: {miss.join(', ')}.</WarnBox> : null}
      {st.editing ? <NoteBox>A editar um registo. Altera o que precisares e carrega em Atualizar registo, ou em Limpar para cancelar.</NoteBox> : null}
      <Row style={{ justifyContent: 'flex-end', marginTop: 12 }}>
        <Btn label="Limpar" icon="reset" variant="ghost" onPress={() => set(CLEAR)} />
        <Btn label={st.editing ? 'Atualizar registo' : 'Guardar registo'} icon="save" variant="primary" onPress={save} />
      </Row>
    </View>
  );

  return (
    <Screen>
      <Panel>
        <ViewHead title="Estatística Individual" lead="Segue os passos por ordem. Os registos de guarda-redes e de jogadores de campo são separados: escolher um GR mostra só as ações e os registos de GR."
          right={<ModeSwitch value={st.mode} onChange={m => { if (m !== st.mode) setSt(prev => ({ ...prev, ...CLEAR, mode: m, filters: { period: '', player: '', action: '' } })); }} options={[{ value: 'field', label: 'Jogadores de campo' }, { value: 'gk', label: 'Guarda-redes', danger: true }]} />} />
        {three ? (
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ flex: 0.85, gap: 12 }}>{stepPeriod}{stepPlayer}</View>
            <View style={{ flex: 1.5, gap: 12 }}>{pitchCard}{goalCard}</View>
            <View style={{ flex: 1, gap: 12 }}>{stepAction}{stepSit}{stepAssist}{stepSave}</View>
          </View>
        ) : two ? (
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 12 }}>{stepPeriod}{stepPlayer}{stepAction}{stepSit}{stepAssist}</View>
            <View style={{ flex: 1.2, gap: 12 }}>{pitchCard}{goalCard}{stepSave}</View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>{stepPeriod}{stepPlayer}{pitchCard}{stepAction}{goalCard}{stepSit}{stepAssist}{stepSave}</View>
        )}
      </Panel>

      <Panel>
        <SectionHead title={gk ? 'Registos — Guarda-redes' : 'Registos — Jogadores de campo'} right={
          <Row>
            <Btn small label="Exportar CSV" icon="download" variant="outline" onPress={exportIndividual} />
            <Btn small label="Importar CSV" icon="upload" variant="ghost" onPress={importIndividual} />
            <Btn small label="Apagar todos" icon="trash" variant="danger" onPress={async () => {
              const n = g.individual.filter(r => r.mode === st.mode).length;
              if (!n) { toast('Não há registos para apagar.'); return; }
              if (!(await confirm('Apagar registos', `Apagar os **${n}** registos ${gk ? 'de guarda-redes' : 'de jogadores de campo'} deste jogo? Não é possível desfazer.`, 'Apagar todos'))) return;
              mutate(x => { x.individual = x.individual.filter(r => r.mode !== st.mode); }); set(CLEAR); toast('Registos apagados');
            }} />
          </Row>} />
        <Row gap={10} style={{ marginVertical: 12, alignItems: 'flex-end' }}>
          <Field label="Período"><Select value={f.period} emptyLabel="Todos" options={PERIODS} onChange={v => setF({ period: v })} title="Filtrar por período" /></Field>
          <Field label="Jogador"><Select value={f.player} emptyLabel="Todos" options={playersWithRecs.map(n => ({ value: String(n), label: plabel(g, n) }))} onChange={v => setF({ player: v })} title="Filtrar por jogador" /></Field>
          <Field label="Ação"><Select value={f.action} emptyLabel="Todas" options={ACTIONS[st.mode].map(x => x.id)} onChange={v => setF({ action: v })} title="Filtrar por ação" /></Field>
          <Btn small label="Limpar filtros" icon="reset" variant="ghost" onPress={() => set({ filters: { period: '', player: '', action: '' } })} />
        </Row>
        <Muted style={{ marginBottom: 10 }}>Os filtros também se aplicam aos marcadores no campo e na baliza. Toca numa linha para a destacar no mapa.</Muted>
        <Table
          cols={[{ title: '#', w: 40 }, { title: 'Período', w: 64 }, { title: 'Jogador', w: 150, align: 'left' }, { title: 'Ação', w: 160, align: 'left' }, { title: 'Situação', w: 90 },
            ...(gk ? [] : [{ title: 'Assistência', w: 150 }]), { title: 'Zona campo', w: 130 }, { title: 'Zona baliza', w: 170 }, { title: 'Ações', w: 90 }]}
          highlight={i => rows[i].id === st.editing || rows[i].id === st.hl}
          empty={`Ainda não há registos ${gk ? 'de guarda-redes' : 'de jogadores de campo'}${f.period || f.player || f.action ? ' com estes filtros' : ''}.`}
          rows={rows.map((r, i) => [
            <Pressable key="n" onPress={() => set({ hl: st.hl === r.id ? null : r.id })} hitSlop={8}><Text style={is.td}>{i + 1}</Text></Pressable>,
            r.period,
            <Pressable key="p" onPress={() => set({ hl: st.hl === r.id ? null : r.id })}><Text style={is.td}>{plabel(g, r.player)}</Text></Pressable>,
            <Pressable key="a" onPress={() => set({ hl: st.hl === r.id ? null : r.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><ActIcon mode={r.mode} action={r.action} /><Text style={[is.td, { fontFamily: F.bodyBold }]}>{r.action}</Text></Pressable>,
            r.sit || '—',
            ...(gk ? [] : [r.assist === 'none' ? 'Sem assistência' : r.assist ? plabel(g, r.assist) : '—']),
            r.fzone || '—', r.gzone || '—',
            <Row key="x" gap={2} wrap={false}>
              <RowBtn icon="edit" label="Editar" onPress={() => set({ editing: r.id, period: r.period, player: r.player, action: r.action, sit: r.sit || null, assist: r.assist === '' ? null : r.assist, f: r.fx != null && r.fy != null ? { x: r.fx, y: r.fy } : null, g: r.gx != null && r.gy != null ? { x: r.gx, y: r.gy } : null, showWarn: false })} />
              <RowBtn icon="trash" danger label="Apagar" onPress={async () => {
                if (!(await confirm('Apagar registo', 'Apagar este registo?', 'Apagar'))) return;
                mutate(x => { x.individual = x.individual.filter(y => y.id !== r.id); });
                if (st.editing === r.id) set(CLEAR);
              }} />
            </Row>,
          ])}
        />
        <Muted style={{ marginTop: 8 }}>{rows.length} registo(s)</Muted>
      </Panel>
    </Screen>
  );
}

function StepTitle({ n, done, title }: { n: number; done: boolean; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={[is.stepN, done && { backgroundColor: C.yellow }]}><Text style={[is.stepNText, done && { color: '#0b2e1d' }]}>{n}</Text></View>
      <Text style={is.stepTitle}>{title}</Text>
    </View>
  );
}
function Step({ n, done, title, hint, children }: { n: number; done: boolean; title: string; hint?: string; children: any }) {
  return (
    <View style={is.step}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        <StepTitle n={n} done={done} title={title} />
        {hint ? <Text style={is.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}
const ZoneTag = ({ text, set }: { text: string; set: boolean }) => <Text style={[is.zone, set && is.zoneSet]} numberOfLines={1}>{text}</Text>;

function exportIndividual() {
  const g = G(), rows = g.individual.slice().sort((a, b) => a.ts - b.ts);
  if (!rows.length) { toast('Não há registos para exportar.', 'warn'); return; }
  exportText('estatistica_individual_' + fileStamp() + '.csv', toCSV([IND_CSV, ...rows.map(r => [r.mode === 'gk' ? 'GR' : 'Campo', r.period, r.player, pname(g, r.player), r.action, r.sit, r.assist === 'none' ? '' : r.assist, r.assist === 'none' ? 'Sem assistência' : r.assist ? pname(g, r.assist) : '', r.fzone, r.fx != null ? numPT(r.fx * 100) : '', r.fy != null ? numPT(r.fy * 100) : '', r.gzone, r.gx != null ? numPT(r.gx * 100) : '', r.gy != null ? numPT(r.gy * 100) : '', new Date(r.ts).toLocaleString('pt-PT')])]));
}
async function importIndividual() {
  const file = await importText('csv'); if (!file) return;
  const objs = csvObjects(file.text).filter(o => o['Ação'] && o['Nº Jogador']);
  if (!objs.length) { toast('Não encontrei registos. Usa um CSV exportado pela Estatística Individual.', 'bad'); return; }
  const mode = await askImportMode(objs.length, 'estatística individual'); if (!mode) return;
  const recs: IndRecord[] = objs.map((o, i) => {
    const fx = parseNum(o['Campo X (%)']), fy = parseNum(o['Campo Y (%)']), gx = parseNum(o['Baliza X (%)']), gy = parseNum(o['Baliza Y (%)']);
    const r: IndRecord = {
      id: uid(), mode: o['Tipo'] === 'GR' ? 'gk' : 'field', period: (PERIODS.includes(o['Período'] as Period) ? o['Período'] : '1º') as Period,
      player: +o['Nº Jogador'], playerName: o['Jogador'] || '', action: o['Ação'], sit: o['Situação'] || '',
      assist: o['Assistência'] === 'Sem assistência' ? 'none' : o['Assistência Nº'] ? +o['Assistência Nº'] : '',
      fx: fx != null ? r3(fx / 100) : null, fy: fy != null ? r3(fy / 100) : null, fzone: '', gx: gx != null ? r3(gx / 100) : null, gy: gy != null ? r3(gy / 100) : null, gzone: '', ts: Date.now() + i,
    };
    r.fzone = r.fx != null && r.fy != null ? fieldZone(r.fx, r.fy) : o['Zona Campo'] || '';
    r.gzone = r.gx != null && r.gy != null ? goalZone(r.gx, r.gy) : o['Zona Baliza'] || '';
    return r;
  });
  mutate(x => {
    recs.forEach(r => { const p = player(x, r.player); if (p && !p.name && r.playerName) p.name = r.playerName; });
    x.individual = mode === 'replace' ? recs : x.individual.concat(recs);
  });
  toast(recs.length + ' registo(s) importado(s)');
}

const is = StyleSheet.create({
  step: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, backgroundColor: C.panelAlt },
  stepN: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  stepNText: { color: C.white, fontFamily: F.bodyBold, fontSize: 13 },
  stepTitle: { fontFamily: F.disp, fontSize: 16, letterSpacing: 0.4, textTransform: 'uppercase', color: '#1e3d35', flexShrink: 1 },
  hint: { fontFamily: F.bodySemi, fontSize: 12, color: C.muted, flexShrink: 1, textAlign: 'right' },
  cap: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 5, borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: C.white, minHeight: 44 },
  capOn: { borderColor: C.green, backgroundColor: '#e6f5ec' },
  capOnGk: { borderColor: C.red, backgroundColor: '#fdeceb' },
  capName: { flex: 1, fontFamily: F.bodySemi, fontSize: 13, color: C.ink },
  pitchCard: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, backgroundColor: '#f7faf9' },
  pcHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  zone: { fontFamily: F.disp, fontSize: 14, color: C.muted, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', maxWidth: 220 },
  zoneSet: { backgroundColor: C.green, borderColor: C.green, color: C.white },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontFamily: F.body, fontSize: 12.5, color: '#33504a' },
  act: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 9, minHeight: 44, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.white, width: '48.5%' },
  actOn: { backgroundColor: '#123d2e', borderColor: '#123d2e' },
  actText: { flex: 1, fontFamily: F.bodyBold, fontSize: 13.5, color: C.ink },
  req: { fontFamily: F.bodyBold, fontSize: 12.5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: C.warnbg, color: C.warn, overflow: 'hidden' },
  reqOk: { backgroundColor: C.okbg, color: C.ok },
  td: { fontFamily: F.body, fontSize: 13.5, color: C.ink },
});
