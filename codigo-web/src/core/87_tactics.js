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
