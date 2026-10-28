'use strict';
/* =========================================================
   DEFINIÇÕES — regras de registo, equipa, dados e cópias de segurança
   ========================================================= */
function renderDefinicoes(){
 const g=G(),st=S(),v=$('#view-definicoes');
 let bytes=0;try{bytes=new Blob([localStorage.getItem(STORE_KEY)||'']).size}catch(e){}
 const games=Object.values(DB.games),recs=games.reduce((a,x)=>a+x.individual.length+x.collective.length+x.timer.events.length+x.exclLog.length,0);
 const LIMIT=5*1024*1024;
 const sw=(key,title,desc)=>`<div class="set-row"><div><b>${title}</b><span>${desc}</span></div><button type="button" class="switch" role="switch" aria-checked="${!!st[key]}" data-set="${key}" aria-label="${esc(title)}"></button></div>`;
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Definições</h1><p>As regras aplicam-se a todos os jogos neste dispositivo. As alterações ficam guardadas logo.</p></div></div>
  <div class="set-grid">
   <div>
    <h3 class="mini">Equipa e jogo</h3>
    <div class="set-row"><div><b>Nome da equipa</b><span>Usado nos novos jogos e no jogo aberto.</span></div><input class="inp" id="st-team" value="${esc(st.teamName)}" style="width:200px"></div>
    <div class="set-row"><div><b>Duração do período (novos jogos)</b><span>Os jogos seniores usam 8 minutos.</span></div><select class="inp" id="st-plen" style="width:140px">${[5,6,7,8].map(m=>`<option value="${m*60}" ${st.periodLength===m*60?'selected':''}>${m} minutos</option>`).join('')}</select></div>
    <div class="set-row"><div><b>Duração do período (jogo aberto)</b><span>${esc(fmtDate(g.date))} vs ${esc(g.opponent)}</span></div><select class="inp" id="st-gplen" style="width:140px">${[5,6,7,8].map(m=>`<option value="${m*60}" ${g.periodLength===m*60?'selected':''}>${m} minutos</option>`).join('')}</select></div>
    <div class="set-row"><div><b>Máximo de jogadores na água</b><span>Bloqueia o botão Entrar no Tempo de Jogo.</span></div><select class="inp" id="st-pool" style="width:140px">${[5,6,7].map(n=>`<option value="${n}" ${st.maxInPool===n?'selected':''}>${n} jogadores</option>`).join('')}</select></div>
   </div>
   <div>
    <h3 class="mini">Regras de registo</h3>
    ${sw('assistRequired','Assistência obrigatória','Em Golo e EXC ganha é preciso escolher quem assistiu (ou "Sem assistência").')}
    ${sw('autoAttack','Avançar o nº do ataque','Na Estatística Coletiva, o próximo ataque fica já escolhido depois de guardar.')}
    ${sw('resetClockOnPeriod','Repor o relógio ao mudar de período','Ao escolher outro período, o relógio volta à duração completa e pára.')}
   </div>
  </div>
 </section>
 <div class="set-grid">
  <section class="panel">
   <h2 class="sub">Dados neste dispositivo</h2>
   <div class="store-meter" aria-hidden="true"><i style="width:${Math.min(100,Math.max(1,bytes*100/LIMIT))}%"></i></div>
   <p class="muted small" style="margin:0 0 12px">${(bytes/1024).toFixed(0)} KB usados de cerca de 5 MB disponíveis no browser · ${games.length} jogo(s) · ${recs} registo(s)${storageOK?'':' · <b style="color:var(--red)">o browser está a bloquear o armazenamento</b>'}</p>
   <div class="btn-row"><button type="button" class="btn btn-outline" id="st-backup">${icon('download')}Cópia de segurança de tudo</button><button type="button" class="btn btn-ghost" id="st-restore">${icon('upload')}Restaurar cópia</button></div>
   <div class="btn-row" style="margin-top:8px"><button type="button" class="btn btn-ghost" id="st-demo">${icon('plus')}Adicionar jogo de exemplo</button><button type="button" class="btn btn-danger" id="st-wipe">${icon('trash')}Apagar todos os dados</button></div>
   <p class="muted small" style="margin:12px 0 0">A cópia de segurança (.json) inclui todos os jogos e estas definições. Para um só jogo usa Início › Exportar jogo; para Excel, o Exportar CSV de cada página.</p>
  </section>
  <section class="panel">
   <h2 class="sub">Instalação</h2>
   <div class="install-slot" style="margin-top:12px">${installCardHTML()}</div>
   <ol class="steps-list">
    <li>Depois de instalada, a app abre em ecrã inteiro e funciona sem internet, incluindo na piscina.</li>
    <li>Os dados ficam no dispositivo onde foram registados. Exporta o jogo no fim de cada partida.</li>
    <li>Quando houver uma versão nova da app, aparece um aviso "Atualizar agora". Os dados mantêm-se.</li>
   </ol>
   <p class="muted small" style="margin:12px 0 0">SCP Stat · Polo Aquático · versão 0.3 (${esc(APP_VERSION.startsWith('__')?'local':APP_VERSION)})</p>
  </section>
 </div>`;
 $$('[data-set]',v).forEach(b=>b.onclick=()=>{const k=b.dataset.set;DB.settings[k]=!DB.settings[k];b.setAttribute('aria-checked',String(DB.settings[k]));save(true);toast('Definição guardada')});
 $('#st-team').onchange=e=>{const n=e.target.value.trim()||'Sporting CP';DB.settings.teamName=n;g.scpName=n;save();toast('Nome da equipa guardado')};
 $('#st-plen').onchange=e=>{DB.settings.periodLength=+e.target.value;save(true);toast('Duração para novos jogos: '+fmtClock(+e.target.value))};
 $('#st-gplen').onchange=e=>{g.periodLength=+e.target.value;if(!g.timer.running&&g.timer.remaining>g.periodLength)g.timer.remaining=g.periodLength;save();toast('Duração do período deste jogo: '+fmtClock(g.periodLength))};
 $('#st-pool').onchange=e=>{DB.settings.maxInPool=+e.target.value;save(true);toast('Máximo na água: '+e.target.value)};
 $('#st-backup').onclick=()=>download('scp_stat_copia_seguranca_'+todayISO()+'.json',JSON.stringify({app:'scp-stat-polo',version:1,kind:'backup',exported:new Date().toISOString(),settings:DB.settings,currentId:DB.currentId,games:DB.games}),'application/json');
 $('#st-restore').onclick=restoreBackup;
 $('#st-demo').onclick=()=>{const d=buildDemoGame();DB.games[d.id]=d;DB.currentId=d.id;save();resetLocalState();renderDefinicoes();toast('Jogo de exemplo adicionado e aberto')};
 $('#st-wipe').onclick=async()=>{
  if(!await confirmBox('Apagar todos os dados',`Vais apagar <b>${games.length} jogo(s)</b> e todos os registos deste dispositivo. Faz antes uma cópia de segurança se precisares destes dados.`,'Continuar'))return;
  const ok=await modal({title:'Confirmar',body:'<p>Escreve <b>APAGAR</b> para confirmar.</p><input id="m-conf" class="inp" autocomplete="off">',actions:[{label:'Cancelar',cls:'btn-ghost',value:false},{label:'Apagar tudo',cls:'btn-danger',get:r=>r.querySelector('#m-conf').value.trim().toUpperCase()==='APAGAR'}]});
  if(!ok){toast('Nada foi apagado.');return}
  const n=newGame();DB.games={[n.id]:n};DB.currentId=n.id;save();resetLocalState();renderDefinicoes();toast('Dados apagados. Começaste um jogo vazio.')};
}
async function restoreBackup(){
 const f=await pickFile('.json,application/json');if(!f)return;
 let d;try{d=JSON.parse(f.text)}catch(e){toast('Este ficheiro não é uma cópia da SCP Stat (.json).','bad');return}
 if(!d||d.app!=='scp-stat-polo'){toast('Este ficheiro não é uma cópia da SCP Stat (.json).','bad');return}
 const incoming=d.kind==='backup'?Object.values(d.games||{}):(d.game?[d.game]:[]);
 if(!incoming.length){toast('A cópia não tem jogos.','warn');return}
 const mode=await modal({title:'Restaurar cópia',body:`<p>A cópia tem <b>${incoming.length}</b> jogo(s). Juntar aos jogos deste dispositivo (os jogos iguais são atualizados) ou substituir tudo?</p>`,actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Substituir tudo',cls:'btn-danger',value:'replace'},{label:'Juntar',cls:'btn-primary',value:'merge'}]});
 if(!mode)return;
 if(mode==='replace')DB.games={};
 incoming.forEach(x=>{normalizeGame(x);DB.games[x.id]=x});
 if(d.kind==='backup'&&d.settings&&mode==='replace')DB.settings={...DEFAULT_SETTINGS,...d.settings};
 DB.currentId=(d.currentId&&DB.games[d.currentId])?d.currentId:incoming[0].id;
 save();resetLocalState();rerender();toast(incoming.length+' jogo(s) restaurado(s)');
}
