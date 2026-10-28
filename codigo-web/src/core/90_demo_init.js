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
