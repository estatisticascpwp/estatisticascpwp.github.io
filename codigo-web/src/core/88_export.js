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
