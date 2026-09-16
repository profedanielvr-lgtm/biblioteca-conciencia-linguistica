function theoryAdviceHTML(){
 const d=textualSummaryData();
 const priorities=[
   ...d.b.study.map(x=>({area:x,type:"basis",status:"study"})),
   ...d.m.study.map(x=>({area:x,type:"master",status:"study"})),
   ...d.b.refresh.map(x=>({area:x,type:"basis",status:"refresh"})),
   ...d.m.refresh.map(x=>({area:x,type:"master",status:"refresh"}))
 ];
 if(!priorities.length)return `<div class="theory-guide"><h4>Cómo seguir con la teoría</h4><p class="note">No aparecen prioridades claras de repaso o estudio. Utiliza el dashboard por pregunta para elegir un ámbito que quieras consolidar o profundizar.</p></div>`;
 const cards=priorities.slice(0,6).map(({area,type,status})=>{
   const rr=RESOURCES[`${type}_${area.si}`]||{web:[],bib:[]};
   const firstWeb=(rr.web||[]).map(id=>WEB[id]).find(Boolean);
   const firstBib=(rr.bib||[]).map(id=>BIB[id]).find(Boolean);
   const how=type==="basis"
     ? (status==="study"
       ? "Empieza por una explicación accesible. Haz después 3–5 ejemplos nuevos y comprueba si puedes explicar el fenómeno sin mirar la fuente."
       : "Haz un repaso breve, explica el concepto con tus propias palabras y compruébalo con uno o dos ejemplos nuevos.")
     : (status==="study"
       ? "Empieza por el marco conceptual, continúa con bibliografía académica y termina contrastando la explicación con datos reales o un corpus."
       : "Reactiva el marco conceptual y compruébalo con ejemplos auténticos antes de utilizarlo en una microanálisis.");
   const links=[
     firstWeb?`<a href="${firstWeb.url}" target="_blank" rel="noopener">${esc(firstWeb.provider)}: ${esc(firstWeb.title)} ↗</a>`:"",
     firstBib?`<div class="note"><strong>Después:</strong> ${esc(firstBib)}</div>`:""
   ].join("");
   return `<div class="theory-start"><strong>${status==="study"?"Estudiar":"Refrescar"} · ${esc(area.title)}</strong><div class="theory-method">${esc(how)}</div>${links}</div>`;
 }).join("");
 return `<div class="theory-guide"><h4>Dónde y cómo adquirir la teoría que necesitas</h4><p class="note">No intentes estudiar todos los recursos. Empieza por la primera fuente de cada prioridad y pasa a la bibliografía del EVL cuando necesites más profundidad.</p>${cards}</div>`;
}

function renderTextualResults(){
 const d=textualSummaryData(),allIncomplete=[...d.b.incomplete,...d.m.incomplete];
 dom.textSummary.innerHTML=d.parts.map(p=>`<p>${esc(p)}</p>`).join("")+
   `<p class="note">Este resumen describe tu <strong>autopercepción</strong>. No sustituye una evaluación de desempeño ni demuestra por sí mismo el dominio de un ámbito.</p>`+
   theoryAdviceHTML();
 const strengths=[...d.b.strength.map(x=>({ ...x,layer:"Basischeck"})),...d.m.strength.map(x=>({...x,layer:"Masterverdieping"}))];
 const partial=[
   ...BASIS.map((s,si)=>({title:s.title,c:counts("basis",si),layer:"Basischeck"})),
   ...MASTER.map((s,si)=>({title:s.title,c:counts("master",si),layer:"Masterverdieping"}))
 ].filter(x=>x.c.green>=2&&x.c.red===0&&x.c.green<x.c.total);
 let strengthHtml=strengths.map(x=>`<div class="result-box strength"><strong>${esc(x.title)}</strong><div class="note">${x.layer} · 3 de 3 afirmaciones marcadas como «Lo tengo claro».</div></div>`).join("");
 strengthHtml+=partial.map(x=>`<div class="result-box strength"><strong>${esc(x.title)}</strong><div class="note">${x.layer} · fortaleza parcial: ${x.c.green} verdes y ninguna respuesta roja.</div></div>`).join("");
 dom.strengthSummary.innerHTML=strengthHtml||`<p class="note">Todavía no aparece un ámbito claramente asentado. Utiliza el dashboard por pregunta para localizar respuestas verdes concretas.</p>`;
 const studies=[...d.b.study.map(x=>({...x,layer:"Basischeck"})),...d.m.study.map(x=>({...x,layer:"Masterverdieping"}))];
 const refresh=[...d.b.refresh.map(x=>({...x,layer:"Basischeck"})),...d.m.refresh.map(x=>({...x,layer:"Masterverdieping"}))];
 let action="";
 studies.forEach(x=>action+=`<div class="priority-card study"><strong>Estudiar: ${esc(x.title)}</strong><div class="note">${x.layer} · aparece al menos una respuesta roja.</div><div class="nextstep"><strong>Siguiente paso:</strong> reconstruye la explicación, compruébala con ejemplos o datos reales y vuelve después a este ámbito.</div></div>`);
 refresh.forEach(x=>action+=`<div class="priority-card refresh"><strong>Refrescar: ${esc(x.title)}</strong><div class="note">${x.layer} · aparece naranja, pero ninguna respuesta roja.</div><div class="nextstep"><strong>Siguiente paso:</strong> repasa el concepto, explícalo sin mirar la fuente y compruébalo con uno o dos ejemplos nuevos.</div></div>`);
 if(!action)action='<p class="note">No aparecen prioridades completas de estudio o repaso con las respuestas actuales.</p>';
 dom.actionSummary.className="priority-grid";dom.actionSummary.innerHTML=action;
 const priorities=[
   ...d.b.study.map(x=>({area:x,type:"basis",status:"study"})),
   ...d.m.study.map(x=>({area:x,type:"master",status:"study"})),
   ...d.b.refresh.map(x=>({area:x,type:"basis",status:"refresh"})),
   ...d.m.refresh.map(x=>({area:x,type:"master",status:"refresh"}))
 ];
 dom.resourceRecommendations.innerHTML=priorities.length?priorities.map((x,i)=>resourceHTML(x.type,x.area,x.status,i)).join(""):`<p class="note">Cuando marques algún ámbito como «Necesito estudiarlo» o «Necesito refrescarlo», aquí aparecerán recomendaciones de estudio y fuentes concretas.</p>`;
 const r=researchDirectionData(),first=firstPrioritySource();
 let nextTheory="";
 if(first&&first.web)nextTheory=` Para empezar con la teoría, abre primero ${first.web.provider}: ${first.web.title}.`;
 dom.textSummary.innerHTML+=`<div class="direction-next"><strong>Tu siguiente paso:</strong> ${esc(r.next)}${nextTheory?`<div class="note" style="margin-top:5px">${esc(nextTheory)}</div>`:""}</div>`;
}


function answerPill(v){
 const labels={green:"Lo tengo claro",orange:"Necesito refrescarlo",red:"Necesito estudiarlo",blank:"Sin responder"};
 return `<span class="answer-pill ${v||"blank"}">${labels[v||"blank"]}</span>`;
}
function renderQuestionDashboard(){
 dom.questionDashboard.className="question-dashboard";
 dom.questionDashboard.innerHTML=[["Basischeck",BASIS,"basis"],["Masterverdieping",MASTER,"master"]].map(([heading,list,type])=>{
   const cards=list.map((s,si)=>{
     const c=counts(type,si);
     const rows=s.items.map((txt,ii)=>{
       const v=document.querySelector(`input[name="${type}_${si}_${ii}"]:checked`)?.value||"blank";
       return `<div class="question-row"><div class="question-text">${esc(txt)}</div><div>${answerPill(v)}</div></div>`;
     }).join("");
     return `<details><summary>${esc(s.title)} · ${c.green} verde · ${c.orange} naranja · ${c.red} rojo</summary>${rows}</details>`;
   }).join("");
   return `<h4>${heading}</h4>${cards}`;
 }).join("");
}

function renderResults(){
 const bt=totalCounts("basis"),mt=totalCounts("master"),all={green:bt.green+mt.green,orange:bt.orange+mt.orange,red:bt.red+mt.red,blank:bt.blank+mt.blank,total:bt.total+mt.total};
  dom.overallStatus.innerHTML=all.blank?`<div class="warning">Resultado provisional: faltan ${all.blank} respuestas.</div>`:`<div class="success">Autoscan completo: ${all.total} de ${all.total} respuestas.</div>`;
 dom.basisSummary.innerHTML=BASIS.map((s,si)=>summaryRow(s.title,counts("basis",si))).join("");
 dom.masterSummary.innerHTML=MASTER.map((s,si)=>summaryRow(s.title,counts("master",si))).join("");
 renderMissingActions();
 renderResultOverview();
 renderTextualResults();
 renderQuestionDashboard();
 renderResearchDirection();
 const sel=getSelectedTopics(),rows=[
   ["Ámbitos seleccionados",sel.map(si=>MASTER[si].title).join("; ")],
   ["Tema concreto",dom.qTopic.value],
   ["Grupo o contexto",dom.qContext.value],
   ["Cantidad o periodo",dom.qScope.value],
   ["Comparación u observación",dom.qCompare.value],
   ["Qué queda fuera",dom.qBoundary.value],
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
 return {schemaVersion:SCHEMA_VERSION,name:dom.studentName.value,date:dom.scanDate.value,answers,interest,selected:getSelectedTopics(),qTopic:dom.qTopic.value,qContext:dom.qContext.value,qScope:dom.qScope.value,qCompare:dom.qCompare.value,qBoundary:dom.qBoundary.value,qPractice:dom.qPractice.value,qData:dom.qData.value,qUnderstand:dom.qUnderstand.value,qProvisional:dom.qProvisional.value,checks:{practice:dom.checkPractice.checked,data:dom.checkData.checked,interest:dom.checkInterest.checked,scope:$("checkScope").checked}};
}
function validate(s){
 if(!s||typeof s!=="object"||![6,7,8,9,SCHEMA_VERSION].includes(Number(s.schemaVersion)))return false;
 const allowed=new Set(["green","orange","red"]);
 for(const [k,v] of Object.entries(s.answers||{})){if(!/^(basis|master)_\d+_\d+$/.test(k)||!allowed.has(v))return false}
 return true;
}
function applyState(s){
 dom.studentName.value=s.name||"";dom.scanDate.value=s.date||"";
 Object.entries(s.answers||{}).forEach(([n,v])=>{const e=document.querySelector(`input[name="${n}"][value="${v}"]`);if(e)e.checked=true});
 Object.entries(s.interest||{}).forEach(([i,v])=>{const e=$("interest_"+i);if(e)e.checked=!!v});
 window._restoreTopics=(s.selected||[]).map(Number);
 dom.qTopic.value=s.qTopic||"";dom.qContext.value=s.qContext||"";dom.qScope.value=s.qScope||"";dom.qCompare.value=s.qCompare||"";dom.qBoundary.value=s.qBoundary||"";dom.qPractice.value=s.qPractice||"";dom.qData.value=s.qData||"";dom.qUnderstand.value=s.qUnderstand||"";dom.qProvisional.value=s.qProvisional||"";
 const c=s.checks||{};dom.checkPractice.checked=!!c.practice;dom.checkData.checked=!!c.data;dom.checkInterest.checked=!!c.interest;$("checkScope").checked=!!c.scope;
}
function migrateLegacy(){
 const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
 try{const s=JSON.parse(raw);if(Number(s.schemaVersion)!==SCHEMA_VERSION)localStorage.setItem(STORAGE_KEY+"_legacy",raw)}catch(e){}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state()))}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(validate(s))applyState(s)}catch(e){}}
function exportState(){
 const blob=new Blob([JSON.stringify(state(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="copia_autoscan_conciencia_linguistica_v10.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function importState(ev){
 const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!validate(s))throw new Error();document.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(e=>e.checked=false);applyState(s);update();alert("Copia recuperada correctamente.")}catch(e){alert("Esta copia no corresponde a esta versión del autoscan.")}};r.readAsText(f);ev.target.value="";
}
function eraseAll(){
 if(!confirm("¿Quieres borrar todas las respuestas guardadas en este dispositivo?"))return;
 localStorage.removeItem(STORAGE_KEY);document.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(e=>e.checked=false);document.querySelectorAll("textarea").forEach(e=>e.value="");dom.qTopic.value="";dom.qContext.value="";dom.qScope.value="";dom.qCompare.value="";dom.qBoundary.value="";dom.studentName.value="";dom.scanDate.value=new Date().toISOString().slice(0,10);update();showView(1);
}

/* PDF autónomo */
