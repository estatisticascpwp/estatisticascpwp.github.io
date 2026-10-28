'use strict';
/* =========================================================
   REMATES — mapa de remates do SCP e do adversário (a partir da Estatística Individual)
   ========================================================= */
const rem={team:'scp',period:'',player:'',sit:'',res:[]};
const REM_RES={
 scp:[{id:'Golo',goal:true,on:true},{id:'Defesa',on:true},{id:'Bloco'},{id:'Fora'}],
 opp:[{id:'Golo Sofrido',goal:true,on:true,label:'Golo'},{id:'Defesa GR',on:true},{id:'Defesa p/ Fora GR',on:true,label:'Defesa p/ fora'},{id:'Fora'}]
};
const remMode=()=>rem.team==='scp'?'field':'gk';
function remBase(){const g=G();return rem.team==='scp'?g.individual.filter(r=>r.mode==='field'&&SHOT_ACTS.includes(r.action)):g.individual.filter(r=>r.mode==='gk')}
function remRows(){return remBase().filter(r=>(!rem.period||r.period===rem.period)&&(!rem.player||String(r.player)===rem.player)&&(!rem.sit||r.sit===rem.sit)&&(!rem.res.length||rem.res.includes(r.action)))}
function renderRemates(){
 const v=$('#view-remates'),res=REM_RES[rem.team],isGoal=r=>res.find(x=>x.id===r.action)?.goal,isOn=r=>res.find(x=>x.id===r.action)?.on;
 const rows=remRows(),goals=rows.filter(isGoal),on=rows.filter(isOn),scp=rem.team==='scp';
 const players=[...new Set(remBase().map(r=>r.player))].sort((a,b)=>a-b);
 const avgDist=rows.filter(r=>r.fy!=null).reduce((a,r,_,arr)=>a+r.fy*12.5/arr.length,0);
 const byZone=groupBy(rows,'fzone'),byGoal=groupBy(rows,'gzone');
 const maxCell=Math.max(1,...FIELD_ZONES.flatMap(z=>res.map(o=>(byZone.get(z)||[]).filter(r=>r.action===o.id).length)));
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Remates</h1><p>Todos os remates registados na Estatística Individual. Os remates do adversário são os registados nos guarda-redes do SCP.</p></div>
   <div class="mode-switch" id="rem-team" role="group" aria-label="Equipa"><button type="button" data-team="scp" class="${scp?'on':''}">Remates SCP</button><button type="button" data-team="opp" class="gk ${scp?'':'on'}">Remates do adversário</button></div></div>
  <div class="fbar">
   <div class="field"><label for="rem-p">Período</label><select id="rem-p"><option value="">Jogo todo</option>${PERIODS.map(p=>`<option ${rem.period===p?'selected':''}>${p}</option>`).join('')}</select></div>
   <div class="field"><label for="rem-j">${scp?'Jogador':'Guarda-redes'}</label><select id="rem-j"><option value="">Todos</option>${players.map(n=>`<option value="${n}" ${rem.player===String(n)?'selected':''}>${esc(plabel(n))}</option>`).join('')}</select></div>
   <div class="field"><label for="rem-s">Situação</label><select id="rem-s"><option value="">Todas</option>${STD.map(s=>`<option ${rem.sit===s?'selected':''}>${s}</option>`).join('')}</select></div>
   <div class="field" style="flex:2 1 320px"><span class="lbl">Resultado</span><div class="chips" id="rem-res">${res.map(o=>{const a=actDef(remMode(),o.id);return `<button type="button" class="chip ${rem.res.includes(o.id)?'on':''}" data-res="${esc(o.id)}">${actIcon(a)}${esc(o.label||o.id)}</button>`}).join('')}</div></div>
   <button type="button" class="btn btn-ghost btn-sm" id="rem-reset">${icon('reset')}Limpar filtros</button>
  </div>
  <div class="kpis" style="margin-top:16px">
   ${kpiBox('Remates',rows.length,scp?'do SCP':'do adversário')}
   ${kpiBox('Golos',goals.length,scp?'marcados':'sofridos')}
   ${kpiBox('Eficácia',fmtPct(goals.length,rows.length),'golos / remates')}
   ${kpiBox('À baliza',fmtPct(on.length,rows.length),`${on.length} enquadrados`)}
   ${scp?kpiBox('Bloqueados',rows.filter(r=>r.action==='Bloco').length,fmtPct(rows.filter(r=>r.action==='Bloco').length,rows.length)+' dos remates'):kpiBox('Defesas GR',on.length-goals.length,fmtPct(on.length-goals.length,on.length)+' dos remates à baliza')}
   ${kpiBox('Distância média',rows.length?numPT(avgDist)+' m':'—','à linha de golo')}
  </div>
 </section>
 <div class="two-maps">
  <section class="panel"><div class="pc-h"><h3 class="mini" style="margin:0">Posição de remate</h3><span class="muted small">${rows.length} remate(s)</span></div>${pitchMarkup('rpitch')}<div class="legend">${res.map(o=>`<span>${actIcon(actDef(remMode(),o.id))}${esc(o.label||o.id)}</span>`).join('')}</div></section>
  <section class="panel"><div class="pc-h"><h3 class="mini" style="margin:0">Destino na baliza</h3><span class="muted small">${rows.filter(r=>r.gx!=null).length} com local</span></div>${goalMarkup('rgoal')}
   <div class="table-wrap" style="margin-top:12px"><table class="mx"><thead><tr><th class="zl">Zona da baliza</th><th>Remates</th><th>Golos</th><th>% golo</th></tr></thead><tbody>
   ${GOAL_ZONES.filter(z=>byGoal.has(z)).map(z=>{const rs=byGoal.get(z),gg=rs.filter(isGoal).length;return `<tr><td class="zl">${esc(z)}</td><td>${rs.length}</td><td>${gg}</td><td><b>${pct(gg,rs.length)}%</b></td></tr>`}).join('')||'<tr><td class="empty" colspan="4">Sem remates com local na baliza.</td></tr>'}
   </tbody></table></div></section>
 </div>
 <section class="panel">
  <div class="rec-head"><h2 class="sub">Zona do campo × resultado</h2><button type="button" class="btn btn-outline btn-sm" id="rem-exp">${icon('download')}Exportar CSV</button></div>
  <div class="table-wrap" style="margin-top:12px"><table class="mx"><thead><tr><th class="zl">Zona</th>${res.map(o=>`<th>${esc(o.label||o.id)}</th>`).join('')}<th>Total</th><th>% golo</th><th>% à baliza</th></tr></thead><tbody>
  ${FIELD_ZONES.map(z=>{const rs=byZone.get(z)||[];if(!rs.length)return '';const gg=rs.filter(isGoal).length;return `<tr><td class="zl">${esc(z)}</td>${res.map(o=>`<td>${heatCell(rs.filter(r=>r.action===o.id).length,maxCell,o.goal?'rgba(30,158,74,A)':'rgba(217,50,50,A)')}</td>`).join('')}<td><b>${rs.length}</b></td><td><b>${pct(gg,rs.length)}%</b></td><td>${fmtPct(rs.filter(isOn).length,rs.length)}</td></tr>`}).join('')||`<tr><td class="empty" colspan="${res.length+4}">Sem remates com estes filtros.</td></tr>`}
  </tbody></table></div>
 </section>
 <div class="an-grid">
  <section class="panel"><h3 class="mini">Eficácia por distância</h3>${barsHTML(DIST_BANDS.map(([b])=>{const rs=rows.filter(r=>distBand(r)===b);return {label:b,v:pct(rs.filter(isGoal).length,rs.length),x:{g:rs.filter(isGoal).length,n:rs.length}}}).filter(i=>i.x.n),{max:100,fmt:i=>`${i.v}% <small>${i.x.g}/${i.x.n}</small>`})}</section>
  <section class="panel"><h3 class="mini">Eficácia por situação</h3>${barsHTML(STD.map(s=>{const rs=rows.filter(r=>r.sit===s);return {label:s,v:pct(rs.filter(isGoal).length,rs.length),x:{g:rs.filter(isGoal).length,n:rs.length}}}).filter(i=>i.x.n),{max:100,fmt:i=>`${i.v}% <small>${i.x.g}/${i.x.n}</small>`})}</section>
 </div>`;
 $('#rpitch').style.cursor='default';$('#rgoal').style.cursor='default';
 $('#rpitch-saved').innerHTML=markerGroup(rows,'f','#ffffff',2.4);
 $('#rgoal-saved').innerHTML=markerGroup(rows,'g','#203631',2.4);
 $('#rem-team').onclick=e=>{const b=e.target.closest('[data-team]');if(!b||b.dataset.team===rem.team)return;Object.assign(rem,{team:b.dataset.team,player:'',res:[]});renderRemates()};
 $('#rem-p').onchange=e=>{rem.period=e.target.value;renderRemates()};
 $('#rem-j').onchange=e=>{rem.player=e.target.value;renderRemates()};
 $('#rem-s').onchange=e=>{rem.sit=e.target.value;renderRemates()};
 $('#rem-res').onclick=e=>{const b=e.target.closest('[data-res]');if(!b)return;const id=b.dataset.res;rem.res=rem.res.includes(id)?rem.res.filter(x=>x!==id):[...rem.res,id];renderRemates()};
 $('#rem-reset').onclick=()=>{Object.assign(rem,{period:'',player:'',sit:'',res:[]});renderRemates()};
 $('#rem-exp').onclick=()=>{if(!rows.length){toast('Sem remates para exportar.','warn');return}
  download(`remates_${scp?'scp':'adversario'}_${fileStamp()}.csv`,toCSV([['Período',scp?'Nº Jogador':'Nº GR',scp?'Jogador':'Guarda-redes','Resultado','Situação','Zona Campo','Distância (m)','Zona Baliza'],...rows.map(r=>[r.period,r.player,pname(r.player),r.action,r.sit,r.fzone,r.fy!=null?numPT(r.fy*12.5):'',r.gzone])]))};
}
