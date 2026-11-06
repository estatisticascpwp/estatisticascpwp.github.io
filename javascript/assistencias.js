'use strict';
/* =========================================================
   ASSISTÊNCIAS — quem assiste, para quem, em que situação e período
   (vem do passo "Assistência" da Estatística Individual em Golo e EXC ganha)
   ========================================================= */
const ast={period:'',scope:'game'};
function renderAssistencias(){
 const g=G(),v=$('#view-assistencias');
 const games=ast.scope==='esc'?Object.values(DB.games).filter(x=>x.escalao===g.escalao&&(!x.demo||x.id===g.id)):[g];
 const A=assistStats(games,{period:ast.period}),pl=A.players.filter(p=>p.ag||p.ae||p.goals);
 const tot=pl.slice().sort((a,b)=>(b.ag+b.ae)-(a.ag+a.ae)||b.ag-a.ag||(b.goals+b.ag)-(a.goals+a.ag)||a.n-b.n);
 const lab=p=>A.many?esc(p.name):`${p.n} · ${esc(p.name)}`;
 const best=tot[0]&&(tot[0].ag+tot[0].ae)?tot[0]:null;
 const pairs=A.pairs.slice().sort((a,b)=>b.v-a.v);
 // matriz: quem assiste (linhas) -> quem marca (colunas)
 const givers=tot.filter(p=>p.ag),scorers=pl.filter(p=>A.pairs.some(x=>x.to===p)).sort((a,b)=>b.goals-a.goals||a.n-b.n);
 const pmax=Math.max(1,...pairs.map(x=>x.v));
 const matrix=givers.length&&scorers.length?`<div class="table-wrap"><table class="ast-matrix"><thead><tr><th class="l">Assiste ↓ · marca →</th>${scorers.map(s=>`<th title="${esc(s.name)}">${A.many?esc(s.name.split(' ')[0]):s.n}</th>`).join('')}<th>Total</th></tr></thead><tbody>
  ${givers.map(a=>`<tr><td class="l">${lab(a)}</td>${scorers.map(s=>{const x=A.pairs.find(q=>q.from===a&&q.to===s);return `<td>${heatCell(x?x.v:0,pmax,'rgba(30,158,74,A)')}</td>`}).join('')}<td><b>${a.ag}</b></td></tr>`).join('')}</tbody></table></div>`
  :'<div class="nodata">Ainda não há golos com assistência registada.</div>';
 const sits=[...A.bySit].sort((a,b)=>{const o=x=>{const i=STD.indexOf(x);return i<0?99:i};return o(a[0])-o(b[0])});
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Assistências</h1><p>Quem assiste, para quem e em que situações. Os dados vêm do passo <b>Assistência</b> da Estatística Individual, nos golos e nas exclusões ganhas.</p></div></div>
  <div class="fbar">
   <div class="chips" id="ast-per">${['',...PERIODS].map(p=>`<button type="button" class="chip ${ast.period===p?'on':''}" data-per="${p}">${p?p+' período':'Jogo todo'}</button>`).join('')}</div>
   <div class="seg" id="ast-scope"><button type="button" data-scope="game" class="${ast.scope==='game'?'on':''}">Este jogo</button><button type="button" data-scope="esc" class="${ast.scope==='esc'?'on':''}">Todos os jogos de ${esc(g.escalao)}</button></div>
  </div>
  <div class="kpis" style="margin-top:14px">
   ${kpiBox('Golos',A.goals,'registados na Estatística Individual')}
   ${kpiBox('Golos assistidos',A.assisted,A.goals?fmtPct(A.assisted,A.goals)+' dos golos':'')}
   ${kpiBox('Golos sem assistência',A.solo,'jogada individual')}
   ${kpiBox('Exclusões assistidas',A.excA,A.excW?`de ${A.excW} exclusões ganhas`:'')}
   ${kpiBox('Melhor assistente',best?(best.ag+best.ae):'—',best?esc(best.name):'')}
  </div>
  ${A.unknown?`<p class="muted small" style="margin:10px 0 0">${A.unknown} golo(s) sem a assistência preenchida. Para não falhar nenhuma, liga "Assistência obrigatória" em Definições.</p>`:''}
 </section>
 <div class="an-grid">
  <section class="panel"><h3 class="mini">Por jogador</h3>
   <div class="table-wrap"><table><thead><tr><th class="l">Jogador</th><th title="Assistências para golo">Assist. golo</th><th title="Assistências para exclusão">Assist. exclusão</th><th>Total</th><th>Golos</th><th title="Golos + assistências para golo">Participação</th><th title="Participação em % dos golos da equipa">% golos equipa</th></tr></thead><tbody>
   ${tot.length?tot.map(p=>`<tr><td class="l">${lab(p)}</td><td><b>${p.ag}</b></td><td>${p.ae}</td><td>${p.ag+p.ae}</td><td>${p.goals}</td><td>${p.goals+p.ag}</td><td>${fmtPct(p.goals+p.ag,A.goals)}</td></tr>`).join(''):`<tr><td class="empty" colspan="7">Ainda não há golos nem exclusões ganhas registadas${ast.period?' neste período':''}.</td></tr>`}
   </tbody></table></div></section>
  <section class="panel"><h3 class="mini">Ligações mais frequentes</h3>
   ${barsHTML(pairs.slice(0,10).map(x=>({label:`${A.many?x.from.name:x.from.n} → ${A.many?x.to.name:x.to.n+' · '+x.to.name}`,v:x.v})),{fmt:i=>i.v+' golo(s)'})}
  </section>
 </div>
 <section class="panel"><h3 class="mini">Quem assiste quem</h3><p class="muted small" style="margin:0 0 10px">Linhas: quem fez a assistência. Colunas: quem marcou.</p>${matrix}</section>
 <div class="an-grid">
  <section class="panel"><h3 class="mini">Golos assistidos por situação</h3>
   ${barsHTML(sits.map(([k,x])=>({label:k,v:x.ast,g:x.goals})),{max:Math.max(1,...sits.map(([,x])=>x.goals)),fmt:i=>`${i.v}/${i.g} (${fmtPct(i.v,i.g)})`})}</section>
  <section class="panel"><h3 class="mini">Por período</h3>
   <div class="table-wrap"><table><thead><tr><th>Período</th><th>Golos</th><th>Assistidos</th><th>%</th><th>Assist. exclusão</th></tr></thead><tbody>
   ${PERIODS.map(p=>{const x=A.byPer.get(p);return `<tr><td>${p}</td><td>${x.goals}</td><td>${x.ast}</td><td>${fmtPct(x.ast,x.goals)}</td><td>${x.exc}</td></tr>`}).join('')}
   </tbody></table></div></section>
 </div>`;
 $('#ast-per').onclick=e=>{const b=e.target.closest('[data-per]');if(!b)return;ast.period=b.dataset.per;renderAssistencias()};
 $('#ast-scope').onclick=e=>{const b=e.target.closest('[data-scope]');if(!b)return;ast.scope=b.dataset.scope;renderAssistencias()};
}
