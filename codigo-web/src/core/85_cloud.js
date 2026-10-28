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
