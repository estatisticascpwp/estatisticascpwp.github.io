'use strict';
/* =========================================================
   TEMPO DE JOGO — relógio decrescente por período, entradas/saídas, turnos
   ========================================================= */
const tsub={out:null,in:null};
function renderTempo(){
 const g=G(),v=$('#view-tempo'),L=g.periodLength;
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Tempo de Jogo</h1><p>O relógio conta para trás como o do jogo. Cada entrada, saída ou substituição fica registada com o período e o tempo do relógio nesse momento. O tempo dos jogadores só conta com o relógio a correr.</p></div></div>
  <div class="clock-panel">
   <div class="clock-box"><span class="cp" id="t-cp">${g.period} período</span><div class="clock tnum" id="t-clock">${fmtClock(clockNow())}</div>
    <div class="btn-row"><button type="button" class="btn btn-primary" id="t-play"></button><button type="button" class="btn btn-ghost" id="t-m5" title="Menos 5 segundos">−5s</button><button type="button" class="btn btn-ghost" id="t-p5" title="Mais 5 segundos">+5s</button><button type="button" class="btn btn-ghost" id="t-full" title="Repor o relógio no mesmo período">${icon('reset')}${fmtClock(L)}</button></div>
    <button type="button" class="btn btn-primary" id="t-next" hidden></button>
    <span class="clock-note" id="t-note"></span></div>
   <div class="clock-set">
    <span class="lbl">Período</span><div class="seg" id="t-period">${PERIODS.map(p=>`<button type="button" data-p="${p}" class="${g.period===p?'on':''}">${p}</button>`).join('')}</div>
    <span class="lbl">Acertar relógio</span>
    <div class="row"><select id="t-min" aria-label="Minutos">${Array.from({length:L/60+1},(_,i)=>`<option>${i}</option>`).join('')}</select><b>:</b><select id="t-sec" aria-label="Segundos">${Array.from({length:60},(_,i)=>`<option value="${i}">${String(i).padStart(2,'0')}</option>`).join('')}</select>
     <input class="inp" id="t-manual" placeholder="ou escreve 5:32" style="width:130px;min-height:42px" inputmode="numeric"><button type="button" class="btn btn-green" id="t-set">Definir</button></div>
   </div>
   <div class="onfield"><b id="t-on">0</b><span>/ ${maxPool()} na água</span></div>
  </div>
 </section>
 <section class="panel sub-panel" id="t-sub"></section>
 <section class="panel">
  <div class="rec-head"><h2 class="sub">Jogadores</h2><div class="btn-row"><button type="button" class="btn btn-outline" id="t-expsum">${icon('download')}Exportar resumo</button></div></div>
  <p class="muted small" style="margin:6px 0 12px">Os nomes são os mesmos da tabela de Exclusões; aqui podes ainda preencher os jogadores 14 e 15.</p>
  <div class="table-wrap"><table><thead><tr><th>Nº</th><th class="l">Jogador</th><th>Estado</th><th>Movimento</th><th>Turnos</th><th>Último turno</th><th>Tempo total</th><th class="l">Tempo jogado</th></tr></thead><tbody id="t-players"></tbody></table></div>
 </section>
 <section class="panel">
  <div class="rec-head"><h2 class="sub">Registo de substituições</h2>
   <div class="btn-row"><button type="button" class="btn btn-outline" id="t-exp">${icon('download')}Exportar CSV</button><button type="button" class="btn btn-ghost" id="t-imp">${icon('upload')}Importar CSV</button><button type="button" class="btn btn-danger" id="t-delall">${icon('trash')}Apagar todos</button></div></div>
  <p class="muted small" style="margin:6px 0 12px">Podes corrigir o período ou o relógio de qualquer movimento; os turnos são recalculados. Movimentos marcados com "verificar" têm o relógio fora de ordem.</p>
  <div class="table-wrap"><table><thead><tr><th>Período</th><th>Relógio</th><th class="l">Jogador</th><th>Movimento</th><th>Apagar</th></tr></thead><tbody id="t-log"></tbody></table></div>
 </section>`;
 const t=g.timer;
 const cur=Math.round(clockNow());$('#t-min').value=String(Math.floor(cur/60));$('#t-sec').value=String(cur%60);
 $('#t-play').onclick=()=>{if(t.running){t.remaining=clockNow();t.running=false}else{if(clockNow()<=0){toast('O relógio está a 0:00. Muda de período ou acerta o relógio.','warn');return}t.running=true;t.startedAt=Date.now()}save();updateTempoLive()};
 const shift=d=>{t.remaining=clamp(clockNow()+d,0,g.periodLength);if(t.running)t.startedAt=Date.now();save();updateTempoLive()};
 $('#t-m5').onclick=()=>shift(-5);$('#t-p5').onclick=()=>shift(5);
 $('#t-full').onclick=async()=>{
  if(g.timer.events.some(e=>e.period===g.period&&e.clock<g.periodLength)&&!await confirmBox('Repor o relógio?',`Já há movimentos no ${g.period} período. Repor o relógio a ${fmtClock(g.periodLength)} <b>no mesmo período</b> faz com que os próximos movimentos fiquem antes desses. Se o período acabou, usa "Começar o próximo período".`,'Repor mesmo assim'))return;
  t.running=false;t.remaining=g.periodLength;save();renderTempo()};
 $('#t-next').onclick=()=>{const i=PERIODS.indexOf(g.period);if(i<PERIODS.length-1)setPeriod(PERIODS[i+1])};
 $('#t-sub').addEventListener('click',e=>{const b=e.target.closest('[data-sub]');
  if(b){const [k,n]=b.dataset.sub.split('|');tsub[k]=tsub[k]===+n?null:+n;renderTempoSub();return}
  if(e.target.closest('#t-subgo'))doSub(tsub.out,tsub.in);
  if(e.target.closest('#t-subclr')){tsub.out=null;tsub.in=null;renderTempoSub()}});
 $('#t-period').onclick=e=>{const b=e.target.closest('[data-p]');if(b)setPeriod(b.dataset.p)};
 const setTo=s=>{if(s==null||s>g.periodLength){toast(`Tempo inválido. Usa minutos:segundos até ${fmtClock(g.periodLength)}.`,'warn');return}t.remaining=s;if(t.running)t.startedAt=Date.now();save();updateTempoLive();toast('Relógio: '+fmtClock(s))};
 $('#t-set').onclick=()=>{const m=$('#t-manual').value.trim();setTo(m?parseClock(m):(+$('#t-min').value)*60+(+$('#t-sec').value));$('#t-manual').value=''};
 $('#t-manual').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#t-set').click()}});
 $('#t-players').addEventListener('click',e=>{const b=e.target.closest('[data-move]');if(b)moveIn(+b.dataset.move)});
 $('#t-players').addEventListener('change',e=>{const i=e.target.closest('[data-tname]');if(!i)return;player(+i.dataset.tname).name=i.value.trim();save()});
 $('#t-log').addEventListener('change',e=>{const el=e.target.closest('[data-ev]');if(!el)return;const ev=g.timer.events.find(x=>x.id===el.dataset.ev);if(!ev)return;
  if(el.dataset.f==='period')ev.period=el.value;else{const s=parseClock(el.value);if(s==null||s>g.periodLength){toast('Relógio inválido (mm:ss).','warn');el.value=fmtClock(ev.clock);return}ev.clock=s}
  save();renderTempoPlayers();renderTempoLog()});
 $('#t-log').addEventListener('click',async e=>{const b=e.target.closest('[data-delev]');if(!b)return;if(!await confirmBox('Apagar movimento','Apagar este movimento? Os turnos do jogador são recalculados.','Apagar'))return;g.timer.events=g.timer.events.filter(x=>x.id!==b.dataset.delev);save();renderTempoPlayers();renderTempoLog()});
 $('#t-exp').onclick=exportTempo;$('#t-imp').onclick=importTempo;$('#t-expsum').onclick=exportTempoSummary;
 $('#t-delall').onclick=async()=>{if(!g.timer.events.length){toast('Não há movimentos para apagar.');return}if(!await confirmBox('Apagar movimentos',`Apagar os <b>${g.timer.events.length}</b> movimentos de entrada e saída?`,'Apagar todos'))return;g.timer.events=[];save();renderTempoPlayers();renderTempoLog()};
 renderTempoSub();renderTempoPlayers();renderTempoLog();updateTempoLive();
}
function addMove(n,type){const g=G();g.timer.seq=(g.timer.seq||0)+1;g.timer.events.push({id:uid(),n,type,period:g.period,clock:Math.round(clockNow()),seq:g.timer.seq,ts:Date.now()})}
function afterMove(){save();renderTempoPlayers();renderTempoLog();renderTempoSub()}
async function moveIn(n){
 const g=G(),s=computeShifts(),pool=Object.keys(s).map(Number).filter(k=>s[k].on),me=s[n];
 if(me.on){addMove(n,'out');if(tsub.out===n)tsub.out=null;afterMove();toast(`${plabel(n)} saiu · ${g.period} ${fmtClock(clockNow())}`);return}
 if(pool.length>=maxPool()){
  const out=await modal({title:`Entra ${plabel(n)}: quem sai?`,body:`<p>Estão ${pool.length} jogadores na água. Escolhe quem sai — a saída e a entrada ficam registadas no mesmo instante (${g.period} ${fmtClock(clockNow())}).</p>`,
   actions:[...pool.map(k=>({label:plabel(k)+(player(k).gr?' (GR)':''),cls:'btn-outline',value:k})),{label:'Cancelar',cls:'btn-ghost',value:null}]});
  if(out==null)return;doSub(out,n);return}
 addMove(n,'in');if(tsub.in===n)tsub.in=null;afterMove();toast(`${plabel(n)} entrou · ${g.period} ${fmtClock(clockNow())}`);
}
function doSub(out,inn){
 const s=computeShifts();
 if(out==null||inn==null){toast('Escolhe quem sai e quem entra.','warn');return}
 if(!s[out].on){toast(`${plabel(out)} não está na água.`,'warn');return}
 if(s[inn].on){toast(`${plabel(inn)} já está na água.`,'warn');return}
 addMove(out,'out');addMove(inn,'in');tsub.out=null;tsub.in=null;afterMove();
 toast(`Substituição: sai ${plabel(out)}, entra ${plabel(inn)} · ${G().period} ${fmtClock(clockNow())}`);
}
function renderTempoSub(){
 const box=$('#t-sub');if(!box)return;
 const g=G(),s=computeShifts(),pool=g.roster.filter(p=>s[p.n].on),bench=g.roster.filter(p=>!s[p.n].on&&(p.n<=13||p.name));
 if(tsub.out!=null&&!s[tsub.out].on)tsub.out=null;if(tsub.in!=null&&s[tsub.in].on)tsub.in=null;
 const chip=(k,p)=>`<button type="button" class="chip sub-chip ${k} ${tsub[k]===p.n?'on':''}" data-sub="${k}|${p.n}"><span class="capnum ${p.gr?'gk':''}">${p.n}</span>${esc(p.name||(p.gr?'GR':'Jogador '+p.n))}</button>`;
 box.innerHTML=`<div class="rec-head"><h2 class="sub">Substituição</h2><span class="muted small">Toca em quem sai e em quem entra, depois confirma.</span></div>
  <div class="sub-grid">
   <div><span class="lbl sub-lbl out">Sai · na água (${pool.length})</span><div class="chips">${pool.map(p=>chip('out',p)).join('')||'<span class="muted small">Ninguém na água. Usa ENTRAR na tabela para os titulares.</span>'}</div></div>
   <div><span class="lbl sub-lbl in">Entra · banco</span><div class="chips">${bench.map(p=>chip('in',p)).join('')}</div></div>
  </div>
  <div class="form-actions"><button type="button" class="btn btn-ghost" id="t-subclr">Limpar</button><button type="button" class="btn btn-primary" id="t-subgo" ${tsub.out!=null&&tsub.in!=null?'':'disabled'}>⇄ ${tsub.out!=null&&tsub.in!=null?`Sai ${tsub.out}, entra ${tsub.in}`:'Confirmar substituição'}</button></div>`;
}
function renderTempoPlayers(){
 const g=G(),s=computeShifts(),full=Object.values(s).filter(x=>x.on).length>=maxPool();
 $('#t-players').innerHTML=g.roster.map(p=>{const x=s[p.n];return `<tr class="${x.on?'inpool':''}" data-row="${p.n}"><td><span class="capnum ${p.gr?'gk':''}">${p.n}</span></td>
  <td class="l"><input class="inp-sm t-name" data-tname="${p.n}" value="${esc(p.name)}" placeholder="${p.gr?'Guarda-redes':'Nome'}" aria-label="Nome do jogador ${p.n}"></td>
  <td><span class="state">${x.on?'Na água':'Banco'}</span></td>
  <td><button type="button" class="btn btn-sm ${x.on?'btn-danger':full?'btn-primary':'btn-green'}" data-move="${p.n}" style="min-width:112px">${x.on?'SAIR':full?'⇄ SUBSTITUIR':'ENTRAR'}</button></td>
  <td data-k="count">${x.count}</td><td data-k="last">—</td><td data-k="total"><b>${fmtClock(x.total)}</b></td>
  <td class="tbar l"><div><i data-k="bar" style="width:0%"></i></div></td></tr>`}).join('');
 updateTempoLive();
}
function renderTempoLog(){
 computeShifts();const bad=computeShifts.issues||new Set();
 const g=G(),ev=g.timer.events.slice().sort((a,b)=>absTime(b.period,b.clock)-absTime(a.period,a.clock)||b.seq-a.seq);
 $('#t-log').innerHTML=ev.length?ev.map(e=>`<tr><td><select class="inp-sm" data-ev="${e.id}" data-f="period" aria-label="Período">${PERIODS.map(p=>`<option ${p===e.period?'selected':''}>${p}</option>`).join('')}</select></td>
  <td><input class="inp-sm tnum" data-ev="${e.id}" data-f="clock" value="${fmtClock(e.clock)}" style="width:72px;text-align:center" aria-label="Relógio"></td>
  <td class="l">${esc(plabel(e.n))}${bad.has(e.id)?' <span class="badge t-warn" title="A ordem ou o relógio deste movimento não bate certo com os outros movimentos do jogador. Corrige o período ou o relógio, ou apaga-o." style="min-width:0">verificar</span>':''}</td><td><span class="badge ${e.type==='in'?'t-good':'t-bad'}">${e.type==='in'?'Entrada':'Saída'}</span></td>
  <td><button type="button" class="rowbtn del" data-delev="${e.id}" title="Apagar">${icon('trash')}</button></td></tr>`).join('')
  :'<tr><td class="empty" colspan="5">Ainda não há movimentos. No início do período, carrega em Entrar para os 7 jogadores que começam na água.</td></tr>';
}
let lastPoolSig='';
function updateTempoLive(){
 const g=G(),t=g.timer,c=$('#t-clock');if(!c)return;
 const now=clockNow(),s=computeShifts(),on=Object.values(s).filter(x=>x.on).length;
 c.textContent=fmtClock(now);c.classList.toggle('running',t.running);
 const pb=$('#t-play');if(pb)pb.innerHTML=t.running?icon('pause')+'Pausa':icon('play')+'Iniciar';
 const i=PERIODS.indexOf(g.period),nx=$('#t-next');
 if(nx){nx.hidden=!(now<=0&&i<PERIODS.length-1);nx.innerHTML=`Começar o ${PERIODS[i+1]||''} período`}
 const note=$('#t-note');
 if(note){note.textContent=now<=0?(i<PERIODS.length-1?`Fim do ${g.period} período.`:'Fim do jogo.'):(!t.running&&on?'Relógio parado: o tempo dos jogadores não está a contar.':'');note.hidden=!note.textContent}
 const el=$('#t-on');if(el){el.textContent=on;el.classList.toggle('full',on>=maxPool())}
 const sig=Object.keys(s).filter(k=>s[k].on).join(',')+'|'+(on>=maxPool());
 if(sig!==lastPoolSig&&$('#t-players tr[data-row]')){lastPoolSig=sig;renderTempoPlayers();renderTempoSub();return}
 lastPoolSig=sig;
 const max=Math.max(1,nowAbs());
 $$('#t-players tr[data-row]').forEach(tr=>{const x=s[+tr.dataset.row];if(!x)return;
  const l=tr.querySelector('[data-k="last"]');if(l)l.innerHTML=x.count?fmtClock(x.last)+(x.on?(x.ahead?' <small class="muted">(entrou mais tarde no jogo)</small>':' <small class="muted">(atual)</small>'):''):'—';
  const tt=tr.querySelector('[data-k="total"]');if(tt)tt.innerHTML='<b>'+fmtClock(x.total)+'</b>';
  const cn=tr.querySelector('[data-k="count"]');if(cn)cn.textContent=x.count;
  const b=tr.querySelector('[data-k="bar"]');if(b)b.style.width=Math.min(100,x.total*100/max)+'%'});
}
function exportTempo(){
 const g=G(),ev=g.timer.events.slice().sort((a,b)=>absTime(a.period,a.clock)-absTime(b.period,b.clock)||a.seq-b.seq);
 if(!ev.length){toast('Não há movimentos para exportar.','warn');return}
 download('tempo_jogo_'+fileStamp()+'.csv',toCSV([['Período','Relógio','Nº','Jogador','Movimento'],...ev.map(e=>[e.period,fmtClock(e.clock),e.n,pname(e.n),e.type==='in'?'Entrada':'Saída'])]));
}
function exportTempoSummary(){
 const g=G(),s=computeShifts();
 download('tempo_jogo_resumo_'+fileStamp()+'.csv',toCSV([['Nº','Jogador','GR','Turnos','Último turno','Tempo total','Tempo total (s)'],...g.roster.filter(p=>s[p.n].count||p.name).map(p=>{const x=s[p.n];return [p.n,pname(p.n),p.gr?'Sim':'',x.count,x.count?fmtClock(x.last):'',fmtClock(x.total),Math.round(x.total)]})]));
}
async function importTempo(){
 const f=await pickFile('.csv,text/csv');if(!f)return;
 const objs=csvObjects(f.text).filter(o=>o['Nº']&&o['Movimento']);
 if(!objs.length){toast('Não encontrei movimentos. Usa um CSV exportado pelo Tempo de Jogo.','bad');return}
 const mode=await askImportMode(objs.length,'tempo de jogo');if(!mode)return;
 const g=G();let seq=g.timer.seq||0;
 const evs=objs.map(o=>{const n=+o['Nº'];if(!(n>=1&&n<=15))return null;const p=player(n);if(p&&!p.name&&o['Jogador']&&!/^Jogador \d+$/.test(o['Jogador']))p.name=o['Jogador'];
  return {id:uid(),n,type:norm(o['Movimento']).startsWith('entr')?'in':'out',period:PERIODS.includes(o['Período'])?o['Período']:'1º',clock:parseClock(o['Relógio'])??0,seq:++seq,ts:Date.now()}}).filter(Boolean);
 g.timer.seq=seq;g.timer.events=mode==='replace'?evs:g.timer.events.concat(evs);save();renderTempo();toast(evs.length+' movimento(s) importado(s)');
}
