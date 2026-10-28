/**
 * Diálogos e avisos com o aspeto da app (o Alert nativo só permite 3 botões no Android).
 * Uso: `if (await confirm('Apagar', 'Apagar este registo?', 'Apagar')) …`
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';

export interface DialogAction<T> { label: string; value: T; style?: 'primary' | 'danger' | 'ghost' | 'outline' | 'green' }
interface DialogReq {
  title: string; message: string; actions: DialogAction<any>[]; list?: boolean;
  input?: { placeholder?: string }; resolve: (v: any) => void;
}
let pushDialog: ((d: DialogReq) => void) | null = null;
let pushToast: ((t: { id: number; msg: string; type: ToastType }) => void) | null = null;
export type ToastType = '' | 'warn' | 'bad';

/** Mostra um diálogo; devolve o `value` do botão escolhido, ou null se for fechado. */
export function ask<T>(title: string, message: string, actions: DialogAction<T>[], opts: { list?: boolean } = {}): Promise<T | null> {
  return new Promise(resolve => {
    if (!pushDialog) return resolve(null);
    pushDialog({ title, message, actions, list: opts.list, resolve });
  });
}
export async function confirm(title: string, message: string, ok = 'Confirmar', danger = true): Promise<boolean> {
  const v = await ask(title, message, [{ label: 'Cancelar', value: false, style: 'ghost' }, { label: ok, value: true, style: danger ? 'danger' : 'primary' }]);
  return !!v;
}
/** Diálogo com campo de texto; devolve o texto, ou null se cancelado. */
export function askText(title: string, message: string, okLabel: string, placeholder = ''): Promise<string | null> {
  return new Promise(resolve => {
    if (!pushDialog) return resolve(null);
    pushDialog({ title, message, actions: [{ label: 'Cancelar', value: null, style: 'ghost' }, { label: okLabel, value: '__input__', style: 'danger' }], input: { placeholder }, resolve });
  });
}
let toastId = 0;
export function toast(msg: string, type: ToastType = '') { pushToast?.({ id: ++toastId, msg, type }); }

/** Texto com **negrito**. */
export function Rich({ text, style }: { text: string; style?: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <Text style={style}>{parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <Text key={i} style={{ fontFamily: F.bodyBold }}>{p.slice(2, -2)}</Text> : p))}</Text>;
}

export function DialogHost() {
  const [queue, setQueue] = useState<DialogReq[]>([]);
  const [text, setText] = useState('');
  useEffect(() => { pushDialog = d => setQueue(q => [...q, d]); return () => { pushDialog = null; }; }, []);
  const cur = queue[0];
  const close = (v: any) => { if (!cur) return; cur.resolve(v === '__input__' ? text : v); setText(''); setQueue(q => q.slice(1)); };
  return (
    <Modal visible={!!cur} transparent animationType="fade" onRequestClose={() => close(null)} statusBarTranslucent>
      <Pressable style={st.back} onPress={() => close(null)}>
        <Pressable style={st.card} onPress={() => { /* não fechar ao tocar dentro */ }}>
          {cur ? (
            <>
              <Text style={st.title}>{cur.title}</Text>
              <ScrollView style={{ maxHeight: 420 }}>
                {cur.message.split('\n\n').map((p, i) => <Rich key={i} text={p} style={st.msg} />)}
                {cur.input ? <TextInput value={text} onChangeText={setText} placeholder={cur.input.placeholder} autoCapitalize="characters" autoFocus style={st.input} placeholderTextColor="#8a9b97" /> : null}
                {cur.list ? (
                  <View style={{ gap: 8, marginTop: 6 }}>
                    {cur.actions.filter(a => a.style === 'outline').map((a, i) => (
                      <Pressable key={i} onPress={() => close(a.value)} style={st.listBtn}><Text style={st.listText}>{a.label}</Text></Pressable>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
              <View style={st.actions}>
                {cur.actions.filter(a => !cur.list || a.style !== 'outline').map((a, i) => {
                  const v = BTN[a.style || 'primary'];
                  return (
                    <Pressable key={i} onPress={() => close(a.value)} style={[st.btn, { backgroundColor: v.bg, borderColor: v.border }]}>
                      <Text style={[st.btnText, { color: v.fg }]}>{a.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const BTN = {
  primary: { bg: C.yellow, border: C.yellow2, fg: '#13331f' }, danger: { bg: C.red, border: C.red, fg: C.white },
  ghost: { bg: C.soft, border: C.soft, fg: C.ink }, outline: { bg: C.white, border: C.green, fg: C.green }, green: { bg: C.green, border: C.green, fg: C.white },
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<{ id: number; msg: string; type: ToastType }[]>([]);
  useEffect(() => {
    pushToast = t => {
      setItems(xs => [...xs.slice(-2), t]);
      setTimeout(() => setItems(xs => xs.filter(x => x.id !== t.id)), t.type ? 4200 : 2400);
    };
    return () => { pushToast = null; };
  }, []);
  return (
    <View pointerEvents="none" style={[st.toasts, { bottom: 18 + insets.bottom }]}>
      {items.map(t => <ToastItem key={t.id} msg={t.msg} type={t.type} />)}
    </View>
  );
}
function ToastItem({ msg, type }: { msg: string; type: ToastType }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 180, useNativeDriver: true }).start(); }, [a]);
  const bg = type === 'warn' ? '#fff0a5' : type === 'bad' ? C.red : '#123d2e';
  const fg = type === 'warn' ? '#4a3800' : C.white;
  return (
    <Animated.View style={[st.toast, { backgroundColor: bg, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      <Text style={{ color: fg, fontFamily: F.bodySemi, fontSize: 14 }}>{msg}</Text>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  back: { flex: 1, backgroundColor: C.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 20, width: '100%', maxWidth: 480 },
  title: { fontFamily: F.dispX, fontSize: 23, color: C.deep, marginBottom: 10 },
  msg: { fontFamily: F.body, fontSize: 15, color: '#28443c', lineHeight: 21, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#c7d5cf', borderRadius: 8, paddingHorizontal: 11, minHeight: 44, fontFamily: F.body, fontSize: 15, marginTop: 6, color: C.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  btn: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  btnText: { fontFamily: F.bodyBold, fontSize: 14 },
  listBtn: { borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 14, minHeight: 46, justifyContent: 'center' },
  listText: { fontFamily: F.bodyBold, fontSize: 15, color: C.green },
  toasts: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8 },
  toast: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, maxWidth: 520, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
