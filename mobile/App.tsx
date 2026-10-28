import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold } from '@expo-google-fonts/barlow';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { clockNow } from './src/domain/clock';
import { initStore, G, getState, mutate, setScreen, useStore } from './src/store/store';
import { C } from './src/theme';
import { DialogHost, ToastHost, toast } from './src/ui/dialogs';
import { Header } from './src/ui/Header';
import Analise from './src/screens/Analise';
import Coletiva from './src/screens/Coletiva';
import Definicoes from './src/screens/Definicoes';
import Exclusoes from './src/screens/Exclusoes';
import GuardaRedes from './src/screens/GuardaRedes';
import Home from './src/screens/Home';
import Individual from './src/screens/Individual';
import Jogadores from './src/screens/Jogadores';
import Remates from './src/screens/Remates';
import Tempo from './src/screens/Tempo';

SplashScreen.preventAutoHideAsync().catch(() => { /* já escondido */ });

const SCREEN_COMPONENTS = {
  inicio: Home, individual: Individual, remates: Remates, jogadores: Jogadores, guardaredes: GuardaRedes,
  coletiva: Coletiva, tempo: Tempo, exclusoes: Exclusoes, analise: Analise, definicoes: Definicoes,
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold,
    BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold,
  });
  const st = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { initStore(); }, []);
  useEffect(() => { if (fontsLoaded && st.ready) SplashScreen.hideAsync().catch(() => {}); }, [fontsLoaded, st.ready]);

  // botão "voltar" do Android: fecha o menu ou volta ao Início
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (menuOpen) { setMenuOpen(false); return true; }
      if (getState().screen !== 'inicio') { setScreen('inicio'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [menuOpen]);

  // fim do período: parar o relógio em qualquer ecrã
  useEffect(() => {
    const id = setInterval(() => {
      const s = getState(); if (!s.ready) return;
      const g = G(); if (!g || !g.timer.running) return;
      if (clockNow(g) <= 0) {
        mutate(x => { x.timer.remaining = 0; x.timer.running = false; });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        toast(`Fim do ${g.period} período`, 'warn');
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (st.storageError) toast('Este dispositivo não está a guardar dados. Exporta regularmente para não perderes registos.', 'bad'); }, [st.storageError]);

  if (!fontsLoaded || !st.ready) return null;
  const ScreenComp = SCREEN_COMPONENTS[st.screen];
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <ScreenComp key={st.currentId + st.screen} />
        <DialogHost />
        <ToastHost />
      </View>
    </SafeAreaProvider>
  );
}
