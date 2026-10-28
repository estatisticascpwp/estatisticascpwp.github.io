'use strict';
/* =========================================================
   EXCLUSÕES — 13 jogadores por equipa, 3 exclusões, vermelho, golos
   Os nomes do SCP aqui são o plantel usado em todos os programas.
   ========================================================= */
function renderExclusoes(){
 const v=$('#view-exclusoes');
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Exclusões</h1><p>E1–E3: toca para marcar cada exclusão (tocar de novo numa marcada desfaz). Golos: toque soma 1; <b>Shift + clique</b> ou toque longo subtrai 1. Os nomes do SCP escritos aqui aparecem na Estatística Individual e no Tempo de Jogo.</p></div>
   <div class="btn-row"><button type="button" class="btn btn-outline" id="ex-exp">${icon('download')}Exportar CSV</button><button type="button" class="btn btn-ghost" id="ex-imp">${icon('upload')}Importar CSV</button><button type="button" class="btn btn-danger" id="ex-reset">${icon('reset')}Repor contadores</button></div></div>
  <div class="ex-grid"><div id="ex-scp"></div><div id="ex-opp"></div></div>
 </section>
 <section class="panel">
  <div class="rec-head"><h2 class="sub">Registo detalhado</h2><button type="button" class="btn btn-outline btn-sm" id="ex-explog">${icon('download')}Exportar registo</button></div>
  <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Período</th><th>Relógio</th><th class="l">Equipa</th><th class="l">Jogador</th><th>Evento</th></tr></thead><tbody id="ex-log"></tbody></table></div>
 </section>`;
 renderTeam('scp');renderTeam('opp');renderExLog();
 const grid=v.querySelector('.ex-grid');
 let lp=null,lpFired=false;
 grid.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-goal]');if(!b||e.pointerType==='mouse')return;lpFired=false;lp=setTimeout(()=>{lpFired=true;goalStep(b.dataset.goal,-1)},550)});
 const cancelLp=()=>{clearTimeout(lp);lp=null};
 grid.addEventListener('pointerup',cancelLp);grid.addEventListener('pointerleave',cancelLp);grid.addEventListener('pointercancel',cancelLp);
 grid.addEventListener('contextmenu',e=>{const b=e.target.closest('[data-goal]');if(!b)return;e.preventDefault();if(!lpFired)goalStep(b.dataset.goal,-1)});
 grid.addEventListener('click',e=>{
  const ex=e.target.closest('[data-ex]'),rd=e.target.closest('[data-red]'),gl=e.target.closest('[data-goal]'),gk=e.target.closest('[data-gk]');
  if(ex){const [t,n,k]=ex.dataset.ex.split('|'),o=exOf(t,+n),kk=+k;const before=o.ex;o.ex=o.ex>=kk?kk-1:kk;exLog(t,+n,o.ex>before?`Exclusão ${o.ex}`:`Exclusão anulada (fica ${o.ex})`);save();renderTeam(t);renderExLog();if(o.ex===3)toast(`${exName(t,+n)} excluído definitivamente (3 exclusões)`,'warn')}
  if(rd){const [t,n]=rd.dataset.red.split('|'),o=exOf(t,+n);o.red=!o.red;exLog(t,+n,o.red?'Cartão vermelho':'Cartão vermelho anulado');save();renderTeam(t);renderExLog()}
  if(gl){if(lpFired){lpFired=false;return}goalStep(gl.dataset.goal,e.shiftKey?-1:1)}
  if(gk){const p=player(+gk.dataset.gk);p.gr=!p.gr;save();renderTeam('scp')}
 });
 grid.addEventListener('input',e=>{const i=e.target;
  if(i.dataset.nm){const [t,n]=i.dataset.nm.split('|');if(t==='scp')player(+n).name=i.value.trim();else G().oppRoster[+n-1].name=i.value.trim();save(true)}
  if(i.dataset.team){if(i.dataset.team==='scp')G().scpName=i.value;else G().opponent=i.value;save(true);updateHeader()}});
 grid.addEventListener('change',()=>save());
 $('#ex-exp').onclick=exportExcl;$('#ex-imp').onclick=importExcl;$('#ex-explog').onclick=exportExLog;
 $('#ex-reset').onclick=async()=>{if(!await confirmBox('Repor contadores','Pôr a zero as exclusões, cartões vermelhos e golos das duas equipas? Os nomes mantêm-se.','Repor'))return;const g=G();g.excl={scp:{},opp:{}};g.exclLog=[];save();renderExclusoes();toast('Contadores a zero')};
}
function goalStep(key,d){const [t,n]=key.split('|'),o=exOf(t,+n);if(d<0&&o.goals===0)return;o.goals=Math.max(0,o.goals+d);exLog(t,+n,d>0?'Golo':'Golo anulado');save();renderTeam(t);renderExLog()}
function renderTeam(t){
 const g=G(),rows=t==='scp'?g.roster.slice(0,13):g.oppRoster;
 const tot=rows.reduce((a,p)=>{const o=exOf(t,p.n);a.ex+=o.ex;a.goals+=o.goals;a.out+=(o.ex>=3||o.red)?1:0;return a},{ex:0,goals:0,out:0});
 $('#ex-'+t).innerHTML=`<div class="team-card"><div class="team-head ${t}"><input data-team="${t}" value="${esc(t==='scp'?g.scpName:g.opponent)}" aria-label="Nome da equipa"><div class="team-tot"><span><b>${tot.goals}</b>golos</span><span><b>${tot.ex}</b>exclusões</span><span><b>${tot.out}</b>fora</span></div></div>
 <div class="table-wrap" style="border:0;border-radius:0"><table class="ex-table"><thead><tr><th>Nº</th><th class="l">Nome</th>${t==='scp'?'<th>GR</th>':''}<th>Exclusões</th><th title="Cartão vermelho">CV</th><th>Golos</th></tr></thead><tbody>
 ${rows.map(p=>{const o=exOf(t,p.n),out=o.ex>=3||o.red,gk=t==='scp'?p.gr:(p.n===1||p.n===13);return `<tr class="${out?'out':''}"><td><span class="capnum ${gk?'gk':''}">${p.n}</span></td>
  <td class="l"><input class="inp-sm nm" data-nm="${t}|${p.n}" value="${esc(p.name)}" placeholder="Nome" aria-label="Nome do jogador ${p.n}">${out?`<div><span class="out-tag">${o.red?'CARTÃO VERMELHO':'EXCLUÍDO'}</span></div>`:''}</td>
  ${t==='scp'?`<td><button type="button" class="gk-t ${p.gr?'on':''}" data-gk="${p.n}" title="Marcar como guarda-redes">GR</button></td>`:''}
  <td style="white-space:nowrap">${[1,2,3].map(k=>`<button type="button" class="exb ${o.ex>=k?'on':''}" data-ex="${t}|${p.n}|${k}" aria-label="Exclusão ${k} do jogador ${p.n}">E${k}</button>`).join('')}</td>
  <td><button type="button" class="redb ${o.red?'on':''}" data-red="${t}|${p.n}" aria-label="Cartão vermelho do jogador ${p.n}"></button></td>
  <td><button type="button" class="goalb ${o.goals?'has':''}" data-goal="${t}|${p.n}" aria-label="Golos do jogador ${p.n}: ${o.goals}">${o.goals}</button></td></tr>`}).join('')}
 </tbody></table></div></div>`;
 updateHeader();
}
function renderExLog(){
 const g=G(),l=g.exclLog.slice().reverse();
 $('#ex-log').innerHTML=l.length?l.slice(0,120).map(e=>`<tr><td>${esc(e.period)}</td><td>${fmtClock(e.clock)}</td><td class="l">${esc(teamName(e.team))}</td><td class="l">${e.n} · ${esc(exName(e.team,e.n))}</td><td><span class="badge ${/^Golo$/.test(e.type)?'t-good':/vermelho$/.test(e.type)?'t-bad':/^Exclusão \d/.test(e.type)?'t-warn':'t-neutral'}">${esc(e.type)}</span></td></tr>`).join(''):'<tr><td class="empty" colspan="5">Os golos, exclusões e cartões aparecem aqui com o período e o tempo do relógio.</td></tr>';
}
function exportExcl(){
 const g=G(),rows=[['Equipa','Nº','Nome','GR','Exclusões','Cartão vermelho','Golos']];
 ['scp','opp'].forEach(t=>(t==='scp'?g.roster.slice(0,13):g.oppRoster).forEach(p=>{const o=exOf(t,p.n);rows.push([t==='scp'?'SCP':'Adversário',p.n,p.name,t==='scp'&&p.gr?'Sim':'',o.ex,o.red?'Sim':'',o.goals])}));
 rows.push([]);rows.push(['Nome equipa SCP',g.scpName]);rows.push(['Nome equipa adversária',g.opponent]);
 download('exclusoes_'+fileStamp()+'.csv',toCSV(rows));
}
function exportExLog(){
 const g=G();if(!g.exclLog.length){toast('Ainda não há eventos registados.','warn');return}
 download('exclusoes_registo_'+fileStamp()+'.csv',toCSV([['Período','Relógio','Equipa','Nº','Jogador','Evento','Hora'],...g.exclLog.map(e=>[e.period,fmtClock(e.clock),teamName(e.team),e.n,exName(e.team,e.n),e.type,new Date(e.ts).toLocaleString('pt-PT')])]));
}
async function importExcl(){
 const f=await pickFile('.csv,text/csv');if(!f)return;
 const rows=parseCSV(f.text);const objs=csvObjects(f.text).filter(o=>(o['Equipa']==='SCP'||o['Equipa']==='Adversário')&&o['Nº']);
 if(!objs.length){toast('Não encontrei jogadores. Usa um CSV exportado pelas Exclusões.','bad');return}
 if(!await confirmBox('Importar exclusões',`Substituir nomes, exclusões e golos pelos <b>${objs.length}</b> jogadores do ficheiro?`,'Importar',false))return;
 const g=G();g.excl={scp:{},opp:{}};
 objs.forEach(o=>{const t=o['Equipa']==='SCP'?'scp':'opp',n=+o['Nº'];if(!(n>=1&&n<=13))return;
  if(t==='scp'){const p=player(n);p.name=o['Nome']||'';p.gr=o['GR']==='Sim'}else g.oppRoster[n-1].name=o['Nome']||'';
  g.excl[t][n]={ex:clamp(+o['Exclusões']||0,0,3),red:o['Cartão vermelho']==='Sim',goals:Math.max(0,+o['Golos']||0)}});
 rows.forEach(r=>{if(r[0]==='Nome equipa SCP'&&r[1])g.scpName=r[1];if(r[0]==='Nome equipa adversária'&&r[1])g.opponent=r[1]});
 save();renderExclusoes();toast('Exclusões importadas');
}
