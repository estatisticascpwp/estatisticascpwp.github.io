/**
 * Armazenamento local em SQLite (expo-sqlite).
 * Cada jogo é uma linha — preparado para, mais tarde, sincronizar com uma base de dados na nuvem.
 */
import * as SQLite from 'expo-sqlite';
import type { Game } from '../domain/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function openDB() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('scpstat.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  `);
  return db;
}
export async function loadAll(): Promise<{ games: unknown[]; kv: Record<string, string> }> {
  const d = await openDB();
  const rows = await d.getAllAsync<{ json: string }>('SELECT json FROM games ORDER BY updated DESC');
  const kvRows = await d.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM kv');
  const games: unknown[] = [];
  rows.forEach(r => { try { games.push(JSON.parse(r.json)); } catch { /* linha corrompida: ignorar */ } });
  return { games, kv: Object.fromEntries(kvRows.map(r => [r.key, r.value])) };
}
export async function writeGame(g: Game) {
  const d = await openDB();
  await d.runAsync('INSERT OR REPLACE INTO games (id, json, updated) VALUES (?, ?, ?)', g.id, JSON.stringify(g), g.updated);
}
export async function removeGame(id: string) {
  const d = await openDB();
  await d.runAsync('DELETE FROM games WHERE id = ?', id);
}
export async function writeKV(key: string, value: string) {
  const d = await openDB();
  await d.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
}
export async function clearGames() {
  const d = await openDB();
  await d.runAsync('DELETE FROM games');
}
export async function storageBytes(): Promise<number> {
  const d = await openDB();
  const r = await d.getFirstAsync<{ b: number | null }>('SELECT SUM(LENGTH(json)) AS b FROM games');
  return (r && r.b) || 0;
}
