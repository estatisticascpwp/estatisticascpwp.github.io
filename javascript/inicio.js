'use strict';
/* =========================================================
   INÍCIO — jogo atual, lista de programas, bolas de saída, jogos guardados
   ========================================================= */
const PROGRAMS=[
 {id:'individual',icon:'player',name:'Estatística Individual',desc:'Remates e ações por jogador, com posição no campo e destino na baliza.',count:g=>g.individual.length,unit:'ações'},
 {id:'coletiva',icon:'team',name:'Estatística Coletiva',desc:'Jogadas ofensivas e defensivas, superioridades e contra-ataques, das duas equipas.',count:g=>g.collective.length,unit:'ataques'},
 {id:'tempo',icon:'clock',name:'Tempo de Jogo',desc:'Entradas e saídas em tempo real, turnos e tempo total por jogador (máx. 7 na água).',count:g=>g.timer.events.length,unit:'movimentos'},
 {id:'exclusoes',icon:'card',name:'Exclusões',desc:'Exclusões, cartão vermelho e golos das duas equipas. Os nomes do SCP alimentam os outros programas.',count:g=>Object.values(g.excl.scp).concat(Object.values(g.excl.opp)).reduce((a,x)=>a+(x.ex||0),0),unit:'exclusões'},
 {id:'remates',icon:'target',name:'Remates',desc:'Mapa de todos os remates do SCP e do adversário, com eficácia por zona do campo e da baliza.',count:g=>g.individual.filter(r=>SHOT_ACTS.includes(r.action)&&r.mode==='field').length,unit:'remates'},
 {id:'jogadores',icon:'roster',name:'Jogadores',desc:'Plantel (nomes, GR, posição, mão) e ficha de cada jogador, com histórico entre jogos.',count:g=>g.roster.filter(p=>p.name).length,unit:'no plantel'},
 {id:'guardaredes',icon:'goal',name:'Guarda-Redes',desc:'% de defesas por zona da baliza, distância, situação e período, e comparação entre GR.',count:g=>g.individual.filter(r=>r.mode==='gk').length,unit:'ações'},
 {id:'analise',icon:'chart',name:'Sugestão de Interpretação',desc:'Leituras automáticas, mapas de eficácia por zona e por jogada, e resumo por jogador.',count:()=>null,unit:''}
];
function renderHome(){
 const g=G(),sc=scoreOf(g),v=$('#view-inicio');
 const games=Object.values(DB.games).sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.updated-a.updated);
 const won=g.sprints.filter(s=>s.winner==='SCP').length, played=g.sprints.filter(s=>s.winner).length;
 v.innerHTML=`
 <section class="panel home-hero">
  <div><p class="eyebrow">Sporting CP · Polo Aquático</p><h1 class="title">SCP Stat</h1>
   <p class="lead">Recolha de estatística ao vivo e análise pós-jogo. Funciona sem internet e guarda tudo automaticamente neste dispositivo.</p></div>
  <div class="scoreboard" aria-label="Resultado">
   <div class="sb-team"><span>${esc(g.scpName||'Sporting CP')}</span><b>${sc.scp}</b></div>
   <div class="sb-mid">${g.period} período<small id="sb-clock">${fmtClock(clockNow())}</small></div>
   <div class="sb-team"><span>${esc(g.opponent||'Adversário')}</span><b>${sc.opp}</b></div>
  </div>
 </section>

 <div class="home-grid">
  <section class="panel">
   <div class="rec-head"><h2 class="sub">Jogo atual</h2>
    <div class="btn-row"><button class="btn btn-primary" id="h-new" type="button">${icon('plus')}Novo jogo</button></div></div>
   <div class="game-form">
    <div class="field"><label for="h-opp">Adversário</label><input id="h-opp" value="${esc(g.opponent)}"></div>
    <div class="field"><label for="h-date">Data</label><input id="h-date" type="date" value="${esc(g.date)}"></div>
    <div class="field"><label for="h-comp">Competição</label><input id="h-comp" value="${esc(g.competition)}" placeholder="Ex.: Campeonato Nacional"></div>
    <div class="field"><label for="h-venue">Local</label><input id="h-venue" value="${esc(g.venue)}" placeholder="Piscina"></div>
    <div class="field"><label for="h-plen">Duração do período</label><select id="h-plen">${[5,6,7,8].map(m=>`<option value="${m*60}" ${g.periodLength===m*60?'selected':''}>${m} minutos</option>`).join('')}</select></div>
   </div>
   <h3 class="mini">Programas</h3>
   <ul class="prog-list">${PROGRAMS.map(p=>{const c=p.count(g);return `<li><a class="prog" href="${href(p.id)}"><span class="pi">${icon(p.icon)}</span><span><b>${p.name}</b><p>${p.desc}</p></span><span class="pc">${c==null?'':c+'<small>'+p.unit+'</small>'}</span><span class="btn btn-sm btn-outline">Abrir${icon('open')}</span></a></li>`}).join('')}</ul>
  </section>

  <div>
   <section class="panel">
    <div class="rec-head"><h2 class="sub">Bolas de saída</h2><span class="muted small">SCP ganhou <b>${won}</b> de ${played||0}</span></div>
    <p class="muted small" style="margin:6px 0 10px">Uma por período. Toca em quem ganhou o sprint e, se foi o SCP, escolhe o jogador.</p>
    <div id="h-sprints">${g.sprints.map((s,i)=>`<div class="sprint-row"><span class="pn">${s.period}</span>
      <div class="chips"><button type="button" class="chip ${s.winner==='SCP'?'on':''}" data-sp="${i}" data-w="SCP">SCP</button><button type="button" class="chip opp ${s.winner==='ADV'?'on':''}" data-sp="${i}" data-w="ADV">Adversário</button></div>
      <select class="inp-sm" data-spp="${i}" ${s.winner==='SCP'?'':'disabled'} aria-label="Jogador que ganhou a bola de saída no ${s.period} período"><option value="">Jogador…</option>${namedRoster().map(p=>`<option value="${p.n}" ${String(s.player)===String(p.n)?'selected':''}>${esc(plabel(p.n))}</option>`).join('')}</select></div>`).join('')}</div>
   </section>
   ${pwaStatus()==='installed'||pwaStatus()==='single'?'':`<section class="panel install-slot">${installCardHTML()}</section>`}
   <section class="panel">
    <h2 class="sub">Dados e cópias de segurança</h2>
    <p class="muted small" style="margin:6px 0 10px">Os registos ficam guardados automaticamente neste browser${storageOK?'':' <b style="color:var(--red)">(neste momento o browser está a bloquear o armazenamento — exporta antes de fechar)</b>'}. No fim de cada jogo, exporta o jogo completo para guardar uma cópia ou passá-lo para outro dispositivo.</p>
    <div class="btn-row"><button class="btn btn-outline" id="h-exp" type="button">${icon('download')}Exportar jogo (.json)</button><button class="btn btn-ghost" id="h-imp" type="button">${icon('upload')}Importar jogo</button></div>
    <ul class="store-list"><li>Cada programa tem também Exportar/Importar em CSV, compatível com Excel.</li><li>Usa sempre o mesmo browser no mesmo dispositivo; limpar os dados do browser apaga os registos.</li></ul>
   </section>
  </div>
 </div>

 <section class="panel">
  <h2 class="sub">Jogos guardados</h2>
  <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th class="l">Data</th><th class="l">Adversário</th><th class="l">Competição</th><th>Resultado</th><th>Registos</th><th>Ações</th></tr></thead><tbody>
  ${games.map(x=>{const s=scoreOf(x);const n=x.individual.length+x.collective.length+x.timer.events.length;return `<tr><td class="l">${esc(fmtDate(x.date))}</td><td class="l">${esc(x.opponent)} ${x.id===DB.currentId?'<span class="cur-pill">aberto</span>':''}${x.demo?' <span class="cur-pill" style="background:var(--warnbg);color:var(--warn)">exemplo</span>':''}</td><td class="l">${esc(x.competition||'—')}</td><td>${s.scp} – ${s.opp}</td><td>${n}</td><td>${x.id===DB.currentId?'':`<button class="btn btn-sm btn-outline" data-open="${x.id}" type="button">Abrir</button> `}<button class="rowbtn del" data-delg="${x.id}" title="Apagar jogo" type="button">${icon('trash')}</button></td></tr>`}).join('')}
  </tbody></table></div>
 </section>`;

 const bind=(id,key,fn)=>{$('#'+id).addEventListener('change',e=>{g[key]=fn?fn(e.target.value):e.target.value;save()})};
 bind('h-opp','opponent');bind('h-date','date');bind('h-comp','competition');bind('h-venue','venue');
 $('#h-plen').addEventListener('change',e=>{g.periodLength=+e.target.value;if(!g.timer.running&&(g.timer.remaining>g.periodLength||g.timer.events.length===0))g.timer.remaining=g.periodLength;save();toast('Duração do período: '+fmtClock(g.periodLength))});
 $('#h-new').onclick=newGameFlow;
 $('#h-exp').onclick=exportGameJSON;
 $('#h-imp').onclick=importGameJSON;
 $('#h-sprints').onclick=e=>{const b=e.target.closest('[data-sp]');if(!b)return;const s=g.sprints[+b.dataset.sp];s.winner=s.winner===b.dataset.w?'':b.dataset.w;if(s.winner!=='SCP')s.player='';save();renderHome()};
 $('#h-sprints').onchange=e=>{const s=e.target.closest('[data-spp]');if(!s)return;g.sprints[+s.dataset.spp].player=s.value;save()};
 v.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{DB.currentId=b.dataset.open;save(true);resetLocalState();renderHome();toast('Jogo aberto')});
 v.querySelectorAll('[data-delg]').forEach(b=>b.onclick=async()=>{const x=DB.games[b.dataset.delg];
  if(!await confirmBox('Apagar jogo',`Apagar o jogo de ${esc(fmtDate(x.date))} contra <b>${esc(x.opponent)}</b> e todos os seus registos? Não é possível desfazer.`,'Apagar jogo'))return;
  delete DB.games[x.id];
  if(!Object.keys(DB.games).length){const n=newGame();DB.games[n.id]=n;DB.currentId=n.id}
  else if(DB.currentId===x.id)DB.currentId=Object.keys(DB.games)[0];
  save(true);resetLocalState();renderHome();toast('Jogo apagado')});
}
