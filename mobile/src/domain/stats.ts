import { computeShifts } from './clock';
import { COL_OPTS, GOAL_ZONES, GR_SAVE, PERIODS, SHOT_ACTS, STD } from './constants';
import { effRows, fmtClock, groupBy, norm, pct, type EffRow } from './format';
import { pname } from './model';
import { distBand } from './zones';
import type { ColRecord, ColTableId, Game, IndRecord, Player } from './types';

export type Tone = 'good' | 'bad' | 'info';
export interface Insight { tone: Tone; title: string; text: string }
export interface BarItem { label: string; v: number; g?: number; n?: number; bad?: boolean }

/* ---------- por jogador ---------- */
export function playerLine(g: Game, n: number) {
  const F = g.individual.filter(r => r.mode === 'field' && r.player === n);
  const K = g.individual.filter(r => r.mode === 'gk' && r.player === n);
  const sh = F.filter(r => SHOT_ACTS.includes(r.action));
  const goals = sh.filter(r => r.action === 'Golo').length;
  const c = (a: string) => F.filter(r => r.action === a).length;
  const sv = K.filter(r => GR_SAVE.includes(r.action)).length, gs = K.filter(r => r.action === 'Golo Sofrido').length;
  return {
    shots: sh.length, goals, ast: g.individual.filter(r => r.mode === 'field' && r.assist === n).length,
    excW: c('EXC ganha'), excL: c('EXC sofrida'), lost: c('Perda Bola') + c('Passe Falhado') + c('Falta Atacante'),
    steal: c('Roubo Bola'), blk: c('Bloco Defensivo'), sv, gs, gkOn: sv + gs, F, K,
  };
}
/** Encontra o mesmo jogador noutro jogo: pelo nome, ou pelo número se não tiver nome. */
export function findInGame(game: Game, p: Player): number | null {
  if (p.name) { const m = game.roster.find(x => norm(x.name) === norm(p.name)); return m ? m.n : null; }
  return game.roster.find(x => x.n === p.n) ? p.n : null;
}

/* ---------- guarda-redes ---------- */
export const grOn = (r: IndRecord) => r.action === 'Golo Sofrido' || GR_SAVE.includes(r.action);
export function grStats(rows: IndRecord[]) {
  const on = rows.filter(grOn), sv = rows.filter(r => GR_SAVE.includes(r.action)), gl = rows.filter(r => r.action === 'Golo Sofrido');
  return {
    n: rows.length, on: on.length, sv: sv.length, gl: gl.length, out: rows.filter(r => r.action === 'Fora').length,
    hold: rows.filter(r => r.action === 'Defesa GR').length, away: rows.filter(r => r.action === 'Defesa p/ Fora GR').length,
    p: pct(sv.length, on.length),
  };
}
export function grInsights(rows: IndRecord[]): Insight[] {
  const ins: Insight[] = [];
  const byGoal = groupBy(rows.filter(grOn), 'gzone');
  const sectors = GOAL_ZONES.filter(z => byGoal.has(z)).map(z => ({ z, ...grStats(byGoal.get(z)!) }));
  const weak = sectors.filter(s => s.on >= 2).sort((a, b) => a.p - b.p || b.gl - a.gl);
  if (weak.length) {
    ins.push({ tone: 'bad', title: 'Zona mais batida', text: `${weak[0].z}: ${weak[0].gl} golo(s) em ${weak[0].on} remates à baliza (${weak[0].p}% de defesas).` });
    const best = weak[weak.length - 1];
    if (weak.length > 1 && best.p > weak[0].p) ins.push({ tone: 'good', title: 'Zona mais segura', text: `${best.z}: ${best.p}% de defesas (${best.sv}/${best.on}).` });
  }
  const near = rows.filter(r => grOn(r) && r.fy != null && r.fy * 12.5 < 6), far = rows.filter(r => grOn(r) && r.fy != null && r.fy * 12.5 >= 6);
  if (near.length >= 2 && far.length >= 2) {
    const a = grStats(near).p, b = grStats(far).p;
    ins.push({ tone: b >= a ? 'info' : 'bad', title: 'Perto vs. longe', text: `Remates de dentro dos 6M: ${a}% de defesas (${near.length}). De fora dos 6M: ${b}% (${far.length}).${b < 50 ? ' Os remates de longe estão a entrar demasiado.' : ''}` });
  }
  const pen = grStats(rows.filter(r => r.sit === 'PEN'));
  if (pen.on) ins.push({ tone: pen.sv ? 'good' : 'info', title: 'Penáltis', text: `${pen.sv} defesa(s) em ${pen.on} penálti(s).` });
  const st = grStats(rows);
  if (st.away + st.hold >= 3) ins.push({ tone: 'info', title: 'Tipo de defesa', text: `${st.hold} defesas com a bola controlada e ${st.away} para fora (${pct(st.away, st.sv)}% das defesas dão nova posse ou canto ao adversário).` });
  return ins;
}
export function grSectors(rows: IndRecord[]) {
  const byGoal = groupBy(rows.filter(grOn), 'gzone');
  return GOAL_ZONES.filter(z => byGoal.has(z)).map(z => ({ z, ...grStats(byGoal.get(z)!) }));
}
export function pctBars(rows: IndRecord[], keyFn: keyof IndRecord | ((r: IndRecord) => string | null), order?: string[]): BarItem[] {
  const m = groupBy(rows.filter(grOn), keyFn as any);
  const items = [...m].map(([k, rs]) => { const s = grStats(rs); return { label: k, v: s.p, g: s.sv, n: s.on }; });
  if (order) items.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  return items;
}

/* ---------- Sugestão de Interpretação ---------- */
export interface PlayerSummary {
  n: number; gr: boolean; name: string; shots: number; goals: number; eff: number; ast: number; excW: number; excL: number;
  lost: number; steal: number; blk: number; secs: number; g8: number | null;
}
export function analyse(g: Game, P: string) {
  const inP = (r: { period: string }) => !P || r.period === P;
  const F = g.individual.filter(r => r.mode === 'field' && inP(r)), K = g.individual.filter(r => r.mode === 'gk' && inP(r)), C = g.collective.filter(inP);
  const shots = F.filter(r => SHOT_ACTS.includes(r.action)), goals = shots.filter(r => r.action === 'Golo');
  const saves = K.filter(r => GR_SAVE.includes(r.action)), conc = K.filter(r => r.action === 'Golo Sofrido');
  const excW = F.filter(r => r.action === 'EXC ganha').length, excL = F.filter(r => r.action === 'EXC sofrida').length;
  const tab = (id: ColTableId) => C.filter(r => r.table === id);
  const cv = (rs: ColRecord[]) => ({ n: rs.length, g: rs.filter(r => r.outcome === 'GOLO').length });
  const plus = cv(tab('plus')), minus = cv(tab('minus')), caS = cv(tab('caSCP')), caO = cv(tab('caOther'));
  const sprW = g.sprints.filter(s => s.winner === 'SCP').length, sprP = g.sprints.filter(s => s.winner).length;
  const teamEff = pct(goals.length, shots.length);
  const shifts = computeShifts(g).byPlayer;

  const pl: PlayerSummary[] = g.roster.map(p => {
    const mine = F.filter(r => r.player === p.n), sh = mine.filter(r => SHOT_ACTS.includes(r.action)), gl = sh.filter(r => r.action === 'Golo').length;
    const c = (a: string) => mine.filter(r => r.action === a).length;
    const secs = P ? 0 : shifts[p.n].total;
    return { n: p.n, gr: p.gr, name: pname(g, p.n), shots: sh.length, goals: gl, eff: pct(gl, sh.length), ast: F.filter(r => r.assist === p.n).length,
      excW: c('EXC ganha'), excL: c('EXC sofrida'), lost: c('Perda Bola') + c('Passe Falhado') + c('Falta Atacante'), steal: c('Roubo Bola'), blk: c('Bloco Defensivo'),
      secs, g8: secs >= 60 ? (gl * 480) / secs : null, any: mine.length > 0 || secs > 0 };
  }).filter(x => x.any && !x.gr);

  const ins: Insight[] = [];
  const add = (tone: Tone, title: string, text: string) => ins.push({ tone, title, text });
  if (shots.length < 6) add('info', 'Poucos remates registados', `Há ${shots.length} remate(s) ${P ? 'neste período' : 'neste jogo'}. As leituras abaixo ficam mais fiáveis com mais registos.`);
  if (shots.length) add(teamEff >= 40 ? 'good' : teamEff < 30 ? 'bad' : 'info', 'Eficácia de remate', `O SCP marcou ${goals.length} golos em ${shots.length} remates (${teamEff}%). ${shots.filter(r => r.action === 'Bloco').length} remates foram bloqueados e ${shots.filter(r => r.action === 'Fora').length} saíram fora.`);
  if (!P) {
    const h1 = shots.filter(r => r.period === '1º' || r.period === '2º'), h2 = shots.filter(r => r.period === '3º' || r.period === '4º');
    if (h1.length >= 4 && h2.length >= 4) {
      const e1 = pct(h1.filter(r => r.action === 'Golo').length, h1.length), e2 = pct(h2.filter(r => r.action === 'Golo').length, h2.length);
      if (Math.abs(e1 - e2) >= 15) add(e2 < e1 ? 'bad' : 'good', 'Mudança entre metades', `A eficácia passou de ${e1}% na 1.ª metade para ${e2}% na 2.ª. ${e2 < e1 ? 'Pode indicar fadiga ou um ajuste defensivo do adversário.' : 'A equipa melhorou a seleção de remate ao longo do jogo.'}`);
    }
  }
  const zones = effRows(groupBy(shots, 'fzone'), r => r.action === 'Golo').filter(z => z.n >= 3).sort((a, b) => b.e - a.e || b.n - a.n);
  if (zones.length >= 2) {
    const b = zones[0], w = zones[zones.length - 1];
    add('good', 'Zona de remate mais eficaz', `${b.k}: ${b.g} golo(s) em ${b.n} remates (${b.e}%).`);
    if (w.e < b.e) add('bad', 'Zona de remate menos eficaz', `${w.k}: ${w.g} golo(s) em ${w.n} remates (${w.e}%). Vale a pena rever se estes remates são de boa qualidade ou forçados.`);
  }
  const far = shots.filter(r => /Lateral|Central|Meio-campo/.test(r.fzone)).length;
  if (shots.length >= 8) add(far / shots.length > 0.6 ? 'bad' : 'info', 'Distância de remate', `${pct(far, shots.length)}% dos remates foram de fora dos 6M. ${far / shots.length > 0.6 ? 'Muitos remates de longe: tentar chegar mais vezes ao pivot ou às pontas.' : 'Boa parte do volume é perto da baliza.'}`);
  const gz = [...groupBy(goals, 'gzone')].sort((a, b) => b[1].length - a[1].length);
  if (gz.length && goals.length >= 3) add('info', 'Onde entram os golos do SCP', `Mais golos no ${gz[0][0].toLowerCase()} (${gz[0][1].length} de ${goals.length}).`);
  const fig = F.filter(r => r.action === 'Defesa' && r.gzone === 'Figura').length, def = F.filter(r => r.action === 'Defesa').length;
  if (def >= 3 && fig / def >= 0.3) add('bad', 'Remates à figura', `${fig} das ${def} defesas do GR adversário foram em remates à figura. Procurar os cantos ou rematar após deslocar o GR.`);
  if (saves.length + conc.length >= 4) {
    const sp = pct(saves.length, saves.length + conc.length), cz = [...groupBy(conc, 'gzone')].sort((a, b) => b[1].length - a[1].length);
    add(sp >= 50 ? 'good' : 'bad', 'Guarda-redes SCP', `${sp}% de defesas (${saves.length} defesas, ${conc.length} golos sofridos).${cz.length ? ` A zona mais batida foi ${cz[0][0].toLowerCase()} (${cz[0][1].length}).` : ''}`);
  }
  const sits = effRows(groupBy(shots, 'sit'), r => r.action === 'Golo').filter(s => s.n >= 3).sort((a, b) => b.e - a.e);
  if (sits.length >= 2) add('info', 'Situações de jogo', `Melhor eficácia em ${sits[0].k} (${sits[0].e}%, ${sits[0].n} remates); pior em ${sits[sits.length - 1].k} (${sits[sits.length - 1].e}%).`);
  const top = pl.slice().sort((a, b) => b.goals - a.goals || a.shots - b.shots)[0];
  if (top && top.goals) add('good', 'Melhor marcador', `${top.n} · ${top.name}: ${top.goals} golo(s) em ${top.shots} remates (${top.eff}%).`);
  pl.filter(p => p.shots >= 4 && p.eff <= teamEff - 20).slice(0, 2).forEach(p => add('bad', 'Eficácia individual baixa', `${p.n} · ${p.name}: ${p.goals}/${p.shots} (${p.eff}%), bem abaixo da equipa (${teamEff}%).`));
  if (excW + excL >= 3) add(excW >= excL ? 'good' : 'bad', 'Exclusões', `O SCP ganhou ${excW} e sofreu ${excL} exclusão(ões)${P ? '' : ' no jogo'}.`);
  if (plus.n) add(pct(plus.g, plus.n) >= 35 ? 'good' : 'bad', 'Superioridade (+1)', `Convertidas ${plus.g} de ${plus.n} (${pct(plus.g, plus.n)}%).`);
  if (minus.n) add(minus.n - minus.g >= minus.g ? 'good' : 'bad', 'Inferioridade (−1)', `O SCP defendeu ${minus.n - minus.g} de ${minus.n} superioridades do adversário (${100 - pct(minus.g, minus.n)}%).`);
  const lost = F.filter(r => ['Perda Bola', 'Passe Falhado', 'Falta Atacante'].includes(r.action));
  if (lost.length >= 3) {
    const tl = pl.slice().sort((a, b) => b.lost - a.lost)[0];
    add('bad', 'Perdas de posse', `${lost.length} posses perdidas (perdas, passes falhados, faltas atacantes)${tl && tl.lost >= 2 ? `; ${tl.n} · ${tl.name} com ${tl.lost}` : ''}. Os roubos de bola foram ${F.filter(r => r.action === 'Roubo Bola').length}.`);
  }
  const offs = effRows(groupBy(tab('scp'), 'offense'), r => r.outcome === 'GOLO').filter(x => x.n >= 2).sort((a, b) => b.e - a.e || b.n - a.n);
  if (offs.length >= 2) add('good', 'Jogada ofensiva que mais resulta', `"${offs[0].k}": ${offs[0].g}/${offs[0].n} (${offs[0].e}%). A menos produtiva foi "${offs[offs.length - 1].k}" (${offs[offs.length - 1].e}%).`);
  const dfs = effRows(groupBy(tab('scp'), 'defense'), r => r.outcome === 'GOLO').filter(x => x.n >= 2).sort((a, b) => a.e - b.e);
  if (dfs.length >= 2) add('bad', 'Defesa adversária que mais travou o SCP', `Contra "${dfs[0].k}" o SCP marcou ${dfs[0].g} em ${dfs[0].n} ataques (${dfs[0].e}%).`);
  const oo = [...groupBy(tab('other').filter(r => r.outcome === 'GOLO'), 'offense')].sort((a, b) => b[1].length - a[1].length);
  if (oo.length && oo[0][1].length >= 2) add('bad', 'Jogada adversária mais perigosa', `"${oo[0][0]}" deu ${oo[0][1].length} golos ao adversário.`);
  const tA = tab('scp'), t10 = tA.filter(r => r.timing === '+10s'), tm = tA.filter(r => r.timing === '-10s');
  if (t10.length >= 3 && tm.length >= 3) {
    const a = pct(t10.filter(r => r.outcome === 'GOLO').length, t10.length), b = pct(tm.filter(r => r.outcome === 'GOLO').length, tm.length);
    add('info', 'Tempo de ataque', `Ataques com +10s: ${a}% de golo (${t10.length}); com −10s: ${b}% (${tm.length}). ${a > b + 10 ? 'Ataques mais longos estão a render mais.' : b > a + 10 ? 'O SCP finaliza melhor em ataques rápidos.' : 'Sem grande diferença entre ataques curtos e longos.'}`);
  }
  if (!P) {
    const cp = PERIODS.map(p => ({ p, n: g.individual.filter(r => r.mode === 'gk' && r.action === 'Golo Sofrido' && r.period === p).length })).sort((a, b) => b.n - a.n);
    if (cp[0].n >= 2) add('bad', 'Período mais difícil', `O ${cp[0].p} período foi onde o SCP sofreu mais golos (${cp[0].n}).`);
    const pm = pl.filter(p => p.g8 != null && p.secs >= 300).sort((a, b) => (b.g8 as number) - (a.g8 as number))[0];
    if (pm && pm.goals) add('info', 'Rendimento por tempo jogado', `${pm.n} · ${pm.name}: ${(pm.g8 as number).toFixed(1).replace('.', ',')} golos por cada 8 minutos na água (${fmtClock(pm.secs)} jogados).`);
  }
  if (sprP) add(sprW >= sprP / 2 ? 'good' : 'bad', 'Bolas de saída', `O SCP ganhou ${sprW} de ${sprP} sprints.`);

  const effBars = (rows: EffRow[]): BarItem[] => rows.map(x => ({ label: x.k, v: x.e, g: x.g, n: x.n }));
  const charts = {
    sit: effBars(effRows(groupBy(shots, 'sit'), r => r.action === 'Golo').sort((a, b) => STD.indexOf(a.k) - STD.indexOf(b.k))),
    outcomes: [...groupBy(tab('scp'), 'outcome')].map(([k, rs]) => ({ label: k, v: rs.length, bad: k !== 'GOLO' && k !== 'EXCLUSÃO' && k !== 'PENALTI' })).sort((a, b) => b.v - a.v) as BarItem[],
    offense: effBars(effRows(groupBy(tab('scp'), 'offense'), r => r.outcome === 'GOLO').sort((a, b) => b.e - a.e || b.n - a.n)),
    vsDefense: effBars(effRows(groupBy(tab('scp'), 'defense'), r => r.outcome === 'GOLO').sort((a, b) => b.e - a.e)),
    ourDefense: effBars(effRows(groupBy(tab('other'), 'defense'), r => r.outcome === 'GOLO').sort((a, b) => b.e - a.e)).map(b => ({ ...b, bad: true })),
    position: effBars(effRows(groupBy(C.filter(r => ['scp', 'plus', 'caSCP'].includes(r.table)), 'position'), r => r.outcome === 'GOLO').sort((a, b) => COL_OPTS.positions.indexOf(a.k) - COL_OPTS.positions.indexOf(b.k))),
  };
  return { shots, goals, saves, conc, excW, excL, plus, minus, caS, caO, sprW, sprP, teamEff, pl, ins, charts };
}

/** Barras por distância/situação para a página Remates. */
export function shotBars(rows: IndRecord[], isGoal: (r: IndRecord) => boolean) {
  const dist: BarItem[] = ['0–2 m', '2–6 m', '6–12 m', '+12 m'].map(b => { const rs = rows.filter(r => distBand(r) === b); const gg = rs.filter(isGoal).length; return { label: b, v: pct(gg, rs.length), g: gg, n: rs.length }; }).filter(i => i.n);
  const sit: BarItem[] = STD.map(s => { const rs = rows.filter(r => r.sit === s); const gg = rs.filter(isGoal).length; return { label: s, v: pct(gg, rs.length), g: gg, n: rs.length }; }).filter(i => i.n);
  return { dist, sit };
}
