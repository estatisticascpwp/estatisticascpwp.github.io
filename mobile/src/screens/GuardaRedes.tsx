import { StyleSheet, Text, View } from 'react-native';
import { fileStamp } from '../actions';
import { computeShifts } from '../domain/clock';
import { ACTIONS, DIST_BANDS, FIELD_ZONES, PERIODS, STD } from '../domain/constants';
import { toCSV } from '../domain/csv';
import { fmtClock, fmtPct, numPT, pct } from '../domain/format';
import { pname, plabel } from '../domain/model';
import { grInsights, grSectors, grStats, pctBars } from '../domain/stats';
import { distBand } from '../domain/zones';
import { G, useScreenState, useStore } from '../store/store';
import { C, F } from '../theme';
import { ActIcon, GoalView, Pitch } from '../ui/Court';
import { exportText } from '../ui/files';
import { Badge, Bars, Btn, CapNum, Chip, Cols, Field, Insights, Mini, Panel, Row, Screen, SectionHead, Sub, Table, ViewHead } from '../ui/kit';
import { Select } from '../ui/Select';

export default function GuardaRedes() {
  useStore();
  const g = G();
  const [st, setSt] = useScreenState<{ who: string; period: string }>('gr', { who: '', period: '' });
  const set = (p: Partial<{ who: string; period: string }>) => setSt(prev => ({ ...prev, ...p }));
  const shifts = computeShifts(g).byPlayer;
  const gks = [...new Set([...g.roster.filter(p => p.gr).map(p => p.n), ...g.individual.filter(r => r.mode === 'gk').map(r => r.player)])].sort((a, b) => a - b);
  const all = g.individual.filter(r => r.mode === 'gk' && (!st.period || r.period === st.period));
  const rows = all.filter(r => !st.who || String(r.player) === st.who);
  const s = grStats(rows);
  const secs = st.period ? 0 : st.who ? shifts[+st.who]?.total || 0 : gks.reduce((a, n) => a + (shifts[n]?.total || 0), 0);
  const sectors = grSectors(rows);
  const ins = grInsights(rows);
  const cmp = gks.map(n => ({ n, s: grStats(all.filter(r => r.player === n)), t: st.period ? 0 : shifts[n]?.total || 0 }));

  return (
    <Screen>
      <Panel>
        <ViewHead title="Guarda-Redes" lead="Rendimento dos guarda-redes do SCP a partir dos registos de GR da Estatística Individual (golos sofridos, defesas e remates para fora)."
          right={<Field label="Período" style={{ minWidth: 160 }}><Select value={st.period} emptyLabel="Jogo todo" options={PERIODS} onChange={v => set({ period: v })} /></Field>} />
        <Row gap={8}>
          <Chip label="Todos os GR" on={!st.who} onPress={() => set({ who: '' })} />
          {gks.map(n => <Chip key={n} label={pname(g, n)} on={st.who === String(n)} onColor={C.red} left={<CapNum n={n} gk size={26} />} onPress={() => set({ who: String(n) })} />)}
        </Row>
        <View style={gs.prof}>
          <View style={gs.bigcap}><Text style={gs.bigcapText}>{st.who || 'GR'}</Text></View>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={gs.profName}>{st.who ? pname(g, st.who) : 'Todos os guarda-redes'}</Text>
            <Text style={gs.profSub}>{st.period ? st.period + ' período' : 'Jogo todo'} · {secs ? fmtClock(secs) + ' na água' : 'sem tempo de jogo registado'}</Text>
          </View>
          <View style={gs.meta}>
            {[[s.on ? s.p + '%' : '—', '% defesas'], [s.sv, 'defesas'], [s.gl, 'golos sofridos'], [s.on, 'remates à baliza'], [secs >= 60 ? numPT((s.gl * 480) / secs) : '—', "golos / 8'"]].map(([v, l]) => (
              <View key={l as string} style={{ alignItems: 'center' }}><Text style={gs.metaV}>{v}</Text><Text style={gs.metaL}>{l}</Text></View>
            ))}
          </View>
        </View>
      </Panel>
      {ins.length ? <Panel><Sub>Leituras</Sub><Insights items={ins} /></Panel> : null}
      <Cols min={900} flex={[1.25, 1]}>
        <Panel>
          <Mini>Remates à baliza — onde chegaram</Mini>
          <GoalView rows={rows} markerSize={2.4} />
          <Row gap={10} style={{ marginVertical: 8 }}>{ACTIONS.gk.map(a => <Row key={a.id} gap={5} wrap={false}><ActIcon mode="gk" action={a.id} /><Text style={gs.leg}>{a.id}</Text></Row>)}</Row>
          <Table cols={[{ title: 'Zona da baliza', w: 180, align: 'left' }, { title: 'À baliza', w: 70 }, { title: 'Defesas', w: 70 }, { title: 'Golos', w: 64 }, { title: '% defesas', w: 90 }]}
            empty="Sem remates com local na baliza."
            rows={sectors.map(x => [x.z, x.on, x.sv, x.gl, <Badge key="p" text={x.p + '%'} tone={x.p >= 60 ? 'good' : x.p >= 40 ? 'warn' : 'bad'} minWidth={56} />])} />
        </Panel>
        <Panel>
          <Mini>De onde rematou o adversário</Mini>
          <Pitch rows={rows} markerSize={2.4} />
          <Mini style={{ marginTop: 16 }}>% de defesas por zona do campo</Mini>
          <Bars items={pctBars(rows, 'fzone', FIELD_ZONES)} max={100} pctFmt />
        </Panel>
      </Cols>
      <Cols min={1000}>
        <Panel><Mini>% de defesas por distância</Mini><Bars items={pctBars(rows, r => distBand(r), DIST_BANDS.map(d => d[0]))} max={100} pctFmt /></Panel>
        <Panel><Mini>% de defesas por situação</Mini><Bars items={pctBars(rows, 'sit', STD)} max={100} pctFmt /></Panel>
        <Panel><Mini>% de defesas por período</Mini><Bars items={pctBars(rows, 'period', PERIODS)} max={100} pctFmt /></Panel>
      </Cols>
      <Panel>
        <SectionHead title="Comparação entre guarda-redes" right={<Btn small label="Exportar CSV" icon="download" variant="outline" onPress={() => exportText('guarda_redes_' + fileStamp() + '.csv', toCSV([['Nº', 'Guarda-redes', 'Remates à baliza', 'Defesas', 'Defesas controladas', 'Defesas para fora', 'Golos sofridos', 'Remates fora', '% defesas', 'Tempo jogado'], ...cmp.map(({ n, s: x, t }) => [n, pname(g, n), x.on, x.sv, x.hold, x.away, x.gl, x.out, x.on ? pct(x.sv, x.on) : '', st.period ? '' : fmtClock(t)])]))} />} />
        <View style={{ height: 12 }} />
        <Table
          cols={[{ title: 'Guarda-redes', w: 160, align: 'left' }, { title: 'À baliza', w: 70 }, { title: 'Defesas', w: 70 }, { title: 'Controladas', w: 90 }, { title: 'Para fora', w: 80 }, { title: 'Golos sofridos', w: 104 }, { title: 'Fora', w: 56 }, { title: '% defesas', w: 84 }, { title: 'Tempo jogado', w: 100 }, { title: "Golos / 8'", w: 84 }]}
          empty="Marca os guarda-redes no plantel (Jogadores ou Exclusões)."
          rows={cmp.map(({ n, s: x, t }) => [plabel(g, n), x.on, <Text key="s" style={{ fontFamily: F.bodyBold }}>{x.sv}</Text>, x.hold, x.away, x.gl, x.out, <Text key="p" style={{ fontFamily: F.bodyBold }}>{fmtPct(x.sv, x.on)}</Text>, st.period ? '—' : fmtClock(t), t >= 60 ? numPT((x.gl * 480) / t) : '—'])}
        />
      </Panel>
    </Screen>
  );
}

const gs = StyleSheet.create({
  prof: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: C.deep },
  bigcap: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#e84a44', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  bigcapText: { color: C.white, fontFamily: F.dispX, fontSize: 26 },
  profName: { color: C.white, fontFamily: F.dispX, fontSize: 28, lineHeight: 30, textTransform: 'uppercase' },
  profSub: { color: C.white, opacity: 0.85, fontFamily: F.body, fontSize: 13.5, marginTop: 3 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  metaV: { color: C.yellow, fontFamily: F.dispX, fontSize: 26, fontVariant: ['tabular-nums'] },
  metaL: { color: C.white, opacity: 0.85, fontFamily: F.body, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  leg: { fontFamily: F.body, fontSize: 12.5, color: '#33504a' },
});
