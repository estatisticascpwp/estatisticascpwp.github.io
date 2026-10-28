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

