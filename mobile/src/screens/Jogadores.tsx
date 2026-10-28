import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fileStamp } from '../actions';
import { computeShifts } from '../domain/clock';
import { HANDS, POSITIONS, SHOT_ACTS } from '../domain/constants';
import { csvObjects, toCSV } from '../domain/csv';
import { fmtClock, fmtDate, fmtPct, groupBy, numPT } from '../domain/format';
import { defaultRoster, namedRoster, peekEx, player, plabel, pname } from '../domain/model';
import { findInGame, playerLine } from '../domain/stats';
import { G, getState, mutate, setScreen, useScreenState, useStore } from '../store/store';
import { C, F } from '../theme';
import { GoalView, Pitch } from '../ui/Court';
import { ask, confirm, toast } from '../ui/dialogs';
import { exportText, importText } from '../ui/files';
import { Bars, Btn, CapNum, Cols, Input, Kpi, Kpis, Mini, Muted, Panel, Row, Screen, SectionHead, Sub, Table, ViewHead } from '../ui/kit';
import { Select } from '../ui/Select';

export default function Jogadores() {
  const store = useStore();
  const g = G();
  const shifts = computeShifts(g).byPlayer;
  const [sel, setSel] = useScreenState<number | null>('jog-sel', () => {
    const gg = G();
    const best = gg.roster.filter(p => !p.gr).map(p => ({ p, l: playerLine(gg, p.n) })).sort((a, b) => b.l.goals - a.l.goals || b.l.shots - a.l.shots)[0];
    return best ? best.p.n : 1;
  });
  const p = player(g, sel || 1)!;
  const l = playerLine(g, p.n), sh = shifts[p.n], ex = peekEx(g, 'scp', p.n);
  const hist = Object.values(store.games).sort((a, b) => String(a.date).localeCompare(String(b.date))).map(x => {
    const n = findInGame(x, p); if (n == null) return null;
    const hl = playerLine(x, n), t = computeShifts(x).byPlayer[n]?.total || 0;
    return { x, n, hl, t };
  }).filter((h): h is NonNullable<typeof h> => !!h && (h.hl.F.length > 0 || h.hl.K.length > 0 || h.t > 0));
  const tot = hist.reduce((a, h) => { a.shots += h.hl.shots; a.goals += h.hl.goals; a.ast += h.hl.ast; a.excW += h.hl.excW; a.excL += h.hl.excL; a.sv += h.hl.sv; a.gs += h.hl.gs; a.t += h.t; return a; }, { shots: 0, goals: 0, ast: 0, excW: 0, excL: 0, sv: 0, gs: 0, t: 0 });
  const acts = [...groupBy(l.F, 'action')].map(([k, rs]) => ({ label: k, v: rs.length, bad: ['Defesa', 'Bloco', 'Fora', 'EXC sofrida', 'Perda Bola', 'Passe Falhado', 'Falta Atacante'].includes(k) })).sort((a, b) => b.v - a.v);

  const copyRoster = async () => {
    const others = Object.values(getState().games).filter(x => x.id !== g.id && x.roster.some(r => r.name)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!others.length) { toast('Não há outros jogos com plantel preenchido.', 'warn'); return; }
    const id = await ask<string>('Copiar plantel', 'Escolhe o jogo de onde copiar nomes, GR, posição e mão. Os registos deste jogo não mudam.',
      [...others.map(x => ({ label: `${fmtDate(x.date)} · vs ${x.opponent}`, value: x.id, style: 'outline' as const })), { label: 'Cancelar', value: null as any, style: 'ghost' as const }], { list: true });
    if (!id) return;
    mutate(x => { x.roster = getState().games[id].roster.map(r => ({ ...r })); }); toast('Plantel copiado');
  };
  const importRoster = async () => {
    const f = await importText('csv'); if (!f) return;
    const objs = csvObjects(f.text).filter(o => +o['Nº'] >= 1 && +o['Nº'] <= 15);
    if (!objs.length) { toast('Não encontrei jogadores. Usa um CSV com as colunas Nº e Nome.', 'bad'); return; }
    if (!(await confirm('Importar plantel', `Substituir o plantel deste jogo pelos **${objs.length}** jogadores do ficheiro?`, 'Importar', false))) return;
    const r = defaultRoster();
    objs.forEach(o => { const x = r[+o['Nº'] - 1]; x.name = o['Nome'] || ''; x.gr = o['GR'] ? /^s/i.test(o['GR']) : x.gr; x.pos = POSITIONS.includes(o['Posição']) ? o['Posição'] : x.gr ? 'Guarda-redes' : ''; x.hand = HANDS.includes(o['Mão']) ? o['Mão'] : ''; });
    mutate(x => { x.roster = r; }); toast('Plantel importado');
  };

  return (
    <Screen>
      <Panel>
        <ViewHead title="Jogadores" lead="O plantel do SCP para este jogo. É o mesmo usado na Estatística Individual, Tempo de Jogo e Exclusões: altera aqui ou lá, fica igual em todo o lado."
          right={<Row>
            <Btn small label="Copiar de outro jogo" icon="roster" variant="ghost" onPress={copyRoster} />
            <Btn small label="Exportar plantel" icon="download" variant="outline" onPress={() => exportText('plantel_' + fileStamp() + '.csv', toCSV([['Nº', 'Nome', 'GR', 'Posição', 'Mão'], ...g.roster.map(x => [x.n, x.name, x.gr ? 'Sim' : '', x.pos || '', x.hand || ''])]))} />
            <Btn small label="Importar plantel" icon="upload" variant="ghost" onPress={importRoster} />
          </Row>} />
        <Table
          cols={[{ title: 'Nº', w: 50 }, { title: 'Nome', w: 170, align: 'left' }, { title: 'GR', w: 50 }, { title: 'Posição', w: 150 }, { title: 'Mão', w: 116 }, { title: 'Remates', w: 70 }, { title: 'Golos', w: 60 }, { title: 'Tempo', w: 70 }, { title: 'Ficha', w: 70 }]}
          highlight={i => g.roster[i].n === p.n}
          rows={g.roster.map(x => {
            const pl = playerLine(g, x.n);
            return [
              <CapNum key="c" n={x.n} gk={x.gr} />,
              <Input key="n" small value={x.name} placeholder="Nome" style={{ width: '100%' }} accessibilityLabel={`Nome do jogador ${x.n}`} onChangeText={v => mutate(y => { player(y, x.n)!.name = v; })} />,
              <Pressable key="g" onPress={() => mutate(y => { const q = player(y, x.n)!; q.gr = !q.gr; if (!q.gr && q.pos === 'Guarda-redes') q.pos = ''; if (q.gr && !q.pos) q.pos = 'Guarda-redes'; })} style={[js.gkT, x.gr && js.gkTOn]}><Text style={[js.gkTText, x.gr && { color: C.bad }]}>GR</Text></Pressable>,
              <View key="p" style={{ width: 138 }}><Select small value={x.pos} emptyLabel="—" options={POSITIONS} title={`Posição de ${plabel(g, x.n)}`} onChange={v => mutate(y => { const q = player(y, x.n)!; q.pos = v; if (v === 'Guarda-redes') q.gr = true; })} /></View>,
              <View key="h" style={{ width: 104 }}><Select small value={x.hand} options={HANDS.map(h => ({ value: h, label: h || '—' }))} title={`Mão de ${plabel(g, x.n)}`} onChange={v => mutate(y => { player(y, x.n)!.hand = v; })} /></View>,
              x.gr ? '—' : pl.shots, x.gr ? '—' : pl.goals, shifts[x.n].total ? fmtClock(shifts[x.n].total) : '—',
              <Btn key="v" small label="Ver" variant={x.n === p.n ? 'green' : 'outline'} onPress={() => setSel(x.n)} />,
            ];
          })}
        />
        <Muted style={{ marginTop: 8 }}>Os guarda-redes usam touca vermelha (nº 1 e 13 por defeito). Os nº 14 e 15 aparecem nos outros programas só depois de terem nome.</Muted>
      </Panel>

      <Panel>
        <SectionHead title="Ficha do jogador" right={<View style={{ minWidth: 220 }}><Select value={String(p.n)} options={namedRoster(g).map(x => ({ value: String(x.n), label: plabel(g, x.n) + (x.gr ? ' (GR)' : '') }))} onChange={v => setSel(+v)} title="Escolher jogador" /></View>} />
        <View style={js.prof}>
          <View style={[js.bigcap, p.gr && { backgroundColor: '#e84a44' }]}><Text style={[js.bigcapText, p.gr && { color: C.white }]}>{p.n}</Text></View>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={js.profName}>{pname(g, p.n)}</Text>
            <Text style={js.profSub}>{[p.gr ? 'Guarda-redes' : p.pos, p.hand ? 'mão ' + p.hand.toLowerCase() : ''].filter(Boolean).join(' · ') || 'Posição por definir'} · {sh.count} turno(s) · {fmtClock(sh.total)} na água</Text>
          </View>
          <View style={js.meta}>
            {(p.gr
              ? [[l.gkOn ? Math.round((l.sv * 100) / l.gkOn) + '%' : '—', '% defesas'], [l.sv, 'defesas'], [l.gs, 'golos sofridos']]
              : [[l.goals, 'golos'], [l.shots, 'remates'], [fmtPct(l.goals, l.shots), 'eficácia'], [l.ast, 'assist.']]
            ).map(([v, lb]) => <View key={lb as string} style={{ alignItems: 'center' }}><Text style={js.metaV}>{v}</Text><Text style={js.metaL}>{lb}</Text></View>)}
          </View>
        </View>
        {p.gr ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <Muted>Para o detalhe por zona da baliza e situação, abre a página Guarda-Redes.</Muted>
            <Btn small label="Abrir Guarda-Redes" icon="open" variant="outline" onPress={() => setScreen('guardaredes')} />
          </View>
        ) : (
          <>
            <View style={{ height: 14 }} />
            <Kpis>
              <Kpi k="Exclusões ganhas" v={l.excW} sub="provocadas ao adversário" />
              <Kpi k="Exclusões sofridas" v={l.excL} sub={`tabela de exclusões: ${ex.ex}/3${ex.red ? ' · vermelho' : ''}`} />
              <Kpi k="Perdas de posse" v={l.lost} sub="perdas, passes falhados, faltas at." />
              <Kpi k="Roubos de bola" v={l.steal} />
              <Kpi k="Blocos defensivos" v={l.blk} />
              <Kpi k="Golos / 8 min" v={sh.total >= 60 ? numPT((l.goals * 480) / sh.total) : '—'} sub="tempo na água" />
            </Kpis>
            <View style={{ height: 16 }} />
            <Cols min={900}>
              <View><Mini>Posição das ações · {l.F.length}</Mini><Pitch rows={l.F} /></View>
              <View>
                <Mini>Destino dos remates</Mini><GoalView rows={l.F.filter(r => SHOT_ACTS.includes(r.action))} />
                <Mini style={{ marginTop: 14 }}>Ações registadas</Mini><Bars items={acts} />
              </View>
            </Cols>
          </>
        )}
        <Sub style={{ marginTop: 20, marginBottom: 10, fontSize: 20 }}>Histórico em todos os jogos guardados</Sub>
        <Table
          cols={[{ title: 'Data', w: 96, align: 'left' }, { title: 'Adversário', w: 160, align: 'left' }, { title: 'Nº', w: 44 },
            ...(p.gr ? [{ title: 'Defesas', w: 70 }, { title: 'Golos sofridos', w: 104 }, { title: '% defesas', w: 84 }] : [{ title: 'Remates', w: 70 }, { title: 'Golos', w: 60 }, { title: 'Eficácia', w: 72 }, { title: 'Assist.', w: 60 }, { title: 'EXC ganhas', w: 86 }, { title: 'EXC sofridas', w: 92 }]),
            { title: 'Tempo', w: 70 }]}
          highlight={i => (i < hist.length ? hist[i].x.id === g.id : false)}
          empty="Sem registos deste jogador."
          rows={[
            ...hist.map(h => [fmtDate(h.x.date), h.x.opponent + (h.x.demo ? ' (exemplo)' : ''), h.n,
              ...(p.gr ? [h.hl.sv, h.hl.gs, fmtPct(h.hl.sv, h.hl.gkOn)] : [h.hl.shots, <Text key="g" style={{ fontFamily: F.bodyBold }}>{h.hl.goals}</Text>, fmtPct(h.hl.goals, h.hl.shots), h.hl.ast, h.hl.excW, h.hl.excL]),
              h.t ? fmtClock(h.t) : '—']),
            ...(hist.length > 1 ? [[<Text key="t" style={{ fontFamily: F.bodyBold }}>Total ({hist.length} jogos)</Text>, '', '',
              ...(p.gr ? [tot.sv, tot.gs, fmtPct(tot.sv, tot.sv + tot.gs)] : [tot.shots, tot.goals, fmtPct(tot.goals, tot.shots), tot.ast, tot.excW, tot.excL]), fmtClock(tot.t)]] : []),
          ]}
        />
        <Muted style={{ marginTop: 8 }}>O jogador é reconhecido nos outros jogos pelo nome (ou pelo número, se não tiver nome).</Muted>
      </Panel>
    </Screen>
  );
}

const js = StyleSheet.create({
  gkT: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 },
  gkTOn: { backgroundColor: C.gkCapBg, borderColor: '#f0b4b1' },
  gkTText: { fontFamily: F.bodyBold, fontSize: 11, color: '#8a9b97' },
  prof: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: C.deep },
  bigcap: { width: 62, height: 62, borderRadius: 31, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  bigcapText: { color: C.deep, fontFamily: F.dispX, fontSize: 28 },
  profName: { color: C.white, fontFamily: F.dispX, fontSize: 28, lineHeight: 30, textTransform: 'uppercase' },
  profSub: { color: C.white, opacity: 0.85, fontFamily: F.body, fontSize: 13.5, marginTop: 3 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  metaV: { color: C.yellow, fontFamily: F.dispX, fontSize: 26, fontVariant: ['tabular-nums'] },
  metaL: { color: C.white, opacity: 0.85, fontFamily: F.body, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
});
