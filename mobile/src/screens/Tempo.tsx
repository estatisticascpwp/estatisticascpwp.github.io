import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { askImportMode, fileStamp, setPeriod, useTicker } from '../actions';
import { absTime, clockNow, computeShifts, inPool, nowAbs } from '../domain/clock';
import { PERIODS } from '../domain/constants';
import { csvObjects, toCSV } from '../domain/csv';
import { clamp, fmtClock, norm, parseClock, uid } from '../domain/format';
import { player, plabel, pname } from '../domain/model';
import type { Period, TimerEvent } from '../domain/types';
import { G, mutate, settings, useScreenState, useStore } from '../store/store';
import { C, F } from '../theme';
import { ask, confirm, toast } from '../ui/dialogs';
import { exportText, importText } from '../ui/files';
import { Badge, Btn, CapNum, Chip, Input, Mini, Muted, Panel, Row, RowBtn, Screen, SectionHead, Seg, Table, ViewHead, useWide } from '../ui/kit';
import { Select } from '../ui/Select';

const maxPool = () => settings().maxInPool || 7;

function addMove(n: number, type: 'in' | 'out') {
  mutate(g => { g.timer.seq = (g.timer.seq || 0) + 1; g.timer.events.push({ id: uid(), n, type, period: g.period, clock: Math.round(clockNow(g)), seq: g.timer.seq, ts: Date.now() }); });
}
function doSub(out: number | null, inn: number | null) {
  const g = G(), s = computeShifts(g).byPlayer;
  if (out == null || inn == null) { toast('Escolhe quem sai e quem entra.', 'warn'); return false; }
  if (!s[out].on) { toast(`${plabel(g, out)} não está na água.`, 'warn'); return false; }
  if (s[inn].on) { toast(`${plabel(g, inn)} já está na água.`, 'warn'); return false; }
  addMove(out, 'out'); addMove(inn, 'in');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  toast(`Substituição: sai ${plabel(g, out)}, entra ${plabel(g, inn)} · ${g.period} ${fmtClock(clockNow(g))}`);
  return true;
}
async function moveIn(n: number) {
  const g = G(), s = computeShifts(g).byPlayer, pool = inPool(s);
  if (s[n].on) { addMove(n, 'out'); toast(`${plabel(g, n)} saiu · ${g.period} ${fmtClock(clockNow(g))}`); return; }
  if (pool.length >= maxPool()) {
    const out = await ask<number>(`Entra ${plabel(g, n)}: quem sai?`, `Estão ${pool.length} jogadores na água. Escolhe quem sai — a saída e a entrada ficam registadas no mesmo instante (${g.period} ${fmtClock(clockNow(g))}).`,
      [...pool.map(k => ({ label: plabel(g, k) + (player(g, k)?.gr ? ' (GR)' : ''), value: k, style: 'outline' as const })), { label: 'Cancelar', value: null as any, style: 'ghost' as const }], { list: true });
    if (out == null) return;
    doSub(out, n); return;
  }
  addMove(n, 'in');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  toast(`${plabel(g, n)} entrou · ${g.period} ${fmtClock(clockNow(g))}`);
}

export default function Tempo() {
  useKeepAwake(); // o ecrã não se desliga durante o jogo
  useStore();
  const g = G(), t = g.timer, L = g.periodLength;
  useTicker(t.running, 500);
  const wide = useWide(980);
  const [sub, setSub] = useScreenState<{ out: number | null; in: number | null }>('tempo-sub', { out: null, in: null });
  const [mm, setMm] = useState(String(Math.floor(Math.round(clockNow(g)) / 60)));
  const [ss, setSs] = useState(String(Math.round(clockNow(g)) % 60));
  const [manual, setManual] = useState('');
  const now = clockNow(g);
  const { byPlayer: sh, issues } = computeShifts(g);
  const pool = g.roster.filter(p => sh[p.n].on), bench = g.roster.filter(p => !sh[p.n].on && (p.n <= 13 || p.name));
  const full = pool.length >= maxPool();
  const pi = PERIODS.indexOf(g.period);
  const note = now <= 0 ? (pi < 3 ? `Fim do ${g.period} período.` : 'Fim do jogo.') : !t.running && pool.length ? 'Relógio parado: o tempo dos jogadores não está a contar.' : '';
  const subOut = sub.out != null && sh[sub.out]?.on ? sub.out : null, subIn = sub.in != null && !sh[sub.in]?.on ? sub.in : null;
  const maxAbs = Math.max(1, nowAbs(g));

  const toggleRun = () => mutate(x => {
    if (x.timer.running) { x.timer.remaining = clockNow(x); x.timer.running = false; }
    else { if (clockNow(x) <= 0) { toast('O relógio está a 0:00. Muda de período ou acerta o relógio.', 'warn'); return; } x.timer.running = true; x.timer.startedAt = Date.now(); }
  });
  const shift = (d: number) => mutate(x => { x.timer.remaining = clamp(clockNow(x) + d, 0, x.periodLength); if (x.timer.running) x.timer.startedAt = Date.now(); });
  const setTo = (s: number | null) => {
    if (s == null || s > L) { toast(`Tempo inválido. Usa minutos:segundos até ${fmtClock(L)}.`, 'warn'); return; }
    mutate(x => { x.timer.remaining = s; if (x.timer.running) x.timer.startedAt = Date.now(); }); toast('Relógio: ' + fmtClock(s));
  };
  const resetClock = async () => {
    if (g.timer.events.some(e => e.period === g.period && e.clock < L) && !(await confirm('Repor o relógio?', `Já há movimentos no ${g.period} período. Repor o relógio a ${fmtClock(L)} **no mesmo período** faz com que os próximos movimentos fiquem antes desses. Se o período acabou, usa "Começar o próximo período".`, 'Repor mesmo assim'))) return;
    mutate(x => { x.timer.running = false; x.timer.remaining = x.periodLength; });
  };
  const log = g.timer.events.slice().sort((a, b) => absTime(g, b.period, b.clock) - absTime(g, a.period, a.clock) || b.seq - a.seq);

  return (
    <Screen>
      <Panel>
        <ViewHead title="Tempo de Jogo" lead="O relógio conta para trás como o do jogo. Cada entrada, saída ou substituição fica registada com o período e o tempo do relógio nesse momento. O tempo dos jogadores só conta com o relógio a correr." />
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 14 }}>
          <View style={[ts.clockBox, wide && { flex: 1.1 }]}>
            <Text style={ts.cp}>{g.period} PERÍODO</Text>
            <Text style={[ts.clock, t.running && { color: C.yellow }]}>{fmtClock(now)}</Text>
            <Row>
              <Btn label={t.running ? 'Pausa' : 'Iniciar'} icon={t.running ? 'pause' : 'play'} variant="primary" onPress={toggleRun} />
              <Btn label="−5s" onPress={() => shift(-5)} style={ts.ghostDark} />
              <Btn label="+5s" onPress={() => shift(5)} style={ts.ghostDark} />
              <Btn label={fmtClock(L)} icon="reset" onPress={resetClock} style={ts.ghostDark} />
            </Row>
            {now <= 0 && pi < 3 ? <Btn label={`Começar o ${PERIODS[pi + 1]} período`} variant="primary" onPress={() => setPeriod(PERIODS[pi + 1])} /> : null}
            {note ? <Text style={ts.note}>{note}</Text> : null}
          </View>
          <View style={[ts.setBox, wide && { flex: 1.2 }]}>
            <Text style={ts.lbl}>Período</Text>
            <Seg options={PERIODS} value={g.period} onChange={p => setPeriod(p as Period)} />
            <Text style={ts.lbl}>Acertar relógio</Text>
            <Row>
              <View style={{ width: 76 }}><Select small value={mm} options={Array.from({ length: L / 60 + 1 }, (_, i) => String(i))} onChange={setMm} title="Minutos" /></View>
              <Text style={{ fontFamily: F.bodyBold }}>:</Text>
              <View style={{ width: 76 }}><Select small value={ss} options={Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: String(i).padStart(2, '0') }))} onChange={setSs} title="Segundos" /></View>
              <Input small value={manual} onChangeText={setManual} placeholder="ou 5:32" keyboardType="numbers-and-punctuation" style={{ width: 96 }} onSubmitEditing={() => { setTo(parseClock(manual)); setManual(''); }} />
              <Btn small label="Definir" variant="green" onPress={() => { setTo(manual.trim() ? parseClock(manual) : +mm * 60 + +ss); setManual(''); }} />
            </Row>
          </View>
          <View style={[ts.onfield, wide && { flex: 0.7 }]}>
            <Text style={[ts.onNum, full && { color: C.red }]}>{pool.length}</Text>
            <Text style={ts.onLbl}>/ {maxPool()} NA ÁGUA</Text>
          </View>
        </View>
      </Panel>

      <Panel>
        <SectionHead title="Substituição" right={<Muted>Toca em quem sai e em quem entra, depois confirma.</Muted>} />
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={[ts.subLbl, { color: C.bad }]}>SAI · NA ÁGUA ({pool.length})</Text>
            <Row gap={6}>
              {pool.length ? pool.map(p => <Chip key={p.n} label={p.name || (p.gr ? 'GR' : 'Jogador ' + p.n)} on={subOut === p.n} onColor={C.red} left={<CapNum n={p.n} gk={p.gr} size={26} />} onPress={() => setSub(s => ({ ...s, out: s.out === p.n ? null : p.n }))} />)
                : <Muted>Ninguém na água. Usa ENTRAR na tabela para os titulares.</Muted>}
            </Row>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ts.subLbl, { color: C.ok }]}>ENTRA · BANCO</Text>
            <Row gap={6}>{bench.map(p => <Chip key={p.n} label={p.name || (p.gr ? 'GR' : 'Jogador ' + p.n)} on={subIn === p.n} left={<CapNum n={p.n} gk={p.gr} size={26} />} onPress={() => setSub(s => ({ ...s, in: s.in === p.n ? null : p.n }))} />)}</Row>
          </View>
        </View>
        <Row style={{ justifyContent: 'flex-end', marginTop: 14 }}>
          <Btn label="Limpar" variant="ghost" onPress={() => setSub({ out: null, in: null })} />
          <Btn label={subOut != null && subIn != null ? `Sai ${subOut}, entra ${subIn}` : 'Confirmar substituição'} icon="swap" variant="primary" disabled={subOut == null || subIn == null}
            onPress={() => { if (doSub(subOut, subIn)) setSub({ out: null, in: null }); }} />
        </Row>
      </Panel>

      <Panel>
        <SectionHead title="Jogadores" right={<Btn small label="Exportar resumo" icon="download" variant="outline" onPress={exportSummary} />} />
        <Muted style={{ marginVertical: 8 }}>Os nomes são os mesmos de Jogadores e Exclusões; aqui podes ainda preencher os jogadores 14 e 15.</Muted>
        <Table
          cols={[{ title: 'Nº', w: 50 }, { title: 'Jogador', w: 160, align: 'left' }, { title: 'Estado', w: 84 }, { title: 'Movimento', w: 140 }, { title: 'Turnos', w: 64 }, { title: 'Último turno', w: 150 }, { title: 'Tempo total', w: 94 }, { title: 'Tempo jogado', w: 120, align: 'left' }]}
          rowStyle={i => (sh[g.roster[i].n].on ? { backgroundColor: C.inpool } : null)}
          rows={g.roster.map(p => {
            const x = sh[p.n];
            return [
              <CapNum key="c" n={p.n} gk={p.gr} />,
              <Input key="i" small value={p.name} placeholder={p.gr ? 'Guarda-redes' : 'Nome'} onChangeText={v => mutate(y => { player(y, p.n)!.name = v; })} style={{ width: '100%' }} accessibilityLabel={`Nome do jogador ${p.n}`} />,
              <Text key="s" style={[ts.state, x.on && { backgroundColor: C.green2, color: C.white }]}>{x.on ? 'Na água' : 'Banco'}</Text>,
              <Btn key="m" small label={x.on ? 'SAIR' : full ? '⇄ SUBSTITUIR' : 'ENTRAR'} variant={x.on ? 'danger' : full ? 'primary' : 'green'} onPress={() => moveIn(p.n)} style={{ minWidth: 120 }} />,
              x.count,
              x.count ? `${fmtClock(x.last)}${x.on ? (x.ahead ? ' (entrou mais tarde)' : ' (atual)') : ''}` : '—',
              <Text key="t" style={{ fontFamily: F.bodyBold, fontVariant: ['tabular-nums'] }}>{fmtClock(x.total)}</Text>,
              <View key="b" style={ts.barTrack}><View style={[ts.barFill, { width: `${Math.min(100, (x.total * 100) / maxAbs)}%` }]} /></View>,
            ];
          })}
        />
      </Panel>

      <Panel>
        <SectionHead title="Registo de substituições" right={
          <Row>
            <Btn small label="Exportar CSV" icon="download" variant="outline" onPress={exportLog} />
            <Btn small label="Importar CSV" icon="upload" variant="ghost" onPress={importLog} />
            <Btn small label="Apagar todos" icon="trash" variant="danger" onPress={async () => {
              if (!g.timer.events.length) { toast('Não há movimentos para apagar.'); return; }
              if (!(await confirm('Apagar movimentos', `Apagar os **${g.timer.events.length}** movimentos de entrada e saída?`, 'Apagar todos'))) return;
              mutate(x => { x.timer.events = []; });
            }} />
          </Row>} />
        <Muted style={{ marginVertical: 8 }}>Podes corrigir o período ou o relógio de qualquer movimento; os turnos são recalculados. Movimentos marcados com "verificar" têm o relógio fora de ordem.</Muted>
        <Table
          cols={[{ title: 'Período', w: 90 }, { title: 'Relógio', w: 90 }, { title: 'Jogador', w: 200, align: 'left' }, { title: 'Movimento', w: 110 }, { title: 'Apagar', w: 70 }]}
          empty="Ainda não há movimentos. No início do período, carrega em ENTRAR para os 7 jogadores que começam na água."
          rows={log.map(e => [
            <View key="p" style={{ width: 78 }}><Select small value={e.period} options={PERIODS} title="Período do movimento" onChange={v => mutate(x => { const ev = x.timer.events.find(y => y.id === e.id); if (ev) ev.period = v as Period; })} /></View>,
            <ClockCell key={e.id + e.clock} ev={e} max={L} />,
            <View key="j" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Text style={{ fontFamily: F.body, fontSize: 13.5, color: C.ink }}>{plabel(g, e.n)}</Text>
              {issues.has(e.id) ? <Badge text="verificar" tone="warn" minWidth={0} /> : null}
            </View>,
            <Badge key="t" text={e.type === 'in' ? 'Entrada' : 'Saída'} tone={e.type === 'in' ? 'good' : 'bad'} />,
            <RowBtn key="d" icon="trash" danger label="Apagar movimento" onPress={async () => {
              if (!(await confirm('Apagar movimento', 'Apagar este movimento? Os turnos do jogador são recalculados.', 'Apagar'))) return;
              mutate(x => { x.timer.events = x.timer.events.filter(y => y.id !== e.id); });
            }} />,
          ])}
        />
      </Panel>
      <Mini style={{ textAlign: 'center' }}>O ecrã mantém-se ligado enquanto estiveres no Tempo de Jogo.</Mini>
    </Screen>
  );
}

function ClockCell({ ev, max }: { ev: TimerEvent; max: number }) {
  const [txt, setTxt] = useState(fmtClock(ev.clock));
  return (
    <Input small value={txt} onChangeText={setTxt} keyboardType="numbers-and-punctuation" style={{ width: 72, textAlign: 'center' }} accessibilityLabel="Relógio do movimento"
      onEndEditing={() => {
        const s = parseClock(txt);
        if (s == null || s > max) { toast('Relógio inválido (mm:ss).', 'warn'); setTxt(fmtClock(ev.clock)); return; }
        mutate(x => { const e = x.timer.events.find(y => y.id === ev.id); if (e) e.clock = s; });
      }} />
  );
}

function exportLog() {
  const g = G(), ev = g.timer.events.slice().sort((a, b) => absTime(g, a.period, a.clock) - absTime(g, b.period, b.clock) || a.seq - b.seq);
  if (!ev.length) { toast('Não há movimentos para exportar.', 'warn'); return; }
  exportText('tempo_jogo_' + fileStamp() + '.csv', toCSV([['Período', 'Relógio', 'Nº', 'Jogador', 'Movimento'], ...ev.map(e => [e.period, fmtClock(e.clock), e.n, pname(g, e.n), e.type === 'in' ? 'Entrada' : 'Saída'])]));
}
function exportSummary() {
  const g = G(), s = computeShifts(g).byPlayer;
  exportText('tempo_jogo_resumo_' + fileStamp() + '.csv', toCSV([['Nº', 'Jogador', 'GR', 'Turnos', 'Último turno', 'Tempo total', 'Tempo total (s)'],
    ...g.roster.filter(p => s[p.n].count || p.name).map(p => { const x = s[p.n]; return [p.n, pname(g, p.n), p.gr ? 'Sim' : '', x.count, x.count ? fmtClock(x.last) : '', fmtClock(x.total), Math.round(x.total)]; })]));
}
async function importLog() {
  const f = await importText('csv'); if (!f) return;
  const objs = csvObjects(f.text).filter(o => o['Nº'] && o['Movimento']);
  if (!objs.length) { toast('Não encontrei movimentos. Usa um CSV exportado pelo Tempo de Jogo.', 'bad'); return; }
  const mode = await askImportMode(objs.length, 'tempo de jogo'); if (!mode) return;
  mutate(g => {
    let seq = g.timer.seq || 0;
    const evs: TimerEvent[] = [];
    objs.forEach(o => {
      const n = +o['Nº']; if (!(n >= 1 && n <= 15)) return;
      const p = player(g, n); if (p && !p.name && o['Jogador'] && !/^Jogador \d+$/.test(o['Jogador'])) p.name = o['Jogador'];
      evs.push({ id: uid(), n, type: norm(o['Movimento']).startsWith('entr') ? 'in' : 'out', period: (PERIODS.includes(o['Período'] as Period) ? o['Período'] : '1º') as Period, clock: parseClock(o['Relógio']) ?? 0, seq: ++seq, ts: Date.now() });
    });
    g.timer.seq = seq; g.timer.events = mode === 'replace' ? evs : g.timer.events.concat(evs);
  });
  toast('Movimentos importados');
}

const ts = StyleSheet.create({
  clockBox: { backgroundColor: C.deep, borderRadius: 14, padding: 16, gap: 10 },
  cp: { color: C.white, opacity: 0.85, fontFamily: F.disp, fontSize: 14, letterSpacing: 2 },
  clock: { color: C.white, fontFamily: F.dispX, fontSize: 76, lineHeight: 80, fontVariant: ['tabular-nums'] },
  ghostDark: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'transparent' },
  note: { color: '#ffe680', fontFamily: F.bodySemi, fontSize: 13 },
  setBox: { borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, gap: 10 },
  lbl: { fontFamily: F.bodyBold, fontSize: 13, color: '#28443c' },
  onfield: { borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  onNum: { fontFamily: F.dispX, fontSize: 64, lineHeight: 68, color: C.green },
  onLbl: { fontFamily: F.disp, fontSize: 15, letterSpacing: 1, color: C.muted },
  subLbl: { fontFamily: F.bodyBold, fontSize: 12, letterSpacing: 0.8, marginBottom: 8 },
  state: { fontFamily: F.bodyBold, fontSize: 12, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: C.neutral, color: '#4b5f5b', overflow: 'hidden' },
  barTrack: { width: 104, height: 8, borderRadius: 4, backgroundColor: C.soft, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.green2, borderRadius: 4 },
});
