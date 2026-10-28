import { Text, View } from 'react-native';
import { fileStamp } from '../actions';
import { PERIODS } from '../domain/constants';
import { toCSV } from '../domain/csv';
import { fmtClock, numPT, pct } from '../domain/format';
import { analyse } from '../domain/stats';
import { G, useScreenState, useStore } from '../store/store';
import { F } from '../theme';
import { GoalHeat, ZoneMap } from '../ui/Court';
import { toast } from '../ui/dialogs';
import { exportText } from '../ui/files';
import { Bars, Btn, Cols, Field, Insights, Kpi, Kpis, Mini, Muted, Panel, Screen, SectionHead, Sub, Table, ViewHead } from '../ui/kit';
import { Select } from '../ui/Select';

export default function Analise() {
  useStore();
  const g = G();
  const [P, setP] = useScreenState<string>('analise-p', '');
  const a = analyse(g, P);
  const pl = a.pl;
  return (
    <Screen>
      <Panel>
        <ViewHead title="Sugestão de Interpretação" lead="Leituras automáticas a partir dos registos da Estatística Individual, Coletiva, Tempo de Jogo e Bolas de saída. São pistas para a análise, não conclusões."
          right={<Field label="Período" style={{ minWidth: 160 }}><Select value={P} emptyLabel="Jogo todo" options={PERIODS} onChange={setP} /></Field>} />
        <Kpis>
          <Kpi k="Golos (individual)" v={a.goals.length} sub={`${a.shots.length} remates · ${a.teamEff}%`} />
          <Kpi k="Defesas GR" v={a.saves.length + a.conc.length ? pct(a.saves.length, a.saves.length + a.conc.length) + '%' : '—'} sub={`${a.saves.length} defesas · ${a.conc.length} golos`} />
          <Kpi k="Exclusões" v={`${a.excW}–${a.excL}`} sub="ganhas – sofridas" />
          <Kpi k="Superioridade +1" v={a.plus.n ? pct(a.plus.g, a.plus.n) + '%' : '—'} sub={`${a.plus.g} golo(s) em ${a.plus.n}`} />
          <Kpi k="Inferioridade −1" v={a.minus.n ? 100 - pct(a.minus.g, a.minus.n) + '%' : '—'} sub={`${a.minus.n - a.minus.g} defendidas de ${a.minus.n}`} />
          <Kpi k="Contra-ataque" v={a.caS.n ? pct(a.caS.g, a.caS.n) + '%' : '—'} sub={`SCP ${a.caS.g}/${a.caS.n} · Adv. ${a.caO.g}/${a.caO.n}`} />
          <Kpi k="Bolas de saída" v={a.sprP ? `${a.sprW}/${a.sprP}` : '—'} sub="ganhas pelo SCP" />
        </Kpis>
      </Panel>
      <Panel><Sub>Leituras automáticas</Sub><Insights items={a.ins} /></Panel>
      <Cols min={1000}>
        <Panel><Mini>Eficácia de remate por zona</Mini><ZoneMap shots={a.shots} /><Muted style={{ marginTop: 8 }}>Amarelo mais forte = maior % de golo.</Muted></Panel>
        <Panel><Mini>Onde entram os golos do SCP</Mini><GoalHeat rows={a.goals} color="#1e9e4a" /><Muted style={{ marginTop: 8 }}>{a.goals.length} golos com local registado.</Muted></Panel>
        <Panel><Mini>Golos sofridos pelo GR SCP</Mini><GoalHeat rows={a.conc} color="#d93232" /><Muted style={{ marginTop: 8 }}>{a.conc.length} golos sofridos com local registado.</Muted></Panel>
      </Cols>
      <Panel>
        <SectionHead title="Resumo por jogador" right={<Btn small label="Exportar CSV" icon="download" variant="outline" onPress={() => {
          if (!pl.length) { toast('Sem dados para exportar.', 'warn'); return; }
          exportText('interpretacao_jogadores_' + fileStamp() + '.csv', toCSV([['Nº', 'Jogador', 'Remates', 'Golos', 'Eficácia (%)', 'Assistências', 'EXC ganhas', 'EXC sofridas', 'Perdas', 'Roubos', 'Blocos defensivos', 'Tempo jogado', 'Golos por 8 min'],
            ...pl.map(p => [p.n, p.name, p.shots, p.goals, p.eff, p.ast, p.excW, p.excL, p.lost, p.steal, p.blk, P ? '' : fmtClock(p.secs), p.g8 != null ? numPT(p.g8) : ''])]));
        }} />} />
        <View style={{ height: 12 }} />
        <Table
          cols={[{ title: 'Jogador', w: 160, align: 'left' }, { title: 'Remates', w: 70 }, { title: 'Golos', w: 60 }, { title: 'Eficácia', w: 72 }, { title: 'Assist.', w: 60 }, { title: 'EXC ganhas', w: 86 }, { title: 'EXC sofridas', w: 92 }, { title: 'Perdas', w: 64 }, { title: 'Roubos', w: 64 }, { title: 'Blocos def.', w: 84 }, { title: 'Tempo jogado', w: 100 }, { title: "Golos / 8'", w: 80 }]}
          empty="Ainda sem registos de jogadores de campo."
          rows={pl.map(p => [`${p.n} · ${p.name}`, p.shots, <Text key="g" style={{ fontFamily: F.bodyBold }}>{p.goals}</Text>, p.shots ? p.eff + '%' : '—', p.ast, p.excW, p.excL, p.lost, p.steal, p.blk, P ? '—' : fmtClock(p.secs), p.g8 != null ? numPT(p.g8) : '—'])}
        />
      </Panel>
      <Cols min={760}>
        <Panel><Mini>Eficácia por situação de jogo</Mini><Bars items={a.charts.sit} max={100} pctFmt /></Panel>
        <Panel><Mini>Resultado dos ataques SCP (6x6)</Mini><Bars items={a.charts.outcomes} /></Panel>
      </Cols>
      <Cols min={760}>
        <Panel><Mini>Jogadas ofensivas SCP · % de golo</Mini><Bars items={a.charts.offense} max={100} pctFmt /></Panel>
        <Panel><Mini>Eficácia SCP contra cada defesa adversária</Mini><Bars items={a.charts.vsDefense} max={100} pctFmt /></Panel>
      </Cols>
      <Cols min={760}>
        <Panel><Mini>Defesas SCP · golos sofridos por sistema</Mini><Bars items={a.charts.ourDefense} max={100} pctFmt /></Panel>
        <Panel><Mini>Posição de remate · ataques SCP</Mini><Bars items={a.charts.position} max={100} pctFmt /></Panel>
      </Cols>
    </Screen>
  );
}
