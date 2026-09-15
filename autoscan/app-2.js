function update(){
 ["basis","master"].forEach(type=>{
   const list=type==="basis"?BASIS:MASTER,t=totalCounts(type),answered=t.total-t.blank,pct=Math.round(answered/t.total*100);
   $(type+"ProgressText").textContent=`${answered} de ${t.total} respondidas`;$(type+"Pct").textContent=pct+" %";$(type+"Progress").innerHTML=bars(t);$(type+"Progress").setAttribute("aria-valuenow",String(pct));
   list.forEach((_,si)=>{const c=counts(type,si),done=c.blank===0,chip=$(`${type}_chip_${si}`);chip.textContent=done?"Completo":"Incompleto";chip.classList.toggle("done",done);$(`${type}_score_${si}`).textContent=`${c.total-c.blank}/${c.total}`});
 });
 renderRoutes();renderTopics();renderQuestions();renderTopicCheck();renderResults();saveState();
}
function renderRoutes(){
 const bt=totalCounts("basis"),mt=totalCounts("master");
 dom.routeWarning.innerHTML=(bt.blank+mt.blank)>0?`<div class="warning">Resultado provisional: todavía faltan ${bt.blank+mt.blank} respuestas.</div>`:`<div class="success">Autoscan completo.</div>`;
 const br=BASIS.map((s,si)=>({si,title:s.title,c:counts("basis",si),score:needScore("basis",si)})).filter(x=>x.c.red+x.c.orange>0).sort((a,b)=>b.score-a.score).slice(0,5);
 dom.basisRoute.innerHTML=br.length?br.map((x,i)=>`<div class="route-card base"><strong>${esc(x.title)}</strong><div class="note">${x.c.red} estudiar · ${x.c.orange} refrescar</div><p>${x.c.red?"Conviene reactivar esta base antes de utilizarla en un análisis complejo.":"Un repaso breve puede ser suficiente antes de aplicarla."}</p></div>`).join(""):`<p class="note">No aparecen prioridades de base con las respuestas actuales.</p>`;
 const mr=MASTER.map((s,si)=>({si,title:s.title,c:counts("master",si),score:needScore("master",si)})).filter(x=>x.c.red+x.c.orange>0).sort((a,b)=>b.score-a.score).slice(0,5);
 dom.masterRoute.innerHTML=mr.length?mr.map((x,i)=>`<div class="route-card master"><span class="rank">Prioridad ${i+1}</span><strong>${esc(x.title)}</strong><div class="note">${x.c.red} estudiar · ${x.c.orange} refrescar${masterInterest(x.si)?" · ⭐ interés":""}</div></div>`).join(""):`<p class="note">Completa Masterverdieping para generar esta ruta.</p>`;
}
function candidateOrder(){
 return MASTER.map((s,si)=>({si,title:s.title,interest:masterInterest(si),need:needScore("master",si),c:counts("master",si)}))
 .filter(x=>x.interest || x.c.total-x.c.blank>0)
 .sort((a,b)=>Number(b.interest)-Number(a.interest)||b.need-a.need).slice(0,8);
}
function renderTopics(){
 const selected=new Set(getSelectedTopics().concat(window._restoreTopics||[]));window._restoreTopics=[];
 dom.topicSuggestions.innerHTML="";
 candidateOrder().forEach(x=>{
   const d=document.createElement("div");d.className="topic-card";
   d.innerHTML=`<div class="topic-row"><input class="topicPick" data-si="${x.si}" type="checkbox" ${selected.has(x.si)?"checked":""}><div><strong>${esc(x.title)}</strong><div class="note">${x.interest?"⭐ Interés marcado · ":""}${x.c.red} estudiar · ${x.c.orange} refrescar</div></div></div>`;
   dom.topicSuggestions.appendChild(d);
 });
 dom.topicSuggestions.querySelectorAll(".topicPick").forEach(cb=>cb.addEventListener("change",()=>{limitTopics(cb);renderSelected();renderQuestions();renderResults();saveState()}));
 renderSelected();
}
function addTopic(si){
 if(getSelectedTopics().includes(si))return;
 if(getSelectedTopics().length>=3){alert("Puedes seleccionar como máximo tres ámbitos.");return;}
 let cb=document.querySelector(`.topicPick[data-si="${si}"]`);
 if(!cb){
   const d=document.createElement("div");d.className="topic-card";d.innerHTML=`<div class="topic-row"><input class="topicPick" data-si="${si}" type="checkbox" checked><div><strong>${esc(MASTER[si].title)}</strong><div class="note">Elegido por ti</div></div></div>`;
   dom.topicSuggestions.appendChild(d);cb=d.querySelector("input");cb.addEventListener("change",()=>{renderSelected();renderQuestions();renderResults();saveState()});
 }else cb.checked=true;
 update();
}
function limitTopics(changed){if(getSelectedTopics().length>3){changed.checked=false;alert("Puedes seleccionar como máximo tres ámbitos.")}}
function renderSelected(){
 const sel=getSelectedTopics();dom.selectedTopics.innerHTML=sel.length?sel.map(si=>`<div class="route-card"><strong>${esc(MASTER[si].title)}</strong><button type="button" data-remove="${si}">Quitar</button></div>`).join(""):`<p class="note">Todavía no has seleccionado ámbitos.</p>`;
 dom.selectedTopics.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{const cb=document.querySelector(`.topicPick[data-si="${b.dataset.remove}"]`);if(cb)cb.checked=false;update()}));
}
function contextPhrase(){return dom.qPractice.value.trim()?"mi práctica docente":"mi contexto educativo"}
