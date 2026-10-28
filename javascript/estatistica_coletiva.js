'use strict';
/* =========================================================
   ESTATÍSTICA COLETIVA — 6 tabelas (baseado em estatistica_coletiva.js)
   ========================================================= */
const col={active:'scp',editing:null,timing:'+10s',filters:{},showWarn:false};
const colTable=()=>COL_TABLES.find(t=>t.id===col.active);
function nextAttack(tid,period){const xs=G().collective.filter(r=>r.table===tid&&r.period===period).map(r=>+r.attack||0);return String(Math.min(25,(xs.length?Math.max(...xs):0)+1))}
function renderColetiva(){
 const v=$('#view-coletiva');
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Estatística Coletiva</h1><p>Registo e análise das jogadas coletivas da equipa e do adversário. O nº do ataque avança sozinho depois de cada registo.</p></div></div>
  <div class="tabs" id="col-tabs" role="tablist"></div>
  <form id="col-form" novalidate autocomplete="off"><div class="form-grid" id="col-fields"></div><div id="col-warn"></div>
   <div class="form-actions"><button class="btn btn-ghost" id="col-clear" type="button">${icon('reset')}Limpar</button><button class="btn btn-primary" type="submit">${icon('save')}<span id="col-savelbl">Guardar registo</span></button></div></form>
 </section>
 <section class="panel">
  <div class="rec-head"><h2 class="sub" id="col-title"></h2>
   <div class="btn-row"><button type="button" class="btn btn-outline" id="col-exp">${icon('download')}Exportar CSV</button><button type="button" class="btn btn-ghost" id="col-imp">${icon('upload')}Importar CSV</button><button type="button" class="btn btn-danger" id="col-delall">${icon('trash')}Apagar todos</button></div></div>
  <div class="sumstrip" id="col-sum"></div>
  <div class="filters" id="col-filters"></div>
  <div class="table-wrap"><table><thead id="col-thead"></thead><tbody id="col-tbody"></tbody></table></div>
  <p class="count" id="col-count"></p>
 </section>`;
 $('#col-tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;col.active=b.dataset.tab;col.editing=null;col.filters={};col.showWarn=false;col.timing='+10s';renderColTabs();renderColForm();renderColRecords()};
 $('#col-form').onsubmit=e=>{e.preventDefault();colSave()};
 $('#col-clear').onclick=()=>{col.editing=null;col.showWarn=false;col.timing='+10s';renderColForm();renderColRecords()};
 $('#col-fields').addEventListener('click',e=>{const b=e.target.closest('[data-time]');if(!b)return;col.timing=b.dataset.time;$$('[data-time]').forEach(x=>x.classList.toggle('on',x===b))});
 $('#col-exp').onclick=exportColetiva;$('#col-imp').onclick=importColetiva;
 $('#col-delall').onclick=async()=>{const t=colTable(),n=G().collective.filter(r=>r.table===t.id).length;if(!n){toast('Não há registos para apagar.');return}
  if(!await confirmBox('Apagar registos',`Apagar os <b>${n}</b> registos da tabela <b>${esc(t.title)}</b>?`,'Apagar todos'))return;
  G().collective=G().collective.filter(r=>r.table!==t.id);col.editing=null;save();renderColForm();renderColRecords();toast('Registos apagados')};
 $('#col-tbody').addEventListener('click',async e=>{const ed=e.target.closest('[data-edit]'),dl=e.target.closest('[data-del]');
  if(ed){col.editing=ed.dataset.edit;const r=G().collective.find(x=>x.id===col.editing);col.timing=r&&r.timing||'+10s';col.showWarn=false;renderColForm();renderColRecords();$('#view-coletiva').scrollIntoView({behavior:'smooth'})}
  if(dl){if(!await confirmBox('Apagar registo','Apagar este registo?','Apagar'))return;G().collective=G().collective.filter(r=>r.id!==dl.dataset.del);if(col.editing===dl.dataset.del)col.editing=null;save();renderColForm();renderColRecords()}});
 renderColTabs();renderColForm();renderColRecords();
}
function renderColTabs(){$('#col-tabs').innerHTML=COL_TABLES.map((t,i)=>`<button type="button" role="tab" class="tab ${col.active===t.id?'on':''}" data-tab="${t.id}" aria-selected="${col.active===t.id}"><small>${String(i+1).padStart(2,'0')}</small>${esc(t.tab)}</button>`).join('')}
function renderColForm(){
 const t=colTable(),g=G(),r=col.editing?g.collective.find(x=>x.id===col.editing):null;
 const period=r?r.period:g.period, attack=r?r.attack:(S().autoAttack?nextAttack(t.id,period):'');
 const fh=([k,label,opts,kind])=>{const val=r?r[k]:'';
  if(kind==='toggle')return `<div class="field"><span class="lbl">${label}</span><div class="timing">${opts.map(o=>`<button type="button" data-time="${o}" class="${col.timing===o?'on':''}">${o}</button>`).join('')}</div></div>`;
  if(kind==='notes')return `<div class="field wide"><label for="cf-${k}">${label}</label><input id="cf-${k}" value="${esc(val)}" placeholder="Observações (opcional)"></div>`;
  if(kind==='combo')return `<div class="field"><label for="cf-${k}">${label}</label>${comboHTML('cf-'+k,val,'Pesquisar…')}</div>`;
  return `<div class="field"><label for="cf-${k}">${label}</label>${selectHTML('cf-'+k,opts,val)}</div>`};
 $('#col-fields').innerHTML=`<div class="field"><label for="cf-period">Período</label>${selectHTML('cf-period',PERIODS,period,'Escolher')}</div><div class="field"><label for="cf-attack">Nº do ataque</label>${selectHTML('cf-attack',COL_OPTS.attacks,attack,'Escolher')}</div>`+t.fields.map(fh).join('');
 t.fields.filter(f=>f[3]==='combo').forEach(([k,,opts])=>bindCombo($(`[data-combo="cf-${k}"]`),opts));
 $('#cf-period').onchange=e=>{if(!col.editing&&S().autoAttack)$('#cf-attack').value=nextAttack(t.id,e.target.value)};
 $('#col-savelbl').textContent=col.editing?'Atualizar registo':'Guardar registo';
 $('#col-warn').innerHTML=col.editing?`<div class="editing-note" style="margin-top:12px">A editar o ataque nº ${esc(r?r.attack:'')} (${esc(r?r.period:'')} período). Carrega em <b>Atualizar registo</b> ou em Limpar para cancelar.</div>`:'';
 $('#col-title').textContent='Registos — '+t.title;
}
async function colSave(){
 const t=colTable(),g=G();
 const rec={id:col.editing||uid(),table:t.id,period:$('#cf-period').value,attack:$('#cf-attack').value,ts:Date.now()};
 const miss=[];if(!rec.period)miss.push('período');if(!rec.attack)miss.push('nº do ataque');
 t.fields.forEach(([k,label,opts,kind])=>{if(kind==='toggle'){rec[k]=col.timing;return}const el=$('#cf-'+k);rec[k]=el?el.value.trim():'';if(kind!=='notes'&&!rec[k])miss.push(label.toLowerCase());if(kind==='combo'&&rec[k]&&!opts.includes(rec[k]))miss.push(label.toLowerCase()+' (opção válida)')});
 if(miss.length){$('#col-warn').innerHTML=`<div class="warnbox"><b>Faltam pressupostos:</b> ${esc(miss.join(', '))}.</div>`;toast('Faltam pressupostos: '+miss.join(', '),'warn');return}
 if(!col.editing&&g.collective.some(r=>r.table===t.id&&r.period===rec.period&&r.attack===rec.attack)){
  if(!await confirmBox('Ataque repetido',`Já existe o ataque nº <b>${esc(rec.attack)}</b> no ${esc(rec.period)} período nesta tabela. Guardar mesmo assim?`,'Guardar',false))return}
 const prev=col.editing&&g.collective.find(x=>x.id===col.editing);if(prev)rec.ts=prev.ts;
 if(prev)g.collective=g.collective.map(x=>x.id===rec.id?rec:x);else g.collective.push(rec);
 save();toast(prev?'Registo atualizado':`Ataque nº ${rec.attack} guardado`);
 col.editing=null;col.timing='+10s';
 renderColForm();renderColRecords();
}
function renderColRecords(){
 const t=colTable(),g=G(),f=col.filters,k1=t.fields[0][0],k2=t.fields[1][3]==='notes'||t.fields[1][0]==='position'?null:t.fields[1][0];
 const all=g.collective.filter(r=>r.table===t.id);
 const rows=all.filter(r=>(!f.period||r.period===f.period)&&(!f.k1||r[k1]===f.k1)&&(!f.k2||r[k2]===f.k2)&&(!f.outcome||r.outcome===f.outcome)).sort((a,b)=>a.period.localeCompare(b.period)||(+a.attack)-(+b.attack));
 const goals=rows.filter(r=>r.outcome==='GOLO').length,ex=rows.filter(r=>r.outcome==='EXCLUSÃO'||r.outcome==='PENALTI').length;
 $('#col-sum').innerHTML=t.side==='att'
  ?`<span><b>${rows.length}</b>ataques</span><span><b>${goals}</b>golos</span><span><b>${pct(goals,rows.length)}%</b>eficácia</span><span><b>${ex}</b>exclusões/penáltis ganhos</span>`
  :`<span><b>${rows.length}</b>ataques do adversário</span><span><b>${goals}</b>golos sofridos</span><span><b>${rows.length?100-pct(goals,rows.length):0}%</b>ataques travados</span><span><b>${ex}</b>exclusões/penáltis cometidos</span>`;
 const opt=(arr,val)=>arr.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('');
 const fd1=t.fields[0],fd2=k2?t.fields[1]:null;
 $('#col-filters').innerHTML=`<div class="field"><label for="cfl-p">Período</label><select id="cfl-p"><option value="">Todos</option>${opt(PERIODS,f.period)}</select></div>
  <div class="field"><label for="cfl-1">${esc(fd1[1])}</label><select id="cfl-1"><option value="">Todas</option>${opt(fd1[2],f.k1)}</select></div>
  ${fd2?`<div class="field"><label for="cfl-2">${esc(fd2[1])}</label><select id="cfl-2"><option value="">Todas</option>${opt(fd2[2],f.k2)}</select></div>`:''}
  <div class="field"><label for="cfl-o">Outcome</label><select id="cfl-o"><option value="">Todos</option>${opt(COL_OPTS.outcomes,f.outcome)}</select></div>
  <button type="button" class="btn btn-ghost btn-sm" id="cfl-reset">${icon('reset')}Limpar filtros</button>`;
 const on=(id,key)=>{const el=$(id);if(el)el.onchange=e=>{f[key]=e.target.value;renderColRecords()}};
 on('#cfl-p','period');on('#cfl-1','k1');on('#cfl-2','k2');on('#cfl-o','outcome');
 $('#cfl-reset').onclick=()=>{col.filters={};renderColRecords()};
 const keys=['period','attack',...t.fields.map(x=>x[0])];
 $('#col-thead').innerHTML='<tr>'+['#','Período','Nº Ataque',...t.fields.map(x=>x[1]),'Ações'].map(h=>`<th>${esc(h)}</th>`).join('')+'</tr>';
 $('#col-tbody').innerHTML=rows.length?rows.map((r,i)=>`<tr ${col.editing===r.id?'style="background:#e3f0fb"':''}><td>${i+1}</td>${keys.map(k=>{const v=r[k];
   if(k==='outcome')return `<td><span class="badge ${outcomeTone(v,t.side)}">${esc(v)}</span></td>`;
   if(k==='timing')return `<td><span class="badge ${v==='+10s'?'t-good':'t-bad'}" style="min-width:52px">${esc(v)}</span></td>`;
   if(k==='notes')return `<td class="l" style="min-width:160px">${esc(v||'—')}</td>`;
   return `<td>${esc(v||'—')}</td>`}).join('')}<td style="white-space:nowrap"><button type="button" class="rowbtn" data-edit="${r.id}" title="Editar">${icon('edit')}</button><button type="button" class="rowbtn del" data-del="${r.id}" title="Apagar">${icon('trash')}</button></td></tr>`).join('')
  :`<tr><td class="empty" colspan="${keys.length+2}">Ainda não há registos nesta tabela${Object.values(f).some(Boolean)?' com estes filtros':''}.</td></tr>`;
 $('#col-count').textContent=`${rows.length} registo(s) encontrado(s)`;
}
const COL_CSV=[['table','Tabela'],['period','Período'],['attack','Nº Ataque'],['offense','Jogada Ofensiva'],['defense','Jogada Defensiva / Defesa'],['system','Sistema +1'],['ca','Contra-ataque'],['position','Posição Remate'],['outcome','Outcome'],['timing','Tempo ATQ'],['notes','Notas']];
function exportColetiva(){
 const rows=G().collective.slice().sort((a,b)=>COL_TABLES.findIndex(t=>t.id===a.table)-COL_TABLES.findIndex(t=>t.id===b.table)||a.period.localeCompare(b.period)||(+a.attack)-(+b.attack));
 if(!rows.length){toast('Não há registos para exportar.','warn');return}
 download('estatistica_coletiva_'+fileStamp()+'.csv',toCSV([COL_CSV.map(c=>c[1]),...rows.map(r=>COL_CSV.map(([k])=>k==='table'?(COL_TABLES.find(t=>t.id===r.table)||{}).title:r[k]||''))]));
}
async function importColetiva(){
 const f=await pickFile('.csv,text/csv');if(!f)return;
 const objs=csvObjects(f.text).filter(o=>o['Tabela']&&o['Outcome']!==undefined);
 if(!objs.length){toast('Não encontrei registos. Usa um CSV exportado pela Estatística Coletiva.','bad');return}
 const mode=await askImportMode(objs.length,'estatística coletiva');if(!mode)return;
 const recs=objs.map((o,i)=>{const t=COL_TABLES.find(x=>x.title===o['Tabela']||x.id===o['Tabela']||x.tab===o['Tabela']);if(!t)return null;
  const r={id:uid(),table:t.id,ts:Date.now()+i};COL_CSV.slice(1).forEach(([k,h])=>{if(k==='table')return;if(k==='period'||k==='attack'||t.fields.some(x=>x[0]===k))r[k]=o[h]||''});if(t.fields.some(x=>x[0]==='timing')&&!r.timing)r.timing='+10s';return r}).filter(Boolean);
 const g=G();g.collective=mode==='replace'?recs:g.collective.concat(recs);save();renderColetiva();toast(recs.length+' registo(s) importado(s)');
}
