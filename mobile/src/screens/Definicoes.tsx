import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DEFAULT_SETTINGS } from '../domain/constants';
import { buildDemoGame } from '../domain/demo';
import { fmtClock, fmtDate, todayISO } from '../domain/format';
import { newGame, normalizeGame } from '../domain/model';
import type { Settings } from '../domain/types';
import * as db from '../store/db';
import { addGame, G, getState, mutate, mutateSettings, replaceAllGames, useStore } from '../store/store';
import { C, F } from '../theme';
import { ask, askText, confirm, toast } from '../ui/dialogs';
import { exportText, importText } from '../ui/files';
import { Btn, Cols, Input, Mini, Muted, Panel, Row, Screen, Sub, Toggle, ViewHead } from '../ui/kit';
import { Select } from '../ui/Select';

export const APP_VERSION = '1.0.0';
const LENGTHS = [5, 6, 7, 8].map(m => ({ value: String(m * 60), label: `${m} minutos` }));

export default function Definicoes() {
  const st = useStore();
  const g = G();
  const s = st.settings;
  const [bytes, setBytes] = useState<number | null>(null);
  const [team, setTeam] = useState(s.teamName);
  const games = Object.values(st.games);
  const recs = games.reduce((a, x) => a + x.individual.length + x.collective.length + x.timer.events.length + x.exclLog.length, 0);
  useEffect(() => { db.storageBytes().then(setBytes).catch(() => setBytes(null)); }, [games.length, recs]);

  const sw = (key: keyof Settings, title: string, desc: string) => (
    <View style={ds.row}>
      <View style={{ flex: 1 }}><Text style={ds.rowTitle}>{title}</Text><Text style={ds.rowDesc}>{desc}</Text></View>
      <Toggle value={!!s[key]} label={title} onChange={v => { mutateSettings(x => { (x as any)[key] = v; }); toast('Definição guardada'); }} />
    </View>
  );
  const sel = (title: string, desc: string, value: string, options: { value: string; label: string }[], onChange: (v: string) => void) => (
    <View style={ds.row}>
      <View style={{ flex: 1 }}><Text style={ds.rowTitle}>{title}</Text><Text style={ds.rowDesc}>{desc}</Text></View>
      <View style={{ width: 150 }}><Select small value={value} options={options} title={title} onChange={onChange} /></View>
    </View>
  );

  const backup = () => exportText('scp_stat_copia_seguranca_' + todayISO() + '.json', JSON.stringify({ app: 'scp-stat-polo', version: 1, kind: 'backup', exported: new Date().toISOString(), settings: s, currentId: st.currentId, games: st.games }), 'json');
  const restore = async () => {
    const f = await importText('json'); if (!f) return;
    let d: any;
    try { d = JSON.parse(f.text); } catch { toast('Este ficheiro não é uma cópia da SCP Stat (.json).', 'bad'); return; }
    if (!d || d.app !== 'scp-stat-polo') { toast('Este ficheiro não é uma cópia da SCP Stat (.json).', 'bad'); return; }
    const incoming = (d.kind === 'backup' ? Object.values(d.games || {}) : d.game ? [d.game] : []).map(normalizeGame);
    if (!incoming.length) { toast('A cópia não tem jogos.', 'warn'); return; }
    const mode = await ask<'merge' | 'replace'>('Restaurar cópia', `A cópia tem **${incoming.length}** jogo(s). Juntar aos jogos deste dispositivo (os jogos iguais são atualizados) ou substituir tudo?`, [
      { label: 'Cancelar', value: null as any, style: 'ghost' }, { label: 'Substituir tudo', value: 'replace', style: 'danger' }, { label: 'Juntar', value: 'merge', style: 'primary' }]);
    if (!mode) return;
    if (mode === 'replace') await replaceAllGames(incoming, d.currentId, d.kind === 'backup' && d.settings ? { ...DEFAULT_SETTINGS, ...d.settings } : undefined);
    else { incoming.forEach(x => addGame(x, false)); }
    toast(incoming.length + ' jogo(s) restaurado(s)');
  };
  const wipe = async () => {
    if (!(await confirm('Apagar todos os dados', `Vais apagar **${games.length} jogo(s)** e todos os registos deste dispositivo. Faz antes uma cópia de segurança se precisares destes dados.`, 'Continuar'))) return;
    const t = await askText('Confirmar', 'Escreve **APAGAR** para confirmar.', 'Apagar tudo', 'APAGAR');
    if (!t || t.trim().toUpperCase() !== 'APAGAR') { toast('Nada foi apagado.'); return; }
    await replaceAllGames([newGame(getState().settings)]);
    toast('Dados apagados. Começaste um jogo vazio.');
  };

  return (
    <Screen>
      <Panel>
        <ViewHead title="Definições" lead="As regras aplicam-se a todos os jogos neste dispositivo. As alterações ficam guardadas logo." />
        <Cols min={900}>
          <View>
            <Mini>Equipa e jogo</Mini>
            <View style={ds.row}>
              <View style={{ flex: 1 }}><Text style={ds.rowTitle}>Nome da equipa</Text><Text style={ds.rowDesc}>Usado nos novos jogos e no jogo aberto.</Text></View>
              <Input small value={team} onChangeText={setTeam} style={{ width: 170 }} onEndEditing={() => { const n = team.trim() || 'Sporting CP'; mutateSettings(x => { x.teamName = n; }); mutate(x => { x.scpName = n; }); toast('Nome da equipa guardado'); }} />
            </View>
            {sel('Duração do período (novos jogos)', 'Os jogos seniores usam 8 minutos.', String(s.periodLength), LENGTHS, v => { mutateSettings(x => { x.periodLength = +v; }); toast('Duração para novos jogos: ' + fmtClock(+v)); })}
            {sel('Duração do período (jogo aberto)', `${fmtDate(g.date)} vs ${g.opponent}`, String(g.periodLength), LENGTHS, v => { mutate(x => { x.periodLength = +v; if (!x.timer.running && x.timer.remaining > x.periodLength) x.timer.remaining = x.periodLength; }); toast('Duração do período deste jogo: ' + fmtClock(+v)); })}
            {sel('Máximo de jogadores na água', 'Ao chegar ao máximo, ENTRAR passa a SUBSTITUIR no Tempo de Jogo.', String(s.maxInPool), [5, 6, 7].map(n => ({ value: String(n), label: `${n} jogadores` })), v => { mutateSettings(x => { x.maxInPool = +v; }); toast('Máximo na água: ' + v); })}
          </View>
          <View>
            <Mini>Regras de registo</Mini>
            {sw('assistRequired', 'Assistência obrigatória', 'Em Golo e EXC ganha é preciso escolher quem assistiu (ou "Sem assistência").')}
            {sw('autoAttack', 'Avançar o nº do ataque', 'Na Estatística Coletiva, o próximo ataque fica já escolhido depois de guardar.')}
            {sw('resetClockOnPeriod', 'Repor o relógio ao mudar de período', 'Ao escolher outro período, o relógio volta à duração completa e pára.')}
          </View>
        </Cols>
      </Panel>
      <Cols min={900}>
        <Panel>
          <Sub>Dados neste dispositivo</Sub>
          <Text style={ds.meterText}>{bytes != null ? `${Math.round(bytes / 1024)} KB` : '—'} em SQLite · {games.length} jogo(s) · {recs} registo(s){st.storageError ? ' · o armazenamento está a falhar' : ''}</Text>
          <Row><Btn label="Cópia de segurança de tudo" icon="download" variant="outline" onPress={backup} /><Btn label="Restaurar cópia" icon="upload" variant="ghost" onPress={restore} /></Row>
          <Row style={{ marginTop: 8 }}>
            <Btn label="Adicionar jogo de exemplo" icon="plus" variant="ghost" onPress={() => { addGame(buildDemoGame(getState().settings)); toast('Jogo de exemplo adicionado e aberto'); }} />
            <Btn label="Apagar todos os dados" icon="trash" variant="danger" onPress={wipe} />
          </Row>
          <Muted style={{ marginTop: 12 }}>A cópia de segurança (.json) inclui todos os jogos e estas definições, e é compatível com a versão web da SCP Stat. Para um só jogo usa Início › Exportar jogo; para Excel, o Exportar CSV de cada ecrã.</Muted>
        </Panel>
        <Panel>
          <Sub>Sobre</Sub>
          <Muted style={{ marginTop: 8 }}>SCP Stat · Polo Aquático · app móvel {APP_VERSION}</Muted>
          <Muted style={{ marginTop: 8 }}>Os dados ficam numa base de dados SQLite no próprio dispositivo e funcionam sem internet. Exporta o jogo no fim de cada partida para guardar uma cópia fora do dispositivo.</Muted>
          <Muted style={{ marginTop: 8 }}>Enquanto o ecrã do Tempo de Jogo estiver aberto, o dispositivo não se desliga sozinho.</Muted>
        </Panel>
      </Cols>
    </Screen>
  );
}

const ds = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  rowTitle: { fontFamily: F.bodyBold, fontSize: 14.5, color: C.ink },
  rowDesc: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 2 },
  meterText: { fontFamily: F.body, fontSize: 13.5, color: C.muted, marginVertical: 10 },
});
