import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { exportGameJSON, importGameJSON, useTicker } from '../actions';
import { clockNow } from '../domain/clock';
import { SHOT_ACTS } from '../domain/constants';
import { fmtClock, fmtDate, parseDate } from '../domain/format';
import { namedRoster, plabel, scoreOf } from '../domain/model';
import type { Game } from '../domain/types';
import { createGame, deleteGame, G, mutate, openGame, setScreen, useStore, type ScreenId } from '../store/store';
import { C, F } from '../theme';
import { ask, confirm, toast } from '../ui/dialogs';
import { Icon, type IconName } from '../ui/Icon';
import { Btn, Chip, Cols, Field, Input, Lead, Mini, Muted, Panel, Row, RowBtn, Screen, SectionHead, Sub, Table, useWide } from '../ui/kit';
import { Select } from '../ui/Select';

const PROGRAMS: { id: ScreenId; icon: IconName; name: string; desc: string; count: (g: Game) => number | null; unit: string }[] = [
  { id: 'individual', icon: 'player', name: 'Estatística Individual', desc: 'Remates e ações por jogador, com posição no campo e destino na baliza.', count: g => g.individual.length, unit: 'ações' },
  { id: 'coletiva', icon: 'team', name: 'Estatística Coletiva', desc: 'Jogadas ofensivas e defensivas, superioridades e contra-ataques, das duas equipas.', count: g => g.collective.length, unit: 'ataques' },
  { id: 'tempo', icon: 'clock', name: 'Tempo de Jogo', desc: 'Entradas, saídas e substituições em tempo real, turnos e tempo total por jogador.', count: g => g.timer.events.length, unit: 'movimentos' },
  { id: 'exclusoes', icon: 'card', name: 'Exclusões', desc: 'Exclusões, cartão vermelho e golos das duas equipas.', count: g => Object.values(g.excl.scp).concat(Object.values(g.excl.opp)).reduce((a, x) => a + (x.ex || 0), 0), unit: 'exclusões' },
  { id: 'remates', icon: 'target', name: 'Remates', desc: 'Mapa de todos os remates do SCP e do adversário, com eficácia por zona.', count: g => g.individual.filter(r => r.mode === 'field' && SHOT_ACTS.includes(r.action)).length, unit: 'remates' },
  { id: 'jogadores', icon: 'roster', name: 'Jogadores', desc: 'Plantel e ficha de cada jogador, com histórico entre jogos.', count: g => g.roster.filter(p => p.name).length, unit: 'no plantel' },
  { id: 'guardaredes', icon: 'goal', name: 'Guarda-Redes', desc: '% de defesas por zona da baliza, distância, situação e período.', count: g => g.individual.filter(r => r.mode === 'gk').length, unit: 'ações' },
  { id: 'analise', icon: 'chart', name: 'Sugestão de Interpretação', desc: 'Leituras automáticas, mapas de eficácia e resumo por jogador.', count: () => null, unit: '' },
];

export default function Home() {
  const st = useStore();
  const g = G();
  const wide = useWide(700);
  useTicker(g.timer.running, 500);
  const sc = scoreOf(g);
  const games = Object.values(st.games).sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.updated - a.updated);
  const won = g.sprints.filter(s => s.winner === 'SCP').length, played = g.sprints.filter(s => s.winner).length;
  const [dateTxt, setDateTxt] = useState(fmtDate(g.date));

  const newGameFlow = async () => {
    const keep = await ask<'keep' | 'empty'>('Novo jogo', 'Cria um jogo vazio. O jogo atual fica guardado em "Jogos guardados".', [
      { label: 'Cancelar', value: null as any, style: 'ghost' },
      { label: 'Plantel vazio', value: 'empty', style: 'outline' },
      { label: 'Manter plantel', value: 'keep', style: 'primary' },
    ]);
    if (!keep) return;
    createGame(keep === 'keep' && !g.demo);
    toast('Novo jogo criado');
  };

  return (
    <Screen>
      <Panel style={{ gap: 16 }}>
        <Cols min={760} flex={[1.3, 1]}>
          <View>
            <Text style={hs.eyebrow}>Sporting CP · Polo Aquático</Text>
            <Text style={hs.hero}>SCP Stat</Text>
            <Lead>Recolha de estatística ao vivo e análise pós-jogo. Funciona sem internet e guarda tudo automaticamente neste dispositivo.</Lead>
          </View>
          <View style={hs.scoreboard}>
            <View style={hs.sbTeam}><Text style={hs.sbName} numberOfLines={2}>{g.scpName || 'Sporting CP'}</Text><Text style={hs.sbScore}>{sc.scp}</Text></View>
            <View style={{ alignItems: 'center' }}><Text style={hs.sbMid}>{g.period} PERÍODO</Text><Text style={hs.sbClock}>{fmtClock(clockNow(g))}</Text></View>
            <View style={hs.sbTeam}><Text style={hs.sbName} numberOfLines={2}>{g.opponent || 'Adversário'}</Text><Text style={hs.sbScore}>{sc.opp}</Text></View>
          </View>
        </Cols>
      </Panel>

      <Cols min={900} flex={[1.4, 1]}>
        <Panel>
          <SectionHead title="Jogo atual" right={<Btn label="Novo jogo" icon="plus" variant="primary" onPress={newGameFlow} />} />
          <Row gap={12} style={{ marginVertical: 14, alignItems: 'flex-start' }}>
            <Field label="Adversário"><Input value={g.opponent} onChangeText={t => mutate(x => { x.opponent = t; })} /></Field>
            <Field label="Data (dd/mm/aaaa)">
              <Input value={dateTxt} onChangeText={setDateTxt} keyboardType="numbers-and-punctuation"
                onEndEditing={() => { const d = parseDate(dateTxt); if (d) mutate(x => { x.date = d; }); else { toast('Data inválida. Usa dd/mm/aaaa.', 'warn'); setDateTxt(fmtDate(g.date)); } }} />
            </Field>
            <Field label="Competição"><Input value={g.competition} placeholder="Ex.: Campeonato Nacional" onChangeText={t => mutate(x => { x.competition = t; })} /></Field>
            <Field label="Local"><Input value={g.venue} placeholder="Piscina" onChangeText={t => mutate(x => { x.venue = t; })} /></Field>
            <Field label="Duração do período">
              <Select value={String(g.periodLength)} title="Duração do período" options={[5, 6, 7, 8].map(m => ({ value: String(m * 60), label: `${m} minutos` }))}
                onChange={v => { mutate(x => { x.periodLength = +v; if (!x.timer.running && (x.timer.remaining > x.periodLength || x.timer.events.length === 0)) x.timer.remaining = x.periodLength; }); toast('Duração do período: ' + fmtClock(+v)); }} />
            </Field>
          </Row>
          <Mini>Programas</Mini>
          <View style={{ gap: 8 }}>
            {PROGRAMS.map(p => {
              const c = p.count(g);
              return (
                <Pressable key={p.id} onPress={() => setScreen(p.id)} style={({ pressed }: { pressed: boolean }) => [hs.prog, pressed && { borderColor: C.green2, backgroundColor: '#f4faf6' }]}>
                  <View style={hs.progIcon}><Icon name={p.icon} size={22} color={C.green} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={hs.progName}>{p.name}</Text>
                    {wide ? <Text style={hs.progDesc}>{p.desc}</Text> : null}
                  </View>
                  {c != null ? <View style={{ alignItems: 'flex-end' }}><Text style={hs.progCount}>{c}</Text><Text style={hs.progUnit}>{p.unit}</Text></View> : null}
                  <Icon name="open" size={18} color={C.green} />
                </Pressable>
              );
            })}
          </View>
        </Panel>

        <View style={{ gap: 16 }}>
          <Panel>
            <SectionHead title="Bolas de saída" right={<Muted>SCP ganhou <Text style={{ fontFamily: F.bodyBold }}>{won}</Text> de {played}</Muted>} />
            <Muted style={{ marginVertical: 8 }}>Uma por período. Toca em quem ganhou o sprint e, se foi o SCP, escolhe o jogador.</Muted>
            {g.sprints.map((s, i) => (
              <View key={s.period} style={[hs.sprint, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
                <Text style={hs.sprintP}>{s.period}</Text>
                <Chip label="SCP" on={s.winner === 'SCP'} onPress={() => mutate(x => { const sp = x.sprints[i]; sp.winner = sp.winner === 'SCP' ? '' : 'SCP'; if (sp.winner !== 'SCP') sp.player = ''; })} />
                <Chip label="Adversário" on={s.winner === 'ADV'} onColor="#5b6b68" onPress={() => mutate(x => { const sp = x.sprints[i]; sp.winner = sp.winner === 'ADV' ? '' : 'ADV'; sp.player = ''; })} />
                {s.winner === 'SCP' ? (
                  <View style={{ flex: 1, minWidth: 140 }}>
                    <Select small value={s.player} placeholder="Jogador…" title={`Bola de saída · ${s.period} período`} options={namedRoster(g).map(p => ({ value: String(p.n), label: plabel(g, p.n) }))}
                      onChange={v => mutate(x => { x.sprints[i].player = v; })} />
                  </View>
                ) : null}
              </View>
            ))}
          </Panel>
          <Panel>
            <Sub>Dados e cópias de segurança</Sub>
            <Muted style={{ marginVertical: 8 }}>Os registos ficam guardados automaticamente neste dispositivo. No fim de cada jogo, exporta o jogo completo para guardar uma cópia ou passá-lo para outro dispositivo (também abre na versão web).</Muted>
            <Row>
              <Btn label="Exportar jogo" icon="download" variant="outline" onPress={() => exportGameJSON()} />
              <Btn label="Importar jogo" icon="upload" variant="ghost" onPress={importGameJSON} />
            </Row>
          </Panel>
        </View>
      </Cols>

      <Panel>
        <Sub style={{ marginBottom: 12 }}>Jogos guardados</Sub>
        <Table
          cols={[{ title: 'Data', w: 96, align: 'left' }, { title: 'Adversário', w: 190, align: 'left' }, { title: 'Competição', w: 150, align: 'left' }, { title: 'Resultado', w: 84 }, { title: 'Registos', w: 76 }, { title: 'Ações', w: 130 }]}
          highlight={i => games[i].id === g.id}
          rows={games.map(x => {
            const s = scoreOf(x), n = x.individual.length + x.collective.length + x.timer.events.length;
            return [
              fmtDate(x.date),
              <View key="o" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                <Text style={hs.td}>{x.opponent}</Text>
                {x.id === g.id ? <Text style={[hs.pill, { backgroundColor: C.okbg, color: C.ok }]}>aberto</Text> : null}
                {x.demo ? <Text style={[hs.pill, { backgroundColor: C.warnbg, color: C.warn }]}>exemplo</Text> : null}
              </View>,
              x.competition || '—', `${s.scp} – ${s.opp}`, n,
              <Row key="a" gap={4} wrap={false}>
                {x.id !== g.id ? <Btn small label="Abrir" variant="outline" onPress={() => { openGame(x.id); toast('Jogo aberto'); }} /> : null}
                <RowBtn icon="trash" danger label="Apagar jogo" onPress={async () => {
                  if (!(await confirm('Apagar jogo', `Apagar o jogo de ${fmtDate(x.date)} contra **${x.opponent}** e todos os seus registos? Não é possível desfazer.`, 'Apagar jogo'))) return;
                  await deleteGame(x.id); toast('Jogo apagado');
                }} />
              </Row>,
            ];
          })}
        />
      </Panel>
    </Screen>
  );
}

const hs = StyleSheet.create({
  eyebrow: { fontFamily: F.disp, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: C.green2, marginBottom: 4 },
  hero: { fontFamily: F.dispX, fontSize: 54, lineHeight: 56, color: C.green, textTransform: 'uppercase' },
  scoreboard: { backgroundColor: C.deep, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sbTeam: { flex: 1, alignItems: 'center' },
  sbName: { color: C.white, opacity: 0.9, fontFamily: F.disp, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  sbScore: { color: C.white, fontFamily: F.dispX, fontSize: 52, lineHeight: 56, fontVariant: ['tabular-nums'] },
  sbMid: { color: C.white, fontFamily: F.disp, fontSize: 13, letterSpacing: 1.5 },
  sbClock: { color: C.yellow, fontFamily: F.dispX, fontSize: 24, fontVariant: ['tabular-nums'] },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.white },
  progIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#e3f2e9', alignItems: 'center', justifyContent: 'center' },
  progName: { fontFamily: F.dispX, fontSize: 18, color: C.deep, textTransform: 'uppercase', letterSpacing: 0.3 },
  progDesc: { fontFamily: F.body, fontSize: 13.5, color: C.muted, marginTop: 2 },
  progCount: { fontFamily: F.dispX, fontSize: 22, color: C.deep },
  progUnit: { fontFamily: F.bodySemi, fontSize: 11, color: C.muted },
  sprint: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingVertical: 8 },
  sprintP: { width: 40, fontFamily: F.dispX, fontSize: 20, color: C.deep },
  td: { fontFamily: F.body, fontSize: 13.5, color: C.ink },
  pill: { fontFamily: F.bodyBold, fontSize: 11, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
});
