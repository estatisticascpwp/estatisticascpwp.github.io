/**
 * Campo de escolha: abre uma lista em folha inferior, com pesquisa quando há muitas opções
 * (substitui o <select> e a caixa pesquisável da versão web).
 */
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { norm } from '../domain/format';
import { C, F } from '../theme';
import { Icon } from './Icon';

export interface Opt { value: string; label: string }
const toOpts = (o: (string | Opt)[]): Opt[] => o.map(x => (typeof x === 'string' ? { value: x, label: x } : x));

export function Select({ value, options, onChange, placeholder = 'Selecionar…', title, emptyLabel, searchable, small, style, accessibilityLabel }: {
  value: string; options: (string | Opt)[]; onChange: (v: string) => void; placeholder?: string; title?: string;
  /** se definido, mostra uma primeira opção vazia com este texto (ex.: "Todos") */
  emptyLabel?: string; searchable?: boolean; small?: boolean; style?: any; accessibilityLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const opts = useMemo(() => toOpts(options), [options]);
  const cur = opts.find(o => o.value === value);
  const showSearch = searchable ?? opts.length > 12;
  const list = useMemo(() => {
    const n = norm(q);
    const base = emptyLabel != null ? [{ value: '', label: emptyLabel }, ...opts] : opts;
    return n ? base.filter(o => norm(o.label).includes(n)) : base;
  }, [q, opts, emptyLabel]);
  const label = cur ? cur.label : value === '' && emptyLabel != null ? emptyLabel : placeholder;
  const isPh = !cur && !(value === '' && emptyLabel != null);
  return (
    <>
      <Pressable onPress={() => { setQ(''); setOpen(true); }} accessibilityRole="button" accessibilityLabel={accessibilityLabel || title}
        style={[st.field, small && st.fieldSm, style]}>
        <Text style={[st.value, small && { fontSize: 14 }, isPh && { color: '#8a9b97' }]} numberOfLines={1}>{label}</Text>
        <Icon name="chev" size={16} color={C.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={st.back} onPress={() => setOpen(false)}>
          <Pressable style={[st.sheet, { paddingBottom: 12 + insets.bottom }]} onPress={() => { /* manter aberto */ }}>
            <View style={st.handle} />
            {title ? <Text style={st.title}>{title}</Text> : null}
            {showSearch ? (
              <View style={st.search}>
                <Icon name="search" size={18} color={C.muted} />
                <TextInput value={q} onChangeText={setQ} placeholder="Pesquisar…" placeholderTextColor="#8a9b97" style={st.searchInput} autoFocus autoCorrect={false} />
              </View>
            ) : null}
            <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
              {list.length ? list.map(o => (
                <Pressable key={o.value + o.label} onPress={() => { onChange(o.value); setOpen(false); }} style={[st.opt, o.value === value && st.optOn]}>
                  <Text style={[st.optText, o.value === value && { color: C.green, fontFamily: F.bodyBold }]}>{o.label}</Text>
                  {o.value === value ? <Icon name="check" size={18} color={C.green} /> : null}
                </Pressable>
              )) : <Text style={st.none}>Sem resultados</Text>}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#c7d5cf', borderRadius: 8, paddingHorizontal: 11, minHeight: 44, backgroundColor: C.white },
  fieldSm: { minHeight: 36, paddingHorizontal: 8 },
  value: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
  back: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 16, paddingTop: 8, maxHeight: '85%', width: '100%', maxWidth: 640, alignSelf: 'center' },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: 10 },
  title: { fontFamily: F.dispX, fontSize: 21, color: C.deep, marginBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#c7d5cf', borderRadius: 9, paddingHorizontal: 10, marginBottom: 8 },
  searchInput: { flex: 1, minHeight: 44, fontFamily: F.body, fontSize: 15, color: C.ink },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, minHeight: 48, borderRadius: 8 },
  optOn: { backgroundColor: '#e3f4ea' },
  optText: { fontFamily: F.body, fontSize: 15.5, color: C.ink },
  none: { padding: 16, color: C.muted, fontFamily: F.body },
});
