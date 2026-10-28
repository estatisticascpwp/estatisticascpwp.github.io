import { Text, View } from 'react-native';
import { fileStamp } from '../actions';
import { FIELD_ZONES, GOAL_ZONES, PERIODS, SHOT_ACTS, STD } from '../domain/constants';
import { toCSV } from '../domain/csv';
import { fmtPct, groupBy, numPT, pct } from '../domain/format';
import { plabel, pname } from '../domain/model';
import { shotBars } from '../domain/stats';
import type { IndRecord, Mode } from '../domain/types';
import { G, useScreenState, useStore } from '../store/store';
import { C, F } from '../theme';
import { ActIcon, GoalView, Pitch } from '../ui/Court';
import { toast } from '../ui/dialogs';
import { exportText } from '../ui/files';
import { Badge, Bars, Btn, Chip, Cols, Field, Kpi, Kpis, Mini, ModeSwitch, Muted, Panel, Row, Screen, SectionHead, Table, ViewHead } from '../ui/kit';
import { Select } from '../ui/Select';

const RES: Record<'scp' | 'opp', { id: string; label?: string; goal?: boolean; on?: boolean }[]> = {
  scp: [{ id: 'Golo', goal: true, on: true }, { id: 'Defesa', on: true }, { id: 'Bloco' }, { id: 'Fora' }],
  opp: [{ id: 'Golo Sofrido', goal: true, on: true, label: 'Golo' }, { id: 'Defesa GR', on: true }, { id: 'Defesa p/ Fora GR', on: true, label: 'Defesa p/ fora' }, { id: 'Fora' }],
};
interface RemState { team: 'scp' | 'opp'; period: string; player: string; sit: string; res: string[] }

export default function Remates() {
  useStore();
  const g = G();
  const [st, setSt] = useScreenState<RemState>('remates', { team: 'scp', period: '', player: '', sit: '', res: [] });
  const set = (p: Partial<RemState>) => setSt(prev => ({ ...prev, ...p }));
  const scp = st.team === 'scp', mode: Mode = scp ? 'field' : 'gk', res = RES[st.team];
  const isGoal = (r: IndRecord) => !!res.find(x => x.id === r.action)?.goal;
  const isOn = (r: IndRecord) => !!res.find(x => x.id === r.action)?.on;
  const base = scp ? g.individual.filter(r => r.mode === 'field' && SHOT_ACTS.includes(r.action)) : g.individual.filter(r => r.mode === 'gk');
  const rows = base.filter(r => (!st.period || r.period === st.period) && (!st.player || String(r.player) === st.player) && (!st.sit || r.sit === st.sit) && (!st.res.length || st.res.includes(r.action)));
  const goals = rows.filter(isGoal), on = rows.filter(isOn);
  const players = [...new Set(base.map(r => r.player))].sort((a, b) => a - b);
  const withDist = rows.filter(r => r.fy != null);
  const avgDist = withDist.length ? withDist.reduce((a, r) => a + (r.fy as number) * 12.5, 0) / withDist.length : 0;
  const byZone = groupBy(rows, 'fzone'), byGoal = groupBy(rows, 'gzone');
  const maxCell = Math.max(1, ...FIELD_ZONES.flatMap(z => res.map(o => (byZone.get(z) || []).filter(r => r.action === o.id).length)));
  const bars = shotBars(rows, isGoal);
  const heat = (v: number, good: boolean) => v
    ? <View style={{ minWidth: 44, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, backgroundColor: good ? `rgba(30,158,74,${(0.12 + (0.6 * v) / maxCell).toFixed(2)})` : `rgba(217,50,50,${(0.12 + (0.6 * v) / maxCell).toFixed(2)})`, alignItems: 'center' }}><Text style={{ fontFamily: F.bodyBold, color: C.ink }}>{v}</Text></View>
    : <Text style={{ color: C.muted }}>·</Text>;

  const exportCSV = () => {
    if (!rows.length) { toast('Sem remates para exportar.', 'warn'); return; }
    exportText(`remates_${scp ? 'scp' : 'adversario'}_${fileStamp()}.csv`, toCSV([['Período', scp ? 'Nº Jogador' : 'Nº GR', scp ? 'Jogador' : 'Guarda-redes', 'Resultado', 'Situação', 'Zona Campo', 'Distância (m)', 'Zona Baliza'],
      ...rows.map(r => [r.period, r.player, pname(g, r.player), r.action, r.sit, r.fzone, r.fy != null ? numPT(r.fy * 12.5) : '', r.gzone])]));
  };

  return (
    <Screen>
      <Panel>
        <ViewHead title="Remates" lead="Todos os remates registados na Estatística Individual. Os remates do adversário são os registados nos guarda-redes do SCP."
          right={<ModeSwitch value={st.team} onChange={t => setSt(prev => ({ ...prev, team: t, player: '', res: [] }))} options={[{ value: 'scp', label: 'Remates SCP' }, { value: 'opp', label: 'Remates do adversário', danger: true }]} />} />
        <Row gap={10} style={{ alignItems: 'flex-end' }}>
          <Field label="Período"><Select value={st.period} emptyLabel="Jogo todo" options={PERIODS} onChange={v => set({ period: v })} /></Field>
          <Field label={scp ? 'Jogador' : 'Guarda-redes'}><Select value={st.player} emptyLabel="Todos" options={players.map(n => ({ value: String(n), label: plabel(g, n) }))} onChange={v => set({ player: v })} /></Field>
          <Field label="Situação"><Select value={st.sit} emptyLabel="Todas" options={STD} onChange={v => set({ sit: v })} /></Field>
          <Btn small label="Limpar filtros" icon="reset" variant="ghost" onPress={() => set({ period: '', player: '', sit: '', res: [] })} />
        </Row>
        <Mini style={{ marginTop: 12 }}>Resultado</Mini>
        <Row gap={6}>
          {res.map(o => <Chip key={o.id} label={o.label || o.id} on={st.res.includes(o.id)} left={<ActIcon mode={mode} action={o.id} />}
            onPress={() => set({ res: st.res.includes(o.id) ? st.res.filter(x => x !== o.id) : [...st.res, o.id] })} />)}
        </Row>
        <View style={{ height: 14 }} />
        <Kpis>
          <Kpi k="Remates" v={rows.length} sub={scp ? 'do SCP' : 'do adversário'} />
          <Kpi k="Golos" v={goals.length} sub={scp ? 'marcados' : 'sofridos'} />
          <Kpi k="Eficácia" v={fmtPct(goals.length, rows.length)} sub="golos / remates" />
          <Kpi k="À baliza" v={fmtPct(on.length, rows.length)} sub={`${on.length} enquadrados`} />
          {scp
            ? <Kpi k="Bloqueados" v={rows.filter(r => r.action === 'Bloco').length} sub={fmtPct(rows.filter(r => r.action === 'Bloco').length, rows.length) + ' dos remates'} />
            : <Kpi k="Defesas GR" v={on.length - goals.length} sub={fmtPct(on.length - goals.length, on.length) + ' dos remates à baliza'} />}
          <Kpi k="Distância média" v={withDist.length ? numPT(avgDist) + ' m' : '—'} sub="à linha de golo" />
        </Kpis>
      </Panel>

      <Cols min={900} flex={[1.25, 1]}>
        <Panel>
          <SectionHead title="Posição de remate" right={<Muted>{rows.length} remate(s)</Muted>} />
          <View style={{ height: 10 }} />
          <Pitch rows={rows} markerSize={2.4} />
          <Row gap={10} style={{ marginTop: 8 }}>{res.map(o => <Row key={o.id} gap={5} wrap={false}><ActIcon mode={mode} action={o.id} /><Muted>{o.label || o.id}</Muted></Row>)}</Row>
        </Panel>
        <Panel>
          <SectionHead title="Destino na baliza" right={<Muted>{rows.filter(r => r.gx != null).length} com local</Muted>} />
          <View style={{ height: 10 }} />
          <GoalView rows={rows} markerSize={2.4} />
          <View style={{ height: 12 }} />
          <Table cols={[{ title: 'Zona da baliza', w: 180, align: 'left' }, { title: 'Remates', w: 74 }, { title: 'Golos', w: 64 }, { title: '% golo', w: 70 }]}
            empty="Sem remates com local na baliza."
            rows={GOAL_ZONES.filter(z => byGoal.has(z)).map(z => { const rs = byGoal.get(z)!, gg = rs.filter(isGoal).length; return [z, rs.length, gg, <Text key="p" style={{ fontFamily: F.bodyBold }}>{pct(gg, rs.length)}%</Text>]; })} />
        </Panel>
      </Cols>

      <Panel>
        <SectionHead title="Zona do campo × resultado" right={<Btn small label="Exportar CSV" icon="download" variant="outline" onPress={exportCSV} />} />
        <View style={{ height: 12 }} />
        <Table
          cols={[{ title: 'Zona', w: 160, align: 'left' }, ...res.map(o => ({ title: o.label || o.id, w: 96 })), { title: 'Total', w: 64 }, { title: '% golo', w: 70 }, { title: '% à baliza', w: 86 }]}
          empty="Sem remates com estes filtros."
          rows={FIELD_ZONES.filter(z => byZone.has(z)).map(z => {
            const rs = byZone.get(z)!, gg = rs.filter(isGoal).length;
            return [z, ...res.map(o => heat(rs.filter(r => r.action === o.id).length, !!o.goal)), <Text key="t" style={{ fontFamily: F.bodyBold }}>{rs.length}</Text>, <Badge key="g" text={pct(gg, rs.length) + '%'} tone={pct(gg, rs.length) >= 40 ? 'good' : pct(gg, rs.length) < 25 ? 'bad' : 'warn'} minWidth={52} />, fmtPct(rs.filter(isOn).length, rs.length)];
          })}
        />
      </Panel>
      <Cols min={760}>
        <Panel><Mini>Eficácia por distância</Mini><Bars items={bars.dist} max={100} pctFmt /></Panel>
        <Panel><Mini>Eficácia por situação</Mini><Bars items={bars.sit} max={100} pctFmt /></Panel>
      </Cols>
    </Screen>
  );
}
