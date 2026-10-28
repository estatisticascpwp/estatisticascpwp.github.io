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
