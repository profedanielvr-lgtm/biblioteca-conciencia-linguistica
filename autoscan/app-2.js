function matrixType(si){
 const need=needLevel(si),interest=interestMarked(si);
 if(need==="alta"&&interest)return ["high-high","Necesidad alta + interés alto","Buen candidato para profundizar, después de asegurar la base necesaria."];
 if(need==="alta"&&!interest)return ["high-low","Necesidad alta + interés bajo","Prioridad para estudiar o refrescar, pero no necesariamente para investigar."];
 if(need!=="alta"&&interest)return ["low-high","Necesidad baja/media + interés alto","Posible tema de especialización o profundización."];
 return ["","Necesidad baja/media + interés bajo","Menor prioridad para este momento."];
}
function state(){
 const answers={};document.querySelectorAll('input[type=radio]:checked').forEach(e=>answers[e.name]=e.value);
 const interest={};SECTIONS.forEach((_,i)=>interest[i]=interestMarked(i));
 const selected=getSelectedTopics();
 return {
   schemaVersion:SCHEMA_VERSION,name:dom.studentName.value,date:dom.scanDate.value,answers,interest,selected,
   qInterest:dom.qInterest.value,qPractice:dom.qPractice.value,qStudents:dom.qStudents.value,qData:dom.qData.value,
   qUnderstand:dom.qUnderstand.value,qProvisional:dom.qProvisional.value,
   checks:{practice:dom.checkPractice.checked,data:dom.checkData.checked,interest:dom.checkInterest.checked}
 };
}
function validateState(s){
 if(!s||typeof s!=="object")return false;
 if(![4,5].includes(Number(s.schemaVersion||s.version||4)))return false;
 if(s.answers && typeof s.answers!=="object")return false;
 const allowed=new Set(["green","orange","red"]);
 for(const [name,val] of Object.entries(s.answers||{})){
   if(!/^s\d+_i\d+$/.test(name)||!allowed.has(val))return false;
 }
 if(s.selected && (!Array.isArray(s.selected)||s.selected.some(x=>!Number.isInteger(Number(x))||Number(x)<0||Number(x)>=SECTIONS.length)))return false;
 return true;
}
function applyState(s){
 if(!validateState(s))throw new Error("Formato no válido");
 dom.studentName.value=s.name||"";dom.scanDate.value=s.date||"";
 Object.entries(s.answers||{}).forEach(([n,v])=>{const e=document.querySelector(`input[name="${n}"][value="${v}"]`);if(e)e.checked=true});
 Object.entries(s.interest||{}).forEach(([i,v])=>{const e=$("interest_"+i);if(e)e.checked=!!v});
 dom.qInterest.value=s.qInterest||"";dom.qPractice.value=s.qPractice||"";dom.qStudents.value=s.qStudents||"";dom.qData.value=s.qData||"";dom.qUnderstand.value=s.qUnderstand||"";dom.qProvisional.value=s.qProvisional||"";
 const ch=s.checks||{};dom.checkPractice.checked=!!ch.practice;dom.checkData.checked=!!ch.data;dom.checkInterest.checked=!!ch.interest;
 window._savedSelected=(s.selected||[]).map(Number);
}
function migrateLegacy(){
 if(localStorage.getItem(STORAGE_KEY))return;
 const legacyKeys=["autoscan_conciencia_linguistica_master_web_v4","autoscan_conciencia_linguistica_master_web_v3","autoscan_conciencia_linguistica_es_v2"];
 for(const key of legacyKeys){
   const raw=localStorage.getItem(key);
   if(raw){try{const old=JSON.parse(raw);old.schemaVersion=old.schemaVersion||old.version||4;localStorage.setItem(STORAGE_KEY,JSON.stringify(old));return}catch(e){}}
 }
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state()))}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;const s=JSON.parse(raw);applyState(s)}catch(e){}}
function exportProgress(){
 const blob=new Blob([JSON.stringify(state(),null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="copia_autoscan_conciencia_linguistica.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function importProgress(ev){
 const f=ev.target.files[0];if(!f)return;
 const reader=new FileReader();reader.onload=()=>{
   try{
     const s=JSON.parse(reader.result);
     if(!validateState(s))throw new Error("Formato no válido");
     document.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(e=>e.checked=false);
     applyState(s);update();alert("Copia recuperada correctamente.");
   }catch(e){alert("No se pudo recuperar esta copia. Comprueba que corresponde a este autoscan.");}
 };reader.readAsText(f);ev.target.value="";
}
function bars(c){
 const d=c.total||1;
 return `<span style="width:${c.green/d*100}%;background:var(--green)"></span><span style="width:${c.orange/d*100}%;background:var(--orange)"></span><span style="width:${c.red/d*100}%;background:var(--red)"></span>`;
}
function update(){
 const t=totalCounts(),answered=t.total-t.blank,pct=t.total?Math.round(answered/t.total*100):0,complete=t.blank===0;
 SECTIONS.forEach((_,si)=>{
   const c=counts(si),done=c.blank===0;
   $("score_"+si).textContent=`${c.total-c.blank}/${c.total} respondidas`;
   const chip=$("complete_"+si);chip.textContent=done?"Completo":"Incompleto";chip.classList.toggle("done",done);
 });
 dom.gc.textContent=t.green;dom.oc.textContent=t.orange;dom.rc.textContent=t.red;dom.bc.textContent=t.blank;
 dom.progressText.textContent=`${answered} de ${t.total} respondidas`;dom.progressPct.textContent=`${pct} %`;dom.prog.innerHTML=bars(t);dom.prog.setAttribute("aria-valuenow",String(pct));
 dom.statusChip.textContent=complete?"Perfil final":"Resultado provisional";dom.statusChip.className="status-chip "+(complete?"status-final":"status-provisional");
 dom.routeStatus.style.display=complete?"none":"block";
 dom.summaryTitle.textContent=complete?"Resumen final de mi autoscan":"Resumen provisional de mi autoscan";
 dom.pdfWarning.innerHTML=complete?"":`<div class="warning">Todavía faltan ${t.blank} afirmaciones. Puedes descargar el PDF, pero el resultado seguirá siendo provisional.</div>`;
 renderRoute();renderMatrix();renderSuggestions();renderSelectedTopics();renderEligibility();renderGeneratedQuestions();renderSummary(t);save();
}
function renderRoute(){
 const ranked=SECTIONS.map((s,si)=>({si,title:s.title,c:counts(si),score:needScore(si)})).filter(x=>x.c.red+x.c.orange>0).sort((a,b)=>b.score-a.score).slice(0,5);
 dom.learningRoute.innerHTML=ranked.length?ranked.map((x,idx)=>{
   const action=x.c.red>0?"Primero estudia la base y después contrástala con ejemplos reales.":"Refresca la base y compruébala con ejemplos reales.";
   return `<div class="route-card"><span class="rank">Prioridad ${idx+1}</span><strong>${esc(x.title)}</strong><div class="scoreline">${x.c.red} por estudiar · ${x.c.orange} por refrescar</div><p>${action}</p></div>`;
 }).join(""):'<p class="note">Completa más partes del autoscan para generar una ruta.</p>';

 const strengths=SECTIONS.map((s,si)=>({si,title:s.title,c:counts(si)}))
 .filter(x=>x.c.blank===0 && x.c.green/x.c.total>=0.7)
 .sort((a,b)=>(b.c.green/b.c.total)-(a.c.green/a.c.total))
 .slice(0,3);
 dom.strengths.innerHTML=strengths.length?strengths.map(x=>`<div class="route-card strength"><strong>${esc(x.title)}</strong><div class="scoreline">${x.c.green} de ${x.c.total} afirmaciones marcadas como «Lo tengo claro».</div></div>`).join(""):'<p class="note">Las fortalezas aparecen cuando completas un bloque y al menos el 70 % está marcado como «Lo tengo claro».</p>';
}
function renderMatrix(){
 const selected=SECTIONS.map((s,si)=>({si,title:s.title,need:needLevel(si),interest:interestMarked(si),c:counts(si)}))
 .filter(x=>x.c.total-x.c.blank>0 || x.interest)
 .sort((a,b)=>needScore(b.si)-needScore(a.si));
 dom.matrixView.innerHTML=selected.length?selected.slice(0,8).map(x=>{
   const [cls,label,desc]=matrixType(x.si);
   return `<div class="matrix-card ${cls}"><strong>${esc(x.title)}</strong><div class="scoreline">${label}</div><p>${desc}</p></div>`;
 }).join(""):'<p class="note">Completa algunos bloques para ver esta matriz.</p>';
}
