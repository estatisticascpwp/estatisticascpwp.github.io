'use strict';
/* =========================================================
   ESTATÍSTICA INDIVIDUAL — campo (16:8) + baliza, ações por tipo de jogador
   ========================================================= */
/* ---------- Estado do formulário ---------- */
const ind={mode:'field',editing:null,period:null,player:null,action:null,sit:null,assist:null,f:null,g:null,showWarn:false,filters:{period:'',player:'',action:''}};
const indPeriod=()=>ind.editing?ind.period:G().period;
function indDef(){return ind.action?actDef(ind.mode,ind.action):null}
function indReqs(){
 const a=indDef(),r=[];
 r.push(['Período',!!indPeriod()]);
 r.push(['Jogador',!!ind.player]);
 r.push(['Local no campo',!!ind.f]);
 r.push(['Tipo de ação',!!a]);
 if(a){
  if(a.goal)r.push(['Local na baliza',!!ind.g]);
  if(a.sits.length&&!a.sitOpt)r.push(['Situação de jogo',!!ind.sit]);
  if(a.assist&&S().assistRequired)r.push(['Assistência',!!ind.assist]);
 }
 return r;
}
function resetIndForm(){Object.assign(ind,{editing:null,period:null,player:null,action:null,sit:null,assist:null,f:null,g:null,showWarn:false})}

function renderIndividual(){
 const v=$('#view-individual');
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Estatística Individual</h1><p>Segue os passos da esquerda para a direita. Os registos de guarda-redes e de jogadores de campo são separados: escolher um GR mostra só as ações e os registos de GR.</p></div>
   <div class="mode-switch" id="ind-mode" role="group" aria-label="Tipo de jogador"><button type="button" data-mode="field">Jogadores de campo</button><button type="button" data-mode="gk" class="gk">Guarda-redes</button></div></div>
  <div class="ind-layout">
   <div class="ind-a">
    <div class="step"><div class="step-h"><span class="step-n" data-sn="period">1</span>Período</div><div class="seg" id="ind-period"></div></div>
    <div class="step"><div class="step-h"><span class="step-n" data-sn="player">2</span>Jogador<span class="opt">nomes vêm da tabela de Exclusões</span></div><div class="caps" id="ind-players"></div></div>
   </div>
   <div class="ind-b">
    <div class="pitch-card"><div class="pc-h"><b><span class="step-n" data-sn="f">3</span>Localização do jogador</b><span class="zone-tag" id="ind-fzone">Toca no campo</span></div>${pitchMarkup('pitch')}
     <div class="legend" id="ind-legend"></div></div>
    <div class="pitch-card" id="ind-goalcard"><div class="pc-h"><b><span class="step-n" data-sn="g">4</span>Local do remate na baliza</b><span class="zone-tag" id="ind-gzone">Toca na baliza</span></div>${goalMarkup('goalsvg')}<div class="na-note" id="ind-gnote" hidden>Esta ação não regista local na baliza.</div></div>
   </div>
   <div class="ind-c">
    <div class="step"><div class="step-h"><span class="step-n" data-sn="action">5</span>Tipo de ação</div><div class="acts" id="ind-actions"></div></div>
    <div class="step" id="ind-sitstep"><div class="step-h"><span class="step-n" data-sn="sit">6</span>Situação de jogo<span class="opt" id="ind-sitopt"></span></div><div class="chips" id="ind-sits"></div></div>
    <div class="step" id="ind-asstep"><div class="step-h"><span class="step-n" data-sn="assist">7</span>Assistência</div><div class="chips" id="ind-assist"></div></div>
    <div class="step"><div class="step-h">Pressupostos</div><div class="reqs" id="ind-reqs"></div><div id="ind-warn"></div>
     <div id="ind-editnote"></div>
     <div class="form-actions"><button type="button" class="btn btn-ghost" id="ind-cancel">${icon('reset')}Limpar</button><button type="button" class="btn btn-primary" id="ind-save">${icon('save')}<span>Guardar registo</span></button></div></div>
   </div>
  </div>
 </section>
 <section class="panel">
  <div class="rec-head"><h2 class="sub" id="ind-ttitle"></h2>
   <div class="btn-row"><button type="button" class="btn btn-outline" id="ind-exp">${icon('download')}Exportar CSV</button><button type="button" class="btn btn-ghost" id="ind-imp">${icon('upload')}Importar CSV</button><button type="button" class="btn btn-danger" id="ind-delall">${icon('trash')}Apagar todos</button></div></div>
  <div class="filters" id="ind-filters"></div>
  <div class="table-wrap"><table><thead id="ind-thead"></thead><tbody id="ind-tbody"></tbody></table></div>
  <p class="count" id="ind-count"></p>
 </section>`;

 $('#ind-mode').onclick=e=>{const b=e.target.closest('[data-mode]');if(!b||b.dataset.mode===ind.mode)return;ind.mode=b.dataset.mode;resetIndForm();ind.filters={period:'',player:'',action:''};renderIndividual()};
 $('#ind-period').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;if(ind.editing){ind.period=b.dataset.p;renderIndForm()}else setPeriod(b.dataset.p)};
 $('#ind-players').onclick=e=>{const b=e.target.closest('[data-player]');if(!b)return;const n=+b.dataset.player,p=player(n),m=p.gr?'gk':'field';
  if(m!==ind.mode){const keep={f:ind.f,g:ind.g};ind.mode=m;ind.action=null;ind.sit=null;ind.assist=null;ind.player=n;Object.assign(ind,keep);
   if(ind.editing){ind.editing=null;ind.period=null}
   ind.filters={period:'',player:'',action:''};renderIndividual();toast(m==='gk'?'Guarda-redes selecionado: ações e registos de GR':'Jogador de campo selecionado');return}
  ind.player=ind.player===n?null:n; if(ind.assist===n)ind.assist=null; renderIndForm()};
 $('#ind-actions').onclick=e=>{const b=e.target.closest('[data-action]');if(!b)return;ind.action=ind.action===b.dataset.action?null:b.dataset.action;const a=indDef();
  if(a){if(!a.sits.includes(ind.sit))ind.sit=null;if(!a.assist)ind.assist=null;if(!a.goal&&ind.g){ind.g=null}}
  renderIndForm()};
 $('#ind-sits').onclick=e=>{const b=e.target.closest('[data-sit]');if(!b)return;ind.sit=ind.sit===b.dataset.sit?null:b.dataset.sit;renderIndForm()};
 $('#ind-assist').onclick=e=>{const b=e.target.closest('[data-assist]');if(!b)return;const v=b.dataset.assist==='none'?'none':+b.dataset.assist;ind.assist=ind.assist===v?null:v;renderIndForm()};
 $('#pitch').addEventListener('click',e=>{ind.f=svgPoint($('#pitch'),e);renderIndForm()});
 $('#goalsvg').addEventListener('click',e=>{const a=indDef();if(a&&!a.goal){toast(`"${a.id}" não regista local na baliza.`,'warn');return}ind.g=svgPoint($('#goalsvg'),e);renderIndForm()});
 $('#ind-save').onclick=indSave;
 $('#ind-cancel').onclick=()=>{resetIndForm();renderIndForm();renderIndRecords()};
 $('#ind-exp').onclick=exportIndividual;
 $('#ind-imp').onclick=importIndividual;
 $('#ind-delall').onclick=async()=>{const lbl=ind.mode==='gk'?'de guarda-redes':'de jogadores de campo';const n=G().individual.filter(r=>r.mode===ind.mode).length;if(!n){toast('Não há registos para apagar.');return}
  if(!await confirmBox('Apagar registos',`Apagar os <b>${n}</b> registos ${lbl} deste jogo? Não é possível desfazer.`,'Apagar todos'))return;
  G().individual=G().individual.filter(r=>r.mode!==ind.mode);resetIndForm();save();renderIndForm();renderIndRecords();toast('Registos apagados')};
 const tb=$('#ind-tbody');
 tb.addEventListener('mouseover',e=>{const tr=e.target.closest('tr[data-id]');$$('.mk.hl').forEach(m=>m.classList.remove('hl'));if(tr)$$(`.mk[data-id="${tr.dataset.id}"]`).forEach(m=>m.classList.add('hl'))});
 tb.addEventListener('mouseleave',()=>$$('.mk.hl').forEach(m=>m.classList.remove('hl')));
 tb.addEventListener('click',async e=>{const ed=e.target.closest('[data-edit]'),dl=e.target.closest('[data-del]');
  if(ed){const r=G().individual.find(x=>x.id===ed.dataset.edit);if(!r)return;Object.assign(ind,{editing:r.id,period:r.period,player:r.player,action:r.action,sit:r.sit||null,assist:r.assist===''?null:r.assist,f:r.fx!=null?{x:r.fx,y:r.fy}:null,g:r.gx!=null?{x:r.gx,y:r.gy}:null,showWarn:false});renderIndForm();renderIndMarkers();$('#view-individual').scrollIntoView({behavior:'smooth'})}
  if(dl){if(!await confirmBox('Apagar registo','Apagar este registo?','Apagar'))return;G().individual=G().individual.filter(x=>x.id!==dl.dataset.del);if(ind.editing===dl.dataset.del)resetIndForm();save();renderIndForm();renderIndRecords()}});
 renderIndForm();renderIndRecords();
}

function renderIndForm(){
 const g=G(),a=indDef(),gk=ind.mode==='gk';
 $$('#ind-mode button').forEach(b=>b.classList.toggle('on',b.dataset.mode===ind.mode));
 $('#ind-period').innerHTML=PERIODS.map(p=>`<button type="button" data-p="${p}" class="${indPeriod()===p?'on':''}">${p}</button>`).join('');
 $('#ind-players').innerHTML=namedRoster().map(p=>`<button type="button" class="cap ${p.gr?'gk':''} ${ind.player===p.n?'on':''} ${(p.gr?'gk':'field')!==ind.mode?'dim':''}" data-player="${p.n}" title="${esc(plabel(p.n))}${p.gr?' (GR)':''}"><span class="num">${p.n}</span><span class="nm">${esc(p.name||(p.gr?'GR':'—'))}</span></button>`).join('');
 $('#ind-actions').innerHTML=ACTIONS[ind.mode].map(x=>`<button type="button" class="act ${ind.action===x.id?'on':''}" data-action="${esc(x.id)}">${actIcon(x)}<span>${esc(x.id)}</span></button>`).join('');
 const sits=a?a.sits:(gk?STD:[...new Set(ACTIONS.field.flatMap(x=>x.sits))]);
 $('#ind-sitstep').hidden=!!(a&&!a.sits.length);
 $('#ind-sitopt').textContent=a?(a.sitOpt?'opcional':''):'escolhe primeiro a ação';
 $('#ind-sits').innerHTML=sits.map(s=>`<button type="button" class="chip ${ind.sit===s?'on':''}" data-sit="${esc(s)}" ${a?'':'disabled'}>${esc(s)}</button>`).join('');
 $('#ind-asstep').hidden=!(a&&a.assist);
 if(a&&a.assist){$('#ind-assist').innerHTML=`<button type="button" class="chip ${ind.assist==='none'?'on':''}" data-assist="none">Sem assistência</button>`+namedRoster().filter(p=>p.n!==ind.player).map(p=>`<button type="button" class="chip ${ind.assist===p.n?'on':''}" data-assist="${p.n}">${p.n}${p.name?' · '+esc(p.name):''}</button>`).join('')}
 const fz=$('#ind-fzone'),gz=$('#ind-gzone');
 fz.textContent=ind.f?fieldZone(ind.f.x,ind.f.y):'Toca no campo';fz.classList.toggle('set',!!ind.f);
 const na=a&&!a.goal;
 $('#ind-goalcard').classList.toggle('na',!!na);$('#ind-gnote').hidden=!na;
 gz.textContent=na?'Não aplicável':(ind.g?goalZone(ind.g.x,ind.g.y):'Toca na baliza');gz.classList.toggle('set',!!ind.g&&!na);
 $('#pitch-temp').innerHTML=ind.f?tempMarker(ind.f.x,ind.f.y):'';
 $('#goalsvg-temp').innerHTML=ind.g&&!na?tempMarker(ind.g.x,ind.g.y):'';
 const reqs=indReqs();
 $('#ind-reqs').innerHTML=reqs.map(([l,ok])=>`<span class="req ${ok?'ok':''}">${ok?'✓':'•'} ${l}</span>`).join('');
 const done={period:!!indPeriod(),player:!!ind.player,f:!!ind.f,g:!!ind.g&&!na,action:!!a,sit:!!ind.sit,assist:!!ind.assist};
 $$('[data-sn]').forEach(s=>s.classList.toggle('done',!!done[s.dataset.sn]));
 const miss=reqs.filter(r=>!r[1]).map(r=>r[0].toLowerCase());
 $('#ind-warn').innerHTML=ind.showWarn&&miss.length?`<div class="warnbox"><b>Faltam pressupostos:</b> ${esc(miss.join(', '))}.</div>`:'';
 $('#ind-editnote').innerHTML=ind.editing?`<div class="editing-note" style="margin-top:10px">A editar um registo. Altera o que precisares e carrega em <b>Atualizar registo</b>, ou em Limpar para cancelar.</div>`:'';
 $('#ind-save span').textContent=ind.editing?'Atualizar registo':'Guardar registo';
 $('#ind-legend').innerHTML=ACTIONS[ind.mode].map(x=>`<span>${actIcon(x)}${esc(x.id)}</span>`).join('');
}
function indRows(){const f=ind.filters;return G().individual.filter(r=>r.mode===ind.mode&&(!f.period||r.period===f.period)&&(!f.player||String(r.player)===f.player)&&(!f.action||r.action===f.action))}
function renderIndMarkers(){
 const rows=indRows().filter(r=>r.id!==ind.editing);
 const mk=(r,x,y,stroke)=>{const a=actDef(r.mode,r.action)||{shape:'circle',color:'#999'};return `<g class="mk" data-id="${r.id}"><title>${esc(r.period+' · '+plabel(r.player)+' · '+r.action)}</title>${shapeSVG(a.shape,x*160,y*80,2.5,a.color,a.stroke||stroke,.7)}</g>`};
 $('#pitch-saved').innerHTML=rows.filter(r=>r.fx!=null).map(r=>mk(r,r.fx,r.fy,'#ffffff')).join('');
 $('#goalsvg-saved').innerHTML=rows.filter(r=>r.gx!=null).map(r=>mk(r,r.gx,r.gy,'#203631')).join('');
}
function renderIndRecords(){
 const g=G(),gk=ind.mode==='gk',f=ind.filters;
 $('#ind-ttitle').textContent=gk?'Registos — Guarda-redes':'Registos — Jogadores de campo';
 const players=[...new Set(g.individual.filter(r=>r.mode===ind.mode).map(r=>r.player))].sort((a,b)=>a-b);
 $('#ind-filters').innerHTML=`
  <div class="field"><label for="if-p">Período</label><select id="if-p"><option value="">Todos</option>${PERIODS.map(p=>`<option ${f.period===p?'selected':''}>${p}</option>`).join('')}</select></div>
  <div class="field"><label for="if-j">Jogador</label><select id="if-j"><option value="">Todos</option>${players.map(n=>`<option value="${n}" ${f.player===String(n)?'selected':''}>${esc(plabel(n))}</option>`).join('')}</select></div>
  <div class="field"><label for="if-a">Ação</label><select id="if-a"><option value="">Todas</option>${ACTIONS[ind.mode].map(a=>`<option ${f.action===a.id?'selected':''}>${esc(a.id)}</option>`).join('')}</select></div>
  <button type="button" class="btn btn-ghost btn-sm" id="if-reset">${icon('reset')}Limpar filtros</button>
  <span class="muted small" style="flex-basis:100%">Os filtros também se aplicam aos marcadores no campo e na baliza.</span>`;
 $('#if-p').onchange=e=>{f.period=e.target.value;renderIndRecords()};
 $('#if-j').onchange=e=>{f.player=e.target.value;renderIndRecords()};
 $('#if-a').onchange=e=>{f.action=e.target.value;renderIndRecords()};
 $('#if-reset').onclick=()=>{ind.filters={period:'',player:'',action:''};renderIndRecords()};
 const heads=['#','Período','Jogador','Ação','Situação',...(gk?[]:['Assistência']),'Zona campo','Zona baliza','Ações'];
 $('#ind-thead').innerHTML='<tr>'+heads.map(h=>`<th>${h}</th>`).join('')+'</tr>';
 const rows=indRows();
 $('#ind-tbody').innerHTML=rows.length?rows.map((r,i)=>{const a=actDef(r.mode,r.action)||{shape:'circle',color:'#999'};
  return `<tr data-id="${r.id}" ${ind.editing===r.id?'style="background:#e3f0fb"':''}><td>${i+1}</td><td>${esc(r.period)}</td><td class="l">${esc(plabel(r.player))}</td><td><span class="act-cell">${actIcon(a)}${esc(r.action)}</span></td><td>${esc(r.sit||'—')}</td>${gk?'':`<td>${r.assist==='none'?'Sem assistência':r.assist?esc(plabel(r.assist)):'—'}</td>`}<td>${esc(r.fzone||'—')}</td><td>${esc(r.gzone||'—')}</td><td style="white-space:nowrap"><button type="button" class="rowbtn" data-edit="${r.id}" title="Editar">${icon('edit')}</button><button type="button" class="rowbtn del" data-del="${r.id}" title="Apagar">${icon('trash')}</button></td></tr>`}).join('')
  :`<tr><td class="empty" colspan="${heads.length}">Ainda não há registos ${gk?'de guarda-redes':'de jogadores de campo'}${f.period||f.player||f.action?' com estes filtros':''}.</td></tr>`;
 $('#ind-count').textContent=`${rows.length} registo(s)`;
 renderIndMarkers();
}
function indSave(){
 const reqs=indReqs(),miss=reqs.filter(r=>!r[1]).map(r=>r[0].toLowerCase());
 if(miss.length){ind.showWarn=true;renderIndForm();toast('Faltam pressupostos: '+miss.join(', '),'warn');return}
 const g=G(),a=indDef(),prev=ind.editing?g.individual.find(x=>x.id===ind.editing):null;
 const rec={id:ind.editing||uid(),mode:ind.mode,period:indPeriod(),player:ind.player,playerName:pname(ind.player),action:ind.action,
  sit:a.sits.length?(ind.sit||''):'',assist:a.assist?ind.assist:'',
  fx:ind.f.x,fy:ind.f.y,fzone:fieldZone(ind.f.x,ind.f.y),
  gx:a.goal&&ind.g?ind.g.x:null,gy:a.goal&&ind.g?ind.g.y:null,gzone:a.goal&&ind.g?goalZone(ind.g.x,ind.g.y):'',
  ts:prev?prev.ts:Date.now()};
 if(prev)g.individual=g.individual.map(x=>x.id===rec.id?rec:x);else g.individual.push(rec);
 save();toast(prev?'Registo atualizado':`Guardado: ${plabel(rec.player)} · ${rec.action}`);
 resetIndForm();renderIndForm();renderIndRecords();
}
const IND_CSV=['Tipo','Período','Nº Jogador','Jogador','Ação','Situação','Assistência Nº','Assistência','Zona Campo','Campo X (%)','Campo Y (%)','Zona Baliza','Baliza X (%)','Baliza Y (%)','Registado em'];
function exportIndividual(){
 const g=G(),rows=g.individual.slice().sort((a,b)=>a.ts-b.ts);
 if(!rows.length){toast('Não há registos para exportar.','warn');return}
 download('estatistica_individual_'+fileStamp()+'.csv',toCSV([IND_CSV,...rows.map(r=>[r.mode==='gk'?'GR':'Campo',r.period,r.player,pname(r.player),r.action,r.sit,r.assist==='none'?'':r.assist,r.assist==='none'?'Sem assistência':r.assist?pname(r.assist):'',r.fzone,numPT(r.fx*100),numPT(r.fy*100),r.gzone,r.gx!=null?numPT(r.gx*100):'',r.gy!=null?numPT(r.gy*100):'',new Date(r.ts).toLocaleString('pt-PT')])]));
}
async function importIndividual(){
 const f=await pickFile('.csv,text/csv');if(!f)return;
 const objs=csvObjects(f.text).filter(o=>o['Ação']&&o['Nº Jogador']);
 if(!objs.length){toast('Não encontrei registos. Usa um CSV exportado pela Estatística Individual.','bad');return}
 const mode=await askImportMode(objs.length,'estatística individual');if(!mode)return;
 const recs=objs.map((o,i)=>{const fx=parseNum(o['Campo X (%)']),fy=parseNum(o['Campo Y (%)']),gx=parseNum(o['Baliza X (%)']),gy=parseNum(o['Baliza Y (%)']);
  const r={id:uid(),mode:o['Tipo']==='GR'?'gk':'field',period:PERIODS.includes(o['Período'])?o['Período']:'1º',player:+o['Nº Jogador'],playerName:o['Jogador']||'',action:o['Ação'],sit:o['Situação']||'',
   assist:o['Assistência']==='Sem assistência'?'none':(o['Assistência Nº']?+o['Assistência Nº']:''),
   fx:fx!=null?r3(fx/100):null,fy:fy!=null?r3(fy/100):null,gx:gx!=null?r3(gx/100):null,gy:gy!=null?r3(gy/100):null,ts:Date.now()+i};
  r.fzone=r.fx!=null?fieldZone(r.fx,r.fy):(o['Zona Campo']||'');r.gzone=r.gx!=null?goalZone(r.gx,r.gy):(o['Zona Baliza']||'');
  const p=player(r.player);if(p&&!p.name&&r.playerName)p.name=r.playerName;
  return r});
 const g=G();g.individual=mode==='replace'?recs:g.individual.concat(recs);save();renderIndividual();toast(recs.length+' registo(s) importado(s)');
}
