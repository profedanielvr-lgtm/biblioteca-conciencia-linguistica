function suggestedTopicOrder(){
 return SECTIONS.map((s,si)=>({si,title:s.title,need:needScore(si),interest:interestMarked(si),c:counts(si)}))
 .filter(x=>x.c.total-x.c.blank>0 || x.interest)
 .sort((a,b)=>{
   const aHH=(a.interest&&needLevel(a.si)==="alta")?1:0,bHH=(b.interest&&needLevel(b.si)==="alta")?1:0;
   if(aHH!==bHH)return bHH-aHH;
   if(a.interest!==b.interest)return b.interest-a.interest;
   return b.need-a.need;
 }).slice(0,8);
}
function renderSuggestions(){
 const preserve=new Set(getSelectedTopics().concat(window._savedSelected||[]));
 dom.suggestions.innerHTML="";
 suggestedTopicOrder().forEach(x=>{
   const [cls,label,desc]=matrixType(x.si);
   const d=document.createElement("div");d.className="suggestion";
   d.innerHTML=`<strong>${esc(x.title)}</strong><div class="scoreline">${label}</div><div class="note">${desc}</div><label class="topic-choice"><input class="topicSelect" data-si="${x.si}" type="checkbox" ${preserve.has(x.si)?"checked":""}> Añadir a mis posibles temas de profundización</label>`;
   dom.suggestions.appendChild(d);
 });
 window._savedSelected=[];
 document.querySelectorAll(".topicSelect").forEach(e=>e.addEventListener("change",()=>{
   enforceTopicLimit(e);renderSelectedTopics();renderGeneratedQuestions();renderSummary(totalCounts());save();
 }));
}
function getSelectedTopics(){return [...document.querySelectorAll(".topicSelect:checked")].map(e=>Number(e.dataset.si))}
function enforceTopicLimit(changed){
 const checked=getSelectedTopics();if(checked.length>3){changed.checked=false;alert("Puedes seleccionar como máximo tres temas.");}
}
function addSelectedTopic(si){
 if(getSelectedTopics().includes(si))return;
 const current=getSelectedTopics();if(current.length>=3){alert("Puedes seleccionar como máximo tres temas.");return;}
 let checkbox=document.querySelector(`.topicSelect[data-si="${si}"]`);
 if(!checkbox){
   const d=document.createElement("div");d.className="suggestion";d.dataset.manual="1";
   d.innerHTML=`<strong>${esc(SECTIONS[si].title)}</strong><div class="scoreline">Tema elegido por ti</div><label class="topic-choice"><input class="topicSelect" data-si="${si}" type="checkbox" checked> Añadido a mis posibles temas de profundización</label>`;
   dom.suggestions.appendChild(d);checkbox=d.querySelector("input");checkbox.addEventListener("change",()=>{renderSelectedTopics();renderGeneratedQuestions();renderSummary(totalCounts());save()});
 }else checkbox.checked=true;
 update();
}
function renderSelectedTopics(){
 const selected=getSelectedTopics();
 dom.selectedTopicList.innerHTML=selected.length?selected.map(si=>`<div class="route-card"><strong>${esc(SECTIONS[si].title)}</strong><button type="button" data-remove="${si}">Quitar</button></div>`).join(""):'<p class="note">Todavía no has seleccionado temas.</p>';
 dom.selectedTopicList.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{
   const cb=document.querySelector(`.topicSelect[data-si="${b.dataset.remove}"]`);if(cb)cb.checked=false;update();
 }));
}
function renderEligibility(){
 const n=[dom.checkPractice.checked,dom.checkData.checked,dom.checkInterest.checked].filter(Boolean).length;
 dom.eligibilityStatus.textContent=n===3?"El tema reúne las tres condiciones para convertirse en un buen candidato de indagación.":`${n} de 3 condiciones comprobadas.`;
}
function contextPhrase(){
 if(dom.qPractice.value.trim())return "mi práctica docente";
 if(dom.qStudents.value.trim())return "las producciones de mi alumnado";
 return "mi contexto educativo";
}
function renderGeneratedQuestions(){
 const selected=getSelectedTopics();
 dom.generatedQuestions.innerHTML=selected.length?selected.map(si=>{
   let q=QUESTION_TEMPLATES[si].replace("{contexto}",contextPhrase()).replace("{tema}",SECTIONS[si].title.toLowerCase());
   return `<div class="generated-q"><strong>${esc(SECTIONS[si].title)}</strong><br>${esc(q)}<br><button type="button" class="useQuestion" data-si="${si}" style="margin-top:7px">Usar como punto de partida</button></div>`;
 }).join(""):'<p class="note">Selecciona uno o más temas para generar preguntas de partida.</p>';
 dom.generatedQuestions.querySelectorAll(".useQuestion").forEach(b=>b.addEventListener("click",()=>{
   const si=Number(b.dataset.si);
   dom.qProvisional.value=QUESTION_TEMPLATES[si].replace("{contexto}",contextPhrase()).replace("{tema}",SECTIONS[si].title.toLowerCase());
   update();
 }));
}
function renderSummary(t){
 const complete=t.blank===0;
 dom.intro.innerHTML=`<strong>${esc(dom.studentName.value||"Estudiante")}</strong>${dom.scanDate.value?" · "+esc(dom.scanDate.value):""}<br>${t.total-t.blank} de ${t.total} afirmaciones respondidas. <span class="badge green">${t.green} lo tengo claro</span> <span class="badge orange">${t.orange} necesito refrescarlo</span> <span class="badge red">${t.red} necesito estudiarlo</span>. ${complete?"<strong>Autoscan completo.</strong>":"<strong>Resultado provisional.</strong>"}`;
 dom.sectionResults.innerHTML="";
 SECTIONS.forEach((s,si)=>{const c=counts(si),row=document.createElement("div");row.className="result-row";row.innerHTML=`<div>${esc(s.title)}</div><div class="bar">${bars(c)}</div><div class="note">${c.green} / ${c.orange} / ${c.red}</div>`;dom.sectionResults.appendChild(row)});
 fillLists();
 const selected=getSelectedTopics();
 dom.chosenTopics.innerHTML=selected.length?selected.map(si=>`<p><strong>${esc(SECTIONS[si].title)}</strong></p>`).join(""):'<p class="note">Todavía no has seleccionado temas de profundización.</p>';
 const rows=[["Fenómeno que me interesa",dom.qInterest.value],["Lo que observo en mi práctica",dom.qPractice.value],["Dificultades o patrones del alumnado",dom.qStudents.value],["Datos que podría analizar",dom.qData.value],["Lo que quiero comprender mejor",dom.qUnderstand.value],["Posible pregunta de partida",dom.qProvisional.value]].filter(x=>x[1].trim());
 dom.researchSummary.innerHTML=rows.length?rows.map(x=>`<p><strong>${esc(x[0])}</strong><br>${esc(x[1])}</p>`).join(""):'<p class="note">Todavía no has completado esta parte.</p>';
}
function fillLists(){
 const rr=[],oo=[];SECTIONS.forEach((s,si)=>s.items.forEach((txt,ii)=>{const v=document.querySelector(`input[name="${k(si,ii)}"]:checked`)?.value;if(v==="red")rr.push([s.title,txt]);if(v==="orange")oo.push([s.title,txt])}));
 fill(dom.redList,rr,"red","Necesito estudiarlo");fill(dom.orangeList,oo,"orange","Necesito refrescarlo");
}
function fill(el,arr,cls,label){el.innerHTML=arr.length?arr.map(x=>`<li><span class="badge ${cls}">${label}</span> <strong>${esc(x[0])}</strong><br>${esc(x[1])}</li>`).join(""):'<li class="note">No hay contenidos marcados en esta categoría.</li>'}
function clearAll(){
 if(!confirm("¿Quieres borrar todas tus respuestas de este autoscan?"))return;
 document.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(e=>e.checked=false);document.querySelectorAll("textarea").forEach(e=>e.value="");dom.studentName.value="";dom.scanDate.value=new Date().toISOString().slice(0,10);localStorage.removeItem(STORAGE_KEY);update();
}
function eraseDeviceData(){
 if(!confirm("Esto borrará del navegador todas las respuestas guardadas de este autoscan. ¿Continuar?"))return;
 localStorage.removeItem(STORAGE_KEY);clearAll();
}

/* PDF autónomo */
function pdfEsc(s){return String(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function winAnsiBytes(str){const map={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};const out=[];for(const ch of str){let c=ch.codePointAt(0);if(c<=255)out.push(c);else if(map[c])out.push(map[c]);else out.push(63)}return new Uint8Array(out)}
