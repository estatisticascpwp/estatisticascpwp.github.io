/**
 * Cabeçalho verde (como na versão web): emblema SCP, navegação, resultado e período.
 * Tablet/ecrã largo: navegação em linha. Telemóvel: botão de menu com painel lateral.
 */
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setPeriod } from '../actions';
import { PERIODS } from '../domain/constants';
import { fmtDate } from '../domain/format';
import { scoreOf } from '../domain/model';
import { createGame, G, setScreen, useStore, type ScreenId } from '../store/store';
import { C, F } from '../theme';
import { toast } from './dialogs';
import { Icon, type IconName } from './Icon';

export const SCREENS: { id: ScreenId; label: string; icon: IconName }[] = [
  { id: 'inicio', label: 'Início', icon: 'home' },
  { id: 'individual', label: 'Individual', icon: 'player' },
  { id: 'remates', label: 'Remates', icon: 'target' },
  { id: 'jogadores', label: 'Jogadores', icon: 'roster' },
  { id: 'guardaredes', label: 'Guarda-Redes', icon: 'goal' },
  { id: 'coletiva', label: 'Coletiva', icon: 'team' },
  { id: 'tempo', label: 'Tempo de Jogo', icon: 'clock' },
  { id: 'exclusoes', label: 'Exclusões', icon: 'card' },
  { id: 'analise', label: 'Interpretação', icon: 'chart' },
  { id: 'definicoes', label: 'Definições', icon: 'gear' },
];

export function Header({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const st = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const g = G();
  const sc = scoreOf(g);
  return (
    <View style={{ backgroundColor: C.deep }}>
      <View style={[h.bar, { paddingTop: insets.top + 8, paddingLeft: Math.max(14, insets.left), paddingRight: Math.max(14, insets.right) }]}>
        {!wide ? (
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityLabel="Abrir menu" style={h.menuBtn}><Icon name="menu" size={24} color={C.white} /></Pressable>
        ) : null}
        <Pressable onPress={() => setScreen('inicio')} style={h.brand} accessibilityLabel="Início">
          <View style={h.crest}><Text style={h.crestText}>SCP</Text></View>
          {width >= 420 ? <View><Text style={h.brandTitle}>SPORTING CP</Text><Text style={h.brandSub}>POLO AQUÁTICO</Text></View> : null}
        </Pressable>
        <View style={{ flex: 1 }} />
        {width >= 700 ? (
          <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
            <Text style={h.score}>SCP {sc.scp} – {sc.opp} {g.opponent || 'Adversário'}</Text>
            <Text style={h.scoreSub}>{fmtDate(g.date)}{g.competition ? ' · ' + g.competition : ''}</Text>
          </View>
        ) : (
          <Text style={[h.score, { marginRight: 10 }]}>{sc.scp}–{sc.opp}</Text>
        )}
        <View style={h.periods}>
          {PERIODS.map(p => (
            <Pressable key={p} onPress={() => setPeriod(p)} style={[h.pBtn, g.period === p && h.pOn]} accessibilityLabel={p + ' período'} accessibilityState={{ selected: g.period === p }}>
              <Text style={[h.pText, g.period === p && { color: '#0b2e1d' }]}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {wide ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[h.navRow, { paddingLeft: Math.max(10, insets.left), paddingRight: Math.max(10, insets.right) }]}>
          {SCREENS.map(s => (
            <Pressable key={s.id} onPress={() => setScreen(s.id)} style={[h.navItem, st.screen === s.id && h.navOn]}>
              <Icon name={s.icon} size={20} color={st.screen === s.id ? '#0b2e1d' : C.white} />
              <Text style={[h.navText, st.screen === s.id && { color: '#0b2e1d' }]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {g.demo ? (
        <View style={h.demo}>
          <Text style={h.demoText}><Text style={{ fontFamily: F.bodyBold }}>Jogo de exemplo.</Text> Os dados são fictícios, para experimentares a app.</Text>
          <Pressable onPress={() => { createGame(false); setScreen('inicio'); toast('Jogo novo criado. Começa pelos nomes em Jogadores ou Exclusões.'); }} style={h.demoBtn}>
            <Text style={h.demoBtnText}>Começar jogo real</Text>
          </Pressable>
        </View>
      ) : null}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const st = useStore();
  const insets = useSafeAreaInsets();
  const g = G();
  const sc = scoreOf(g);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[h.side, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <View style={[h.brand, { paddingHorizontal: 16, marginBottom: 6 }]}>
            <View style={h.crest}><Text style={h.crestText}>SCP</Text></View>
            <View><Text style={h.brandTitle}>SPORTING CP</Text><Text style={h.brandSub}>POLO AQUÁTICO</Text></View>
          </View>
          <View style={h.sideGame}>
            <Text style={h.score}>SCP {sc.scp} – {sc.opp} {g.opponent}</Text>
            <Text style={h.scoreSub}>{fmtDate(g.date)} · {g.period} período</Text>
          </View>
          <ScrollView>
            {SCREENS.map(s => (
              <Pressable key={s.id} onPress={() => { setScreen(s.id); onClose(); }} style={[h.sideItem, st.screen === s.id && h.sideOn]}>
                <Icon name={s.icon} size={22} color={st.screen === s.id ? '#0b2e1d' : C.white} />
                <Text style={[h.sideText, st.screen === s.id && { color: '#0b2e1d' }]}>{s.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <Pressable style={{ flex: 1, backgroundColor: C.overlay }} onPress={onClose} accessibilityLabel="Fechar menu" />
      </View>
    </Modal>
  );
}

const h = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, gap: 10 },
  menuBtn: { padding: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  crest: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green },
  crestText: { color: C.white, fontFamily: F.dispX, fontSize: 14, letterSpacing: 0.5 },
  brandTitle: { color: C.white, fontFamily: F.dispX, fontSize: 21, lineHeight: 22, letterSpacing: 0.5 },
  brandSub: { color: C.white, opacity: 0.9, fontFamily: F.dispSemi, fontSize: 11, letterSpacing: 2.4 },
  score: { color: C.white, fontFamily: F.disp, fontSize: 16 },
  scoreSub: { color: C.white, opacity: 0.8, fontFamily: F.body, fontSize: 12 },
  periods: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 10, padding: 3, gap: 2 },
  pBtn: { minWidth: 36, minHeight: 36, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  pOn: { backgroundColor: C.yellow },
  pText: { color: C.white, fontFamily: F.disp, fontSize: 15 },
  navRow: { gap: 4, paddingBottom: 8 },
  navItem: { alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  navOn: { backgroundColor: C.yellow },
  navText: { color: C.white, fontFamily: F.disp, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
  demo: { backgroundColor: C.yellow, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  demoText: { color: '#2c2300', fontFamily: F.body, fontSize: 13.5, flexShrink: 1 },
  demoBtn: { backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  demoBtnText: { color: C.white, fontFamily: F.bodyBold, fontSize: 13 },
  side: { width: 290, backgroundColor: C.deep },
  sideGame: { marginHorizontal: 12, marginVertical: 10, padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 50, marginHorizontal: 8, borderRadius: 10 },
  sideOn: { backgroundColor: C.yellow },
  sideText: { color: C.white, fontFamily: F.disp, fontSize: 17, letterSpacing: 0.4, textTransform: 'uppercase' },
});
