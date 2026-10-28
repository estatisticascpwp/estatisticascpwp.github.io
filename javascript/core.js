'use strict';
/* =========================================================
   SCP STAT — POLO AQUÁTICO · núcleo (utilitários, armazenamento, navegação)
   ========================================================= */
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const PERIODS=['1º','2º','3º','4º'];
const STORE_KEY='scpStatPoloAquatico.v1';
const pct=(a,b)=>b?Math.round(a*100/b):0;
const r3=v=>Math.round(v*1000)/1000;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const norm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
function todayISO(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function fmtClock(s){s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function parseClock(str){const m=String(str??'').trim().match(/^(\d{1,2})(?:\s*[:.,'h]\s*(\d{1,2}))?$/);if(!m)return null;const sec=+(m[2]||0);if(sec>59)return null;return +m[1]*60+sec}
function fmtDate(iso){if(!iso)return '';const p=String(iso).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:iso}
function numPT(v,dec=1){return v==null||v===''?'':String(Math.round(v*Math.pow(10,dec))/Math.pow(10,dec)).replace('.',',')}
function parseNum(v){if(v==null||v==='')return null;const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n}

const ICONS={
 home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 player:'<circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
 team:'<circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="9" r="2.7"/><path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M14 14.6c3.6-.6 7 1.4 7 5.4"/>',
 clock:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
 card:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>',
 chart:'<path d="M4 20V11M10 20V5M16 20v-7M21 20H3"/>',
 download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
 upload:'<path d="M12 16V4M7 9l5-5 5 5M5 21h14"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
 save:'<path d="M5 3h11l3 3v15H5zM8 3v5h7M8 21v-7h8v7"/>',
 reset:'<path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5"/>',
 board:'<rect x="3" y="4" width="18" height="14" rx="1.5"/><path d="M12 4v14M8 21h8"/><circle cx="7.5" cy="9" r="1.3"/><path d="M15 13.5l2.5-2.5M15 11h2.5v2.5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 play:'<path d="M7 4l13 8-13 8z"/>',
 pause:'<path d="M8 4v16M16 4v16"/>',
 filter:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
 open:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 chev:'<path d="M6 9l6 6 6-6"/>',
 phone:'<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
 target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
 roster:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="2.8"/><path d="M7.5 17.5c.6-2.3 2.4-3.4 4.5-3.4s3.9 1.1 4.5 3.4"/>',
 goal:'<path d="M3 19V6h18v13"/><path d="M3 6l3 4h12l3-4M6 10v9M18 10v9M10 10v9M14 10v9"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
};
const icon=(n,cls='')=>`<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ---------- Modelo de dados ---------- */
const DEFAULT_SETTINGS={teamName:'Sporting CP',periodLength:480,maxInPool:7,assistRequired:true,autoAttack:true,resetClockOnPeriod:true};
const S=()=>(typeof DB!=='undefined'&&DB.settings)||DEFAULT_SETTINGS;
const POSITIONS=['Guarda-redes','Pivot','Defesa-pivot','Ponta','Lateral','Central','Universal'];
function defaultRoster(){return Array.from({length:15},(_,i)=>({n:i+1,name:'',gr:i===0||i===12,pos:i===0||i===12?'Guarda-redes':'',hand:''}))}
function defaultOpp(){return Array.from({length:13},(_,i)=>({n:i+1,name:''}))}
function newGame(base,opts={}){
 const L=S().periodLength||480;
 return {
  id:uid(), scpName:S().teamName||'Sporting CP', opponent:'Adversário', date:todayISO(), competition:'', venue:'',
  period:'1º', periodLength:L,
  roster: base&&opts.keepRoster? base.roster.map(p=>({...p})) : defaultRoster(),
  oppRoster: defaultOpp(),
  individual:[], collective:[],
  timer:{events:[], remaining:L, running:false, startedAt:0, seq:0},
  excl:{scp:{},opp:{}}, exclLog:[],
  sprints:PERIODS.map(p=>({period:p,winner:'',player:''})),
  demo:false, created:Date.now(), updated:Date.now()
 };
}
function normalizeGame(g){
 const b=newGame();
 for(const k of Object.keys(b)) if(g[k]===undefined||g[k]===null) g[k]=b[k];
 const r=defaultRoster(); (Array.isArray(g.roster)?g.roster:[]).forEach(p=>{if(p&&p.n>=1&&p.n<=15)r[p.n-1]={...r[p.n-1],...p}}); g.roster=r;
 const o=defaultOpp(); (Array.isArray(g.oppRoster)?g.oppRoster:[]).forEach(p=>{if(p&&p.n>=1&&p.n<=13)o[p.n-1]={...o[p.n-1],...p}}); g.oppRoster=o;
 g.timer={...b.timer,...g.timer}; if(!Array.isArray(g.timer.events))g.timer.events=[];
 g.excl=g.excl||{}; g.excl.scp=g.excl.scp||{}; g.excl.opp=g.excl.opp||{};
 if(!Array.isArray(g.sprints)||g.sprints.length!==4) g.sprints=b.sprints;
 ['individual','collective','exclLog'].forEach(k=>{if(!Array.isArray(g[k]))g[k]=[]});
 if(!PERIODS.includes(g.period))g.period='1º';
 return g;
}

let DB={currentId:null,games:{},settings:{...DEFAULT_SETTINGS}};
let storageOK=true;
function load(){
 try{const raw=localStorage.getItem(STORE_KEY); if(raw){const d=JSON.parse(raw); if(d&&d.games)DB=d}}catch(e){storageOK=false}
 DB.settings={...DEFAULT_SETTINGS,...(DB.settings||{})};
 if(!DB.games||!Object.keys(DB.games).length){const g=buildDemoGame(); DB.games={[g.id]:g}; DB.currentId=g.id;}
 Object.values(DB.games).forEach(normalizeGame);
 if(!DB.games[DB.currentId]) DB.currentId=Object.keys(DB.games)[0];
 save(true);
}
const G=()=>DB.games[DB.currentId];
let saveWarned=false;
function save(silent){
 if(!silent&&G())G().updated=Date.now();
 try{localStorage.setItem(STORE_KEY,JSON.stringify(DB));storageOK=true}
 catch(e){storageOK=false;if(!saveWarned){saveWarned=true;toast('Este browser não está a guardar dados. Exporta regularmente para não perderes registos.','bad')}}
 updateHeader();
 if(typeof cloudOnSave==='function')cloudOnSave();
}

/* ---------- Jogador ---------- */
const player=n=>G().roster.find(p=>p.n===+n);
const pname=n=>{const p=player(n);return p&&p.name?p.name:'Jogador '+n};
const plabel=n=>n?`${n} · ${pname(n)}`:'—';
const namedRoster=()=>G().roster.filter(p=>p.n<=13||p.name);

/* ---------- Modal e avisos (sem alert/confirm do browser) ---------- */
function modal({title,body,actions,onOpen}){
 return new Promise(res=>{
  const root=$('#modal-root');
  root.innerHTML=`<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h3>${esc(title)}</h3><div class="modal-body">${body}</div><div class="modal-actions">${actions.map((a,i)=>`<button type="button" class="btn ${a.cls||''}" data-mi="${i}">${esc(a.label)}</button>`).join('')}</div></div></div>`;
  const back=root.firstElementChild;
  const close=v=>{root.innerHTML='';document.removeEventListener('keydown',key);res(v)};
  const key=e=>{if(e.key==='Escape')close(null)};
  document.addEventListener('keydown',key);
  back.addEventListener('click',e=>{if(e.target===back)close(null)});
  $$('[data-mi]',root).forEach(b=>b.onclick=()=>{const a=actions[+b.dataset.mi];const v=a.get?a.get(root):(a.value!==undefined?a.value:true);close(v)});
  const f=root.querySelector('input,select,[data-mi]:last-child'); if(f)f.focus();
  if(onOpen)onOpen(root);
 });
}
function confirmBox(title,msg,ok='Confirmar',danger=true){return modal({title,body:`<p>${msg}</p>`,actions:[{label:'Cancelar',cls:'btn-ghost',value:false},{label:ok,cls:danger?'btn-danger':'btn-primary',value:true}]})}
function toast(msg,type=''){
 const root=$('#toast-root'); if(!root)return;
 const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg; root.appendChild(t);
 setTimeout(()=>t.remove(),type==='warn'||type==='bad'?4200:2400);
}

/* ---------- CSV / ficheiros ---------- */
function csvCell(v){v=v==null?'':String(v);return /[";\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function toCSV(rows){return '﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')}
function download(name,text,type='text/csv;charset=utf-8'){
 const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 toast('Ficheiro exportado: '+name);
}
function parseCSV(text){
 text=String(text).replace(/^﻿/,'');
 const first=text.split(/\r?\n/)[0]||'';
 const sep=first.split(';').length>=first.split(',').length?';':',';
 const rows=[];let row=[],f='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true; else if(c===sep){row.push(f);f=''} else if(c==='\n'){row.push(f);rows.push(row);row=[];f=''} else if(c!=='\r')f+=c;
 }
 if(f!==''||row.length){row.push(f);rows.push(row)}
 return rows.filter(r=>r.some(x=>String(x).trim()!==''));
}
function csvObjects(text){const rows=parseCSV(text);if(rows.length<2)return [];const h=rows[0].map(x=>x.trim());return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,String(r[i]??'').trim()])))}
function pickFile(accept){
 return new Promise(res=>{const inp=document.createElement('input');inp.type='file';inp.accept=accept;
  inp.onchange=()=>{const f=inp.files[0];if(!f)return res(null);const r=new FileReader();r.onload=()=>res({name:f.name,text:String(r.result)});r.onerror=()=>res(null);r.readAsText(f,'utf-8')};
  inp.click()});
}
function askImportMode(n,what){
 return modal({title:'Importar '+what,body:`<p>O ficheiro tem <b>${n}</b> registo(s).</p><p>Queres juntá-los aos registos atuais ou substituir os atuais?</p>`,
  actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Substituir',cls:'btn-danger',value:'replace'},{label:'Juntar',cls:'btn-primary',value:'merge'}]});
}
function fileStamp(){const g=G();return (g.date||todayISO())+'_vs_'+String(g.opponent||'adversario').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w-]+/g,'_')}

/* ---------- Navegação ----------
   Versão de ficheiro único: todas as páginas no mesmo HTML, navegação por #âncora.
   Versão multi-página: cada página é um .html próprio (body data-page="...").      */
let currentView='inicio';
const VIEWS=[
 {id:'inicio',file:'index.html',label:'Início',icon:'home',render:()=>renderHome()},
 {id:'individual',file:'estatistica_individual.html',label:'Individual',icon:'player',render:()=>renderIndividual()},
 {id:'remates',file:'remates.html',label:'Remates',icon:'target',render:()=>renderRemates()},
 {id:'jogadores',file:'jogadores.html',label:'Jogadores',icon:'roster',render:()=>renderJogadores()},
 {id:'guardaredes',file:'guarda_redes.html',label:'Guarda-Redes',icon:'goal',render:()=>renderGuardaRedes()},
 {id:'coletiva',file:'estatistica_coletiva.html',label:'Coletiva',icon:'team',render:()=>renderColetiva()},
 {id:'tempo',file:'tabela_tempo_jogo.html',label:'Tempo de Jogo',icon:'clock',render:()=>renderTempo()},
 {id:'exclusoes',file:'exclusoes.html',label:'Exclusões',icon:'card',render:()=>renderExclusoes()},
 {id:'analise',file:'interpretacao.html',label:'Interpretação',icon:'chart',render:()=>renderAnalise()},
 {id:'taticas',file:'quadro_tatico.html',label:'Quadro Tático',icon:'board',render:()=>renderTaticas()},
 {id:'definicoes',file:'definicoes.html',label:'Definições',icon:'gear',render:()=>renderDefinicoes(),right:true}
];
const MULTI=()=>!!document.body.dataset.page;
const href=id=>{const v=VIEWS.find(x=>x.id===id)||VIEWS[0];return MULTI()?v.file:'#'+v.id};
function goTo(id){if(MULTI()){const f=href(id);if(!location.pathname.endsWith('/'+f))location.href=f;else rerender()}else{if(location.hash==='#'+id)rerender();else location.hash=id}}
function route(){
 const id=MULTI()?document.body.dataset.page:(location.hash.slice(1)||'inicio');
 const v=VIEWS.find(x=>x.id===id)||VIEWS[0];
 const changed=currentView!==v.id; currentView=v.id;
 $$('.view').forEach(s=>s.hidden=s.id!=='view-'+v.id);
 $$('.topbar a[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===v.id));
 v.render(); if(changed)window.scrollTo(0,0);
}
function rerender(){const v=VIEWS.find(x=>x.id===currentView);if(v)v.render()}
function renderHeader(){
 const link=v=>`<a href="${href(v.id)}" data-view="${v.id}" ${v.right?'class="nav-right" title="Definições"':''}>${icon(v.icon)}<span>${v.label}</span></a>`;
 $('#nav').innerHTML=VIEWS.filter(v=>!v.right).map(link).join('');
 $('#hdr-settings').innerHTML=VIEWS.filter(v=>v.right).map(link).join('');
 $$('.topbar a.brand').forEach(a=>a.href=href('inicio'));
 $('#hdr-period').innerHTML=PERIODS.map(p=>`<button type="button" data-p="${p}" title="${p} período">${p}</button>`).join('');
 $('#hdr-period').onclick=e=>{const b=e.target.closest('[data-p]');if(b)setPeriod(b.dataset.p)};
 updateHeader();
}
function updateHeader(){
 const g=G(); if(!g||!$('#hdr-game'))return;
 const sc=scoreOf(g);
 $('#hdr-game').innerHTML=`<b>SCP ${sc.scp} – ${sc.opp} ${esc(g.opponent||'Adversário')}</b><span class="hg-sub">${esc(fmtDate(g.date))}${g.competition?' · '+esc(g.competition):''}</span>`;
 $$('#hdr-period button').forEach(b=>b.classList.toggle('on',b.dataset.p===g.period));
 $('#demo-banner').hidden=!g.demo;
 if(typeof updateCloudUI==='function')updateCloudUI();
}
async function setPeriod(p){
 const g=G(); if(g.period===p)return;
 const later=g.timer.events.filter(e=>PERIODS.indexOf(e.period)>PERIODS.indexOf(p));
 if(later.length){
  const last=PERIODS[Math.max(...later.map(e=>PERIODS.indexOf(e.period)))];
  if(!await confirmBox('Voltar a um período anterior?',`Já há ${later.length} entrada(s)/saída(s) registadas até ao <b>${last} período</b>. Se voltares ao ${p} período e registares mais movimentos, os tempos de jogo ficam errados.<br><br>Para experimentar a app, cria antes um jogo novo em Início.`,'Mudar mesmo assim'))return;
 }
 g.period=p;
 if(S().resetClockOnPeriod){g.timer.running=false;g.timer.remaining=g.periodLength}
 save(); rerender(); toast(p+' período ativo'+(S().resetClockOnPeriod?' · relógio reposto a '+fmtClock(g.periodLength):''));
}
function scoreOf(g){
 const sum=t=>Object.values(g.excl[t]||{}).reduce((a,x)=>a+(x.goals||0),0);
 return {scp:sum('scp'),opp:sum('opp')};
}

/* ---------- Gestão de jogos (partilhado) ---------- */
async function newGameFlow(){
 const g=G();
 const keep=await modal({title:'Novo jogo',body:`<p>Cria um jogo vazio. O jogo atual fica guardado em "Jogos guardados".</p><label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="m-keep" ${g.demo?'':'checked'}> Manter o plantel do SCP (nomes e GR)</label>`,
  actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Criar jogo',cls:'btn-primary',get:r=>r.querySelector('#m-keep').checked}]});
 if(keep===null)return;
 const n=newGame(g,{keepRoster:keep}); DB.games[n.id]=n; DB.currentId=n.id; save(); resetLocalState();
 goTo('inicio'); toast('Novo jogo criado'); setTimeout(()=>$('#h-opp')&&$('#h-opp').focus(),50);
}
function resetLocalState(){
 if(typeof ind!=='undefined')Object.assign(ind,{mode:'field',editing:null,period:null,player:null,action:null,sit:null,assist:null,f:null,g:null,showWarn:false,filters:{period:'',player:'',action:''}});
 if(typeof col!=='undefined'){col.editing=null;col.filters={}}
 if(typeof jog!=='undefined')jog.sel=null;
 if(typeof grs!=='undefined')grs.who='';
 if(typeof rem!=='undefined')Object.assign(rem,{player:'',res:[]});
}


/* =========================================================
   DOMÍNIO PARTILHADO — ações, zonas, desenho do campo/baliza, tabelas coletivas,
   relógio/turnos, exclusões e auxiliares de análise (usado por várias páginas)
   ========================================================= */
const STD=['6x6','+1','-1','CA','6M','PEN'];
const EXCS=['Natação','Pivot s/ bola','Pivot c/ bola'];
const ACTIONS={
 field:[
  {id:'Golo',sits:STD,assist:true,goal:true,shape:'circle',color:'#1e9e4a'},
  {id:'Defesa',sits:STD,goal:true,shape:'circle',color:'#d93232'},
  {id:'Bloco',sits:STD,shape:'circle',color:'#f08a24'},
  {id:'Fora',sits:STD,shape:'circle',color:'#8a3fc2'},
  {id:'EXC ganha',sits:EXCS,assist:true,shape:'square',color:'#a6e3b8',stroke:'#2d8a4c'},
  {id:'EXC sofrida',sits:EXCS,shape:'square',color:'#f5b3b1',stroke:'#b53b38'},
  {id:'Falta Atacante',sits:['6x6',...EXCS],sitOpt:true,shape:'triangle',color:'#f5c518'},
  {id:'Perda Bola',sits:[...STD,'Pivot c/ bola'],sitOpt:true,shape:'circle',color:'#8d9699'},
  {id:'Roubo Bola',sits:STD,sitOpt:true,shape:'circle',color:'#2f6fd6'},
  {id:'Passe Falhado',sits:STD,shape:'triangle',color:'#d93232'},
  {id:'Bloco Defensivo',sits:STD,shape:'triangle',color:'#1e9e4a'},
  {id:'Canto',sits:[],shape:'diamond',color:'#0e8c8c'}
 ],
 gk:[
  {id:'Golo Sofrido',sits:STD,goal:true,shape:'circle',color:'#d93232'},
  {id:'Defesa GR',sits:STD,goal:true,shape:'circle',color:'#1e9e4a'},
  {id:'Defesa p/ Fora GR',sits:STD,goal:true,shape:'circle',color:'#f5c518'},
  {id:'Fora',sits:STD,shape:'circle',color:'#8a3fc2'}
 ]
};
const actDef=(mode,id)=>ACTIONS[mode].find(a=>a.id===id);
const FIELD_W=160,FIELD_H=80;
const GOAL_CELLS=[['Canto Superior Esquerdo','Meio Superior','Canto Superior Direito'],['Meio Esquerdo','Figura','Meio Direito'],['Canto Inferior Esquerdo','Meio Inferior','Canto Inferior Direito']];
function fieldZone(x,y){
 const m=y*12.5,c=Math.min(2,Math.floor(x*3));
 if(m<2)return 'Zona 2M';
 if(m<6)return ['Ponta Esquerda','Pivot','Ponta Direita'][c];
 if(m<12)return ['Lateral Esquerda','Central','Lateral Direita'][c];
 return 'Meio-campo (+12M)';
}
function goalZone(x,y){
 const X=x*160,Y=y*80;
 if(Y<10)return 'Barra';
 if(X<10)return 'Poste Esquerdo';
 if(X>150)return 'Poste Direito';
 const c=Math.min(2,Math.floor((X-10)/(140/3))),r=Math.min(2,Math.floor((Y-10)/(70/3)));
 return GOAL_CELLS[r][c];
}
function shapeSVG(shape,x,y,s,fill,stroke,sw){
 const f=n=>Math.round(n*100)/100; sw=sw==null?s*.3:sw;
 const st=`fill="${fill}" stroke="${stroke}" stroke-width="${f(sw)}"`;
 if(shape==='square')return `<rect x="${f(x-s)}" y="${f(y-s)}" width="${f(2*s)}" height="${f(2*s)}" rx="${f(s*.18)}" ${st}/>`;
 if(shape==='triangle')return `<polygon points="${f(x)},${f(y-s*1.2)} ${f(x+s*1.15)},${f(y+s*.85)} ${f(x-s*1.15)},${f(y+s*.85)}" stroke-linejoin="round" ${st}/>`;
 if(shape==='diamond')return `<polygon points="${f(x)},${f(y-s*1.2)} ${f(x+s*1.2)},${f(y)} ${f(x)},${f(y+s*1.2)} ${f(x-s*1.2)},${f(y)}" ${st}/>`;
 return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" ${st}/>`;
}
const actIcon=a=>`<svg class="shape" viewBox="-5 -5 10 10" aria-hidden="true">${shapeSVG(a.shape,0,0,3.3,a.color,a.stroke||'rgba(0,0,0,.35)',0.8)}</svg>`;

function pitchMarkup(id){
 const t1=160/3,t2=320/3,y2=12.8,y6=38.4,y12=76.8;
 return `<svg id="${id}" class="court" viewBox="0 0 160 80" role="img" aria-label="Meio-campo: clica para marcar a posição do jogador">
  <defs><pattern id="${id}-lanes" width="160" height="10" patternUnits="userSpaceOnUse"><rect width="160" height="5" fill="#2a7db5"/><rect y="5" width="160" height="5" fill="#2777ae"/></pattern></defs>
  <rect width="160" height="80" fill="url(#${id}-lanes)"/>
  <line x1="${t1}" y1="${y2}" x2="${t1}" y2="${y12}" stroke="#fff" stroke-opacity=".28" stroke-width=".4" stroke-dasharray="1.5 1.5"/>
  <line x1="${t2}" y1="${y2}" x2="${t2}" y2="${y12}" stroke="#fff" stroke-opacity=".28" stroke-width=".4" stroke-dasharray="1.5 1.5"/>
  <line x1="0" y1="${y2}" x2="160" y2="${y2}" stroke="#ff4b4b" stroke-width=".9"/>
  <line x1="0" y1="${y6}" x2="160" y2="${y6}" stroke="#fcd116" stroke-width=".9"/>
  <line x1="0" y1="${y12}" x2="160" y2="${y12}" stroke="#ffffff" stroke-width=".7" stroke-dasharray="3 1.5"/>
  <text x="2" y="${y2-1.2}" font-size="3.6" fill="#ffd2d2">2M</text>
  <text x="2" y="${y6-1.2}" font-size="3.6" fill="#fff1a8">6M</text>
  <text x="2" y="${y12-1.2}" font-size="3.6" fill="#fff">12M</text>
  <g fill="#fff" fill-opacity=".42" font-size="3.4" text-anchor="middle">
   <text x="${t1/2}" y="26.8">PONTA ESQ.</text><text x="80" y="26.8">PIVOT</text><text x="${(t2+160)/2}" y="26.8">PONTA DIR.</text>
   <text x="${t1/2}" y="58.8">LATERAL ESQ.</text><text x="80" y="58.8">CENTRAL</text><text x="${(t2+160)/2}" y="58.8">LATERAL DIR.</text>
  </g>
  <path d="M${t1} 0 V3.2 H${t2} V0" fill="rgba(255,255,255,.28)" stroke="#fff" stroke-width=".9"/>
  <g id="${id}-saved"></g><g id="${id}-temp"></g>
 </svg>`;
}
function goalMarkup(id){
 const cw=140/3,ch=70/3;
 return `<svg id="${id}" class="court" viewBox="0 0 160 80" role="img" aria-label="Baliza: clica para marcar o destino do remate">
  <defs><pattern id="${id}-net" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#e8f0f3"/><path d="M0 0H5M0 0V5" stroke="#c4d3da" stroke-width=".5"/></pattern></defs>
  <rect x="10" y="10" width="140" height="70" fill="url(#${id}-net)"/>
  <g stroke="#7e98a4" stroke-width=".4" stroke-dasharray="1.6 1.4">
   <line x1="${10+cw}" y1="10" x2="${10+cw}" y2="80"/><line x1="${10+2*cw}" y1="10" x2="${10+2*cw}" y2="80"/>
   <line x1="10" y1="${10+ch}" x2="150" y2="${10+ch}"/><line x1="10" y1="${10+2*ch}" x2="150" y2="${10+2*ch}"/>
  </g>
  <g fill="#5d7884" fill-opacity=".55" font-size="3.2" text-anchor="middle">
   ${GOAL_CELLS.map((row,r)=>row.map((n,c)=>`<text x="${10+cw*c+cw/2}" y="${10+ch*r+ch/2+1.2}">${n.replace('Canto ','').replace('Superior','Sup.').replace('Inferior','Inf.').replace('Esquerdo','Esq.').replace('Direito','Dir.').toUpperCase()}</text>`).join('')).join('')}
  </g>
  <rect x="0" y="0" width="10" height="80" fill="#fafafa" stroke="#8aa0a8" stroke-width=".5"/>
  <rect x="150" y="0" width="10" height="80" fill="#fafafa" stroke="#8aa0a8" stroke-width=".5"/>
  <rect x="0" y="0" width="160" height="10" fill="#fafafa" stroke="#8aa0a8" stroke-width=".5"/>
  <text x="80" y="6.6" font-size="3.6" fill="#8aa0a8" text-anchor="middle">BARRA</text>
  <text x="5" y="45" font-size="3.2" fill="#8aa0a8" text-anchor="middle" transform="rotate(-90 5 45)">POSTE</text>
  <text x="155" y="45" font-size="3.2" fill="#8aa0a8" text-anchor="middle" transform="rotate(90 155 45)">POSTE</text>
  <g id="${id}-saved"></g><g id="${id}-temp"></g>
 </svg>`;
}
function svgPoint(svg,e){
 const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
 const p=pt.matrixTransform(svg.getScreenCTM().inverse());
 return {x:r3(clamp(p.x/160,0,1)),y:r3(clamp(p.y/80,0,1))};
}
const tempMarker=(x,y)=>`<circle cx="${x*160}" cy="${y*80}" r="3.3" fill="none" stroke="#0b2e1d" stroke-width="1.5"/><circle cx="${x*160}" cy="${y*80}" r="3.3" fill="none" stroke="#fcd116" stroke-width=".8"/>`;


const COL_OPTS={
 attacks:Array.from({length:25},(_,i)=>String(i+1)),
 positions:['Posição 1','Posição 2','Posição 3','Posição 4','Posição 5','1º Pivot','2º Pivot','6m P2','6m P3','6m P4','PENALTI'],
 outcomes:['GOLO','DEFESA','FALHOU','EXCLUSÃO','PENALTI','ROUBO BOLA','PERDA BOLA','FALTA ATACANTE','FORA DE JOGO','TEMPO ATAQUE ACABOU'],
 offSCP:['1 para pivot','2 para 1','2 cruzada','2 entra a pivot','3 para 1','3 para 5','3 para pivot','4 para 5','4 para 1','4 entra a pivot','5 para pivot','Bloqueio Esq','Bloqueio Direita','Bloqueio Central','2 Pivots (puro)','Ataque contra M','Jogada 1x1','Estático'],
 offOther:['1 para pivot','2 para 1','2 cruzada','2 entra a pivot','3 para 1','3 para 5','3 para pivot','4 para 5','4 para 1','4 entra a pivot','5 para pivot','Bloqueio Esq','Bloqueio Direita','Bloqueio Central','2 Pivots (puro)','Ataque contra M','Jogada 1x1'],
 defense:['Zona 1','Zona 12','Zona 123','Zona 234','Zona M pura','Zona M para a Dir','Zona M Risco','Zona Total','P + Zona 1','P + Zona 12','P + Zona 123','P + Zona 234','P + Zona M','P + Zona M Risco','P + Zona Total','Pressão Total','Zona 45','Zona 34','Zona 4 2'],
 systems:['3-3','4-2','Puxar dir','Puxar esq'],
 defPlus:['Blocos','1 a sair','2 a sair','3 a sair','4 a sair','Saltar no 3 passe','Pressão esq','Pressão direita'],
 ca:['1-0','2-1','3-2','4-3','5-4','2-0','3-1','4-2','5-3']
};
const F_POS=['position','Posição Remate',COL_OPTS.positions],F_OUT=['outcome','Outcome',COL_OPTS.outcomes],F_TIME=['timing','Tempo de ATQ',['+10s','-10s'],'toggle'],F_NOTES=['notes','Notas',null,'notes'];
const COL_TABLES=[
 {id:'scp',tab:'Ataque SCP',side:'att',title:'Ataque SCP vs Defesa Adversária',fields:[['offense','Jogada Ofensiva SCP',COL_OPTS.offSCP,'combo'],['defense','Jogada Defensiva Adversário',COL_OPTS.defense,'combo'],F_POS,F_OUT,F_TIME]},
 {id:'other',tab:'Ataque Adversário',side:'def',title:'Ataque Adversário vs Defesa SCP',fields:[['offense','Jogada Ofensiva Adversário',COL_OPTS.offOther,'combo'],['defense','Jogada Defensiva SCP',COL_OPTS.defense,'combo'],F_POS,F_OUT,F_TIME]},
 {id:'plus',tab:'SCP +1',side:'att',title:'Superioridade SCP (+1)',fields:[['system','SCP +1',COL_OPTS.systems],['defense','Defesa Adversário',COL_OPTS.defPlus],F_POS,F_OUT,F_NOTES]},
 {id:'minus',tab:'Adversário +1',side:'def',title:'Inferioridade SCP (−1)',fields:[['system','Adversário +1',COL_OPTS.systems],['defense','Defesa SCP (−1)',COL_OPTS.defPlus],F_POS,F_OUT,F_NOTES]},
 {id:'caSCP',tab:'Contra-ataque SCP',side:'att',title:'Contra-ataque SCP',fields:[['ca','CA SCP',COL_OPTS.ca],F_POS,F_OUT,F_NOTES]},
 {id:'caOther',tab:'Contra-ataque Adv.',side:'def',title:'Contra-ataque Adversário',fields:[['ca','CA Adversário',COL_OPTS.ca],F_POS,F_OUT,F_NOTES]}
];
function outcomeTone(o,side){
 if(o==='EXCLUSÃO'||o==='PENALTI')return 't-warn';
 if(o==='GOLO')return side==='att'?'t-good':'t-bad';
 if(['DEFESA','FALHOU','ROUBO BOLA','PERDA BOLA','FALTA ATACANTE','FORA DE JOGO','TEMPO ATAQUE ACABOU'].includes(o))return side==='att'?'t-bad':'t-good';
 return 't-neutral';
}
function selectHTML(id,arr,val,ph){return `<select id="${id}"><option value="">${ph||'Selecionar…'}</option>${arr.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('')}</select>`}

/* combobox pesquisável */
function comboHTML(id,val,ph){return `<div class="combo" data-combo="${id}"><input id="${id}" autocomplete="off" spellcheck="false" placeholder="${esc(ph)}" value="${esc(val||'')}" role="combobox" aria-expanded="false" aria-autocomplete="list">${icon('chev','chev')}<ul class="combo-list" role="listbox" hidden></ul></div>`}
function bindCombo(root,opts){
 const inp=root.querySelector('input'),list=root.querySelector('ul');let items=[],idx=0,typed=false;
 const hl=o=>{const q=norm(inp.value);if(!typed||!q)return esc(o);const i=norm(o).indexOf(q);return i<0?esc(o):esc(o.slice(0,i))+'<mark>'+esc(o.slice(i,i+q.length))+'</mark>'+esc(o.slice(i+q.length))};
 const show=()=>{const q=norm(inp.value);items=typed&&q?opts.filter(o=>norm(o).includes(q)):opts.slice();if(idx>=items.length)idx=0;
  list.innerHTML=items.length?items.map((o,i)=>`<li role="option" data-v="${esc(o)}" class="${i===idx?'on':''}">${hl(o)}</li>`).join(''):'<li class="none">Sem resultados</li>';list.hidden=false;inp.setAttribute('aria-expanded','true');
  const on=list.querySelector('li.on');if(on)on.scrollIntoView({block:'nearest'})};
 const hide=()=>{list.hidden=true;inp.setAttribute('aria-expanded','false')};
 const choose=v=>{inp.value=v;typed=false;hide();inp.dispatchEvent(new Event('change',{bubbles:true}))};
 inp.addEventListener('focus',()=>{typed=false;idx=Math.max(0,opts.indexOf(inp.value));show();inp.select()});
 inp.addEventListener('input',()=>{typed=true;idx=0;show()});
 inp.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){e.preventDefault();if(list.hidden)show();idx=Math.min(items.length-1,idx+1);show()}
  else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(0,idx-1);show()}
  else if(e.key==='Enter'){if(!list.hidden&&items[idx]){e.preventDefault();choose(items[idx])}}
  else if(e.key==='Escape'){hide()}
  else if(e.key==='Tab'){if(!list.hidden&&typed&&items[idx])choose(items[idx])}});
 list.addEventListener('mousedown',e=>{e.preventDefault();const li=e.target.closest('li[data-v]');if(li)choose(li.dataset.v)});
 inp.addEventListener('blur',()=>{setTimeout(()=>{hide();if(inp.value&&!opts.includes(inp.value)){const m=opts.find(o=>norm(o)===norm(inp.value))||(items.length===1?items[0]:null);inp.value=m||'';if(!m)toast('Escolhe uma opção da lista.','warn')}typed=false},120)});
}


const maxPool=()=>S().maxInPool||7;
function clockNow(){const t=G().timer;if(!t.running)return t.remaining;return Math.max(0,t.remaining-(Date.now()-t.startedAt)/1000)}
function absTime(period,clock){const L=G().periodLength;return Math.max(0,PERIODS.indexOf(period))*L+(L-clock)}
function nowAbs(){return absTime(G().period,clockNow())}
/* Quem está na água: decidido pela ORDEM em que os movimentos foram registados (seq),
   não pelo relógio — assim mudar de período ou acertar o relógio nunca baralha o estado.
   A duração de cada turno vem do período + relógio de cada movimento. */
function computeShifts(){
 const g=G(),ev=g.timer.events.slice().sort((a,b)=>(a.seq||0)-(b.seq||0)||(a.ts||0)-(b.ts||0));
 const res={},issues=new Set();g.roster.forEach(p=>res[p.n]={inSince:null,inEv:null,shifts:[],closed:0});
 ev.forEach(e=>{const s=res[e.n];if(!s)return;const t=absTime(e.period,e.clock);
  if(e.type==='in'){if(s.inSince==null){s.inSince=t;s.inEv=e.id}else issues.add(e.id)}
  else if(s.inSince!=null){const raw=t-s.inSince;if(raw<0){issues.add(e.id);issues.add(s.inEv)}const d=Math.max(0,raw);s.shifts.push({from:s.inSince,to:t,dur:d});s.closed+=d;s.inSince=null;s.inEv=null}
  else issues.add(e.id)});
 const now=nowAbs();
 Object.values(res).forEach(s=>{s.on=s.inSince!=null;s.ahead=s.on&&now<s.inSince;s.open=s.on?Math.max(0,now-s.inSince):0;s.total=s.closed+s.open;s.count=s.shifts.length+(s.on?1:0);s.last=s.on?s.open:(s.shifts.length?s.shifts[s.shifts.length-1].dur:0)});
 computeShifts.issues=issues;
 return res;
}

function exOf(team,n){const t=G().excl[team];if(!t[n])t[n]={ex:0,red:false,goals:0};return t[n]}
function exLog(team,n,type){const g=G();g.exclLog.push({id:uid(),team,n,type,period:g.period,clock:Math.round(clockNow()),ts:Date.now()})}
const teamName=t=>t==='scp'?(G().scpName||'Sporting CP'):(G().opponent||'Adversário');
const exName=(t,n)=>{const r=t==='scp'?player(n):G().oppRoster[n-1];return r&&r.name?r.name:'Jogador '+n};

const SHOT_ACTS=['Golo','Defesa','Bloco','Fora'];
const ZONE_RECTS=[['Zona 2M',0,0,160,12.8],['Ponta Esquerda',0,12.8,160/3,25.6],['Pivot',160/3,12.8,160/3,25.6],['Ponta Direita',320/3,12.8,160/3,25.6],['Lateral Esquerda',0,38.4,160/3,38.4],['Central',160/3,38.4,160/3,38.4],['Lateral Direita',320/3,38.4,160/3,38.4],['Meio-campo (+12M)',0,76.8,160,3.2]];
function groupBy(rows,key){const m=new Map();rows.forEach(r=>{const k=typeof key==='function'?key(r):r[key];if(k==null||k==='')return;if(!m.has(k))m.set(k,[]);m.get(k).push(r)});return m}
function effRows(map,isGood){return [...map].map(([k,rs])=>({k,n:rs.length,g:rs.filter(isGood).length})).map(x=>({...x,e:pct(x.g,x.n)}))}
function barsHTML(items,{max,fmt,bad}={}){
 if(!items.length)return '<div class="nodata">Ainda sem registos suficientes.</div>';
 const M=max||Math.max(...items.map(i=>i.v),1);
 return `<div class="bars">${items.map(i=>`<div class="bar-row"><span class="bl" title="${esc(i.label)}">${esc(i.label)}</span><div class="bar"><i class="${bad||i.bad?'bad':''}" style="width:${Math.max(2,i.v*100/M)}%"></i></div><span class="bv">${fmt?fmt(i):i.v}</span></div>`).join('')}</div>`;
}
function zoneMapSVG(shots){
 const by=groupBy(shots,'fzone');
 return `<svg class="court" viewBox="0 0 160 80" style="cursor:default" role="img" aria-label="Eficácia de remate por zona">
  <rect width="160" height="80" fill="#2a7db5"/>
  ${ZONE_RECTS.map(([z,x,y,w,h])=>{const rs=by.get(z)||[],n=rs.length,gg=rs.filter(r=>r.action==='Golo').length,e=n?gg/n:0;
   return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${n?`rgba(252,209,22,${(0.12+0.75*e).toFixed(2)})`:'transparent'}" stroke="rgba(255,255,255,.5)" stroke-width=".4"/>${h>8&&n?`<text x="${x+w/2}" y="${y+h/2-1}" text-anchor="middle" font-size="7" fill="#fff" style="paint-order:stroke" stroke="#0b3a55" stroke-width=".8">${Math.round(e*100)}%</text><text x="${x+w/2}" y="${y+h/2+5}" text-anchor="middle" font-size="3.6" fill="#fff">${gg}/${n} golos</text>`:''}`}).join('')}
  <line x1="0" y1="12.8" x2="160" y2="12.8" stroke="#ff4b4b" stroke-width=".8"/><line x1="0" y1="38.4" x2="160" y2="38.4" stroke="#fcd116" stroke-width=".8"/>
  <path d="M53.33 0 V3.2 H106.67 V0" fill="rgba(255,255,255,.3)" stroke="#fff" stroke-width=".8"/>
 </svg>`;
}
function goalHeatSVG(rows,color){
 const by=groupBy(rows,'gzone'),max=Math.max(1,...[...by.values()].map(x=>x.length)),cw=140/3,ch=70/3;
 const cell=(z,x,y,w,h,fs)=>{const n=(by.get(z)||[]).length;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${n?color:'transparent'}" fill-opacity="${n?(0.15+0.7*n/max).toFixed(2):0}" stroke="#a9bcc4" stroke-width=".4"/>${n?`<text x="${x+w/2}" y="${y+h/2+fs*.35}" text-anchor="middle" font-size="${fs}" fill="#102b24">${n}</text>`:''}`};
 return `<svg class="court" viewBox="0 0 160 80" style="cursor:default" role="img" aria-label="Destino na baliza">
  <rect x="10" y="10" width="140" height="70" fill="#eef4f6"/>
  ${GOAL_CELLS.map((row,r)=>row.map((z,c)=>cell(z,10+cw*c,10+ch*r,cw,ch,9)).join('')).join('')}
  <rect x="0" y="0" width="10" height="80" fill="#fafafa" stroke="#8aa0a8" stroke-width=".5"/>${cell('Poste Esquerdo',0,10,10,70,5)}
  <rect x="150" y="0" width="10" height="80" fill="#fafafa" stroke="#8aa0a8" stroke-width=".5"/>${cell('Poste Direito',150,10,10,70,5)}
  <rect x="0" y="0" width="160" height="10" fill="#fafafa" stroke="#8aa0a8" stroke-width=".5"/>${cell('Barra',10,0,140,10,6)}
 </svg>`;
}
/* ---------- auxiliares de desenho partilhados pelas páginas de análise ---------- */
function markerGroup(rows,which,stroke,size=2.5){
 return rows.filter(r=>r[which+'x']!=null).map(r=>{const a=actDef(r.mode,r.action)||{shape:'circle',color:'#999'};
  return `<g class="mk" data-id="${r.id}"><title>${esc(r.period+' · '+plabel(r.player)+' · '+r.action+(r.sit?' · '+r.sit:'')+(r[which==='f'?'fzone':'gzone']?' · '+r[which==='f'?'fzone':'gzone']:''))}</title>${shapeSVG(a.shape,r[which+'x']*160,r[which+'y']*80,size,a.color,a.stroke||stroke,.7)}</g>`}).join('');
}
const kpiBox=(k,v,s)=>`<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s||''}</div></div>`;
const FIELD_ZONES=['Zona 2M','Ponta Esquerda','Pivot','Ponta Direita','Lateral Esquerda','Central','Lateral Direita','Meio-campo (+12M)'];
const GOAL_ZONES=['Barra','Poste Esquerdo','Poste Direito',...GOAL_CELLS.flat()];
const DIST_BANDS=[['0–2 m',0,2],['2–6 m',2,6],['6–12 m',6,12],['+12 m',12,99]];
const distBand=r=>{if(r.fy==null)return null;const m=r.fy*12.5;const b=DIST_BANDS.find(([,a,z])=>m>=a&&m<z);return b?b[0]:null};
const heatCell=(v,max,color)=>v?`<span class="heat" style="background:${color.replace('A',(0.12+0.6*v/Math.max(1,max)).toFixed(2))}">${v}</span>`:'<span class="muted">·</span>';
const fmtPct=(a,b)=>b?pct(a,b)+'%':'—';

/* =========================================================
   PWA — instalação no ecrã principal, funcionamento offline e atualizações.
   Só ativa na versão em pasta alojada num endereço https (tem <link rel="manifest">).
   ========================================================= */
const APP_VERSION='001218d85a';
const pwa={deferred:null,reg:null,waiting:false};
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isPWABuild=()=>!!document.querySelector('link[rel="manifest"]');
const canPWA=()=>isPWABuild()&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
function pwaStatus(){
 if(!isPWABuild())return 'single';
 if(isStandalone())return 'installed';
 if(!canPWA())return 'nohttps';
 if(pwa.deferred)return 'prompt';
 if(isIOS())return 'ios';
 return 'manual';
}
function installInstructionsHTML(){
 if(isIOS())return `<ol class="steps-list"><li>Abre esta página no <b>Safari</b>.</li><li>Toca no botão <b>Partilhar</b> (quadrado com uma seta para cima).</li><li>Escolhe <b>Adicionar ao ecrã principal</b> e confirma.</li></ol><p class="muted small">No iPad, os dados registados no Safari e na app instalada ficam separados. Instala primeiro e regista os jogos já na app (ou usa Exportar/Importar jogo para os passar).</p>`;
 return `<ol class="steps-list"><li>No <b>Chrome</b> ou <b>Edge</b>, abre o menu <b>⋮</b>.</li><li>Escolhe <b>Instalar app</b> ou <b>Adicionar ao ecrã principal</b>.</li><li>Confirma. A SCP Stat fica com ícone próprio e abre em ecrã inteiro.</li></ol>`;
}
async function promptInstall(){
 const st=pwaStatus();
 if(st==='prompt'){
  const ev=pwa.deferred;pwa.deferred=null;ev.prompt();
  try{const r=await ev.userChoice;toast(r.outcome==='accepted'?'A instalar a SCP Stat…':'Instalação cancelada')}catch(e){}
  updateInstallUI();return;
 }
 if(st==='nohttps'){modal({title:'Instalar a app',body:'<p>Para instalar, a app tem de estar alojada num endereço <b>https://</b> (por exemplo GitHub Pages). Aberta a partir de um ficheiro no dispositivo, não é possível instalar.</p><p class="muted small">A app oficial está em https://estatisticascpwp.github.io/</p>',actions:[{label:'Fechar',cls:'btn-primary',value:true}]});return}
 modal({title:'Instalar a SCP Stat',body:installInstructionsHTML(),actions:[{label:'Fechar',cls:'btn-primary',value:true}]});
}
function installCardHTML(){
 const st=pwaStatus();
 const txt={
  installed:'A SCP Stat está instalada neste dispositivo e funciona sem internet.',
  prompt:'Instala a SCP Stat no ecrã principal: abre em ecrã inteiro e funciona sem internet.',
  ios:'No iPhone/iPad instala pelo Safari: Partilhar › Adicionar ao ecrã principal.',
  manual:'Instala pelo menu do browser (Instalar app / Adicionar ao ecrã principal).',
  nohttps:'Para instalar, abre a app em https://estatisticascpwp.github.io/',
  single:'Esta é a versão de ficheiro único. Para instalar como app usa a versão em pasta alojada num endereço https://.'
 }[st];
 const btn=st==='installed'||st==='single'?'':`<button type="button" class="btn btn-primary" data-install>${icon('download')}${st==='prompt'?'Instalar app':'Como instalar'}</button>`;
 return `<div class="install-card ${st}"><span class="pi">${icon(st==='installed'?'save':'phone')}</span><div><b>${st==='installed'?'App instalada':'Instalar no tablet ou telemóvel'}</b><p>${txt}</p></div>${btn}</div>`;
}
function updateInstallUI(){
 const st=pwaStatus(),b=$('#hdr-install');
 if(b){b.hidden=!(st==='prompt'||st==='ios');}
 $$('.install-slot').forEach(s=>s.innerHTML=installCardHTML());
}
function showUpdateBar(){
 if($('#update-bar'))return;
 const bar=document.createElement('div');bar.id='update-bar';bar.className='update-bar';
 bar.innerHTML=`<span>Há uma versão nova da SCP Stat.</span><button type="button" class="btn btn-sm btn-primary" id="update-go">Atualizar agora</button>`;
 document.body.appendChild(bar);
 $('#update-go').onclick=()=>{const w=pwa.reg&&pwa.reg.waiting;if(w){$('#update-go').disabled=true;w.postMessage('skipWaiting')}else location.reload()};
}
function initPWA(){
 document.addEventListener('click',e=>{if(e.target.closest('[data-install]'))promptInstall()});
 const hb=$('#hdr-install');if(hb)hb.onclick=promptInstall;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pwa.deferred=e;updateInstallUI()});
 window.addEventListener('appinstalled',()=>{pwa.deferred=null;updateInstallUI();toast('SCP Stat instalada')});
 if(isStandalone())document.documentElement.classList.add('standalone');
 if(!canPWA()){updateInstallUI();return}
 /* recarregar só quando uma versão nova substitui a anterior (não na primeira instalação) */
 const hadController=!!navigator.serviceWorker.controller;let reloading=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloading)return;reloading=true;location.reload()});
 navigator.serviceWorker.register('sw.js').then(reg=>{
  pwa.reg=reg;
  if(reg.waiting&&navigator.serviceWorker.controller)showUpdateBar();
  reg.addEventListener('updatefound',()=>{const nw=reg.installing;if(!nw)return;nw.addEventListener('statechange',()=>{if(nw.state==='installed'&&navigator.serviceWorker.controller)showUpdateBar()})});
  setInterval(()=>reg.update().catch(()=>{}),30*60*1000);
 }).catch(err=>console.warn('Service worker não registado',err));
 /* pedir ao browser para não apagar os dados guardados quando houver pouco espaço */
 if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(p=>{if(!p)navigator.storage.persist()}).catch(()=>{});
 updateInstallUI();
}

/* =========================================================
   BASE DE DADOS DA EQUIPA (Firebase Firestore)
   - A app continua a trabalhar sobre a cópia local (funciona sem rede).
   - Cada registo é um documento: jogos/{jogo} (dados gerais) e jogos/{jogo}/registos/{registo}.
   - Envio: compara o estado local com o último estado sincronizado (impressões digitais) e envia só o que mudou.
   - Receção: só aplica o que mudou mesmo na nuvem desde a última sincronização (fusão a 3 vias),
     por isso edições locais ainda por enviar não se perdem.
   - Jogos de exemplo nunca são enviados.
   ========================================================= */
const CLOUD_CFG={
 sdk:'12.19.0',
 email:'estatisticascpwp+app@gmail.com',
 firebase:{
  apiKey:'AIzaSyAUpeVeIxrnFTYGViYPUPSMT-_btDbMddU',
  authDomain:'scp-stat.firebaseapp.com',
  projectId:'scp-stat',
  storageBucket:'scp-stat.firebasestorage.app',
  messagingSenderId:'795840439047',
  appId:'1:795840439047:web:07fd4159d3255c3b7e5ba2'
 }
};
const SYNC_KEY='scpStatPoloAquatico.sync.v1';
const CLOUD_DISMISS_KEY='scpStatPoloAquatico.cloudDismissed';
const META_FIELDS=['scpName','opponent','date','competition','venue','period','periodLength','roster','oppRoster','timer','sprints','created','updated'];

/* ---------- funções puras (testadas fora do browser) ---------- */
function stableStr(v){
 if(v===undefined)return 'null';
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(stableStr).join(',')+']';
 return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stableStr(v[k])).join(',')+'}';
}
function fnv(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)}return (h>>>0).toString(36)}
const hashOf=v=>fnv(stableStr(v));
const plain=v=>JSON.parse(JSON.stringify(v===undefined?null:v));
function metaOf(g){
 const m={};
 META_FIELDS.forEach(k=>{m[k]=k==='timer'?{remaining:g.timer.remaining,running:!!g.timer.running,startedAt:g.timer.startedAt||0,seq:g.timer.seq||0}:g[k]});
 return plain(m);
}
/** documentos de registo de um jogo: id do documento -> conteúdo */
function recDocsOf(g){
 const out={};
 const add=(pre,tipo,arr)=>(arr||[]).forEach(r=>{out[pre+r.id]=plain({...r,tipo})});
 add('ind_','ind',g.individual);add('col_','col',g.collective);add('tmp_','tmp',g.timer.events);add('exl_','exl',g.exclLog);
 // só jogadores com alguma coisa registada (o ecrã das Exclusões cria entradas a zero para todos)
 ['scp','opp'].forEach(t=>Object.entries((g.excl||{})[t]||{}).forEach(([n,o])=>{if(!(o.ex||o.red||o.goals))return;out[`exc_${t}_${n}`]={tipo:'exc',team:t,n:+n,ex:o.ex||0,red:!!o.red,goals:o.goals||0}}));
 return out;
}
/** o que mudou localmente desde a última sincronização */
function diffGame(g,synced){
 const next={...synced},meta={},sets={},dels=[];let hasMeta=false;
 const m=metaOf(g);
 META_FIELDS.forEach(k=>{const h=hashOf(m[k]);if(next['m:'+k]!==h){meta[k]=m[k];next['m:'+k]=h;hasMeta=true}});
 const recs=recDocsOf(g);
 Object.entries(recs).forEach(([id,p])=>{const h=hashOf(p);if(next[id]!==h){sets[id]=p;next[id]=h}});
 Object.keys(next).forEach(k=>{if(!k.startsWith('m:')&&!(k in recs)){dels.push(k);delete next[k]}});
 return {meta:hasMeta?meta:null,sets,dels,next};
}
const stripCloud=d=>{const o={...d};delete o.upd;delete o.del;return o};
/** aplica um documento de registo vindo da nuvem; devolve true se mudou o jogo local */
function applyRecDoc(g,synced,id,data){
 const remote=data.del?null:stripCloud(data);
 const rh=remote?hashOf(remote):undefined;
 if(synced[id]===rh)return false;            // nada mudou na nuvem para este registo
 const t=id.slice(0,3);
 if(t==='exc'){
  const p=id.split('_'),team=p[1],n=p[2];
  if(team!=='scp'&&team!=='opp')return false;
  g.excl[team]=g.excl[team]||{};
  if(remote)g.excl[team][n]={ex:remote.ex||0,red:!!remote.red,goals:remote.goals||0};else delete g.excl[team][n];
 }else{
  const arr=t==='ind'?g.individual:t==='col'?g.collective:t==='tmp'?g.timer.events:t==='exl'?g.exclLog:null;
  if(!arr)return false;
  const rid=id.slice(4),i=arr.findIndex(r=>r.id===rid);
  if(remote){const rec={...remote};delete rec.tipo;if(i>=0)arr[i]=rec;else arr.push(rec)}
  else if(i>=0)arr.splice(i,1);
 }
 if(remote)synced[id]=rh;else delete synced[id];
 return true;
}
/** aplica os dados gerais de um jogo vindos da nuvem (só os campos que mudaram lá) */
function applyMeta(g,synced,data){
 let changed=false;
 META_FIELDS.forEach(k=>{
  if(!(k in data))return;
  const v=plain(data[k]),h=hashOf(v);
  if(synced['m:'+k]===h)return;
  if(k==='timer')g.timer={...g.timer,...v,events:g.timer.events};else g[k]=v;
  synced['m:'+k]=h;changed=true;
 });
 return changed;
}

/* ---------- estado e armazenamento da sincronização ---------- */
const cloud={fb:null,auth:null,db:null,user:null,state:'off',error:'',ready:false,metaReady:false,
 unsubMeta:null,unsubRecs:null,unsubTact:null,tactReady:false,tactTimer:null,listenId:null,pushTimer:null,inflight:0,lastSync:0,authResolved:false,prompted:false};
function syncState(){
 let s=null;try{s=JSON.parse(localStorage.getItem(SYNC_KEY)||'null')}catch(e){}
 if(!s||typeof s!=='object')s={};
 s.games=s.games||{};s.pushed=s.pushed||{};s.pull=s.pull||{};s.deleted=s.deleted||[];s.tact=s.tact||{};
 return s;
}
function saveSync(s){try{localStorage.setItem(SYNC_KEY,JSON.stringify(s))}catch(e){}}
const cloudAvailable=()=>typeof isPWABuild==='function'&&isPWABuild()&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
const tsGt=(a,b)=>!b||a.s>b.s||(a.s===b.s&&a.n>b.n);
const tsOf=u=>u&&typeof u.seconds==='number'?{s:u.seconds,n:u.nanoseconds||0}:null;

/* ---------- estado visível ---------- */
function setCloudState(st,err){cloud.state=st;if(err!==undefined)cloud.error=err;updateCloudUI()}
function cloudLabel(){
 switch(cloud.state){
  case 'login':return {t:'Ligar à equipa',c:'login'};
  case 'connecting':return {t:'A ligar…',c:'busy'};
  case 'syncing':return {t:'A sincronizar…',c:'busy'};
  case 'synced':return {t:'Sincronizado',c:'ok'};
  case 'offline':return {t:'Sem rede',c:'warn'};
  case 'error':return {t:'Erro na nuvem',c:'bad'};
  default:return {t:'Só neste dispositivo',c:'off'};
 }
}
function updateCloudUI(){
 const b=typeof $==='function'?$('#hdr-cloud'):null;
 if(b){const l=cloudLabel();b.hidden=!cloudAvailable();b.className='hdr-cloud '+l.c;b.innerHTML=`<span class="dot"></span><span class="cl-txt">${l.t}</span>`;b.title=cloud.error||l.t}
 if(typeof $$==='function')$$('.cloud-slot').forEach(s=>{s.innerHTML=cloudCardHTML()});
}
function cloudCardHTML(){
 if(!cloudAvailable())return `<p class="muted small">A base de dados da equipa só funciona na app publicada em <b>https://estatisticascpwp.github.io/</b>. Nesta versão os dados ficam só neste dispositivo.</p>`;
 const l=cloudLabel(),S=syncState();
 const n=Object.keys(S.games).length;
 const when=cloud.lastSync?new Date(cloud.lastSync).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}):'—';
 const txt={
  off:'A base de dados da equipa ainda não está ligada neste dispositivo.',
  login:'Introduz a palavra-passe da equipa para sincronizar os jogos com os outros dispositivos.',
  connecting:'A ligar à base de dados da equipa…',
  syncing:'A enviar e receber registos…',
  synced:`Ligado como ${esc(CLOUD_CFG.email)}. Última sincronização às ${when}.`,
  offline:'Sem ligação à internet. Os registos ficam guardados neste dispositivo e são enviados quando a rede voltar.',
  error:esc(cloud.error||'Ocorreu um erro na sincronização.')
 }[cloud.state]||'';
 const btns=cloud.user
  ?`<button type="button" class="btn btn-sm btn-outline" data-cloud="sync">Sincronizar agora</button><button type="button" class="btn btn-sm btn-ghost" data-cloud="logout">Desligar este dispositivo</button>`
  :`<button type="button" class="btn btn-sm btn-primary" data-cloud="login">Ligar à base de dados</button>`;
 return `<div class="cloud-card"><span class="cloud-pill ${l.c}"><span class="dot"></span>${l.t}</span><p class="muted small" style="margin:8px 0 10px">${txt}${cloud.user?` · ${n} jogo(s) sincronizado(s) neste dispositivo.`:''}</p><div class="btn-row">${btns}</div>
  <p class="muted small" style="margin:10px 0 0">Os jogos de exemplo ficam só neste dispositivo. Apagar um jogo em Início apaga-o também para a equipa.</p></div>`;
}

/* ---------- arranque ---------- */
async function initCloud(){
 document.addEventListener('click',e=>{const b=e.target.closest('[data-cloud]');if(!b)return;const a=b.dataset.cloud;
  if(a==='login')cloudLogin();else if(a==='logout')cloudLogout();else if(a==='sync')cloudSyncNow()});
 const hb=$('#hdr-cloud');if(hb)hb.onclick=()=>{if(!cloud.user)cloudLogin();else cloudInfo()};
 if(!cloudAvailable()){updateCloudUI();return}
 window.addEventListener('online',()=>{if(cloud.user)cloudSyncNow()});
 // ao mudar de página, enviar logo o que ficou à espera (a página seguinte também o faria)
 window.addEventListener('pagehide',()=>{if(cloud.user&&cloud.ready){clearTimeout(cloud.pushTimer);pushAll()}});
 window.addEventListener('offline',()=>{if(cloud.user)setCloudState('offline')});
 setCloudState('connecting');
 try{
  const base=`https://www.gstatic.com/firebasejs/${CLOUD_CFG.sdk}/`;
  const [A,Au,F]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  cloud.fb={...A,...Au,...F};
  const app=A.initializeApp(CLOUD_CFG.firebase);
  cloud.auth=Au.getAuth(app);
  try{cloud.db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()}),ignoreUndefinedProperties:true})}
  catch(e){cloud.db=F.getFirestore(app)}
 }catch(e){
  console.warn('Firebase indisponível',e);
  setCloudState(navigator.onLine===false?'offline':'error',navigator.onLine===false?'':'Não foi possível carregar a ligação à base de dados. Os dados continuam guardados neste dispositivo.');
  return;
 }
 cloud.fb.onAuthStateChanged(cloud.auth,user=>{
  cloud.authResolved=true;cloud.user=user||null;
  if(user){startSync()}
  else{stopSync();setCloudState('login');maybePromptLogin()}
 });
}
function maybePromptLogin(){
 if(cloud.prompted)return;cloud.prompted=true;
 let last=0;try{last=+localStorage.getItem(CLOUD_DISMISS_KEY)||0}catch(e){}
 if(Date.now()-last<12*3600e3)return;           // "Agora não" vale 12 horas
 setTimeout(()=>{if(!cloud.user&&!$('#modal-root').firstElementChild)cloudLogin(true)},600);
}
const AUTH_ERR={
 'auth/invalid-credential':'Palavra-passe errada.','auth/wrong-password':'Palavra-passe errada.','auth/invalid-login-credentials':'Palavra-passe errada.',
 'auth/user-not-found':'A conta da equipa não existe no Firebase (Authentication › Users).',
 'auth/too-many-requests':'Demasiadas tentativas. Espera alguns minutos e tenta outra vez.',
 'auth/network-request-failed':'Sem ligação à internet. Tenta quando houver rede; a app continua a funcionar neste dispositivo.',
 'auth/unauthorized-domain':'Este endereço não está autorizado no Firebase (Authentication › Settings › Authorized domains).',
 'auth/operation-not-allowed':'O início de sessão por email não está ativo no Firebase (Authentication › Sign-in method).'
};
async function cloudLogin(auto){
 if(!cloudAvailable()){modal({title:'Base de dados da equipa',body:cloudCardHTML(),actions:[{label:'Fechar',cls:'btn-primary',value:true}]});return}
 if(!cloud.auth){toast(cloud.error||'A ligação à base de dados ainda não está pronta. Tenta daqui a pouco.','warn');return}
 let err='';
 for(;;){
  const pw=await modal({title:'Base de dados da equipa',
   body:`<p>Introduz a palavra-passe da equipa para sincronizar os jogos entre todos os dispositivos.</p><p class="muted small">Só é pedida uma vez neste dispositivo. Sem ela, a app continua a funcionar e guarda tudo só aqui.</p>
    ${err?`<div class="warnbox" style="margin:8px 0">${esc(err)}</div>`:''}
    <div class="field" style="margin-top:8px"><label for="m-cloud-pw">Palavra-passe da equipa</label><input id="m-cloud-pw" type="password" autocomplete="current-password"></div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:14px"><input type="checkbox" id="m-cloud-show"> Mostrar palavra-passe</label>`,
   actions:[{label:'Agora não',cls:'btn-ghost',value:null},{label:'Ligar',cls:'btn-primary',get:r=>r.querySelector('#m-cloud-pw').value}],
   onOpen:r=>{const i=r.querySelector('#m-cloud-pw'),c=r.querySelector('#m-cloud-show');c.onchange=()=>{i.type=c.checked?'text':'password'};
    i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();r.querySelector('[data-mi="1"]').click()}});setTimeout(()=>i.focus(),30)}});
  if(pw==null){if(auto){try{localStorage.setItem(CLOUD_DISMISS_KEY,String(Date.now()))}catch(e){}}return}
  if(!pw){err='Escreve a palavra-passe.';continue}
  setCloudState('connecting');
  try{await cloud.fb.signInWithEmailAndPassword(cloud.auth,CLOUD_CFG.email,pw);toast('Dispositivo ligado à base de dados da equipa');return}
  catch(e){err=AUTH_ERR[e&&e.code]||('Não foi possível ligar ('+(e&&e.code||'erro')+').');setCloudState('login')}
 }
}
async function cloudLogout(){
 if(!await confirmBox('Desligar este dispositivo','Este dispositivo deixa de sincronizar com a equipa. Os jogos que já estão aqui ficam guardados, e os da equipa continuam na base de dados.<br><br>Para voltar a ligar é preciso a palavra-passe da equipa.','Desligar',false))return;
 stopSync();
 try{await cloud.fb.signOut(cloud.auth)}catch(e){}
 const S=syncState();S.games={};S.pushed={};S.pull={};S.deleted=[];S.tact={};saveSync(S);
 toast('Dispositivo desligado da base de dados da equipa');
}
function cloudInfo(){modal({title:'Base de dados da equipa',body:`<div class="cloud-slot">${cloudCardHTML()}</div>`,actions:[{label:'Fechar',cls:'btn-primary',value:true}]})}

/* ---------- sincronização ---------- */
function startSync(){
 stopSync();
 const F=cloud.fb;
 setCloudState(navigator.onLine===false?'offline':'syncing');
 cloud.ready=false;cloud.metaReady=false;
 cloud.unsubMeta=F.onSnapshot(F.collection(cloud.db,'jogos'),snap=>{onMetaSnap(snap);if(!cloud.metaReady){cloud.metaReady=true;listenCurrent();}},onCloudError);
 cloud.tactReady=false;
 cloud.unsubTact=F.onSnapshot(F.collection(cloud.db,'taticas'),snap=>{onTactSnap(snap);if(!cloud.tactReady){cloud.tactReady=true;pushTactics()}},onCloudError);
}
function stopSync(){
 if(cloud.unsubMeta){cloud.unsubMeta();cloud.unsubMeta=null}
 if(cloud.unsubRecs){cloud.unsubRecs();cloud.unsubRecs=null}
 if(cloud.unsubTact){cloud.unsubTact();cloud.unsubTact=null}
 cloud.listenId=null;cloud.ready=false;cloud.metaReady=false;cloud.tactReady=false;clearTimeout(cloud.tactTimer);
 clearTimeout(cloud.pushTimer);
}
function onCloudError(e){
 console.warn('Erro Firestore',e);
 const code=e&&e.code;
 if(code==='permission-denied')setCloudState('error','A base de dados recusou o acesso. Confirma as regras do Firestore (o email nas regras tem de ser '+CLOUD_CFG.email+').');
 else if(code==='unavailable')setCloudState('offline');
 else setCloudState('error','Erro na sincronização ('+(code||'desconhecido')+'). Os dados continuam guardados neste dispositivo.');
}
function listenCurrent(){
 const F=cloud.fb,gid=DB.currentId,g=DB.games[gid];
 if(cloud.unsubRecs){cloud.unsubRecs();cloud.unsubRecs=null}
 cloud.listenId=gid;
 if(!g||g.demo){cloud.ready=true;pushAll();return}
 const S=syncState(),p=S.pull[gid];
 const col=F.collection(cloud.db,'jogos',gid,'registos');
 const q=p?F.query(col,F.where('upd','>',new F.Timestamp(p.s,p.n))):col;
 let first=true;
 cloud.unsubRecs=F.onSnapshot(q,snap=>{applyRecSnap(gid,snap.docChanges().map(c=>c.doc));if(first){first=false;cloud.ready=true;pushAll()}},onCloudError);
}
function applyRecSnap(gid,docs){
 const g=DB.games[gid];if(!g)return;
 const S=syncState();const synced=S.games[gid]=S.games[gid]||{};
 let changed=false,maxP=S.pull[gid]||null;
 docs.forEach(d=>{
  if(d.metadata&&d.metadata.hasPendingWrites)return;
  const data=d.data();const t=tsOf(data.upd);if(t&&tsGt(t,maxP))maxP=t;
  if(applyRecDoc(g,synced,d.id,data))changed=true;
 });
 if(maxP)S.pull[gid]=maxP;
 saveSync(S);
 if(changed){save(true);cloudRerender()}
 markSynced();
}
function onMetaSnap(snap){
 const S=syncState();let changed=false,removedCurrent=false;const toPull=[],arrived=[];const initial=!cloud.metaReady;
 snap.docChanges().forEach(c=>{
  const d=c.doc;if(d.metadata&&d.metadata.hasPendingWrites)return;
  const id=d.id,data=d.data();
  if(data.del){
   if(DB.games[id]&&!DB.games[id].demo){delete DB.games[id];changed=true;if(DB.currentId===id)removedCurrent=true}
   delete S.games[id];delete S.pushed[id];delete S.pull[id];return;
  }
  if(S.deleted.includes(id))return;
  let g=DB.games[id],isNew=false;
  if(!g){g=newGame();g.id=id;g.demo=false;DB.games[id]=g;isNew=true;changed=true;arrived.push(id)}
  const synced=S.games[id]=S.games[id]||{};
  if(applyMeta(g,synced,data))changed=true;
  if(isNew)S.pushed[id]=g.updated;
  const t=tsOf(data.upd);
  if(id!==DB.currentId&&(isNew||(t&&tsGt(t,S.pull[id]||null))))toPull.push(id);
 });
 if(removedCurrent){
  const rest=Object.values(DB.games).sort((a,b)=>b.updated-a.updated);
  if(rest.length)DB.currentId=rest[0].id;else{const n=newGame();DB.games[n.id]=n;DB.currentId=n.id}
  toast('O jogo aberto foi apagado noutro dispositivo','warn');
 }
 saveSync(S);
 // jogos novos da equipa: abrir sozinho se este dispositivo não tem jogo em curso, senão perguntar
 if(arrived.length&&!removedCurrent){
  const opened=tryAutoOpen(S,initial);
  if(opened){changed=true;const i=toPull.indexOf(DB.currentId);if(i>=0)toPull.splice(i,1)}
  else announceNewGames(arrived,initial);
 }
 if(changed){save(true);cloudRerender()}
 toPull.forEach(pullGame);
 if(removedCurrent&&cloud.metaReady)listenCurrent();
 markSynced();
}
/** jogo local sem nada registado e nunca sincronizado (ou jogo de exemplo) */
function isBlankLocal(g,S){
 return !!g&&(g.demo||(!S.games[g.id]&&!g.individual.length&&!g.collective.length&&!g.timer.events.length&&!g.exclLog.length));
}
function teamGames(S){return Object.values(DB.games).filter(x=>!x.demo&&S.games[x.id]).sort((a,b)=>(b.created||0)-(a.created||0))}
function gameLabel(g){return `${g.scpName||'SCP'} vs ${g.opponent||'Adversário'} (${fmtDate(g.date)})`}
function tryAutoOpen(S,initial){
 const cur=DB.games[DB.currentId];
 if(!isBlankLocal(cur,S))return false;
 const list=teamGames(S);if(!list.length)return false;
 const g=list[0];
 if(!initial&&Date.now()-(g.created||0)>24*3600e3)return false;
 if(cur&&!cur.demo)delete DB.games[cur.id];           // jogo vazio deste dispositivo: não fica a ocupar espaço
 DB.currentId=g.id;if(typeof resetLocalState==='function')resetLocalState();
 toast((initial?'Aberto o jogo mais recente da equipa: ':'Novo jogo da equipa aberto: ')+gameLabel(g));
 return true;
}
function announceNewGames(ids,initial){
 const recent=ids.map(id=>DB.games[id]).filter(g=>g&&g.id!==DB.currentId&&Date.now()-(g.created||0)<(initial?2:24)*3600e3)
  .sort((a,b)=>(b.created||0)-(a.created||0));
 if(!recent.length)return;
 const g=recent[0];
 if($('#modal-root').firstElementChild){toast('Novo jogo da equipa: '+gameLabel(g)+'. Abre-o em Início › Jogos guardados.');return}
 modal({title:'Novo jogo da equipa',body:`<p>Foi criado noutro dispositivo o jogo <b>${esc(gameLabel(g))}</b>.</p><p class="muted small">Abre-o aqui para registar no mesmo jogo que os outros dispositivos. Podes sempre mudar de jogo em Início › Jogos guardados.</p>`,
  actions:[{label:'Agora não',cls:'btn-ghost',value:false},{label:'Abrir este jogo',cls:'btn-primary',value:true}]})
 .then(ok=>{if(ok&&DB.games[g.id])openTeamGame(g.id)});
}
function openTeamGame(id){
 DB.currentId=id;if(typeof resetLocalState==='function')resetLocalState();
 save(true);rerender();toast('Jogo aberto: '+gameLabel(DB.games[id]));
}
async function pullGame(gid){
 const F=cloud.fb;if(!F||!cloud.user)return;
 const p=syncState().pull[gid];
 const col=F.collection(cloud.db,'jogos',gid,'registos');
 try{const snap=await F.getDocs(p?F.query(col,F.where('upd','>',new F.Timestamp(p.s,p.n))):col);applyRecSnap(gid,snap.docs)}
 catch(e){onCloudError(e)}
}
function cloudOnSave(){
 if(!cloud.user)return;
 if(cloud.metaReady&&cloud.listenId!==DB.currentId)listenCurrent();
 clearTimeout(cloud.pushTimer);cloud.pushTimer=setTimeout(pushAll,700);
}
/** chamado quando o utilizador apaga um jogo (apaga-o para toda a equipa) */
function cloudGameDeleted(id){
 const S=syncState();
 if(cloud.user&&S.games[id]){
  const F=cloud.fb;
  F.setDoc(F.doc(cloud.db,'jogos',id),{del:true,upd:F.serverTimestamp()},{merge:true}).catch(onCloudError);
 }
 delete S.games[id];delete S.pushed[id];delete S.pull[id];
 if(!S.deleted.includes(id))S.deleted.push(id);
 saveSync(S);
}
/** apagar os dados do dispositivo NÃO apaga nada na nuvem */
async function cloudForgetDevice(){
 stopSync();
 if(cloud.auth&&cloud.user){try{await cloud.fb.signOut(cloud.auth)}catch(e){}}
 try{localStorage.removeItem(SYNC_KEY)}catch(e){}
}
function pushAll(){
 if(!cloud.user||!cloud.ready)return;
 const S=syncState();let ops=0;
 Object.values(DB.games).forEach(g=>{
  if(g.demo||S.deleted.includes(g.id))return;
  if(S.pushed[g.id]===g.updated&&S.games[g.id])return;
  ops+=pushGame(g,S);
 });
 saveSync(S);
 if(ops)markPending();else markSynced();
}
function pushGame(g,S){
 const F=cloud.fb,synced=S.games[g.id]||{};
 const d=diffGame(g,synced);
 const writes=[];
 const base=F.doc(cloud.db,'jogos',g.id);
 if(d.meta)writes.push([base,{...d.meta,del:false,upd:F.serverTimestamp()},{merge:true}]);
 Object.entries(d.sets).forEach(([id,p])=>writes.push([F.doc(cloud.db,'jogos',g.id,'registos',id),{...p,del:false,upd:F.serverTimestamp()},null]));
 d.dels.forEach(id=>writes.push([F.doc(cloud.db,'jogos',g.id,'registos',id),{del:true,upd:F.serverTimestamp()},{merge:true}]));
 for(let i=0;i<writes.length;i+=450){
  const b=F.writeBatch(cloud.db);
  writes.slice(i,i+450).forEach(([ref,data,opt])=>opt?b.set(ref,data,opt):b.set(ref,data));
  cloud.inflight++;
  b.commit().then(()=>{cloud.inflight--;markSynced()}).catch(e=>{cloud.inflight--;onCloudError(e)});
 }
 S.games[g.id]=d.next;S.pushed[g.id]=g.updated;
 return writes.length;
}
function markPending(){if(cloud.user)setCloudState(navigator.onLine===false?'offline':'syncing')}
function markSynced(){
 if(!cloud.user||cloud.state==='error')return;
 if(navigator.onLine===false){setCloudState('offline');return}
 if(cloud.inflight>0||!cloud.ready){setCloudState('syncing');return}
 cloud.lastSync=Date.now();setCloudState('synced');
}
function cloudSyncNow(){
 if(!cloud.user){cloudLogin();return}
 if(cloud.state==='error')cloud.error='';
 setCloudState('syncing');
 const S=syncState();S.pushed={};saveSync(S);   // forçar comparação completa
 startSync();
}
/* Atualizar o ecrã quando chegam dados de outro dispositivo, sem apagar o que se está a preencher:
   nos ecrãs de registo só se redesenham as tabelas/contadores, não os formulários. */
const CLOUD_REFRESH={
 coletiva:()=>renderColRecords(),
 individual:()=>{renderIndForm();renderIndRecords()},
 tempo:()=>{const cp=$('#t-cp');if(!cp||cp.textContent!==G().period+' período'){renderTempo();return}renderTempoSub();renderTempoPlayers();renderTempoLog();updateTempoLive()},
 exclusoes:()=>{renderTeam('scp');renderTeam('opp');renderExLog()},
 taticas:()=>{}           // o quadro não depende dos dados do jogo
};
let cloudRerenderPending=false;
function cloudRerender(){
 updateHeader();
 if(cloudRerenderPending)return;
 const a=document.activeElement;
 if(a&&/INPUT|TEXTAREA/.test(a.tagName)&&a.type!=='checkbox'&&a.closest('main')){   // a escrever: esperar
  cloudRerenderPending=true;a.addEventListener('blur',()=>{cloudRerenderPending=false;setTimeout(cloudRerender,50)},{once:true});
  return;
 }
 if($('#modal-root').firstElementChild){                                      // diálogo aberto: esperar que feche
  cloudRerenderPending=true;
  const iv=setInterval(()=>{if(!$('#modal-root').firstElementChild){clearInterval(iv);cloudRerenderPending=false;cloudRerender()}},400);
  return;
 }
 const f=CLOUD_REFRESH[currentView];
 if(f){try{f();return}catch(e){console.warn('Atualização parcial falhou',e)}}
 rerender();
}

/* ---------- táticas do Quadro Tático (documento inteiro; fica a última alteração) ---------- */
function onTactSnap(snap){
 const S=syncState(),m=loadTactics();let changed=false;
 snap.docChanges().forEach(c=>{
  const d=c.doc;if(d.metadata&&d.metadata.hasPendingWrites)return;
  const data=d.data(),id=d.id;
  if(data.del){if(m[id]){delete m[id];changed=true}delete S.tact[id];return}
  const remote=plain(stripCloud(data)),h=hashOf(remote);
  if(S.tact[id]===h)return;
  m[id]=remote;S.tact[id]=h;changed=true;
 });
 saveSync(S);
 if(changed){saveTactics(m,true);if(typeof tacticsRemoteUpdate==='function')tacticsRemoteUpdate()}
 markSynced();
}
function cloudTacticsChanged(){
 if(!cloud.user)return;
 clearTimeout(cloud.tactTimer);cloud.tactTimer=setTimeout(pushTactics,800);
}
function pushTactics(){
 if(!cloud.user||!cloud.tactReady)return;
 const F=cloud.fb,S=syncState(),m=loadTactics();let n=0;
 Object.values(m).forEach(t=>{
  const p=plain(t),h=hashOf(p);if(S.tact[t.id]===h)return;
  S.tact[t.id]=h;n++;cloud.inflight++;
  F.setDoc(F.doc(cloud.db,'taticas',t.id),{...p,del:false,upd:F.serverTimestamp()}).then(()=>{cloud.inflight--;markSynced()}).catch(e=>{cloud.inflight--;onCloudError(e)});
 });
 saveSync(S);if(n)markPending();
}
function cloudTacticDeleted(id){
 const S=syncState();
 if(cloud.user&&S.tact[id]){const F=cloud.fb;F.setDoc(F.doc(cloud.db,'taticas',id),{del:true,upd:F.serverTimestamp()},{merge:true}).catch(onCloudError)}
 delete S.tact[id];saveSync(S);
}

/* =========================================================
   TÁTICAS (Quadro Tático) — armazenamento local + sincronização com a equipa
   Cada tática: {id, name, cat, notes, view:'half'|'full', steps:[{pieces:[{id,t,n,x,y}], arrows:[{id,k,x1,y1,x2,y2}]}], created, updated}
   Coordenadas em metros: piscina de 30 m (x) por 20 m (y), baliza da direita em x=30.
   ========================================================= */
const TACT_KEY='scpStatPoloAquatico.taticas.v1';
const TACT_CATS=['Ataque','Defesa','Superioridade','Inferioridade','Contra-ataque','Bola parada','Outros'];
function loadTactics(){
 try{const m=JSON.parse(localStorage.getItem(TACT_KEY)||'{}');return m&&typeof m==='object'?m:{}}catch(e){return {}}
}
/** grava localmente; fromCloud=true quando a alteração veio da base de dados (não reenviar) */
function saveTactics(map,fromCloud){
 try{localStorage.setItem(TACT_KEY,JSON.stringify(map))}catch(e){toast('Não foi possível guardar a tática neste dispositivo.','bad')}
 if(!fromCloud&&typeof cloudTacticsChanged==='function')cloudTacticsChanged();
}
function importTactics(list){
 const m=loadTactics();
 list.forEach(t=>{if(t&&t.id&&Array.isArray(t.steps))m[t.id]={...t,updated:Date.now()}});
 saveTactics(m);
}
function deleteTactic(id){
 const m=loadTactics();delete m[id];saveTactics(m,true);
 if(typeof cloudTacticDeleted==='function')cloudTacticDeleted(id);
}

/* =========================================================
   EXPORTAR / IMPORTAR — dois botões para tudo:
   1) Exportar para Excel (.xlsx): uma folha por tabela, do jogo aberto ou de todos os jogos
   2) Cópia de segurança (.json): todos os jogos, definições e táticas; volta a entrar com "Importar"
   O .xlsx é gerado aqui mesmo (sem bibliotecas externas), por isso funciona sem internet.
   ========================================================= */

/* ---------- gerador de .xlsx (ZIP sem compressão + SpreadsheetML) ---------- */
const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC_TABLE[(c^b[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipStore(files){
 const enc=new TextEncoder(),parts=[],central=[];let off=0;
 const d=new Date(),dosT=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dosD=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
 files.forEach(f=>{
  const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
  const h=new DataView(new ArrayBuffer(30));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,dosT,true);h.setUint16(12,dosD,true);
  h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
  parts.push(new Uint8Array(h.buffer),name,data);
  const c=new DataView(new ArrayBuffer(46));
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dosT,true);c.setUint16(14,dosD,true);
  c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
  central.push(new Uint8Array(c.buffer),name);
  off+=30+name.length+data.length;
 });
 const cSize=central.reduce((a,p)=>a+p.length,0),e=new DataView(new ArrayBuffer(22));
 e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cSize,true);e.setUint32(16,off,true);
 const all=[...parts,...central,new Uint8Array(e.buffer)],out=new Uint8Array(all.reduce((a,p)=>a+p.length,0));
 let p=0;all.forEach(x=>{out.set(x,p);p+=x.length});
 return out;
}
const xmlEsc=s=>String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function colName(i){let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
function sheetName(n,used){let s=String(n).replace(/[\[\]:*?\/\\]/g,'-').slice(0,31);let k=s,i=2;while(used.has(k)){k=s.slice(0,28)+' '+i++}used.add(k);return k}
/** sheets: [{name, rows:[[cabeçalho...], [valores...]...]}] -> Uint8Array (.xlsx) */
function makeXlsx(sheets){
 const used=new Set();sheets=sheets.map(s=>({...s,name:sheetName(s.name,used)}));
 const sheetXml=s=>{
  const rows=s.rows.length?s.rows:[['(sem dados)']],ncol=Math.max(...rows.map(r=>r.length),1);
  const widths=Array.from({length:ncol},(_,c)=>Math.min(50,Math.max(8,...rows.slice(0,400).map(r=>r[c]==null?0:String(r[c]).length+2))));
  const body=rows.map((r,ri)=>`<row r="${ri+1}">`+r.map((v,ci)=>{
   if(v==null||v==='')return '';
   const ref=colName(ci)+(ri+1),st=ri===0?' s="1"':'';
   if(typeof v==='number'&&isFinite(v))return `<c r="${ref}"${st}><v>${v}</v></c>`;
   if(typeof v==='boolean')return `<c r="${ref}"${st} t="inlineStr"><is><t>${v?'Sim':''}</t></is></c>`;
   return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  }).join('')+'</row>').join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${body}</sheetData>${rows.length>1?`<autoFilter ref="A1:${colName(ncol-1)}${rows.length}"/>`:''}</worksheet>`;
 };
 const defNames=sheets.map((s,i)=>s.rows.length>1?`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlEsc(s.name).replace(/'/g,"''")}'!$A$1:$${colName(Math.max(...s.rows.map(r=>r.length))-1)}$${s.rows.length}</definedName>`:'').join('');
 const files=[
  {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
  {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
  {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xmlEsc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets>${defNames?`<definedNames>${defNames}</definedNames>`:''}</workbook>`},
  {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
  {name:'xl/styles.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF004D2A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`},
  ...sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXml(s)}))
 ];
 return zipStore(files);
}

/* ---------- conteúdo das folhas (os mesmos dados que antes saíam em CSV separados) ---------- */
function withGame(g,fn){const keep=DB.currentId;DB.currentId=g.id;try{return fn()}finally{DB.currentId=keep}}
const xPname=(g,n)=>{const p=g.roster.find(x=>x.n===+n);return p&&p.name?p.name:'Jogador '+n};
const xEx=(g,t,n)=>((g.excl||{})[t]||{})[n]||{ex:0,red:false,goals:0};
const xScore=g=>{const s=t=>Object.values((g.excl||{})[t]||{}).reduce((a,x)=>a+(x.goals||0),0);return {scp:s('scp'),opp:s('opp')}};
const r1=v=>v==null?null:Math.round(v*10)/10;
const COL_TABLE_TITLE={scp:'Ataque SCP vs Defesa Adversária',other:'Ataque Adversário vs Defesa SCP',plus:'Superioridade SCP (+1)',minus:'Inferioridade SCP (−1)',caSCP:'Contra-ataque SCP',caOther:'Contra-ataque Adversário'};
const X_SHOTS=['Golo','Defesa','Bloco','Fora'];
const EXPORT_SHEETS=[
 {name:'Jogos',head:['Competição','Local','Golos SCP','Golos adversário','Duração do período (min)','Registos individuais','Ataques (coletiva)','Entradas/saídas','Bolas de saída ganhas'],
  rows:g=>{const s=xScore(g);return [[g.competition,g.venue,s.scp,s.opp,g.periodLength/60,g.individual.length,g.collective.length,g.timer.events.length,g.sprints.filter(x=>x.winner==='SCP').length]]}},
 {name:'Plantel',head:['Nº','Nome','GR','Posição','Mão'],rows:g=>g.roster.filter(p=>p.n<=13||p.name).map(p=>[p.n,p.name,p.gr?'Sim':'',p.pos||'',p.hand||''])},
 {name:'Individual',head:['Tipo','Período','Nº','Jogador','Ação','Situação','Assistência Nº','Assistência','Zona campo','Distância (m)','Campo X (%)','Campo Y (%)','Zona baliza','Baliza X (%)','Baliza Y (%)','Registado em'],
  rows:g=>g.individual.slice().sort((a,b)=>a.ts-b.ts).map(r=>[r.mode==='gk'?'GR':'Campo',r.period,r.player,xPname(g,r.player),r.action,r.sit,r.assist==='none'||r.assist===''?null:r.assist,r.assist==='none'?'Sem assistência':r.assist?xPname(g,r.assist):'',r.fzone,r.fy!=null?r1(r.fy*12.5):null,r.fx!=null?r1(r.fx*100):null,r.fy!=null?r1(r.fy*100):null,r.gzone,r.gx!=null?r1(r.gx*100):null,r.gy!=null?r1(r.gy*100):null,new Date(r.ts).toLocaleString('pt-PT')])},
 {name:'Coletiva',head:['Tabela','Período','Nº ataque','Jogada ofensiva','Jogada defensiva / Defesa','Sistema +1','Contra-ataque','Posição remate','Outcome','Tempo ATQ','Notas'],
  rows:g=>{const ord=Object.keys(COL_TABLE_TITLE);return g.collective.slice().sort((a,b)=>ord.indexOf(a.table)-ord.indexOf(b.table)||String(a.period).localeCompare(String(b.period))||(+a.attack)-(+b.attack))
   .map(r=>[COL_TABLE_TITLE[r.table]||r.table,r.period,+r.attack||r.attack,r.offense,r.defense,r.system,r.ca,r.position,r.outcome,r.timing,r.notes])}},
 {name:'Tempo – movimentos',head:['Período','Relógio','Nº','Jogador','Movimento'],
  rows:g=>withGame(g,()=>g.timer.events.slice().sort((a,b)=>absTime(a.period,a.clock)-absTime(b.period,b.clock)||a.seq-b.seq).map(e=>[e.period,fmtClock(e.clock),e.n,xPname(g,e.n),e.type==='in'?'Entrada':'Saída']))},
 {name:'Tempo – resumo',head:['Nº','Jogador','GR','Turnos','Último turno','Tempo total','Tempo total (s)'],
  rows:g=>withGame(g,()=>{const s=computeShifts();return g.roster.filter(p=>s[p.n].count||p.name).map(p=>{const x=s[p.n];return [p.n,xPname(g,p.n),p.gr?'Sim':'',x.count,x.count?fmtClock(x.last):'',fmtClock(x.total),Math.round(x.total)]})})},
 {name:'Exclusões',head:['Equipa','Nº','Nome','GR','Exclusões','Cartão vermelho','Golos'],
  rows:g=>['scp','opp'].flatMap(t=>(t==='scp'?g.roster.slice(0,13):g.oppRoster).map(p=>{const o=xEx(g,t,p.n);return [t==='scp'?'SCP':'Adversário',p.n,p.name,t==='scp'&&p.gr?'Sim':'',o.ex||0,o.red?'Sim':'',o.goals||0]}))},
 {name:'Exclusões – registo',head:['Período','Relógio','Equipa','Nº','Jogador','Evento','Hora'],
  rows:g=>g.exclLog.map(e=>[e.period,fmtClock(e.clock),e.team==='scp'?(g.scpName||'Sporting CP'):(g.opponent||'Adversário'),e.n,e.team==='scp'?xPname(g,e.n):((g.oppRoster[e.n-1]||{}).name||'Jogador '+e.n),e.type,new Date(e.ts).toLocaleString('pt-PT')])},
 {name:'Guarda-redes',head:['Nº','Guarda-redes','Remates à baliza','Defesas','Defesas controladas','Defesas para fora','Golos sofridos','Remates fora','% defesas','Tempo jogado'],
  rows:g=>withGame(g,()=>{const s=computeShifts();const ns=[...new Set([...g.roster.filter(p=>p.gr).map(p=>p.n),...g.individual.filter(r=>r.mode==='gk').map(r=>r.player)])].sort((a,b)=>a-b);
   return ns.map(n=>{const rs=g.individual.filter(r=>r.mode==='gk'&&r.player===n),c=a=>rs.filter(r=>r.action===a).length;const hold=c('Defesa GR'),away=c('Defesa p/ Fora GR'),gl=c('Golo Sofrido'),on=hold+away+gl;
    return [n,xPname(g,n),on,hold+away,hold,away,gl,c('Fora'),on?Math.round((hold+away)*100/on):null,fmtClock((s[n]||{}).total||0)]})})},
 {name:'Resumo jogadores',head:['Nº','Jogador','Remates','Golos','Eficácia (%)','Assistências','EXC ganhas','EXC sofridas','Perdas de posse','Roubos','Blocos defensivos','Tempo jogado','Golos por 8 min'],
  rows:g=>withGame(g,()=>{const s=computeShifts(),F=g.individual.filter(r=>r.mode==='field');
   return g.roster.filter(p=>!p.gr).map(p=>{const m=F.filter(r=>r.player===p.n),c=a=>m.filter(r=>r.action===a).length,sh=m.filter(r=>X_SHOTS.includes(r.action)).length,gl=c('Golo'),secs=(s[p.n]||{}).total||0;
    if(!m.length&&!secs&&!F.some(r=>r.assist===p.n))return null;
    return [p.n,xPname(g,p.n),sh,gl,sh?Math.round(gl*100/sh):null,F.filter(r=>r.assist===p.n).length,c('EXC ganha'),c('EXC sofrida'),c('Perda Bola')+c('Passe Falhado')+c('Falta Atacante'),c('Roubo Bola'),c('Bloco Defensivo'),fmtClock(secs),secs>=60?r1(gl*480/secs):null]}).filter(Boolean)})},
 {name:'Bolas de saída',head:['Período','Ganhou','Nº','Jogador'],rows:g=>g.sprints.filter(s=>s.winner).map(s=>[s.period,s.winner==='SCP'?'SCP':'Adversário',s.player?+s.player:null,s.player?xPname(g,s.player):''])}
];
/** folhas para um ou vários jogos (vários: colunas Data e Adversário à esquerda) */
function buildExportSheets(games){
 const many=games.length>1;
 return EXPORT_SHEETS.map(def=>{
  const head=(many||def.name==='Jogos'?['Data','Adversário']:[]).concat(def.head);
  const rows=[head];
  games.forEach(g=>def.rows(g).forEach(r=>rows.push((many||def.name==='Jogos'?[fmtDate(g.date),g.opponent]:[]).concat(r))));
  return {name:def.name,rows};
 });
}
function downloadBytes(name,bytes,type){
 const blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
 toast('Ficheiro exportado: '+name);
}

/* ---------- os dois botões ---------- */
async function exportExcel(){
 const g=G(),all=Object.values(DB.games).filter(x=>!x.demo).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const choice=await modal({title:'Exportar para Excel',
  body:`<p>Um ficheiro <b>.xlsx</b> com uma folha para cada tabela: jogos, plantel, estatística individual, coletiva, tempo de jogo, exclusões, guarda-redes, resumo por jogador e bolas de saída.</p><p class="muted small">Com vários jogos, cada linha leva a data e o adversário, para filtrar ou fazer tabelas dinâmicas no Excel.</p>`,
  actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:`Todos os jogos (${all.length})`,cls:'btn-outline',value:'all'},{label:'Jogo aberto',cls:'btn-primary',value:'one'}]});
 if(!choice)return;
 const games=choice==='one'?[g]:all;
 if(!games.length){toast('Ainda não há jogos reais para exportar (os jogos de exemplo não entram em "Todos os jogos").','warn');return}
 const name=choice==='one'?'scp_stat_'+fileStamp()+'.xlsx':'scp_stat_todos_os_jogos_'+todayISO()+'.xlsx';
 downloadBytes(name,makeXlsx(buildExportSheets(games)),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
function backupPayload(){
 const t=typeof loadTactics==='function'?loadTactics():{};
 return {app:'scp-stat-polo',version:2,kind:'backup',exported:new Date().toISOString(),settings:DB.settings,currentId:DB.currentId,games:DB.games,tactics:t};
}
function exportBackup(){
 downloadBytes('scp_stat_copia_seguranca_'+todayISO()+'.json',JSON.stringify(backupPayload()),'application/json');
}
/** importa uma cópia de segurança (todos os jogos) ou um jogo exportado (também os da app móvel) */
async function importJSON(){
 const f=await pickFile('.json,application/json');if(!f)return;
 let d;try{d=JSON.parse(f.text)}catch(e){toast('Este ficheiro não é uma cópia da SCP Stat (.json).','bad');return}
 if(!d||d.app!=='scp-stat-polo'){toast('Este ficheiro não é uma cópia da SCP Stat (.json).','bad');return}
 const incoming=(d.kind==='backup'?Object.values(d.games||{}):(d.game?[d.game]:[])).map(normalizeGame);
 const tacts=d.tactics&&typeof d.tactics==='object'?Object.values(d.tactics):[];
 if(!incoming.length&&!tacts.length){toast('O ficheiro não tem jogos.','warn');return}
 let mode='merge';
 if(incoming.length>1){
  mode=await modal({title:'Importar cópia de segurança',body:`<p>O ficheiro tem <b>${incoming.length}</b> jogo(s)${tacts.length?` e ${tacts.length} tática(s)`:''}.</p><p>Juntar aos jogos deste dispositivo (os jogos iguais são atualizados) ou substituir os deste dispositivo?</p>${cloud.user?'<p class="muted small">Com a base de dados da equipa ligada, os jogos da equipa voltam a aparecer depois de substituir.</p>':''}`,
   actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Substituir',cls:'btn-danger',value:'replace'},{label:'Juntar',cls:'btn-primary',value:'merge'}]});
  if(!mode)return;
 }else if(incoming.length===1&&DB.games[incoming[0].id]){
  const m=await modal({title:'Jogo já existe',body:`<p>Já tens o jogo de ${esc(fmtDate(incoming[0].date))} vs <b>${esc(incoming[0].opponent)}</b>. Substituir o que está guardado ou importar como cópia?</p>`,
   actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Importar como cópia',cls:'btn-outline',value:'copy'},{label:'Substituir',cls:'btn-danger',value:'replace1'}]});
  if(!m)return;if(m==='copy')incoming[0].id=uid();
 }
 if(mode==='replace'){Object.keys(DB.games).forEach(id=>delete DB.games[id])}
 incoming.forEach(g=>{g.updated=Date.now();DB.games[g.id]=g});
 if(incoming.length)DB.currentId=(d.currentId&&DB.games[d.currentId])?d.currentId:incoming[incoming.length-1].id;
 if(tacts.length&&typeof importTactics==='function')importTactics(tacts);
 save();resetLocalState();rerender();
 toast(`${incoming.length} jogo(s)${tacts.length?` e ${tacts.length} tática(s)`:''} importado(s)`);
}
function dataPanelHTML(){
 return `<div class="btn-row"><button type="button" class="btn btn-primary" data-x="xlsx">${icon('download')}Exportar para Excel</button><button type="button" class="btn btn-outline" data-x="backup">${icon('save')}Cópia de segurança (.json)</button></div>
  <p class="muted small" style="margin:10px 0 0">O Excel junta numa só folha de cálculo tudo o que antes se exportava ecrã a ecrã. A cópia de segurança guarda todos os jogos e táticas e pode voltar a entrar em <button type="button" class="linkbtn" data-x="import">Importar ficheiro (.json)</button>.</p>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;const a=b.dataset.x;
 if(a==='xlsx')exportExcel();else if(a==='backup')exportBackup();else if(a==='import')importJSON()});

/* =========================================================
   JOGO DE EXEMPLO (dados fictícios) + arranque
   ========================================================= */
function buildDemoGame(){
 let s=20261024;const R=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const pick=a=>a[Math.floor(R()*a.length)],wpick=w=>{const tot=w.reduce((a,x)=>a+x[1],0);let r=R()*tot;for(const [v,p] of w){if((r-=p)<0)return v}return w[0][0]},rng=(a,b)=>a+R()*(b-a);
 const g=newGame();g.demo=true;g.opponent='CN Exemplo';g.competition='Jogo de exemplo';g.venue='Piscina (exemplo)';g.period='4º';
 ['Martim C.','Rui A.','Tiago M.','Duarte S.','Gonçalo P.','André L.','Miguel F.','Pedro R.','João V.','Bernardo T.','Diogo N.','Francisco B.','Henrique G.'].forEach((n,i)=>g.roster[i].name=n);
 ['A. Costa','B. Silva','C. Rocha','D. Lima','E. Faria','F. Sousa','G. Pinto','H. Neves','I. Matos','J. Cruz','L. Reis','M. Dias','N. Brito'].forEach((n,i)=>g.oppRoster[i].name=n);
 let ts=Date.now()-3*3600e3;
 const fieldXY=kind=>{const m=kind==='exc'?rng(2.3,5.2):kind==='turn'?rng(3,11):wpick([[rng(2.4,5.8),.45],[rng(6.2,10.5),.5],[rng(12.2,12.4),.05]]);return {x:r3(rng(.06,.94)),y:r3(m/12.5)}};
 const goalXY=act=>{if(act==='Golo'||act==='Golo Sofrido'){const x=R()<.7?pick([rng(.1,.3),rng(.7,.9)]):rng(.35,.65);return {x:r3(x),y:r3(wpick([[rng(.68,.95),.5],[rng(.15,.38),.35],[rng(.42,.64),.15]]))}}return {x:r3(rng(.3,.7)),y:r3(rng(.3,.75))}};
 const field=[2,3,4,5,6,7,8,9,10,11,12];
 const fa=[['Golo',22],['Defesa',18],['Bloco',10],['Fora',9],['EXC ganha',10],['EXC sofrida',5],['Perda Bola',7],['Roubo Bola',6],['Passe Falhado',4],['Falta Atacante',3],['Bloco Defensivo',3],['Canto',2]];
 for(let i=0;i<56;i++){const act=wpick(fa),a=actDef('field',act),n=wpick(field.map(x=>[x,x===4||x===7?3:x===9||x===5?2:1])),period=PERIODS[Math.min(3,Math.floor(i/14))];
  const f=fieldXY(/EXC/.test(act)?'exc':SHOT_ACTS.includes(act)?'shot':'turn'),gl=a.goal?goalXY(act):null;
  let sit='';if(a.sits.length&&(!a.sitOpt||R()<.7))sit=a.sits.includes('6x6')?wpick(a.sits.map(x=>[x,x==='6x6'?6:x==='+1'?2:1])):pick(a.sits);
  let assist='';if(a.assist)assist=R()<.6?pick(field.filter(x=>x!==n)):'none';
  g.individual.push({id:uid(),mode:'field',period,player:n,playerName:g.roster[n-1].name,action:act,sit,assist,fx:f.x,fy:f.y,fzone:fieldZone(f.x,f.y),gx:gl?gl.x:null,gy:gl?gl.y:null,gzone:gl?goalZone(gl.x,gl.y):'',ts:ts+=60e3});
 }
 const ka=[['Golo Sofrido',7],['Defesa GR',8],['Defesa p/ Fora GR',3],['Fora',3]];
 for(let i=0;i<21;i++){const act=wpick(ka),a=actDef('gk',act),period=PERIODS[Math.min(3,Math.floor(i/5.3))],n=period==='4º'?13:1;const f=fieldXY('shot'),gl=a.goal?goalXY(act):null;
  g.individual.push({id:uid(),mode:'gk',period,player:n,playerName:g.roster[n-1].name,action:act,sit:wpick(STD.map(x=>[x,x==='6x6'?6:1])),assist:'',fx:f.x,fy:f.y,fzone:fieldZone(f.x,f.y),gx:gl?gl.x:null,gy:gl?gl.y:null,gzone:gl?goalZone(gl.x,gl.y):'',ts:ts+=60e3});
 }
 const outW=side=>side==='att'?[['GOLO',30],['DEFESA',20],['FALHOU',12],['EXCLUSÃO',14],['PENALTI',3],['ROUBO BOLA',6],['PERDA BOLA',6],['FALTA ATACANTE',3],['TEMPO ATAQUE ACABOU',4]]:[['GOLO',26],['DEFESA',22],['FALHOU',14],['EXCLUSÃO',12],['ROUBO BOLA',10],['PERDA BOLA',8],['TEMPO ATAQUE ACABOU',5]];
 const plan={scp:16,other:14,plus:6,minus:5,caSCP:4,caOther:3};
 Object.entries(plan).forEach(([tid,count])=>{const t=COL_TABLES.find(x=>x.id===tid),per={};
  for(let i=0;i<count;i++){const period=PERIODS[Math.min(3,Math.floor(i*4/count))];per[period]=(per[period]||0)+1;
   const r={id:uid(),table:tid,period,attack:String(per[period]),ts:ts+=30e3};
   t.fields.forEach(([k,,opts,kind])=>{if(kind==='toggle')r[k]=R()<.55?'+10s':'-10s';else if(kind==='notes')r[k]=R()<.25?pick(['Boa circulação','Remate apressado','GR adiantado','Pivot bem marcado']):'';else if(k==='outcome')r[k]=wpick(outW(t.side));else r[k]=pick(opts.slice(0,k==='offense'?9:opts.length))});
   g.collective.push(r)}});
 /* tempo de jogo */
 const L=g.periodLength,on=new Set([1,2,3,4,5,6,7]),bench=new Set([8,9,10,11,12,13]);let seq=0;const ev=(n,type,period,clock)=>g.timer.events.push({id:uid(),n,type,period,clock,seq:++seq,ts:ts+=1e3});
 [...on].forEach(n=>ev(n,'in','1º',L));
 PERIODS.forEach(p=>{const times=p==='4º'?[372,228]:[390,214,75];
  if(p==='4º'){ev(1,'out',p,L);on.delete(1);bench.add(1);ev(13,'in',p,L);on.add(13);bench.delete(13)}
  times.forEach(c=>{const o=pick([...on].filter(x=>x!==1&&x!==13)),i=pick([...bench].filter(x=>x!==13&&x!==1));ev(o,'out',p,c);on.delete(o);bench.add(o);ev(i,'in',p,c);on.add(i);bench.delete(i)})});
 g.timer.seq=seq;g.timer.remaining=192;g.timer.running=false;
 /* exclusões e golos coerentes com os registos */
 g.individual.filter(r=>r.mode==='field'&&r.action==='Golo').forEach(r=>{exOfG(g,'scp',r.player).goals++});
 g.individual.filter(r=>r.mode==='gk'&&r.action==='Golo Sofrido').forEach(()=>{exOfG(g,'opp',pick([2,3,4,5,6,7,8,9])).goals++});
 g.individual.filter(r=>r.mode==='field'&&r.action==='EXC sofrida').forEach(r=>{const o=exOfG(g,'scp',r.player);if(o.ex<3)o.ex++});
 [[4,3],[6,1],[2,2],[9,1],[5,1]].forEach(([n,k])=>exOfG(g,'opp',n).ex=k);
 g.sprints=[{period:'1º',winner:'SCP',player:'8'},{period:'2º',winner:'ADV',player:''},{period:'3º',winner:'SCP',player:'8'},{period:'4º',winner:'SCP',player:'10'}];
 return g;
}
function exOfG(g,team,n){if(!g.excl[team][n])g.excl[team][n]={ex:0,red:false,goals:0};return g.excl[team][n]}

function tick(){
 const g=G();if(!g)return;const t=g.timer;
 if(t.running&&clockNow()<=0){t.remaining=0;t.running=false;save();toast(`Fim do ${g.period} período`,'warn')}
 if(currentView==='tempo')updateTempoLive();
 if(currentView==='inicio'){const el=$('#sb-clock');if(el)el.textContent=fmtClock(clockNow())}
}
function init(){
 load();renderHeader();
 $('#demo-new').onclick=()=>{const n=newGame();DB.games[n.id]=n;DB.currentId=n.id;save();resetLocalState();goTo('inicio');toast('Jogo novo criado. Começa por escrever os nomes em Jogadores ou Exclusões.')};
 window.addEventListener('hashchange',route);
 /* várias páginas/separadores abertos ao mesmo tempo: manter os dados sincronizados */
 window.addEventListener('storage',e=>{
  if(e.key!==STORE_KEY||!e.newValue)return;
  try{const d=JSON.parse(e.newValue);if(!d||!d.games)return;DB=d;DB.settings={...DEFAULT_SETTINGS,...(DB.settings||{})};Object.values(DB.games).forEach(normalizeGame)}catch(err){return}
  updateHeader();
  const a=document.activeElement;if(!(a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)&&a.closest('main')))rerender();
 });
 route();
 initPWA();
 initCloud();
 setInterval(tick,250);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
