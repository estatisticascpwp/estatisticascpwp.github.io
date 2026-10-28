'use strict';
/* =========================================================
   QUADRO TÁTICO — 1.º draft
   Piscina vista de cima (30×20 m, baliza da direita em x=30), jogadores e bola arrastáveis,
   setas de movimento/passe/remate, táticas em vários passos com animação, biblioteca partilhada.
   ========================================================= */
const TB_VIEW={full:'-1.6 -1.3 33.2 22.6',half:'13.2 -1.3 18.4 22.6'};
const TB_PIECE={scp:{fill:'#0d7d45',ring:'#ffffff',txt:'#ffffff',label:'SCP'},opp:{fill:'#1e3a8a',ring:'#ffffff',txt:'#ffffff',label:'Adversário'},
 gks:{fill:'#d93232',ring:'#0d7d45',txt:'#ffffff',label:'GR SCP'},gko:{fill:'#d93232',ring:'#1e3a8a',txt:'#ffffff',label:'GR adversário'},ball:{label:'Bola'}};
const TB_ARROW={move:{c:'#ffffff',w:0.14,dash:'',label:'Movimento'},pass:{c:'#fcd116',w:0.13,dash:'0.45 0.3',label:'Passe'},shot:{c:'#ff5a5a',w:0.18,dash:'',label:'Remate'}};
const tb={id:null,step:0,tool:'move',sel:null,playing:false,drag:null,draft:null,cat:'',speed:1000,raf:0};

/* ---------- modelos (interpretação inicial — ajustar à vontade) ---------- */
function tbMake(def){
 const pieces=def.pieces.map((p,i)=>({id:'p'+i,t:p[0],n:p[1]==null?'':String(p[1])}));
 const steps=def.frames.map((fr,si)=>({pieces:pieces.map((p,i)=>({...p,x:fr[i][0],y:fr[i][1]})),arrows:(def.arrows[si]||[]).map((a,ai)=>({id:'a'+si+'_'+ai,k:a[0],x1:a[1],y1:a[2],x2:a[3],y2:a[4]}))}));
 return {name:def.name,cat:def.cat,view:def.view||'half',notes:def.notes||'',steps};
}
const TB_MODELS=[
 {key:'zona-m',name:'Defesa em zona M',cat:'Defesa',notes:'SCP defende em M contra o 3-3. Bola no 3: os defensores do 2 e do 4 recuam para os lados do centro. Bola na lateral: o defensor do lado da bola sai a pressionar e os outros fecham por dentro. Modelo inicial: ajustar posições ao que o treinador pretende.',
  pieces:[['opp',1],['opp',2],['opp',3],['opp',4],['opp',5],['opp',6],['scp',1],['scp',2],['scp',3],['scp',4],['scp',5],['scp',6],['gks',1],['ball']],
  frames:[
   [[28,15.6],[25,14.8],[23.2,10],[25,5.2],[28,4.4],[28,10],[28.9,14.3],[26.4,12.6],[24.7,10],[26.4,7.4],[28.9,5.7],[26.6,10],[29.5,10],[23.7,10.4]],
   [[28,15.6],[25,14.8],[23.2,10],[25,5.2],[28,4.4],[28,10],[29,14.4],[25.9,13.9],[25.3,11.6],[26.6,8.6],[28.2,6.6],[26.8,11],[29.5,11.2],[25.5,14.3]],
   [[28,15.6],[25,14.8],[23.2,10],[25,5.2],[28,4.4],[28,10],[28.2,13.4],[26.6,11.4],[25.3,8.4],[25.9,6.1],[29,5.6],[26.8,9],[29.5,8.8],[25.5,5.7]]],
  arrows:[[['pass',23.7,10.4,25.3,14.2],['move',26.4,12.6,25.9,13.6],['move',24.7,10,25.2,11.3]],
          [['pass',25.4,14.2,25.4,6],['move',25.9,13.9,26.5,11.6],['move',26.6,8.6,25.9,6.4],['move',28.2,6.6,28.5,5.4]],[]]},
 {key:'inferioridade',name:'Inferioridade 5x6 contra 4-2',cat:'Inferioridade',notes:'Cinco defensores contra o 4-2 do adversário: dois a fechar os postes, dois à frente a cobrir as laterais e um a pressionar do lado da bola. Na troca de bola, toda a defesa roda para o lado da bola.',
  pieces:[['opp',1],['opp',2],['opp',3],['opp',4],['opp',5],['opp',6],['scp',2],['scp',3],['scp',4],['scp',5],['scp',6],['gks',1],['ball']],
  frames:[
   [[25.6,17],[23.4,12.6],[23.4,7.4],[25.6,3],[28.3,13],[28.3,7],[27,11.8],[25.2,11.6],[25.2,8.4],[27,8.2],[25.4,15],[29.5,10.6],[23.8,12.9]],
   [[25.6,17],[23.4,12.6],[23.4,7.4],[25.6,3],[28.3,13],[28.3,7],[27,11.6],[25.6,10],[25.4,5.4],[26.9,7.9],[25.1,11.4],[29.5,9.2],[25.9,3.4]]],
  arrows:[[['pass',23.8,12.9,25.8,3.6],['move',25.2,8.4,25.4,5.7],['move',25.4,15,25.2,11.7],['move',25.2,11.6,25.6,10.3],['move',27,8.2,26.9,7.9]],[]]},
 {key:'superioridade',name:'Superioridade 6x5 (4-2)',cat:'Superioridade',notes:'SCP em 4-2 com seis contra cinco: dois nos postes e quatro fora. Circular a bola rapidamente para o lado contrário e rematar da posição livre.',
  pieces:[['scp',1],['scp',2],['scp',3],['scp',4],['scp',5],['scp',6],['opp',2],['opp',3],['opp',4],['opp',5],['opp',6],['gko',1],['ball']],
  frames:[
   [[25.6,17],[23.4,12.6],[23.4,7.4],[25.6,3],[28.3,13],[28.3,7],[27,11.8],[25.2,11.6],[25.2,8.4],[27,8.2],[25.4,15],[29.5,10.6],[25.9,16.6]],
   [[25.6,17],[23.4,12.6],[23.4,7.4],[25.6,3],[28.3,13],[28.3,7],[27,11.8],[24.6,11.2],[25.2,8.6],[27,8.2],[25.4,14.6],[29.5,10.2],[23.8,12.9]],
   [[25.6,17],[23.4,12.6],[23.4,7.4],[25.6,3],[28.3,13],[28.3,7],[27,11.7],[25,10.6],[24.6,8],[27,8],[25.2,13.2],[29.5,8.6],[25.9,3.4]]],
  arrows:[[['pass',25.9,16.6,23.9,12.8]],[['pass',23.8,12.9,25.8,3.6]],[['shot',25.9,3.4,29.9,8.9]]]},
 {key:'ataque-33',name:'Ataque 3-3 (arco) · 2 cruzada',cat:'Ataque',notes:'Posições base do 3-3. O 2 cruza por trás do 3 para o lado esquerdo e recebe em movimento.',
  pieces:[['scp',1],['scp',2],['scp',3],['scp',4],['scp',5],['scp',6],['opp',1],['opp',2],['opp',3],['opp',4],['opp',5],['opp',6],['gko',1],['ball']],
  frames:[
   [[28,15.6],[25,14.8],[23.2,10],[25,5.2],[28,4.4],[28,10],[28.9,14.3],[26.1,13.9],[24.6,10],[26.1,6.1],[28.9,5.7],[26.6,10],[29.5,10],[23.7,10.4]],
   [[28,15.6],[24.6,7.6],[23.2,10],[25,5.2],[28,4.4],[28,10],[28.9,14.3],[25.6,8.7],[24.6,10.2],[26.1,6.1],[28.9,5.7],[26.6,10],[29.5,9.6],[24.8,8]]],
  arrows:[[['move',25,14.8,24.7,8],['pass',23.7,10.4,24.6,8.2]],[['shot',24.8,8,29.9,8.9]]]},
 {key:'saida',name:'Posições de saída (sprint)',cat:'Bola parada',view:'full',notes:'Início de período: as duas equipas na linha de golo e a bola no meio. O sprinter do SCP nada para a bola; os restantes avançam para as posições de ataque ou defesa.',
  pieces:[['gks',1],['scp',2],['scp',3],['scp',4],['scp',5],['scp',6],['scp',7],['gko',1],['opp',2],['opp',3],['opp',4],['opp',5],['opp',6],['opp',7],['ball']],
  frames:[
   [[0.5,10],[0.6,3.5],[0.6,5.7],[0.6,7.9],[0.6,12.1],[0.6,14.3],[0.6,16.5],[29.5,10],[29.4,3.5],[29.4,5.7],[29.4,7.9],[29.4,12.1],[29.4,14.3],[29.4,16.5],[15,10]],
   [[1.2,10],[8,4.5],[9,7],[14.3,9.7],[9,12.6],[8.5,15.2],[6.5,10],[28.8,10],[22,4.5],[21,7],[15.7,10.4],[21,12.8],[21.5,15.2],[23.5,10],[15,10]]],
  arrows:[[['move',0.6,7.9,14.3,9.7],['move',29.4,12.1,15.7,10.4]],[]]}
];

/* ---------- utilitários ---------- */
let TACTS=null;
const tCur=()=>TACTS&&TACTS[tb.id];
const tStep=()=>{const t=tCur();return t?t.steps[Math.min(tb.step,t.steps.length-1)]:null};
function tPersist(t){t.updated=Date.now();TACTS[t.id]=t;saveTactics(TACTS)}
function tNew(fromModel,name){
 const m=fromModel?tbMake(fromModel):{name:'Nova tática',cat:'Outros',view:'half',notes:'',steps:[{pieces:[{id:'p0',t:'ball',n:'',x:22,y:10}],arrows:[]}]};
 const t={id:uid(),...m,name:name||m.name,created:Date.now(),updated:Date.now()};
 return t;
}
function svgPt(svg,e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse());return {x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100}}
const clampPool=p=>({x:clamp(p.x,-0.8,30.8),y:clamp(p.y,-0.6,20.6)});
function distSeg(p,a){const dx=a.x2-a.x1,dy=a.y2-a.y1,l=dx*dx+dy*dy;let u=l?((p.x-a.x1)*dx+(p.y-a.y1)*dy)/l:0;u=clamp(u,0,1);const x=a.x1+u*dx,y=a.y1+u*dy;return Math.hypot(p.x-x,p.y-y)}
function hitPiece(st,p){let best=null,bd=1e9;st.pieces.forEach(q=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<(q.t==='ball'?0.75:0.95)&&d<bd){bd=d;best=q}});return best}

/* ---------- desenho ---------- */
function poolSVG(){
 const lanes=Array.from({length:8},(_,i)=>`<rect x="0" y="${i*2.5}" width="30" height="2.5" fill="${i%2?'#2777ae':'#2a7db5'}"/>`).join('');
 const vline=(x,c,w,dash)=>`<line x1="${x}" y1="0" x2="${x}" y2="20" stroke="${c}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
 const goal=(x,dir)=>`<rect x="${dir<0?x-0.7:x}" y="8.5" width="0.7" height="3" fill="url(#tb-net)" stroke="#ffffff" stroke-width="0.09"/>`;
 const lbl=(x,t,c)=>`<text x="${x}" y="-0.35" font-size="0.62" text-anchor="middle" fill="${c}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700">${t}</text>`;
 return `<defs>
   <pattern id="tb-net" width="0.25" height="0.25" patternUnits="userSpaceOnUse"><rect width="0.25" height="0.25" fill="#e8f0f3"/><path d="M0 0H0.25M0 0V0.25" stroke="#9fb4bd" stroke-width="0.03"/></pattern>
   ${Object.entries(TB_ARROW).map(([k,a])=>`<marker id="tb-ah-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${a.c}"/></marker>`).join('')}
  </defs>
  <rect x="-1.6" y="-1.3" width="33.2" height="22.6" fill="#dfe8e5"/>
  ${lanes}
  ${vline(0,'#ffffff',0.1)}${vline(30,'#ffffff',0.1)}
  ${vline(2,'#ff4b4b',0.1)}${vline(28,'#ff4b4b',0.1)}
  ${vline(6,'#fcd116',0.1)}${vline(24,'#fcd116',0.1)}
  ${vline(15,'#ffffff',0.08,'0.4 0.3')}
  ${goal(0,-1)}${goal(30,1)}
  ${lbl(2,'2m','#c0392b')}${lbl(6,'6m','#9a7a00')}${lbl(15,'meio','#4b5f5b')}${lbl(24,'6m','#9a7a00')}${lbl(28,'2m','#c0392b')}`;
}
function pieceSVG(q,sel){
 if(q.t==='ball')return `<g class="tb-piece" data-pid="${q.id}" transform="translate(${q.x} ${q.y})"><circle r="0.4" fill="#fcd116" stroke="#8a6d00" stroke-width="0.07"/><path d="M-0.38 -0.05 Q0 0.12 0.38 -0.05 M-0.06 -0.39 Q0.1 0 -0.06 0.39" fill="none" stroke="#8a6d00" stroke-width="0.05"/>${sel?'<circle r="0.7" fill="none" stroke="#fcd116" stroke-width="0.08" stroke-dasharray="0.2 0.12"/>':''}</g>`;
 const s=TB_PIECE[q.t]||TB_PIECE.scp;
 return `<g class="tb-piece" data-pid="${q.id}" transform="translate(${q.x} ${q.y})"><circle r="0.66" fill="${s.fill}" stroke="${s.ring}" stroke-width="0.14"/><text y="0.23" font-size="0.66" text-anchor="middle" fill="${s.txt}" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800">${esc(q.n)}</text>${sel?'<circle r="0.98" fill="none" stroke="#fcd116" stroke-width="0.1" stroke-dasharray="0.25 0.15"/>':''}</g>`;
}
function arrowSVG(a,cls=''){const s=TB_ARROW[a.k]||TB_ARROW.move;return `<line class="tb-arrow ${cls}" data-aid="${a.id||''}" x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${s.c}" stroke-width="${s.w}" stroke-linecap="round"${s.dash?` stroke-dasharray="${s.dash}"`:''} marker-end="url(#tb-ah-${a.k})"/>`}
function renderBoard(){
 const t=tCur(),svg=$('#tb-svg');if(!t||!svg)return;
 const st=tStep();
 const vb=TB_VIEW[t.view]||TB_VIEW.half,[,,vw,vh]=vb.split(' ').map(Number);
 svg.setAttribute('viewBox',vb);svg.style.setProperty('--tb-r',(vw/vh).toFixed(3));
 $('#tb-arrows').innerHTML=st.arrows.map(a=>arrowSVG(a)).join('');
 $('#tb-pieces').innerHTML=st.pieces.filter(q=>q.t!=='ball').map(q=>pieceSVG(q,tb.sel===q.id)).join('')+st.pieces.filter(q=>q.t==='ball').map(q=>pieceSVG(q,tb.sel===q.id)).join('');
 $('#tb-draft').innerHTML='';
 renderSteps();renderSel();
}
function renderSteps(){
 const t=tCur();if(!t)return;
 $('#tb-steps').innerHTML=t.steps.map((s,i)=>`<button type="button" class="tb-stepchip ${i===tb.step?'on':''}" data-step="${i}" ${tb.playing?'disabled':''}>${i+1}</button>`).join('')
  +`<button type="button" class="tb-stepchip add" data-act="step-add" title="Novo passo (copia o atual)" ${tb.playing?'disabled':''}>+</button>`;
 $('#tb-play').innerHTML=tb.playing?icon('pause')+'Parar':icon('play')+'Animar';
 $('#tb-play').disabled=t.steps.length<2&&!tb.playing;
 $('#tb-stepinfo').textContent=`Passo ${tb.step+1} de ${t.steps.length}`;
}
function renderSel(){
 const box=$('#tb-selbox');if(!box)return;
 const st=tStep(),q=st&&st.pieces.find(x=>x.id===tb.sel);
 if(!q){box.innerHTML='<span class="muted small">Toca num jogador para mudar o número ou retirá-lo.</span>';return}
 box.innerHTML=`<span class="tb-selname">${TB_PIECE[q.t].label}</span>${q.t==='ball'?'':`<label class="small" for="tb-num">Nº</label><input id="tb-num" class="inp-sm" style="width:58px" value="${esc(q.n)}" maxlength="3">`}<button type="button" class="btn btn-sm btn-danger" data-act="piece-del">${icon('trash')}Retirar</button>`;
 const inp=$('#tb-num');if(inp)inp.onchange=()=>{const t=tCur();const n=inp.value.trim().slice(0,3);t.steps.forEach(s=>s.pieces.forEach(p=>{if(p.id===q.id)p.n=n}));tPersist(t);renderBoard()};
}
function renderLibrary(){
 const list=Object.values(TACTS).filter(t=>!tb.cat||t.cat===tb.cat).sort((a,b)=>(b.updated||0)-(a.updated||0));
 $('#tb-cats').innerHTML=['',...TACT_CATS].map(c=>`<button type="button" class="chip ${tb.cat===c?'on':''}" data-cat="${esc(c)}">${c||'Todas'}</button>`).join('');
 $('#tb-list').innerHTML=list.length?list.map(t=>`<button type="button" class="tb-item ${t.id===tb.id?'on':''}" data-tid="${t.id}"><b>${esc(t.name)}</b><span>${esc(t.cat||'Outros')} · ${t.steps.length} passo(s)</span></button>`).join(''):'<p class="muted small">Ainda não há táticas nesta categoria.</p>';
}
function renderDetails(){
 const t=tCur();if(!t)return;
 $('#tb-name').value=t.name;$('#tb-cat').value=t.cat||'Outros';$('#tb-notes').value=t.notes||'';
 $$('#tb-view button').forEach(b=>b.classList.toggle('on',b.dataset.view===t.view));
}
function setTool(k){tb.tool=k;$$('#tb-tools [data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===k));const svg=$('#tb-svg');if(svg)svg.dataset.tool=k}

/* ---------- página ---------- */
function renderTaticas(){
 TACTS=loadTactics();
 if(!Object.keys(TACTS).length){                 // primeira vez: começar com um modelo (id fixo para não duplicar entre dispositivos)
  const m=TB_MODELS[0],t={id:'modelo-'+m.key,...tbMake(m),name:m.name+' (modelo)',created:Date.now(),updated:Date.now()};
  TACTS[t.id]=t;saveTactics(TACTS);
 }
 if(!tb.id||!TACTS[tb.id]){let last='';try{last=localStorage.getItem('scpStat.tb.last')||''}catch(e){}tb.id=TACTS[last]?last:Object.values(TACTS).sort((a,b)=>(b.updated||0)-(a.updated||0))[0].id;tb.step=0}
 const v=$('#view-taticas');
 v.innerHTML=`
 <section class="panel">
  <div class="view-head"><div><h1 class="title">Quadro Tático</h1><p>Arrasta as jogadores e a bola, desenha setas e cria vários passos para animar a jogada. As táticas ficam guardadas e, com a base de dados ligada, partilhadas com a equipa.</p></div>
   <div class="btn-row"><button type="button" class="btn btn-primary" data-act="new">${icon('plus')}Nova tática</button><button type="button" class="btn btn-ghost" data-act="full">${icon('open')}Ecrã inteiro</button></div></div>
  <div class="tb-layout">
   <div class="tb-main">
    <div class="tb-toolbar" id="tb-tools">
     <div class="tb-group"><span class="tb-glabel">Ferramenta</span>
      <button type="button" class="tb-tool" data-tool="move">✋ Mover</button>
      <button type="button" class="tb-tool" data-tool="move-arrow"><span class="tb-sw" style="background:#ffffff"></span>Movimento</button>
      <button type="button" class="tb-tool" data-tool="pass-arrow"><span class="tb-sw dash" style="border-color:#fcd116"></span>Passe</button>
      <button type="button" class="tb-tool" data-tool="shot-arrow"><span class="tb-sw" style="background:#ff5a5a"></span>Remate</button>
      <button type="button" class="tb-tool" data-tool="erase">${icon('trash')}Apagar</button></div>
     <div class="tb-group"><span class="tb-glabel">Adicionar</span>
      <button type="button" class="tb-add" data-add="scp"><span class="tb-cap" style="background:#0d7d45"></span>SCP</button>
      <button type="button" class="tb-add" data-add="opp"><span class="tb-cap" style="background:#1e3a8a"></span>Adv.</button>
      <button type="button" class="tb-add" data-add="gks"><span class="tb-cap" style="background:#d93232;box-shadow:0 0 0 2px #0d7d45"></span>GR SCP</button>
      <button type="button" class="tb-add" data-add="gko"><span class="tb-cap" style="background:#d93232;box-shadow:0 0 0 2px #1e3a8a"></span>GR Adv.</button>
      <button type="button" class="tb-add" data-add="ball"><span class="tb-cap" style="background:#fcd116"></span>Bola</button></div>
    </div>
    <div class="tb-board" id="tb-board">
     <svg id="tb-svg" class="tb-svg" viewBox="${TB_VIEW.half}" role="img" aria-label="Quadro tático: piscina vista de cima">
      ${poolSVG()}<g id="tb-arrows"></g><g id="tb-draft"></g><g id="tb-pieces"></g>
     </svg>
     <div class="tb-fullbar"><button type="button" class="btn btn-sm btn-ghost" data-act="prev">◀</button><span id="tb-stepinfo2" class="tb-steplbl"></span><button type="button" class="btn btn-sm btn-ghost" data-act="next">▶</button><button type="button" class="btn btn-sm btn-primary" data-act="play2">Animar</button><button type="button" class="btn btn-sm btn-ghost" data-act="exitfull">Sair</button></div>
    </div>
    <div class="tb-stepsbar">
     <span class="tb-glabel">Passos</span><div class="tb-steps" id="tb-steps"></div>
     <span class="muted small" id="tb-stepinfo"></span>
     <div class="tb-stepctl">
      <button type="button" class="btn btn-sm btn-ghost" data-act="prev" title="Passo anterior">◀</button>
      <button type="button" class="btn btn-sm btn-ghost" data-act="next" title="Passo seguinte">▶</button>
      <button type="button" class="btn btn-sm btn-primary" id="tb-play" data-act="play"></button>
      <select id="tb-speed" class="inp-sm" aria-label="Velocidade"><option value="1600">Lento</option><option value="1000" selected>Normal</option><option value="600">Rápido</option></select>
      <button type="button" class="btn btn-sm btn-ghost" data-act="step-del">${icon('trash')}Apagar passo</button>
      <button type="button" class="btn btn-sm btn-ghost" data-act="arrows-clear">Limpar setas</button>
     </div>
    </div>
    <div class="tb-selbox" id="tb-selbox"></div>
    <p class="muted small tb-mobilehint">No telemóvel, roda o ecrã na horizontal ou usa <b>Ecrã inteiro</b> para teres o quadro maior.</p>
   </div>
   <aside class="tb-side">
    <div class="step"><div class="step-h">Tática</div>
     <div class="field"><label for="tb-name">Nome</label><input id="tb-name"></div>
     <div class="field" style="margin-top:8px"><label for="tb-cat">Categoria</label><select id="tb-cat">${TACT_CATS.map(c=>`<option>${c}</option>`).join('')}</select></div>
     <div class="field" style="margin-top:8px"><span class="lbl">Vista</span><div class="seg" id="tb-view"><button type="button" data-view="half">Meio campo</button><button type="button" data-view="full">Piscina inteira</button></div></div>
     <div class="field" style="margin-top:8px"><label for="tb-notes">Notas para a equipa</label><textarea id="tb-notes" rows="4" placeholder="Pontos-chave, quando usar, variações…"></textarea></div>
     <div class="btn-row" style="margin-top:10px"><button type="button" class="btn btn-sm btn-outline" data-act="dup">Duplicar</button><button type="button" class="btn btn-sm btn-danger" data-act="del">${icon('trash')}Apagar tática</button></div>
    </div>
    <div class="step"><div class="step-h">Táticas da equipa</div><div class="chips tb-cats" id="tb-cats"></div><div class="tb-list" id="tb-list"></div></div>
   </aside>
  </div>
 </section>`;
 const svg=$('#tb-svg');
 svg.addEventListener('pointerdown',tbDown);svg.addEventListener('pointermove',tbMove);svg.addEventListener('pointerup',tbUp);svg.addEventListener('pointercancel',tbUp);
 v.onclick=tbClick;
 $('#tb-speed').value=String(tb.speed);$('#tb-speed').onchange=e=>{tb.speed=+e.target.value};
 $('#tb-name').onchange=e=>{const t=tCur();t.name=e.target.value.trim()||'Sem nome';tPersist(t);renderLibrary()};
 $('#tb-cat').onchange=e=>{const t=tCur();t.cat=e.target.value;tPersist(t);renderLibrary()};
 $('#tb-notes').onchange=e=>{const t=tCur();t.notes=e.target.value;tPersist(t)};
 document.onfullscreenchange=()=>{$('#tb-board')&&$('#tb-board').classList.toggle('isfull',document.fullscreenElement===$('#tb-board'));updFullInfo()};
 setTool(tb.tool);renderLibrary();renderDetails();renderBoard();updFullInfo();
}
function updFullInfo(){const t=tCur(),e=$('#tb-stepinfo2');if(t&&e)e.textContent=`${t.name} · passo ${tb.step+1}/${t.steps.length}`}
function openTactic(id){tb.id=id;tb.step=0;tb.sel=null;try{localStorage.setItem('scpStat.tb.last',id)}catch(e){}renderLibrary();renderDetails();renderBoard();updFullInfo()}
/** chamado quando chegam táticas de outro dispositivo */
function tacticsRemoteUpdate(){
 if(currentView!=='taticas'||tb.drag||tb.draft||tb.playing)return;
 TACTS=loadTactics();
 if(!TACTS[tb.id]){const first=Object.values(TACTS)[0];if(!first)return renderTaticas();tb.id=first.id;tb.step=0}
 const t=tCur();if(tb.step>=t.steps.length)tb.step=t.steps.length-1;
 renderLibrary();if(document.activeElement&&document.activeElement.closest('.tb-side'))return;renderDetails();renderBoard();
}

/* ---------- interação com o quadro ---------- */
function tbDown(e){
 if(tb.playing)return;
 const svg=e.currentTarget,p=svgPt(svg,e),t=tCur(),st=tStep();
 if(tb.tool==='move'){
  const q=hitPiece(st,p);tb.sel=q?q.id:null;
  if(q){tb.drag={id:q.id,dx:q.x-p.x,dy:q.y-p.y,moved:false};svg.setPointerCapture(e.pointerId)}
  renderBoard();return;
 }
 if(tb.tool==='erase'){
  const q=hitPiece(st,p);
  if(q){t.steps.forEach(s=>{s.pieces=s.pieces.filter(x=>x.id!==q.id)});tb.sel=null;tPersist(t);renderBoard();return}
  const a=st.arrows.find(a=>distSeg(p,a)<0.5);
  if(a){st.arrows=st.arrows.filter(x=>x!==a);tPersist(t);renderBoard()}
  return;
 }
 const k=tb.tool.replace('-arrow','');
 const q=hitPiece(st,p);const s0=q?{x:q.x,y:q.y}:p;
 tb.draft={k,x1:s0.x,y1:s0.y,x2:s0.x,y2:s0.y};svg.setPointerCapture(e.pointerId);
}
function tbMove(e){
 if(!tb.drag&&!tb.draft)return;
 e.preventDefault();
 const p=svgPt(e.currentTarget,e);
 if(tb.drag){
  const q=tStep().pieces.find(x=>x.id===tb.drag.id);if(!q)return;
  const np=clampPool({x:p.x+tb.drag.dx,y:p.y+tb.drag.dy});q.x=Math.round(np.x*100)/100;q.y=Math.round(np.y*100)/100;tb.drag.moved=true;
  const el=$(`#tb-pieces [data-pid="${q.id}"]`);if(el)el.setAttribute('transform',`translate(${q.x} ${q.y})`);
 }else{tb.draft.x2=p.x;tb.draft.y2=p.y;$('#tb-draft').innerHTML=arrowSVG(tb.draft,'draft')}
}
function tbUp(e){
 const t=tCur();
 if(tb.drag){const moved=tb.drag.moved;tb.drag=null;if(moved){tPersist(t);renderSel()}return}
 if(tb.draft){
  const a=tb.draft;tb.draft=null;$('#tb-draft').innerHTML='';
  if(Math.hypot(a.x2-a.x1,a.y2-a.y1)>0.6){tStep().arrows.push({id:uid(),...a});tPersist(t)}
  renderBoard();
 }
}
function tbAddPiece(kind){
 const t=tCur(),st=tStep();
 if(kind==='ball'&&st.pieces.some(q=>q.t==='ball')){toast('Já há uma bola no quadro.','warn');return}
 let n='';
 if(kind!=='ball'){const used=new Set(st.pieces.filter(q=>q.t===kind||(kind[0]==='g'&&q.t[0]==='g')).map(q=>q.n));for(let i=kind[0]==='g'?1:2;i<=15;i++){if(!used.has(String(i))){n=String(i);break}}}
 const cx=t.view==='full'?15:22.5,k=st.pieces.length;
 const base={id:uid(),t:kind,n,x:clamp(cx+((k%5)-2)*1.4,0.5,29.5),y:clamp(10+(Math.floor(k/5)%3-1)*1.6,0.6,19.4)};
 t.steps.forEach(s=>s.pieces.push({...base}));
 tb.sel=base.id;setTool('move');tPersist(t);renderBoard();
}
function tbClick(e){
 const b=e.target.closest('[data-act],[data-tool],[data-add],[data-step],[data-tid],[data-cat],[data-view]');if(!b||tb.playing&&!/play|exitfull/.test(b.dataset.act||''))return;
 const t=tCur();
 if(b.dataset.tool){setTool(b.dataset.tool);return}
 if(b.dataset.add){tbAddPiece(b.dataset.add);return}
 if(b.dataset.step!=null){tb.step=+b.dataset.step;tb.sel=null;renderBoard();updFullInfo();return}
 if(b.dataset.tid){openTactic(b.dataset.tid);return}
 if(b.dataset.cat!=null){tb.cat=b.dataset.cat;renderLibrary();return}
 if(b.dataset.view){t.view=b.dataset.view;tPersist(t);renderDetails();renderBoard();return}
 switch(b.dataset.act){
  case 'step-add':{const copy=JSON.parse(JSON.stringify(tStep()));copy.arrows=[];t.steps.splice(tb.step+1,0,copy);tb.step++;tPersist(t);renderBoard();updFullInfo();toast(`Passo ${tb.step+1} criado: arrasta as jogadores para a nova posição`);break}
  case 'step-del':if(t.steps.length<2){toast('A tática precisa de pelo menos um passo.','warn');break}
   confirmBox('Apagar passo',`Apagar o passo ${tb.step+1}?`,'Apagar').then(ok=>{if(!ok)return;t.steps.splice(tb.step,1);tb.step=Math.max(0,tb.step-1);tPersist(t);renderBoard();updFullInfo()});break;
  case 'arrows-clear':tStep().arrows=[];tPersist(t);renderBoard();break;
  case 'prev':if(tb.step>0){tb.step--;tb.sel=null;renderBoard();updFullInfo()}break;
  case 'next':if(tb.step<t.steps.length-1){tb.step++;tb.sel=null;renderBoard();updFullInfo()}break;
  case 'play':case 'play2':tb.playing?tbStop():tbPlay();break;
  case 'piece-del':{const id=tb.sel;t.steps.forEach(s=>{s.pieces=s.pieces.filter(x=>x.id!==id)});tb.sel=null;tPersist(t);renderBoard();break}
  case 'new':tbNewFlow();break;
  case 'dup':{const c=JSON.parse(JSON.stringify(t));c.id=uid();c.name=t.name+' (cópia)';c.created=c.updated=Date.now();TACTS[c.id]=c;saveTactics(TACTS);openTactic(c.id);toast('Tática duplicada');break}
  case 'del':confirmBox('Apagar tática',`Apagar <b>${esc(t.name)}</b>?${cloud.user?' Também é apagada para toda a equipa.':''}`,'Apagar').then(ok=>{if(!ok)return;deleteTactic(t.id);TACTS=loadTactics();tb.id=null;renderTaticas();toast('Tática apagada')});break;
  case 'full':{const el=$('#tb-board');if(el.requestFullscreen)el.requestFullscreen().catch(()=>toast('Este dispositivo não permite ecrã inteiro.','warn'));else toast('Este dispositivo não permite ecrã inteiro.','warn');break}
  case 'exitfull':if(document.fullscreenElement)document.exitFullscreen();break;
 }
}
async function tbNewFlow(){
 const choice=await modal({title:'Nova tática',body:`<p>Começa em branco ou a partir de um modelo. Os modelos são um ponto de partida: ajusta as posições ao que pretendes.</p>
  <div class="field" style="margin-top:8px"><label for="m-tb-name">Nome</label><input id="m-tb-name" placeholder="Ex.: Defesa em M contra o Benfica"></div>
  <div class="field" style="margin-top:8px"><label for="m-tb-model">Começar a partir de</label><select id="m-tb-model"><option value="">Em branco (só a bola)</option>${TB_MODELS.map(m=>`<option value="${m.key}">${esc(m.name)}</option>`).join('')}</select></div>`,
  actions:[{label:'Cancelar',cls:'btn-ghost',value:null},{label:'Criar',cls:'btn-primary',get:r=>({name:r.querySelector('#m-tb-name').value.trim(),model:r.querySelector('#m-tb-model').value})}]});
 if(!choice)return;
 const m=TB_MODELS.find(x=>x.key===choice.model);
 const t=tNew(m,choice.name||(m?m.name:'Nova tática'));
 TACTS[t.id]=t;saveTactics(TACTS);openTactic(t.id);toast('Tática criada');
}

/* ---------- animação ---------- */
function tbPlay(){
 const t=tCur();if(!t||t.steps.length<2)return;
 tb.playing=true;tb.sel=null;let i=tb.step>=t.steps.length-1?0:tb.step;tb.step=i;renderBoard();
 const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
 const run=()=>{
  if(!tb.playing)return;
  if(i>=t.steps.length-1){tbStop();return}
  const A=t.steps[i],B=t.steps[i+1],t0=performance.now();
  $('#tb-arrows').innerHTML=A.arrows.map(a=>arrowSVG(a)).join('');
  const frame=now=>{
   if(!tb.playing)return;
   const u=Math.min(1,(now-t0)/tb.speed),k=ease(u);
   B.pieces.forEach(q=>{const a=A.pieces.find(x=>x.id===q.id)||q;const el=$(`#tb-pieces [data-pid="${q.id}"]`);if(el)el.setAttribute('transform',`translate(${a.x+(q.x-a.x)*k} ${a.y+(q.y-a.y)*k})`)});
   $('#tb-arrows').style.opacity=String(1-u*0.6);
   if(u<1){tb.raf=requestAnimationFrame(frame)}
   else{i++;tb.step=i;$('#tb-arrows').style.opacity='';renderBoard();updFullInfo();setTimeout(run,350)}
  };
  tb.raf=requestAnimationFrame(frame);
 };
 renderSteps();setTimeout(run,250);
}
function tbStop(){tb.playing=false;cancelAnimationFrame(tb.raf);const a=$('#tb-arrows');if(a)a.style.opacity='';renderBoard();updFullInfo()}
