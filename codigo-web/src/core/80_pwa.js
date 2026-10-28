/* =========================================================
   PWA — instalação no ecrã principal, funcionamento offline e atualizações.
   Só ativa na versão em pasta alojada num endereço https (tem <link rel="manifest">).
   ========================================================= */
const APP_VERSION='__APP_VERSION__';
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
