'use strict';
/* =========================================================
   JOGADORES — plantel do SCP e ficha individual com histórico entre jogos
   ========================================================= */
const jog={sel:null};
const HANDS=['','Direita','Esquerda'];
function playerLine(game,n){
 const F=game.individual.filter(r=>r.mode==='field'&&r.player===n),K=game.individual.filter(r=>r.mode==='gk'&&r.player===n);
 const sh=F.filter(r=>SHOT_ACTS.includes(r.action)),gl=sh.filter(r=>r.action==='Golo').length,c=a=>F.filter(r=>r.action===a).length;
 const sv=K.filter(r=>r.action==='Defesa GR'||r.action==='Defesa p/ Fora GR').length,gs=K.filter(r=>r.action==='Golo Sofrido').length;
 return {shots:sh.length,goals:gl,ast:game.individual.filter(r=>r.mode==='field'&&r.assist===n).length,excW:c('EXC ganha'),excL:c('EXC sofrida'),lost:c('Perda Bola')+c('Passe Falhado')+c('Falta Atacante'),steal:c('Roubo Bola'),blk:c('Bloco Defensivo'),sv,gs,gkOn:sv+gs,F,K};
}
function findInGame(game,p){
 if(p.name){const m=game.roster.find(x=>norm(x.name)===norm(p.name));return m?m.n:null}
 return game.roster.find(x=>x.n===p.n)?p.n:null;
}
function renderJogadores(){
 const g=G(),v=$('#view-jogadores');
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Jogadores</h1><p>O plantel do SCP para este jogo. É o mesmo usado na Estatística Individual, Tempo de Jogo e Exclusões: altera aqui ou lá, fica igual em todo o lado.</p></div>
   <div class="btn-row"><button type="button" class="btn btn-ghost" id="jg-copy">${icon('roster')}Copiar de outro jogo</button><button type="button" class="btn btn-outline" id="jg-exp">${icon('download')}Exportar plantel</button><button type="button" class="btn btn-ghost" id="jg-imp">${icon('upload')}Importar plantel</button></div></div>
  <div class="table-wrap"><table class="roster-tbl"><thead><tr><th>Nº</th><th class="l">Nome</th><th>GR</th><th class="l">Posição</th><th class="l">Mão</th><th>Remates</th><th>Golos</th><th>Tempo</th><th>Ficha</th></tr></thead><tbody id="jg-roster"></tbody></table></div>
  <p class="count">Os guarda-redes usam touca vermelha (nº 1 e 13 por defeito). Os nº 14 e 15 aparecem nos outros programas só depois de terem nome.</p>
 </section>
 <section class="panel" id="jg-ficha"></section>`;
 renderRosterRows();renderFicha();
 const tb=$('#jg-roster');
 tb.addEventListener('input',e=>{const i=e.target.closest('[data-rn]');if(!i)return;player(+i.dataset.rn).name=i.value.trim();save(true)});
 tb.addEventListener('change',e=>{const el=e.target;const p=el.dataset.rp?player(+el.dataset.rp):el.dataset.rh?player(+el.dataset.rh):null;
  if(el.dataset.rn){save();renderFicha();return}
  if(el.dataset.rp){p.pos=el.value;if(el.value==='Guarda-redes')p.gr=true;save();renderRosterRows();renderFicha()}
  if(el.dataset.rh){p.hand=el.value;save();renderFicha()}});
 tb.addEventListener('click',e=>{const gk=e.target.closest('[data-rgk]'),f=e.target.closest('[data-ficha]');
  if(gk){const p=player(+gk.dataset.rgk);p.gr=!p.gr;if(!p.gr&&p.pos==='Guarda-redes')p.pos='';if(p.gr&&!p.pos)p.pos='Guarda-redes';save();renderRosterRows();renderFicha()}
  if(f){jog.sel=+f.dataset.ficha;renderFicha();$('#jg-ficha').scrollIntoView({behavior:'smooth'})}});
 $('#jg-exp').onclick=()=>download('plantel_'+fileStamp()+'.csv',toCSV([['Nº','Nome','GR','Posição','Mão'],...g.roster.map(p=>[p.n,p.name,p.gr?'Sim':'',p.pos||'',p.hand||''])]));
 $('#jg-imp').onclick=async()=>{const f=await pickFile('.csv,text/csv');if(!f)return;const objs=csvObjects(f.text).filter(o=>+o['Nº']>=1&&+o['Nº']<=15);
  if(!objs.length){toast('Não encontrei jogadores. Usa um CSV com as colunas Nº e Nome.','bad');return}
  if(!await confirmBox('Importar plantel',`Substituir o plantel deste jogo pelos <b>${objs.length}</b> jogadores do ficheiro?`,'Importar',false))return;
  const r=defaultRoster();objs.forEach(o=>{const p=r[+o['Nº']-1];p.name=o['Nome']||'';p.gr=o['GR']?/^s/i.test(o['GR']):p.gr;p.pos=POSITIONS.includes(o['Posição'])?o['Posição']:(p.gr?'Guarda-redes':'');p.hand=HANDS.includes(o['Mão'])?o['Mão']:''});
  g.roster=r;save();renderJogadores();toast('Plantel importado')};
 $('#jg-copy').onclick=async()=>{const others=Object.values(DB.games).filter(x=>x.id!==g.id&&x.roster.some(p=>p.name));
  if(!others.length){toast('Não há outros jogos com plantel preenchido.','warn');return}
  const id=await modal({title:'Copiar plantel',body:`<p>Escolhe o jogo de onde copiar nomes, GR, posição e mão. Os registos deste jogo não mudam.</p><select id="m-game" class="inp">${others.sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(x=>`<option value="${x.id}">${esc(fmtDate(x.date))} · vs ${esc(x.opponent)}</option>`).join('')}</select>`,
   actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Copiar plantel',cls:'btn-primary',get:r=>r.querySelector('#m-game').value}]});
  if(!id)return;g.roster=DB.games[id].roster.map(p=>({...p}));save();renderJogadores();toast('Plantel copiado')};
}
function renderRosterRows(){
 const g=G(),s=computeShifts();
 $('#jg-roster').innerHTML=g.roster.map(p=>{const l=playerLine(g,p.n);return `<tr><td><span class="capnum ${p.gr?'gk':''}">${p.n}</span></td>
  <td class="l"><input class="inp-sm" data-rn="${p.n}" value="${esc(p.name)}" placeholder="Nome" aria-label="Nome do jogador ${p.n}"></td>
  <td><button type="button" class="gk-t ${p.gr?'on':''}" data-rgk="${p.n}" title="Guarda-redes">GR</button></td>
  <td class="l"><select class="inp-sm" data-rp="${p.n}" aria-label="Posição do jogador ${p.n}"><option value="">—</option>${POSITIONS.map(x=>`<option ${p.pos===x?'selected':''}>${x}</option>`).join('')}</select></td>
  <td class="l"><select class="inp-sm" data-rh="${p.n}" aria-label="Mão do jogador ${p.n}">${HANDS.map(x=>`<option value="${x}" ${p.hand===x?'selected':''}>${x||'—'}</option>`).join('')}</select></td>
  <td>${p.gr?'—':l.shots}</td><td>${p.gr?'—':l.goals}</td><td>${s[p.n].total?fmtClock(s[p.n].total):'—'}</td>
  <td><button type="button" class="btn btn-sm ${jog.sel===p.n?'btn-green':'btn-outline'}" data-ficha="${p.n}">Ver</button></td></tr>`}).join('');
}
function renderFicha(){
 const g=G(),box=$('#jg-ficha');
 if(jog.sel==null){const best=g.roster.filter(p=>!p.gr).map(p=>({p,l:playerLine(g,p.n)})).sort((a,b)=>b.l.goals-a.l.goals||b.l.shots-a.l.shots)[0];jog.sel=best?best.p.n:1}
 const p=player(jog.sel),l=playerLine(g,p.n),sh=computeShifts()[p.n],ex=exOf('scp',p.n);
 const games=Object.values(DB.games).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const hist=games.map(x=>{const n=findInGame(x,p);if(n==null)return null;const hl=playerLine(x,n);const sx=(()=>{const keep=DB.currentId;DB.currentId=x.id;const r=computeShifts()[n];DB.currentId=keep;return r})();const e=(x.excl.scp||{})[n]||{ex:0};return {x,n,hl,t:sx?sx.total:0,ex:e.ex}}).filter(h=>h&&(h.hl.F.length||h.hl.K.length||h.t));
 const tot=hist.reduce((a,h)=>{['shots','goals','ast','excW','excL','sv','gs'].forEach(k=>a[k]+=h.hl[k]);a.t+=h.t;a.ex+=h.ex;return a},{shots:0,goals:0,ast:0,excW:0,excL:0,sv:0,gs:0,t:0,ex:0});
 const acts=[...groupBy(l.F,'action')].map(([k,rs])=>({label:k,v:rs.length,bad:['Defesa','Bloco','Fora','EXC sofrida','Perda Bola','Passe Falhado','Falta Atacante'].includes(k)})).sort((a,b)=>b.v-a.v);
 box.innerHTML=`
  <div class="rec-head" style="margin-bottom:12px"><h2 class="sub">Ficha do jogador</h2>
   <select class="inp-sm" id="jg-sel" aria-label="Escolher jogador" style="min-width:200px">${namedRoster().map(x=>`<option value="${x.n}" ${x.n===p.n?'selected':''}>${esc(plabel(x.n))}${x.gr?' (GR)':''}</option>`).join('')}</select></div>
  <div class="prof"><span class="bigcap ${p.gr?'gk':''}">${p.n}</span>
   <div><h2>${esc(pname(p.n))}</h2><p>${esc([p.gr?'Guarda-redes':p.pos,p.hand?'mão '+p.hand.toLowerCase():''].filter(Boolean).join(' · ')||'Posição por definir')} · ${sh.count} turno(s) · ${fmtClock(sh.total)} na água</p></div>
   <div class="pmeta">${p.gr
    ?`<div><b>${l.gkOn?pct(l.sv,l.gkOn)+'%':'—'}</b><span>% defesas</span></div><div><b>${l.sv}</b><span>defesas</span></div><div><b>${l.gs}</b><span>golos sofridos</span></div>`
    :`<div><b>${l.goals}</b><span>golos</span></div><div><b>${l.shots}</b><span>remates</span></div><div><b>${fmtPct(l.goals,l.shots)}</b><span>eficácia</span></div><div><b>${l.ast}</b><span>assist.</span></div>`}</div></div>
  ${p.gr?`<p class="muted small" style="margin:12px 0 0">Para o detalhe por zona da baliza e situação, abre a página <a href="${href('guardaredes')}">Guarda-Redes</a>.</p>`:`
  <div class="kpis" style="margin-top:14px">
   ${kpiBox('Exclusões ganhas',l.excW,'provocadas ao adversário')}${kpiBox('Exclusões sofridas',l.excL,`tabela de exclusões: ${ex.ex}/3${ex.red?' · vermelho':''}`)}
   ${kpiBox('Perdas de posse',l.lost,'perdas, passes falhados, faltas at.')}${kpiBox('Roubos de bola',l.steal,'')}${kpiBox('Blocos defensivos',l.blk,'')}
   ${kpiBox('Golos / 8 min',sh.total>=60?numPT(l.goals*480/sh.total):'—','tempo na água')}
  </div>
  <div class="two-maps" style="margin-top:16px">
   <div class="pitch-card"><div class="pc-h"><b>Posição das ações</b><span class="muted small">${l.F.length} ação(ões)</span></div>${pitchMarkup('jpitch')}</div>
   <div><div class="pitch-card"><div class="pc-h"><b>Destino dos remates</b></div>${goalMarkup('jgoal')}</div>
    <h3 class="mini" style="margin-top:14px">Ações registadas</h3>${barsHTML(acts)}</div>
  </div>`}
  <h3 class="mini" style="margin-top:20px">Histórico em todos os jogos guardados</h3>
  <div class="table-wrap"><table><thead><tr><th class="l">Data</th><th class="l">Adversário</th><th>Nº</th>${p.gr?'<th>Defesas</th><th>Golos sofridos</th><th>% defesas</th>':'<th>Remates</th><th>Golos</th><th>Eficácia</th><th>Assist.</th><th>EXC ganhas</th><th>EXC sofridas</th>'}<th>Tempo</th></tr></thead><tbody>
  ${hist.length?hist.map(h=>`<tr ${h.x.id===g.id?'style="background:#eaf5ef"':''}><td class="l">${esc(fmtDate(h.x.date))}</td><td class="l">${esc(h.x.opponent)}${h.x.demo?' <span class="cur-pill" style="background:var(--warnbg);color:var(--warn)">exemplo</span>':''}</td><td>${h.n}</td>${p.gr?`<td>${h.hl.sv}</td><td>${h.hl.gs}</td><td>${fmtPct(h.hl.sv,h.hl.gkOn)}</td>`:`<td>${h.hl.shots}</td><td><b>${h.hl.goals}</b></td><td>${fmtPct(h.hl.goals,h.hl.shots)}</td><td>${h.hl.ast}</td><td>${h.hl.excW}</td><td>${h.hl.excL}</td>`}<td>${h.t?fmtClock(h.t):'—'}</td></tr>`).join('')
   +(hist.length>1?`<tr style="background:#eef3f1;font-weight:800"><td class="l" colspan="3">Total (${hist.length} jogos)</td>${p.gr?`<td>${tot.sv}</td><td>${tot.gs}</td><td>${fmtPct(tot.sv,tot.sv+tot.gs)}</td>`:`<td>${tot.shots}</td><td>${tot.goals}</td><td>${fmtPct(tot.goals,tot.shots)}</td><td>${tot.ast}</td><td>${tot.excW}</td><td>${tot.excL}</td>`}<td>${fmtClock(tot.t)}</td></tr>`:'')
   :`<tr><td class="empty" colspan="10">Sem registos deste jogador.</td></tr>`}
  </tbody></table></div>
  <p class="count">O jogador é reconhecido nos outros jogos pelo nome (ou pelo número, se não tiver nome).</p>`;
 if(!p.gr){$('#jpitch').style.cursor='default';$('#jgoal').style.cursor='default';$('#jpitch-saved').innerHTML=markerGroup(l.F,'f','#ffffff',2.5);$('#jgoal-saved').innerHTML=markerGroup(l.F.filter(r=>SHOT_ACTS.includes(r.action)),'g','#203631',2.5)}
 $('#jg-sel').onchange=e=>{jog.sel=+e.target.value;renderFicha();renderRosterRows()};
}
