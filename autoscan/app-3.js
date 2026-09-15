function renderQuestions(){
 const sel=getSelectedTopics();dom.questionSuggestions.innerHTML=sel.length?sel.map(si=>{
   const q=MASTER[si].question.replace("{contexto}",contextPhrase());
   return `<div class="generated-q"><strong>${esc(MASTER[si].title)}</strong><br>${esc(q)}<br><button type="button" class="useQ" data-si="${si}">Usar como punto de partida</button></div>`;
 }).join(""):`<p class="note">Selecciona uno o más ámbitos para generar preguntas de partida.</p>`;
 dom.questionSuggestions.querySelectorAll(".useQ").forEach(b=>b.addEventListener("click",()=>{dom.qProvisional.value=MASTER[Number(b.dataset.si)].question.replace("{contexto}",contextPhrase());update()}));
}
function renderTopicCheck(){
 const n=[dom.checkPractice.checked,dom.checkData.checked,dom.checkInterest.checked].filter(Boolean).length;
 dom.topicCheckStatus.textContent=n===3?"El ámbito cumple las tres condiciones para seguir desarrollándolo como posible indagación.":`${n} de 3 condiciones comprobadas.`;
}
function renderResults(){
 const bt=totalCounts("basis"),mt=totalCounts("master"),all={green:bt.green+mt.green,orange:bt.orange+mt.orange,red:bt.red+mt.red,blank:bt.blank+mt.blank,total:bt.total+mt.total};
 dom.greenCount.textContent=all.green;dom.orangeCount.textContent=all.orange;dom.redCount.textContent=all.red;dom.blankCount.textContent=all.blank;
 dom.overallStatus.innerHTML=all.blank?`<div class="warning">Resultado provisional: faltan ${all.blank} respuestas.</div>`:`<div class="success">Autoscan completo: ${all.total} de ${all.total} respuestas.</div>`;
 dom.basisSummary.innerHTML=BASIS.map((s,si)=>summaryRow(s.title,counts("basis",si))).join("");
 dom.masterSummary.innerHTML=MASTER.map((s,si)=>summaryRow(s.title,counts("master",si))).join("");
 const sel=getSelectedTopics(),rows=[
   ["Ámbitos seleccionados",sel.map(si=>MASTER[si].title).join("; ")],
   ["Lo que observo en mi práctica",dom.qPractice.value],
   ["Datos que podría analizar",dom.qData.value],
   ["Lo que quiero comprender mejor",dom.qUnderstand.value],
   ["Pregunta provisional",dom.qProvisional.value]
 ].filter(x=>String(x[1]||"").trim());
 dom.researchSummary.innerHTML=rows.length?rows.map(([a,b])=>`<p><strong>${esc(a)}</strong><br>${esc(b)}</p>`).join(""):`<p class="note">Todavía no has completado esta parte.</p>`;
}
function summaryRow(title,c){return `<div class="summary-row"><div>${esc(title)}</div><div class="bar">${bars(c)}</div><div class="note">${c.green}/${c.orange}/${c.red}</div></div>`}
function state(){
 const answers={};document.querySelectorAll('input[type=radio]:checked').forEach(e=>answers[e.name]=e.value);
 const interest={};MASTER.forEach((_,si)=>interest[si]=masterInterest(si));
 return {schemaVersion:SCHEMA_VERSION,name:dom.studentName.value,date:dom.scanDate.value,answers,interest,selected:getSelectedTopics(),qPractice:dom.qPractice.value,qData:dom.qData.value,qUnderstand:dom.qUnderstand.value,qProvisional:dom.qProvisional.value,checks:{practice:dom.checkPractice.checked,data:dom.checkData.checked,interest:dom.checkInterest.checked}};
}
function validate(s){
 if(!s||typeof s!=="object"||Number(s.schemaVersion)!==SCHEMA_VERSION)return false;
 const allowed=new Set(["green","orange","red"]);
 for(const [k,v] of Object.entries(s.answers||{})){if(!/^(basis|master)_\d+_\d+$/.test(k)||!allowed.has(v))return false}
 return true;
}
function applyState(s){
 dom.studentName.value=s.name||"";dom.scanDate.value=s.date||"";
 Object.entries(s.answers||{}).forEach(([n,v])=>{const e=document.querySelector(`input[name="${n}"][value="${v}"]`);if(e)e.checked=true});
 Object.entries(s.interest||{}).forEach(([i,v])=>{const e=$("interest_"+i);if(e)e.checked=!!v});
 window._restoreTopics=(s.selected||[]).map(Number);
 dom.qPractice.value=s.qPractice||"";dom.qData.value=s.qData||"";dom.qUnderstand.value=s.qUnderstand||"";dom.qProvisional.value=s.qProvisional||"";
 const c=s.checks||{};dom.checkPractice.checked=!!c.practice;dom.checkData.checked=!!c.data;dom.checkInterest.checked=!!c.interest;
}
function migrateLegacy(){
 const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
 try{const s=JSON.parse(raw);if(Number(s.schemaVersion)!==SCHEMA_VERSION)localStorage.setItem(STORAGE_KEY+"_legacy",raw)}catch(e){}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state()))}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(validate(s))applyState(s)}catch(e){}}
function exportState(){
 const blob=new Blob([JSON.stringify(state(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="copia_autoscan_conciencia_linguistica_v6.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function importState(ev){
 const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!validate(s))throw new Error();document.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(e=>e.checked=false);applyState(s);update();alert("Copia recuperada correctamente.")}catch(e){alert("Esta copia no corresponde a esta versión del autoscan.")}};r.readAsText(f);ev.target.value="";
}
function eraseAll(){
 if(!confirm("¿Quieres borrar todas las respuestas guardadas en este dispositivo?"))return;
 localStorage.removeItem(STORAGE_KEY);document.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(e=>e.checked=false);document.querySelectorAll("textarea").forEach(e=>e.value="");dom.studentName.value="";dom.scanDate.value=new Date().toISOString().slice(0,10);update();showView(1);
}
