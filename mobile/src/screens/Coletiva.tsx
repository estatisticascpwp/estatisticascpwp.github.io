import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { askImportMode, fileStamp } from '../actions';
import { COL_CSV, COL_OPTS, COL_TABLES, outcomeTone, PERIODS } from '../domain/constants';
import { csvObjects, toCSV } from '../domain/csv';
import { pct, uid } from '../domain/format';
import type { ColRecord, ColTableId, Game } from '../domain/types';
import { G, mutate, settings, useScreenState, useStore } from '../store/store';
import { C, F } from '../theme';
import { confirm, toast } from '../ui/dialogs';
import { exportText, importText } from '../ui/files';
import { Badge, Btn, Field, Input, Muted, NoteBox, Panel, Row, RowBtn, Screen, SectionHead, Table, ViewHead, WarnBox } from '../ui/kit';
import { Select } from '../ui/Select';

interface ColState { active: ColTableId; editing: string | null; form: Record<string, string>; filters: Record<string, string>; warn: string }
const nextAttack = (g: Game, tid: string, period: string) => {
  const xs = g.collective.filter(r => r.table === tid && r.period === period).map(r => +r.attack || 0);
  return String(Math.min(25, (xs.length ? Math.max(...xs) : 0) + 1));
};
const freshForm = (g: Game, tid: ColTableId): Record<string, string> => ({ period: g.period, attack: settings().autoAttack ? nextAttack(g, tid, g.period) : '', timing: '+10s' });

export default function Coletiva() {
  useStore();
  const g = G();
  const [st, setSt] = useScreenState<ColState>('coletiva', () => ({ active: 'scp', editing: null, form: freshForm(G(), 'scp'), filters: {}, warn: '' }));
  const set = (p: Partial<ColState>) => setSt(prev => ({ ...prev, ...p }));
  const t = COL_TABLES.find(x => x.id === st.active)!;
  const form = st.form;
  const setForm = (p: Record<string, string>) => set({ form: { ...form, ...p } });

  const switchTab = (id: ColTableId) => set({ active: id, editing: null, filters: {}, warn: '', form: freshForm(g, id) });
  const save = async () => {
    const rec: ColRecord = { id: st.editing || uid(), table: t.id, period: form.period || '', attack: form.attack || '', ts: Date.now() };
    const miss: string[] = [];
    if (!rec.period) miss.push('período'); if (!rec.attack) miss.push('nº do ataque');
    t.fields.forEach(fd => {
      const v = (form[fd.key as string] || '').trim();
      (rec as any)[fd.key] = fd.kind === 'toggle' ? form.timing || '+10s' : v;
      if (fd.kind !== 'notes' && fd.kind !== 'toggle' && !v) miss.push(fd.label.toLowerCase());
    });
    if (miss.length) { set({ warn: 'Faltam pressupostos: ' + miss.join(', ') + '.' }); toast('Faltam pressupostos: ' + miss.join(', '), 'warn'); return; }
    if (!st.editing && g.collective.some(r => r.table === t.id && r.period === rec.period && r.attack === rec.attack)) {
      if (!(await confirm('Ataque repetido', `Já existe o ataque nº **${rec.attack}** no ${rec.period} período nesta tabela. Guardar mesmo assim?`, 'Guardar', false))) return;
    }
    const prev = st.editing ? g.collective.find(x => x.id === st.editing) : undefined;
    if (prev) rec.ts = prev.ts;
    mutate(x => { if (prev) x.collective = x.collective.map(r => (r.id === rec.id ? rec : r)); else x.collective.push(rec); });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast(prev ? 'Registo atualizado' : `Ataque nº ${rec.attack} guardado`);
    set({ editing: null, warn: '', form: freshForm(G(), t.id) });
  };

  const fl = st.filters;
  const k1 = t.fields[0].key as string;
  const fd2 = t.fields[1].kind === 'notes' || t.fields[1].key === 'position' ? null : t.fields[1];
  const k2 = fd2 ? (fd2.key as string) : null;
  const rows = g.collective.filter(r => r.table === t.id)
    .filter(r => (!fl.period || r.period === fl.period) && (!fl.k1 || (r as any)[k1] === fl.k1) && (!k2 || !fl.k2 || (r as any)[k2] === fl.k2) && (!fl.outcome || r.outcome === fl.outcome))
    .sort((a, b) => String(a.period).localeCompare(String(b.period)) || +a.attack - +b.attack);
  const goals = rows.filter(r => r.outcome === 'GOLO').length, ex = rows.filter(r => r.outcome === 'EXCLUSÃO' || r.outcome === 'PENALTI').length;
  const editingRec = st.editing ? g.collective.find(x => x.id === st.editing) : undefined;

  return (
    <Screen>
      <Panel>
        <ViewHead title="Estatística Coletiva" lead="Registo e análise das jogadas coletivas da equipa e do adversário. O nº do ataque avança sozinho depois de cada registo." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {COL_TABLES.map((x, i) => (
            <Pressable key={x.id} onPress={() => switchTab(x.id)} style={[cs.tab, st.active === x.id && cs.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: st.active === x.id }}>
              <Text style={cs.tabNum}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={[cs.tabText, st.active === x.id && { color: '#073c26' }]}>{x.tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={cs.form}>
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <Field label="Período"><Select value={form.period || ''} options={PERIODS} title="Período" onChange={v => setForm({ period: v, ...(st.editing || !settings().autoAttack ? {} : { attack: nextAttack(g, t.id, v) }) })} /></Field>
            <Field label="Nº do ataque"><Select value={form.attack || ''} options={COL_OPTS.attacks} title="Nº do ataque" onChange={v => setForm({ attack: v })} /></Field>
            {t.fields.map(fd => {
              const k = fd.key as string;
              if (fd.kind === 'toggle') return (
                <Field key={k} label={fd.label}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(fd.options || []).map(o => (
                      <Pressable key={o} onPress={() => setForm({ timing: o })} style={[cs.timing, form.timing === o && cs.timingOn]}><Text style={[cs.timingText, form.timing === o && { color: C.white }]}>{o}</Text></Pressable>
                    ))}
                  </View>
                </Field>
              );
              if (fd.kind === 'notes') return <Field key={k} label={fd.label} style={{ flexBasis: 300 }}><Input value={form[k] || ''} placeholder="Observações (opcional)" onChangeText={v => setForm({ [k]: v })} /></Field>;
              return <Field key={k} label={fd.label}><Select value={form[k] || ''} options={fd.options || []} title={fd.label} searchable={fd.kind === 'combo'} placeholder={fd.kind === 'combo' ? 'Pesquisar…' : 'Selecionar…'} onChange={v => setForm({ [k]: v })} /></Field>;
            })}
          </Row>
          {st.warn ? <WarnBox>{st.warn}</WarnBox> : null}
          {editingRec ? <NoteBox>A editar o ataque nº {editingRec.attack} ({editingRec.period} período). Carrega em Atualizar registo ou em Limpar para cancelar.</NoteBox> : null}
          <Row style={{ justifyContent: 'flex-end', marginTop: 14 }}>
            <Btn label="Limpar" icon="reset" variant="ghost" onPress={() => set({ editing: null, warn: '', form: freshForm(g, t.id) })} />
            <Btn label={st.editing ? 'Atualizar registo' : 'Guardar registo'} icon="save" variant="primary" onPress={save} />
          </Row>
        </View>
      </Panel>

      <Panel>
        <SectionHead title={'Registos — ' + t.title} right={
          <Row>
            <Btn small label="Exportar CSV" icon="download" variant="outline" onPress={exportColetiva} />
            <Btn small label="Importar CSV" icon="upload" variant="ghost" onPress={importColetiva} />
            <Btn small label="Apagar todos" icon="trash" variant="danger" onPress={async () => {
              const n = g.collective.filter(r => r.table === t.id).length;
              if (!n) { toast('Não há registos para apagar.'); return; }
              if (!(await confirm('Apagar registos', `Apagar os **${n}** registos da tabela **${t.title}**?`, 'Apagar todos'))) return;
              mutate(x => { x.collective = x.collective.filter(r => r.table !== t.id); }); set({ editing: null }); toast('Registos apagados');
            }} />
          </Row>} />
        <View style={cs.strip}>
          {(t.side === 'att'
            ? [[rows.length, 'ataques'], [goals, 'golos'], [pct(goals, rows.length) + '%', 'eficácia'], [ex, 'exclusões/penáltis ganhos']]
            : [[rows.length, 'ataques do adversário'], [goals, 'golos sofridos'], [(rows.length ? 100 - pct(goals, rows.length) : 0) + '%', 'ataques travados'], [ex, 'exclusões/penáltis cometidos']]
          ).map(([v, l]) => <Text key={l as string} style={cs.stripItem}><Text style={cs.stripNum}>{v} </Text>{l}</Text>)}
        </View>
        <Row gap={10} style={{ marginVertical: 12, alignItems: 'flex-end' }}>
          <Field label="Período"><Select value={fl.period || ''} emptyLabel="Todos" options={PERIODS} onChange={v => set({ filters: { ...fl, period: v } })} /></Field>
          <Field label={t.fields[0].label}><Select value={fl.k1 || ''} emptyLabel="Todas" options={t.fields[0].options || []} searchable={t.fields[0].kind === 'combo'} onChange={v => set({ filters: { ...fl, k1: v } })} /></Field>
          {fd2 ? <Field label={fd2.label}><Select value={fl.k2 || ''} emptyLabel="Todas" options={fd2.options || []} searchable={fd2.kind === 'combo'} onChange={v => set({ filters: { ...fl, k2: v } })} /></Field> : null}
          <Field label="Outcome"><Select value={fl.outcome || ''} emptyLabel="Todos" options={COL_OPTS.outcomes} onChange={v => set({ filters: { ...fl, outcome: v } })} /></Field>
          <Btn small label="Limpar filtros" icon="reset" variant="ghost" onPress={() => set({ filters: {} })} />
        </Row>
        <Table
          cols={[{ title: '#', w: 40 }, { title: 'Período', w: 64 }, { title: 'Nº Ataque', w: 76 }, ...t.fields.map(fd => ({ title: fd.label, w: fd.kind === 'notes' ? 200 : fd.key === 'outcome' ? 170 : fd.kind === 'toggle' ? 96 : 160, align: fd.kind === 'notes' ? 'left' as const : undefined })), { title: 'Ações', w: 90 }]}
          highlight={i => rows[i].id === st.editing}
          empty={`Ainda não há registos nesta tabela${Object.values(fl).some(Boolean) ? ' com estes filtros' : ''}.`}
          rows={rows.map((r, i) => [
            i + 1, String(r.period), r.attack,
            ...t.fields.map(fd => {
              const v = (r as any)[fd.key] as string | undefined;
              if (fd.key === 'outcome') return <Badge key="o" text={v || '—'} tone={outcomeTone(v, t.side)} />;
              if (fd.kind === 'toggle') return <Badge key="t" text={v || '—'} tone={v === '+10s' ? 'good' : 'bad'} minWidth={52} />;
              return v || '—';
            }),
            <Row key="x" gap={2} wrap={false}>
              <RowBtn icon="edit" label="Editar" onPress={() => {
                const f: Record<string, string> = { period: String(r.period), attack: r.attack };
                t.fields.forEach(fd => { f[fd.key as string] = ((r as any)[fd.key] as string) || ''; });
                if (!f.timing) f.timing = '+10s';
                set({ editing: r.id, warn: '', form: f });
              }} />
              <RowBtn icon="trash" danger label="Apagar" onPress={async () => {
                if (!(await confirm('Apagar registo', 'Apagar este registo?', 'Apagar'))) return;
                mutate(x => { x.collective = x.collective.filter(y => y.id !== r.id); });
                if (st.editing === r.id) set({ editing: null });
              }} />
            </Row>,
          ])}
        />
        <Muted style={{ marginTop: 8 }}>{rows.length} registo(s) encontrado(s)</Muted>
      </Panel>
    </Screen>
  );
}

function exportColetiva() {
  const order = (id: string) => COL_TABLES.findIndex(t => t.id === id);
  const rows = G().collective.slice().sort((a, b) => order(a.table) - order(b.table) || String(a.period).localeCompare(String(b.period)) || +a.attack - +b.attack);
  if (!rows.length) { toast('Não há registos para exportar.', 'warn'); return; }
  exportText('estatistica_coletiva_' + fileStamp() + '.csv', toCSV([COL_CSV.map(c => c[1]), ...rows.map(r => COL_CSV.map(([k]) => (k === 'table' ? COL_TABLES.find(t => t.id === r.table)?.title : (r as any)[k] || '')))]));
}
async function importColetiva() {
  const f = await importText('csv'); if (!f) return;
  const objs = csvObjects(f.text).filter(o => o['Tabela'] && o['Outcome'] !== undefined);
  if (!objs.length) { toast('Não encontrei registos. Usa um CSV exportado pela Estatística Coletiva.', 'bad'); return; }
  const mode = await askImportMode(objs.length, 'estatística coletiva'); if (!mode) return;
  const recs = objs.map((o, i) => {
    const t = COL_TABLES.find(x => x.title === o['Tabela'] || x.id === o['Tabela'] || x.tab === o['Tabela']); if (!t) return null;
    const r: ColRecord = { id: uid(), table: t.id, period: '', attack: '', ts: Date.now() + i };
    COL_CSV.slice(1).forEach(([k, h]) => { if (k === 'period' || k === 'attack' || t.fields.some(x => x.key === k)) (r as any)[k] = o[h] || ''; });
    if (t.fields.some(x => x.key === 'timing') && !r.timing) r.timing = '+10s';
    return r;
  }).filter(Boolean) as ColRecord[];
  mutate(x => { x.collective = mode === 'replace' ? recs : x.collective.concat(recs); });
  toast(recs.length + ' registo(s) importado(s)');
}

const cs = StyleSheet.create({
  tab: { backgroundColor: '#e7edeb', paddingHorizontal: 14, paddingVertical: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, minWidth: 130 },
  tabOn: { backgroundColor: C.yellow },
  tabNum: { fontFamily: F.disp, fontSize: 12, letterSpacing: 1, color: '#153a32', opacity: 0.65 },
  tabText: { fontFamily: F.disp, fontSize: 16, color: '#153a32' },
  form: { borderWidth: 1, borderColor: C.line, borderTopLeftRadius: 0, borderRadius: 12, padding: 14, backgroundColor: C.panelAlt },
  timing: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: C.line, borderRadius: 8, backgroundColor: '#eef1f2', alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  timingOn: { backgroundColor: C.green2, borderColor: C.green2 },
  timingText: { fontFamily: F.bodyBold, fontSize: 15, color: C.ink },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 10, padding: 12, backgroundColor: '#f3f7f5', borderRadius: 10 },
  stripItem: { fontFamily: F.body, fontSize: 14, color: C.ink },
  stripNum: { fontFamily: F.dispX, fontSize: 22, color: C.deep },
});
