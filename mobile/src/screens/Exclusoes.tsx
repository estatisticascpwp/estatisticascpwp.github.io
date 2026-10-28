import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fileStamp } from '../actions';
import { clockNow } from '../domain/clock';
import { csvObjects, parseCSV, toCSV } from '../domain/csv';
import { clamp, fmtClock, uid } from '../domain/format';
import { exName, exOf, peekEx, player, teamName } from '../domain/model';
import type { Game, Team } from '../domain/types';
import { G, mutate, useStore } from '../store/store';
import { C, F } from '../theme';
import { confirm, toast } from '../ui/dialogs';
import { exportText, importText } from '../ui/files';
import { Badge, Btn, CapNum, Cols, Panel, Row, Screen, SectionHead, Table, ViewHead } from '../ui/kit';

function log(g: Game, team: Team, n: number, type: string) {
  g.exclLog.push({ id: uid(), team, n, type, period: g.period, clock: Math.round(clockNow(g)), ts: Date.now() });
}
function tapEx(team: Team, n: number, k: number) {
  let msg = '';
  mutate(g => {
    const o = exOf(g, team, n), before = o.ex;
    o.ex = o.ex >= k ? k - 1 : k;
    log(g, team, n, o.ex > before ? `Exclusão ${o.ex}` : `Exclusão anulada (fica ${o.ex})`);
    if (o.ex === 3) msg = `${exName(g, team, n)} excluído definitivamente (3 exclusões)`;
  });
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  if (msg) toast(msg, 'warn');
}
function goalStep(team: Team, n: number, d: number) {
  const g = G(); if (d < 0 && peekEx(g, team, n).goals === 0) return;
  mutate(x => { const o = exOf(x, team, n); o.goals = Math.max(0, o.goals + d); log(x, team, n, d > 0 ? 'Golo' : 'Golo anulado'); });
  Haptics.impactAsync(d > 0 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function Exclusoes() {
  useStore();
  const g = G();
  const recent = g.exclLog.slice().reverse().slice(0, 120);
  return (
    <Screen>
      <Panel>
        <ViewHead title="Exclusões" lead="E1–E3: toca para marcar cada exclusão (tocar de novo numa marcada desfaz). Golos: toque soma 1, toque longo subtrai 1. Os nomes do SCP escritos aqui aparecem em todos os programas."
          right={<Row>
            <Btn small label="Exportar CSV" icon="download" variant="outline" onPress={exportExcl} />
            <Btn small label="Importar CSV" icon="upload" variant="ghost" onPress={importExcl} />
            <Btn small label="Repor contadores" icon="reset" variant="danger" onPress={async () => {
              if (!(await confirm('Repor contadores', 'Pôr a zero as exclusões, cartões vermelhos e golos das duas equipas? Os nomes mantêm-se.', 'Repor'))) return;
              mutate(x => { x.excl = { scp: {}, opp: {} }; x.exclLog = []; }); toast('Contadores a zero');
            }} />
          </Row>} />
        <Cols min={1100}>
          <TeamCard team="scp" />
          <TeamCard team="opp" />
        </Cols>
      </Panel>
      <Panel>
        <SectionHead title="Registo detalhado" right={<Btn small label="Exportar registo" icon="download" variant="outline" onPress={exportLog} />} />
        <View style={{ height: 12 }} />
        <Table
          cols={[{ title: 'Período', w: 70 }, { title: 'Relógio', w: 70 }, { title: 'Equipa', w: 140, align: 'left' }, { title: 'Jogador', w: 170, align: 'left' }, { title: 'Evento', w: 200 }]}
          empty="Os golos, exclusões e cartões aparecem aqui com o período e o tempo do relógio."
          rows={recent.map(e => [e.period, fmtClock(e.clock), teamName(g, e.team), `${e.n} · ${exName(g, e.team, e.n)}`,
            <Badge key="b" text={e.type} minWidth={0} tone={e.type === 'Golo' ? 'good' : /vermelho$/.test(e.type) ? 'bad' : /^Exclusão \d/.test(e.type) ? 'warn' : 'neutral'} />])}
        />
      </Panel>
    </Screen>
  );
}

function TeamCard({ team }: { team: Team }) {
  const g = G();
  const rows = team === 'scp' ? g.roster.slice(0, 13) : g.oppRoster;
  const tot = rows.reduce((a, p) => { const o = peekEx(g, team, p.n); a.ex += o.ex; a.goals += o.goals; a.out += o.ex >= 3 || o.red ? 1 : 0; return a; }, { ex: 0, goals: 0, out: 0 });
  return (
    <View style={xs.card}>
      <View style={[xs.head, team === 'opp' && { backgroundColor: '#3f4e4b' }]}>
        <TextInput value={team === 'scp' ? g.scpName : g.opponent} onChangeText={(v: string) => mutate(x => { if (team === 'scp') x.scpName = v; else x.opponent = v; })} style={xs.teamInput} accessibilityLabel="Nome da equipa" />
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {[[tot.goals, 'golos'], [tot.ex, 'exclusões'], [tot.out, 'fora']].map(([v, l]) => <Text key={l as string} style={xs.tot}><Text style={xs.totNum}>{v} </Text>{l}</Text>)}
        </View>
      </View>
      <Table
        cols={[{ title: 'Nº', w: 46 }, { title: 'Nome', w: 150, align: 'left' }, ...(team === 'scp' ? [{ title: 'GR', w: 46 }] : []), { title: 'Exclusões', w: 140 }, { title: 'CV', w: 46 }, { title: 'Golos', w: 70 }]}
        rowStyle={i => { const o = peekEx(g, team, rows[i].n); return o.ex >= 3 || o.red ? { backgroundColor: '#ffe9e8' } : null; }}
        rows={rows.map(p => {
          const o = peekEx(g, team, p.n), out = o.ex >= 3 || o.red;
          const gk = team === 'scp' ? !!player(g, p.n)?.gr : p.n === 1 || p.n === 13;
          return [
            <CapNum key="c" n={p.n} gk={gk} />,
            <View key="n" style={{ width: '100%' }}>
              <TextInput value={p.name} placeholder="Nome" placeholderTextColor="#8a9b97" style={[xs.name, out && { textDecorationLine: 'line-through', color: '#a03030' }]} accessibilityLabel={`Nome do jogador ${p.n}`}
                onChangeText={(v: string) => mutate(x => { if (team === 'scp') player(x, p.n)!.name = v; else x.oppRoster[p.n - 1].name = v; })} />
              {out ? <Text style={xs.outTag}>{o.red ? 'CARTÃO VERMELHO' : 'EXCLUÍDO'}</Text> : null}
            </View>,
            ...(team === 'scp' ? [
              <Pressable key="g" onPress={() => mutate(x => { const pl = player(x, p.n)!; pl.gr = !pl.gr; if (!pl.gr && pl.pos === 'Guarda-redes') pl.pos = ''; if (pl.gr && !pl.pos) pl.pos = 'Guarda-redes'; })} style={[xs.gkT, gk && xs.gkTOn]} accessibilityLabel="Guarda-redes">
                <Text style={[xs.gkTText, gk && { color: C.bad }]}>GR</Text>
              </Pressable>] : []),
            <View key="e" style={{ flexDirection: 'row', gap: 4 }}>
              {[1, 2, 3].map(k => (
                <Pressable key={k} onPress={() => tapEx(team, p.n, k)} style={[xs.exb, o.ex >= k && (out ? xs.exbOut : xs.exbOn)]} accessibilityLabel={`Exclusão ${k} do jogador ${p.n}`}>
                  <Text style={[xs.exbText, o.ex >= k && { color: out ? C.white : '#3a2b00' }]}>E{k}</Text>
                </Pressable>
              ))}
            </View>,
            <Pressable key="r" onPress={() => mutate(x => { const e = exOf(x, team, p.n); e.red = !e.red; log(x, team, p.n, e.red ? 'Cartão vermelho' : 'Cartão vermelho anulado'); })} style={[xs.red, o.red && xs.redOn]} accessibilityLabel={`Cartão vermelho do jogador ${p.n}`} />,
            <Pressable key="gl" onPress={() => goalStep(team, p.n, 1)} onLongPress={() => goalStep(team, p.n, -1)} delayLongPress={450} style={[xs.goal, o.goals > 0 && xs.goalHas]} accessibilityLabel={`Golos do jogador ${p.n}: ${o.goals}. Toque longo para subtrair.`}>
              <Text style={xs.goalText}>{o.goals}</Text>
            </Pressable>,
          ];
        })}
      />
    </View>
  );
}

function exportExcl() {
  const g = G(), rows: unknown[][] = [['Equipa', 'Nº', 'Nome', 'GR', 'Exclusões', 'Cartão vermelho', 'Golos']];
  (['scp', 'opp'] as Team[]).forEach(t => (t === 'scp' ? g.roster.slice(0, 13) : g.oppRoster).forEach(p => {
    const o = peekEx(g, t, p.n);
    rows.push([t === 'scp' ? 'SCP' : 'Adversário', p.n, p.name, t === 'scp' && player(g, p.n)?.gr ? 'Sim' : '', o.ex, o.red ? 'Sim' : '', o.goals]);
  }));
  rows.push([]); rows.push(['Nome equipa SCP', g.scpName]); rows.push(['Nome equipa adversária', g.opponent]);
  exportText('exclusoes_' + fileStamp() + '.csv', toCSV(rows));
}
function exportLog() {
  const g = G();
  if (!g.exclLog.length) { toast('Ainda não há eventos registados.', 'warn'); return; }
  exportText('exclusoes_registo_' + fileStamp() + '.csv', toCSV([['Período', 'Relógio', 'Equipa', 'Nº', 'Jogador', 'Evento', 'Hora'], ...g.exclLog.map(e => [e.period, fmtClock(e.clock), teamName(g, e.team), e.n, exName(g, e.team, e.n), e.type, new Date(e.ts).toLocaleString('pt-PT')])]));
}
async function importExcl() {
  const f = await importText('csv'); if (!f) return;
  const raw = parseCSV(f.text);
  const objs = csvObjects(f.text).filter(o => (o['Equipa'] === 'SCP' || o['Equipa'] === 'Adversário') && o['Nº']);
  if (!objs.length) { toast('Não encontrei jogadores. Usa um CSV exportado pelas Exclusões.', 'bad'); return; }
  if (!(await confirm('Importar exclusões', `Substituir nomes, exclusões e golos pelos **${objs.length}** jogadores do ficheiro?`, 'Importar', false))) return;
  mutate(g => {
    g.excl = { scp: {}, opp: {} };
    objs.forEach(o => {
      const t: Team = o['Equipa'] === 'SCP' ? 'scp' : 'opp', n = +o['Nº']; if (!(n >= 1 && n <= 13)) return;
      if (t === 'scp') { const p = player(g, n)!; p.name = o['Nome'] || ''; p.gr = o['GR'] === 'Sim'; } else g.oppRoster[n - 1].name = o['Nome'] || '';
      g.excl[t][n] = { ex: clamp(+o['Exclusões'] || 0, 0, 3), red: o['Cartão vermelho'] === 'Sim', goals: Math.max(0, +o['Golos'] || 0) };
    });
    raw.forEach(r => { if (r[0] === 'Nome equipa SCP' && r[1]) g.scpName = r[1]; if (r[0] === 'Nome equipa adversária' && r[1]) g.opponent = r[1]; });
  });
  toast('Exclusões importadas');
}

const xs = StyleSheet.create({
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 12, overflow: 'hidden' },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 10, backgroundColor: C.deep },
  teamInput: { flexGrow: 1, flexBasis: 160, minHeight: 40, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 8, paddingHorizontal: 10, color: C.white, fontFamily: F.dispX, fontSize: 19, textTransform: 'uppercase' },
  tot: { color: C.white, fontFamily: F.body, fontSize: 13 },
  totNum: { fontFamily: F.dispX, fontSize: 20 },
  name: { minHeight: 36, borderWidth: 1, borderColor: '#c7d5cf', borderRadius: 7, paddingHorizontal: 8, backgroundColor: C.white, fontFamily: F.body, fontSize: 14, color: C.ink },
  outTag: { alignSelf: 'flex-start', marginTop: 3, backgroundColor: C.red, color: C.white, fontFamily: F.bodyBold, fontSize: 10.5, letterSpacing: 0.6, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  gkT: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 },
  gkTOn: { backgroundColor: C.gkCapBg, borderColor: '#f0b4b1' },
  gkTText: { fontFamily: F.bodyBold, fontSize: 11, color: '#8a9b97' },
  exb: { width: 40, height: 40, borderRadius: 8, borderWidth: 2, borderColor: '#cdd8d4', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  exbOn: { backgroundColor: '#f5c518', borderColor: '#d4a800' },
  exbOut: { backgroundColor: C.red, borderColor: '#a51f1f' },
  exbText: { fontFamily: F.dispX, fontSize: 14, color: '#7d8f8b' },
  red: { width: 28, height: 40, borderRadius: 5, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e0a3a1', backgroundColor: C.white },
  redOn: { backgroundColor: C.red, borderStyle: 'solid', borderColor: '#a51f1f' },
  goal: { minWidth: 54, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#c7d5cf', backgroundColor: '#f3f7f5', alignItems: 'center', justifyContent: 'center' },
  goalHas: { backgroundColor: '#d6f2de', borderColor: '#9fd6b0' },
  goalText: { fontFamily: F.dispX, fontSize: 21, color: C.deep, fontVariant: ['tabular-nums'] },
});
