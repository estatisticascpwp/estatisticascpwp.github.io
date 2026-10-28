'use strict';
/* =========================================================
   SUGESTÃO DE INTERPRETAÇÃO — leituras automáticas, mapas e resumos
   ========================================================= */
const an={period:''};
function renderAnalise(){
 const g=G(),P=an.period,inP=r=>!P||r.period===P;
 const F=g.individual.filter(r=>r.mode==='field'&&inP(r)),K=g.individual.filter(r=>r.mode==='gk'&&inP(r)),C=g.collective.filter(inP);
 const shots=F.filter(r=>SHOT_ACTS.includes(r.action)),goals=shots.filter(r=>r.action==='Golo');
 const saves=K.filter(r=>r.action==='Defesa GR'||r.action==='Defesa p/ Fora GR'),conc=K.filter(r=>r.action==='Golo Sofrido');
 const excW=F.filter(r=>r.action==='EXC ganha').length,excL=F.filter(r=>r.action==='EXC sofrida').length;
 const tab=id=>C.filter(r=>r.table===id),cv=rs=>({n:rs.length,g:rs.filter(r=>r.outcome==='GOLO').length});
 const plus=cv(tab('plus')),minus=cv(tab('minus')),caS=cv(tab('caSCP')),caO=cv(tab('caOther'));
 const sprW=g.sprints.filter(s=>s.winner==='SCP').length,sprP=g.sprints.filter(s=>s.winner).length;
 const teamEff=pct(goals.length,shots.length);
 const shifts=computeShifts();

 /* ---- jogadores ---- */
 const pl=g.roster.map(p=>{const mine=F.filter(r=>r.player===p.n),sh=mine.filter(r=>SHOT_ACTS.includes(r.action)),gl=sh.filter(r=>r.action==='Golo').length;
  const c=a=>mine.filter(r=>r.action===a).length;const secs=P?0:shifts[p.n].total;
  return {n:p.n,gr:p.gr,name:pname(p.n),shots:sh.length,goals:gl,eff:pct(gl,sh.length),ast:F.filter(r=>r.assist===p.n).length,excW:c('EXC ganha'),excL:c('EXC sofrida'),lost:c('Perda Bola')+c('Passe Falhado')+c('Falta Atacante'),steal:c('Roubo Bola'),blk:c('Bloco Defensivo'),secs,g8:secs>=60?(gl*480/secs):null,any:mine.length||secs>0}}).filter(x=>x.any&&!x.gr);

 /* ---- leituras automáticas ---- */
 const ins=[];const add=(tone,title,text)=>ins.push({tone,title,text});
 if(shots.length<6)add('info','Poucos remates registados',`Há ${shots.length} remate(s) ${P?'neste período':'neste jogo'}. As leituras abaixo ficam mais fiáveis com mais registos.`);
 if(shots.length){add(teamEff>=40?'good':teamEff<30?'bad':'info','Eficácia de remate',`O SCP marcou ${goals.length} golos em ${shots.length} remates (${teamEff}%). ${shots.filter(r=>r.action==='Bloco').length} remates foram bloqueados e ${shots.filter(r=>r.action==='Fora').length} saíram fora.`)}
 if(!P){const h1=shots.filter(r=>r.period==='1º'||r.period==='2º'),h2=shots.filter(r=>r.period==='3º'||r.period==='4º');
  if(h1.length>=4&&h2.length>=4){const e1=pct(h1.filter(r=>r.action==='Golo').length,h1.length),e2=pct(h2.filter(r=>r.action==='Golo').length,h2.length);
   if(Math.abs(e1-e2)>=15)add(e2<e1?'bad':'good','Mudança entre metades',`A eficácia passou de ${e1}% na 1.ª metade para ${e2}% na 2.ª. ${e2<e1?'Pode indicar fadiga ou um ajuste defensivo do adversário.':'A equipa melhorou a seleção de remate ao longo do jogo.'}`)}}
 const zones=effRows(groupBy(shots,'fzone'),r=>r.action==='Golo').filter(z=>z.n>=3).sort((a,b)=>b.e-a.e||b.n-a.n);
 if(zones.length>=2){const b=zones[0],w=zones[zones.length-1];add('good','Zona de remate mais eficaz',`${b.k}: ${b.g} golo(s) em ${b.n} remates (${b.e}%).`);if(w.e<b.e)add('bad','Zona de remate menos eficaz',`${w.k}: ${w.g} golo(s) em ${w.n} remates (${w.e}%). Vale a pena rever se estes remates são de boa qualidade ou forçados.`)}
 const far=shots.filter(r=>/Lateral|Central|Meio-campo/.test(r.fzone)).length;
 if(shots.length>=8)add(far/shots.length>0.6?'bad':'info','Distância de remate',`${pct(far,shots.length)}% dos remates foram de fora dos 6M. ${far/shots.length>0.6?'Muitos remates de longe: tentar chegar mais vezes ao pivot ou às pontas.':'Boa parte do volume é perto da baliza.'}`);
 const gz=[...groupBy(goals,'gzone')].sort((a,b)=>b[1].length-a[1].length);
 if(gz.length&&goals.length>=3)add('info','Onde entram os golos do SCP',`Mais golos no ${gz[0][0].toLowerCase()} (${gz[0][1].length} de ${goals.length}).`);
 const fig=F.filter(r=>r.action==='Defesa'&&r.gzone==='Figura').length,def=F.filter(r=>r.action==='Defesa').length;
 if(def>=3&&fig/def>=0.3)add('bad','Remates à figura',`${fig} das ${def} defesas do GR adversário foram em remates à figura. Procurar os cantos ou rematar após deslocar o GR.`);
 if(saves.length+conc.length>=4){const sp=pct(saves.length,saves.length+conc.length),cz=[...groupBy(conc,'gzone')].sort((a,b)=>b[1].length-a[1].length);
  add(sp>=50?'good':'bad','Guarda-redes SCP',`${sp}% de defesas (${saves.length} defesas, ${conc.length} golos sofridos).${cz.length?` A zona mais batida foi ${cz[0][0].toLowerCase()} (${cz[0][1].length}).`:''}`)}
 const sits=effRows(groupBy(shots,'sit'),r=>r.action==='Golo').filter(s=>s.n>=3).sort((a,b)=>b.e-a.e);
 if(sits.length>=2)add('info','Situações de jogo',`Melhor eficácia em ${sits[0].k} (${sits[0].e}%, ${sits[0].n} remates); pior em ${sits[sits.length-1].k} (${sits[sits.length-1].e}%).`);
 const top=pl.slice().sort((a,b)=>b.goals-a.goals||a.shots-b.shots)[0];
 if(top&&top.goals)add('good','Melhor marcador',`${top.n} · ${top.name}: ${top.goals} golo(s) em ${top.shots} remates (${top.eff}%).`);
 pl.filter(p=>p.shots>=4&&p.eff<=teamEff-20).slice(0,2).forEach(p=>add('bad','Eficácia individual baixa',`${p.n} · ${p.name}: ${p.goals}/${p.shots} (${p.eff}%), bem abaixo da equipa (${teamEff}%).`));
 if(excW+excL>=3)add(excW>=excL?'good':'bad','Exclusões',`O SCP ganhou ${excW} e sofreu ${excL} exclusão(ões)${P?'':' no jogo'}.`);
 if(plus.n)add(pct(plus.g,plus.n)>=35?'good':'bad','Superioridade (+1)',`Convertidas ${plus.g} de ${plus.n} (${pct(plus.g,plus.n)}%).`);
 if(minus.n)add(minus.n-minus.g>=minus.g?'good':'bad','Inferioridade (−1)',`O SCP defendeu ${minus.n-minus.g} de ${minus.n} superioridades do adversário (${100-pct(minus.g,minus.n)}%).`);
 const lost=F.filter(r=>['Perda Bola','Passe Falhado','Falta Atacante'].includes(r.action));
 if(lost.length>=3){const tl=pl.slice().sort((a,b)=>b.lost-a.lost)[0];add('bad','Perdas de posse',`${lost.length} posses perdidas (perdas, passes falhados, faltas atacantes)${tl&&tl.lost>=2?`; ${tl.n} · ${tl.name} com ${tl.lost}`:''}. Os roubos de bola foram ${F.filter(r=>r.action==='Roubo Bola').length}.`)}
 const offs=effRows(groupBy(tab('scp'),'offense'),r=>r.outcome==='GOLO').filter(x=>x.n>=2).sort((a,b)=>b.e-a.e||b.n-a.n);
 if(offs.length>=2)add('good','Jogada ofensiva que mais resulta',`"${offs[0].k}": ${offs[0].g}/${offs[0].n} (${offs[0].e}%). A menos produtiva foi "${offs[offs.length-1].k}" (${offs[offs.length-1].e}%).`);
 const dfs=effRows(groupBy(tab('scp'),'defense'),r=>r.outcome==='GOLO').filter(x=>x.n>=2).sort((a,b)=>a.e-b.e);
 if(dfs.length>=2)add('bad','Defesa adversária que mais travou o SCP',`Contra "${dfs[0].k}" o SCP marcou ${dfs[0].g} em ${dfs[0].n} ataques (${dfs[0].e}%).`);
 const oo=[...groupBy(tab('other').filter(r=>r.outcome==='GOLO'),'offense')].sort((a,b)=>b[1].length-a[1].length);
 if(oo.length&&oo[0][1].length>=2)add('bad','Jogada adversária mais perigosa',`"${oo[0][0]}" deu ${oo[0][1].length} golos ao adversário.`);
 const tA=tab('scp'),t10=tA.filter(r=>r.timing==='+10s'),tm=tA.filter(r=>r.timing==='-10s');
 if(t10.length>=3&&tm.length>=3){const a=pct(t10.filter(r=>r.outcome==='GOLO').length,t10.length),b=pct(tm.filter(r=>r.outcome==='GOLO').length,tm.length);add('info','Tempo de ataque',`Ataques com +10s: ${a}% de golo (${t10.length}); com −10s: ${b}% (${tm.length}). ${a>b+10?'Ataques mais longos estão a render mais.':b>a+10?'O SCP finaliza melhor em ataques rápidos.':'Sem grande diferença entre ataques curtos e longos.'}`)}
 if(!P){const cp=PERIODS.map(p=>({p,n:g.individual.filter(r=>r.mode==='gk'&&r.action==='Golo Sofrido'&&r.period===p).length})).sort((a,b)=>b.n-a.n);if(cp[0].n>=2)add('bad','Período mais difícil',`O ${cp[0].p} período foi onde o SCP sofreu mais golos (${cp[0].n}).`)}
 if(!P){const pm=pl.filter(p=>p.g8!=null&&p.secs>=300).sort((a,b)=>b.g8-a.g8)[0];if(pm&&pm.goals)add('info','Rendimento por tempo jogado',`${pm.n} · ${pm.name}: ${pm.g8.toFixed(1).replace('.',',')} golos por cada 8 minutos na água (${fmtClock(pm.secs)} jogados).`)}
 if(sprP)add(sprW>=sprP/2?'good':'bad','Bolas de saída',`O SCP ganhou ${sprW} de ${sprP} sprints.`);

 /* ---- render ---- */
 const kpi=(k,v,s)=>`<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
 const v=$('#view-analise');
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Sugestão de Interpretação</h1><p>Leituras automáticas a partir dos registos da Estatística Individual, Coletiva, Tempo de Jogo e Bolas de saída. São pistas para a análise, não conclusões.</p></div>
   <div class="field" style="min-width:160px"><label for="an-p">Período</label><select id="an-p"><option value="">Jogo todo</option>${PERIODS.map(p=>`<option ${P===p?'selected':''}>${p}</option>`).join('')}</select></div></div>
  <div class="kpis">
   ${kpi('Golos (individual)',goals.length,`${shots.length} remates · ${teamEff}%`)}
   ${kpi('Defesas GR',saves.length+conc.length?pct(saves.length,saves.length+conc.length)+'%':'—',`${saves.length} defesas · ${conc.length} golos`)}
   ${kpi('Exclusões',`${excW}–${excL}`,'ganhas – sofridas')}
   ${kpi('Superioridade +1',plus.n?pct(plus.g,plus.n)+'%':'—',`${plus.g} golo(s) em ${plus.n}`)}
   ${kpi('Inferioridade −1',minus.n?(100-pct(minus.g,minus.n))+'%':'—',`${minus.n-minus.g} defendidas de ${minus.n}`)}
   ${kpi('Contra-ataque',caS.n?pct(caS.g,caS.n)+'%':'—',`SCP ${caS.g}/${caS.n} · Adv. ${caO.g}/${caO.n}`)}
   ${kpi('Bolas de saída',sprP?`${sprW}/${sprP}`:'—','ganhas pelo SCP')}
  </div>
 </section>
 <section class="panel"><h2 class="sub">Leituras automáticas</h2><div class="insights" style="margin-top:12px">${ins.map(i=>`<div class="ins ${i.tone}"><span class="dot">${i.tone==='good'?'↑':i.tone==='bad'?'!':'i'}</span><div><b>${esc(i.title)}</b><p>${esc(i.text)}</p></div></div>`).join('')}</div></section>
 <div class="an-grid3">
  <section class="panel"><h3 class="mini">Eficácia de remate por zona</h3>${zoneMapSVG(shots)}<p class="muted small" style="margin:8px 0 0">Amarelo mais forte = maior % de golo.</p></section>
  <section class="panel"><h3 class="mini">Onde entram os golos do SCP</h3>${goalHeatSVG(goals,'#1e9e4a')}<p class="muted small" style="margin:8px 0 0">${goals.length} golos com local registado.</p></section>
  <section class="panel"><h3 class="mini">Golos sofridos pelo GR SCP</h3>${goalHeatSVG(conc,'#d93232')}<p class="muted small" style="margin:8px 0 0">${conc.length} golos sofridos com local registado.</p></section>
 </div>
 <section class="panel">
  <div class="rec-head"><h2 class="sub">Resumo por jogador</h2><button type="button" class="btn btn-outline btn-sm" id="an-exp">${icon('download')}Exportar CSV</button></div>
  <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th class="l">Jogador</th><th>Remates</th><th>Golos</th><th>Eficácia</th><th>Assist.</th><th>EXC ganhas</th><th>EXC sofridas</th><th>Perdas</th><th>Roubos</th><th>Blocos def.</th><th>Tempo jogado</th><th>Golos / 8'</th></tr></thead><tbody>
  ${pl.length?pl.map(p=>`<tr><td class="l">${esc(p.n+' · '+p.name)}</td><td>${p.shots}</td><td><b>${p.goals}</b></td><td>${p.shots?p.eff+'%':'—'}</td><td>${p.ast}</td><td>${p.excW}</td><td>${p.excL}</td><td>${p.lost}</td><td>${p.steal}</td><td>${p.blk}</td><td>${P?'—':fmtClock(p.secs)}</td><td>${p.g8!=null?p.g8.toFixed(1).replace('.',','):'—'}</td></tr>`).join(''):'<tr><td class="empty" colspan="12">Ainda sem registos de jogadores de campo.</td></tr>'}
  </tbody></table></div>
 </section>
 <div class="an-grid">
  <section class="panel"><h3 class="mini">Eficácia por situação de jogo</h3>${barsHTML(effRows(groupBy(shots,'sit'),r=>r.action==='Golo').sort((a,b)=>STD.indexOf(a.k)-STD.indexOf(b.k)).map(x=>({label:x.k,v:x.e,x})),{max:100,fmt:i=>`${i.v}% <small>${i.x.g}/${i.x.n}</small>`})}</section>
  <section class="panel"><h3 class="mini">Resultado dos ataques SCP (6x6)</h3>${barsHTML([...groupBy(tab('scp'),'outcome')].map(([k,rs])=>({label:k,v:rs.length,bad:k!=='GOLO'&&k!=='EXCLUSÃO'&&k!=='PENALTI'})).sort((a,b)=>b.v-a.v))}</section>
  <section class="panel"><h3 class="mini">Jogadas ofensivas SCP · % de golo</h3>${barsHTML(effRows(groupBy(tab('scp'),'offense'),r=>r.outcome==='GOLO').sort((a,b)=>b.e-a.e||b.n-a.n).map(x=>({label:x.k,v:x.e,x})),{max:100,fmt:i=>`${i.v}% <small>${i.x.g}/${i.x.n}</small>`})}</section>
  <section class="panel"><h3 class="mini">Eficácia SCP contra cada defesa adversária</h3>${barsHTML(effRows(groupBy(tab('scp'),'defense'),r=>r.outcome==='GOLO').sort((a,b)=>b.e-a.e).map(x=>({label:x.k,v:x.e,x})),{max:100,fmt:i=>`${i.v}% <small>${i.x.g}/${i.x.n}</small>`})}</section>
  <section class="panel"><h3 class="mini">Defesas SCP · golos sofridos por sistema</h3>${barsHTML(effRows(groupBy(tab('other'),'defense'),r=>r.outcome==='GOLO').sort((a,b)=>b.e-a.e).map(x=>({label:x.k,v:x.e,x,bad:true})),{max:100,fmt:i=>`${i.v}% <small>${i.x.g}/${i.x.n}</small>`})}</section>
  <section class="panel"><h3 class="mini">Posição de remate · ataques SCP</h3>${barsHTML(effRows(groupBy(C.filter(r=>['scp','plus','caSCP'].includes(r.table)),'position'),r=>r.outcome==='GOLO').sort((a,b)=>COL_OPTS.positions.indexOf(a.k)-COL_OPTS.positions.indexOf(b.k)).map(x=>({label:x.k,v:x.e,x})),{max:100,fmt:i=>`${i.v}% <small>${i.x.g}/${i.x.n}</small>`})}</section>
 </div>`;
 $('#an-p').onchange=e=>{an.period=e.target.value;renderAnalise()};
 $('#an-exp').onclick=()=>{if(!pl.length){toast('Sem dados para exportar.','warn');return}download('interpretacao_jogadores_'+fileStamp()+'.csv',toCSV([['Nº','Jogador','Remates','Golos','Eficácia (%)','Assistências','EXC ganhas','EXC sofridas','Perdas','Roubos','Blocos defensivos','Tempo jogado','Golos por 8 min'],...pl.map(p=>[p.n,p.name,p.shots,p.goals,p.eff,p.ast,p.excW,p.excL,p.lost,p.steal,p.blk,P?'':fmtClock(p.secs),p.g8!=null?numPT(p.g8):''])]))};
}
