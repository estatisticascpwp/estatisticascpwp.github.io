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
}

/* ---------- Jogador ---------- */
const player=n=>G().roster.find(p=>p.n===+n);
const pname=n=>{const p=player(n);return p&&p.name?p.name:'Jogador '+n};
const plabel=n=>n?`${n} · ${pname(n)}`:'—';
const namedRoster=()=>G().roster.filter(p=>p.n<=13||p.name);

/* ---------- Modal e avisos (sem alert/confirm do browser) ---------- */
function modal({title,body,actions}){
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
function exportGameJSON(){
 download('scp_stat_'+fileStamp()+'.json',JSON.stringify({app:'scp-stat-polo',version:1,exported:new Date().toISOString(),game:G()},null,1),'application/json');
}
async function importGameJSON(){
 const f=await pickFile('.json,application/json'); if(!f)return;
 let d; try{d=JSON.parse(f.text)}catch(e){toast('Este ficheiro não é um jogo exportado pela SCP Stat (.json).','bad');return}
 const game=d&&d.game; if(!game||d.app!=='scp-stat-polo'){toast('Este ficheiro não é um jogo exportado pela SCP Stat (.json).','bad');return}
 normalizeGame(game);
 if(DB.games[game.id]){
  const m=await modal({title:'Jogo já existe',body:`<p>Já tens este jogo (${esc(fmtDate(game.date))} vs ${esc(game.opponent)}). Substituir o que está guardado ou importar como cópia?</p>`,actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Importar como cópia',value:'copy'},{label:'Substituir',cls:'btn-danger',value:'replace'}]});
  if(!m)return; if(m==='copy')game.id=uid();
 }
 DB.games[game.id]=game; DB.currentId=game.id; save(); resetLocalState(); rerender(); toast('Jogo importado e aberto');
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
const APP_VERSION='82544d9f16';
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
 setInterval(tick,250);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
