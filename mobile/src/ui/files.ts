/**
 * Exportar: grava o ficheiro na cache e abre a folha de partilha do sistema
 * (Guardar em Ficheiros, Drive, email, WhatsApp…).
 * Importar: abre o seletor de ficheiros do sistema e lê o texto.
 */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { toast } from './dialogs';

export async function exportText(filename: string, text: string, kind: 'csv' | 'json' = 'csv') {
  try {
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(text);
    if (!(await Sharing.isAvailableAsync())) { toast('Este dispositivo não permite partilhar ficheiros.', 'bad'); return; }
    await Sharing.shareAsync(file.uri, {
      mimeType: kind === 'csv' ? 'text/csv' : 'application/json',
      UTI: kind === 'csv' ? 'public.comma-separated-values-text' : 'public.json',
      dialogTitle: filename,
    });
  } catch (e) {
    toast('Não foi possível exportar o ficheiro.', 'bad');
  }
}

export async function importText(kind: 'csv' | 'json'): Promise<{ name: string; text: string } | null> {
  try {
    const r = await DocumentPicker.getDocumentAsync({
      // '*/*' evita que o iOS/Android escondam CSV com tipos MIME pouco habituais; o conteúdo é validado a seguir
      type: kind === 'csv' ? ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel', '*/*'] : ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true, multiple: false,
    });
    if (r.canceled || !r.assets || !r.assets.length) return null;
    const asset = r.assets[0];
    const text = await new File(asset.uri).text();
    return { name: asset.name || 'ficheiro', text };
  } catch (e) {
    toast('Não foi possível ler o ficheiro.', 'bad');
    return null;
  }
}
