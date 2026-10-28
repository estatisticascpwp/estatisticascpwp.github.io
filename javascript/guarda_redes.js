'use strict';
/* =========================================================
   GUARDA-REDES — rendimento dos GR do SCP (a partir da Estatística Individual)
   ========================================================= */
const grs={who:'',period:''};
const GR_SAVE=['Defesa GR','Defesa p/ Fora GR'];
const grOn=r=>r.action==='Golo Sofrido'||GR_SAVE.includes(r.action);
function grStats(rows){const on=rows.filter(grOn),sv=rows.filter(r=>GR_SAVE.includes(r.action)),gl=rows.filter(r=>r.action==='Golo Sofrido');return {n:rows.length,on:on.length,sv:sv.length,gl:gl.length,out:rows.filter(r=>r.action==='Fora').length,hold:rows.filter(r=>r.action==='Defesa GR').length,away:rows.filter(r=>r.action==='Defesa p/ Fora GR').length,p:pct(sv.length,on.length)}}
function renderGuardaRedes(){
 const g=G(),v=$('#view-guardaredes'),shifts=computeShifts();
 const gks=[...new Set([...g.roster.filter(p=>p.gr).map(p=>p.n),...g.individual.filter(r=>r.mode==='gk').map(r=>r.player)])].sort((a,b)=>a-b);
 const all=g.individual.filter(r=>r.mode==='gk'&&(!grs.period||r.period===grs.period));
 const rows=all.filter(r=>!grs.who||String(r.player)===grs.who),st=grStats(rows);
 const secs=grs.period?0:(grs.who?shifts[+grs.who]?.total||0:gks.reduce((a,n)=>a+(shifts[n]?.total||0),0));
 const pctBars=(keyFn,order)=>{const m=groupBy(rows.filter(grOn),keyFn);let items=[...m].map(([k,rs])=>{const s=grStats(rs);return {label:k,v:s.p,x:s}});if(order)items.sort((a,b)=>order.indexOf(a.label)-order.indexOf(b.label));return barsHTML(items,{max:100,fmt:i=>`${i.v}% <small>${i.x.sv}/${i.x.on}</small>`})};
 const byGoal=groupBy(rows.filter(grOn),'gzone');
 const sectors=GOAL_ZONES.filter(z=>byGoal.has(z)).map(z=>({z,...grStats(byGoal.get(z))}));
 const ins=[];
 const weak=sectors.filter(s=>s.on>=2).sort((a,b)=>a.p-b.p||b.gl-a.gl);
 if(weak.length){ins.push(['bad','Zona mais batida',`${weak[0].z}: ${weak[0].gl} golo(s) em ${weak[0].on} remates à baliza (${weak[0].p}% de defesas).`]);if(weak.length>1&&weak[weak.length-1].p>weak[0].p)ins.push(['good','Zona mais segura',`${weak[weak.length-1].z}: ${weak[weak.length-1].p}% de defesas (${weak[weak.length-1].sv}/${weak[weak.length-1].on}).`])}
 const near=rows.filter(r=>grOn(r)&&r.fy!=null&&r.fy*12.5<6),far=rows.filter(r=>grOn(r)&&r.fy!=null&&r.fy*12.5>=6);
 if(near.length>=2&&far.length>=2){const a=grStats(near).p,b=grStats(far).p;ins.push([b>=a?'info':'bad','Perto vs. longe',`Remates de dentro dos 6M: ${a}% de defesas (${near.length}). De fora dos 6M: ${b}% (${far.length}).${b<50?' Os remates de longe estão a entrar demasiado.':''}`])}
 const pen=grStats(rows.filter(r=>r.sit==='PEN'));if(pen.on)ins.push([pen.sv?'good':'info','Penáltis',`${pen.sv} defesa(s) em ${pen.on} penálti(s).`]);
 if(st.away+st.hold>=3)ins.push(['info','Tipo de defesa',`${st.hold} defesas com a bola controlada e ${st.away} para fora (${pct(st.away,st.sv)}% das defesas dão nova posse ou canto ao adversário).`]);
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Guarda-Redes</h1><p>Rendimento dos guarda-redes do SCP a partir dos registos de GR da Estatística Individual (golos sofridos, defesas e remates para fora).</p></div>
   <div class="field" style="min-width:150px"><label for="gr-p">Período</label><select id="gr-p"><option value="">Jogo todo</option>${PERIODS.map(p=>`<option ${grs.period===p?'selected':''}>${p}</option>`).join('')}</select></div></div>
  <div class="gk-chips" id="gr-who"><button type="button" class="chip ${grs.who?'':'on'}" data-who="">Todos os GR</button>${gks.map(n=>`<button type="button" class="cap gk ${grs.who===String(n)?'on':''}" data-who="${n}" style="min-width:150px"><span class="num">${n}</span><span class="nm">${esc(pname(n))}</span></button>`).join('')}</div>
  <div class="prof" style="margin-top:14px">
   <span class="bigcap gk">${grs.who||'GR'}</span>
   <div><h2>${esc(grs.who?pname(grs.who):'Todos os guarda-redes')}</h2><p>${grs.period?grs.period+' período':'Jogo todo'} · ${secs?fmtClock(secs)+' na água':'sem tempo de jogo registado'}</p></div>
   <div class="pmeta"><div><b>${st.on?st.p+'%':'—'}</b><span>% defesas</span></div><div><b>${st.sv}</b><span>defesas</span></div><div><b>${st.gl}</b><span>golos sofridos</span></div><div><b>${st.on}</b><span>remates à baliza</span></div><div><b>${secs>=60?numPT(st.gl*480/secs):'—'}</b><span>golos / 8'</span></div></div>
  </div>
 </section>
 ${ins.length?`<section class="panel"><h2 class="sub">Leituras</h2><div class="insights" style="margin-top:12px">${ins.map(([t,h,p])=>`<div class="ins ${t}"><span class="dot">${t==='good'?'↑':t==='bad'?'!':'i'}</span><div><b>${esc(h)}</b><p>${esc(p)}</p></div></div>`).join('')}</div></section>`:''}
 <div class="two-maps">
  <section class="panel"><div class="pc-h"><h3 class="mini" style="margin:0">Remates à baliza — onde chegaram</h3></div>${goalMarkup('grgoal')}
   <div class="legend">${ACTIONS.gk.map(a=>`<span>${actIcon(a)}${esc(a.id)}</span>`).join('')}</div>
   <div class="table-wrap" style="margin-top:12px"><table class="mx"><thead><tr><th class="zl">Zona da baliza</th><th>À baliza</th><th>Defesas</th><th>Golos</th><th>% defesas</th></tr></thead><tbody>
   ${sectors.map(s=>`<tr><td class="zl">${esc(s.z)}</td><td>${s.on}</td><td>${s.sv}</td><td>${s.gl}</td><td><span class="badge ${s.p>=60?'t-good':s.p>=40?'t-warn':'t-bad'}" style="min-width:56px">${s.p}%</span></td></tr>`).join('')||'<tr><td class="empty" colspan="5">Sem remates com local na baliza.</td></tr>'}
   </tbody></table></div></section>
  <section class="panel"><div class="pc-h"><h3 class="mini" style="margin:0">De onde rematou o adversário</h3></div>${pitchMarkup('grpitch')}
   <h3 class="mini" style="margin-top:16px">% de defesas por zona do campo</h3>${pctBars('fzone',FIELD_ZONES)}</section>
 </div>
 <div class="an-grid3">
  <section class="panel"><h3 class="mini">% de defesas por distância</h3>${pctBars(distBand,DIST_BANDS.map(d=>d[0]))}</section>
  <section class="panel"><h3 class="mini">% de defesas por situação</h3>${pctBars('sit',STD)}</section>
  <section class="panel"><h3 class="mini">% de defesas por período</h3>${pctBars('period',PERIODS)}</section>
 </div>
 <section class="panel">
  <div class="rec-head"><h2 class="sub">Comparação entre guarda-redes</h2><button type="button" class="btn btn-outline btn-sm" id="gr-exp">${icon('download')}Exportar CSV</button></div>
  <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th class="l">Guarda-redes</th><th>À baliza</th><th>Defesas</th><th>Controladas</th><th>Para fora</th><th>Golos sofridos</th><th>Fora</th><th>% defesas</th><th>Tempo jogado</th><th>Golos / 8'</th></tr></thead><tbody id="gr-cmp"></tbody></table></div>
 </section>`;
 const cmp=gks.map(n=>{const s=grStats(all.filter(r=>r.player===n)),t=grs.period?0:(shifts[n]?.total||0);return {n,s,t}});
 $('#gr-cmp').innerHTML=cmp.length?cmp.map(({n,s,t})=>`<tr><td class="l">${esc(plabel(n))}</td><td>${s.on}</td><td><b>${s.sv}</b></td><td>${s.hold}</td><td>${s.away}</td><td>${s.gl}</td><td>${s.out}</td><td><b>${fmtPct(s.sv,s.on)}</b></td><td>${grs.period?'—':fmtClock(t)}</td><td>${t>=60?numPT(s.gl*480/t):'—'}</td></tr>`).join(''):'<tr><td class="empty" colspan="10">Marca os guarda-redes no plantel (página Jogadores ou Exclusões).</td></tr>';
 $('#grgoal').style.cursor='default';$('#grpitch').style.cursor='default';
 $('#grgoal-saved').innerHTML=markerGroup(rows,'g','#203631',2.4);
 $('#grpitch-saved').innerHTML=markerGroup(rows,'f','#ffffff',2.4);
 $('#gr-p').onchange=e=>{grs.period=e.target.value;renderGuardaRedes()};
 $('#gr-who').onclick=e=>{const b=e.target.closest('[data-who]');if(!b)return;grs.who=b.dataset.who;renderGuardaRedes()};
 $('#gr-exp').onclick=()=>download('guarda_redes_'+fileStamp()+'.csv',toCSV([['Nº','Guarda-redes','Remates à baliza','Defesas','Defesas controladas','Defesas para fora','Golos sofridos','Remates fora','% defesas','Tempo jogado'],...cmp.map(({n,s,t})=>[n,pname(n),s.on,s.sv,s.hold,s.away,s.gl,s.out,s.on?pct(s.sv,s.on):'',grs.period?'':fmtClock(t)])]));
}
