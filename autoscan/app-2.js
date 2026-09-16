function update(){
 ["basis","master"].forEach(type=>{
   const list=type==="basis"?BASIS:MASTER,t=totalCounts(type),answered=t.total-t.blank,pct=Math.round(answered/t.total*100);
   $(type+"ProgressText").textContent=`${answered} de ${t.total} respondidas`;$(type+"Pct").textContent=pct+" %";$(type+"Progress").innerHTML=bars(t);$(type+"Progress").setAttribute("aria-valuenow",String(pct));
   list.forEach((_,si)=>{
     const c=counts(type,si),done=c.blank===0,key=`${type}_${si}`,prev=sectionCompletionState[key],chip=$(`${type}_chip_${si}`);
     chip.textContent=done?"Completo ✓":"Incompleto";chip.classList.toggle("done",done);$(`${type}_score_${si}`).textContent=`${c.total-c.blank}/${c.total}`;
     if(prev===undefined){
       setDomainOpen(type,si,!done);
     }else if(done && prev===false){
       setDomainOpen(type,si,false);
     }
     sectionCompletionState[key]=done;
   });
 });
 renderRoutes();renderTopics();renderQuestions();renderTopicCheck();renderScopeCoach();renderResults();saveState();
}
function renderRoutes(){
 const bt=totalCounts("basis"),mt=totalCounts("master");
 dom.routeWarning.innerHTML=(bt.blank+mt.blank)>0?`<div class="warning">Resultado provisional: todavía faltan ${bt.blank+mt.blank} respuestas.</div>`:`<div class="success">Autoscan completo.</div>`;
 const br=BASIS.map((s,si)=>({si,title:s.title,c:counts("basis",si),score:needScore("basis",si)})).filter(x=>x.c.red+x.c.orange>0).sort((a,b)=>b.score-a.score).slice(0,5);
 dom.basisRoute.innerHTML=br.length?br.map((x,i)=>`<div class="route-card base"><strong>${esc(x.title)}</strong><div class="note">${x.c.red} estudiar · ${x.c.orange} refrescar</div><p>${x.c.red?"Conviene reactivar esta base antes de utilizarla en un análisis complejo.":"Un repaso breve puede ser suficiente antes de aplicarla."}</p></div>`).join(""):`<p class="note">No aparecen prioridades de base con las respuestas actuales.</p>`;
 const mr=MASTER.map((s,si)=>({si,title:s.title,c:counts("master",si),score:needScore("master",si)})).filter(x=>x.c.red+x.c.orange>0).sort((a,b)=>b.score-a.score).slice(0,5);
 dom.masterRoute.innerHTML=mr.length?mr.map((x,i)=>`<div class="route-card master"><span class="rank">Prioridad ${i+1}</span><strong>${esc(x.title)}</strong><div class="note">${x.c.red} estudiar · ${x.c.orange} refrescar${masterInterest(x.si)?" · ⭐ interés para profundizar":""}</div></div>`).join(""):`<p class="note">Completa Masterverdieping para generar esta ruta.</p>`;
}
function candidateOrder(){
 return MASTER.map((s,si)=>({si,title:s.title,interest:masterInterest(si),need:needScore("master",si),c:counts("master",si)}))
 .filter(x=>x.interest || x.c.total-x.c.blank>0)
 .sort((a,b)=>Number(b.interest)-Number(a.interest)||b.need-a.need).slice(0,8);
}
function renderTopics(){
 const selected=new Set(getSelectedTopics().concat(window._restoreTopics||[]));window._restoreTopics=[];
 const candidates=candidateOrder();
 selected.forEach(si=>{
   if(!candidates.some(x=>x.si===si)){
     const c=counts("master",si);
     candidates.push({si,title:MASTER[si].title,interest:masterInterest(si),need:needScore("master",si),c});
   }
 });
 dom.topicSuggestions.innerHTML="";
 candidates.forEach(x=>{
   const d=document.createElement("div");d.className="topic-card";
   d.innerHTML=`<div class="topic-row"><input class="topicPick" data-si="${x.si}" type="checkbox" ${selected.has(x.si)?"checked":""}><div><strong>${esc(x.title)}</strong><div class="note">${x.interest?"⭐ Me interesa este tema para profundizar · ":""}${x.c.red} estudiar · ${x.c.orange} refrescar</div></div></div>`;
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
function contextPhrase(){return dom.qContext.value.trim()||"mi contexto educativo"}
function dataPhrase(){return dom.qData.value.trim()?dom.qData.value.trim():"los datos disponibles"}
function initTopicHelp(){
 dom.topicHelpDomain.innerHTML="";
 MASTER.forEach((s,si)=>{const o=document.createElement("option");o.value=si;o.textContent=s.title;dom.topicHelpDomain.appendChild(o)});
 renderTopicHelpExamples();
}
function renderTopicHelpExamples(){
 const si=Number(dom.topicHelpDomain.value||0),items=TOPIC_HELP[si]||[];
 dom.topicHelpExample.innerHTML="";
 items.forEach(t=>{const o=document.createElement("option");o.value=t;o.textContent=t;dom.topicHelpExample.appendChild(o)});
}
function useTopicHelp(){
 const si=Number(dom.topicHelpDomain.value||0),topic=dom.topicHelpExample.value;
 if(!topic)return;
 dom.qTopic.value=topic;
 if(!dom.qUnderstand.value.trim())dom.qUnderstand.value=`Comprender mejor qué patrones aparecen en ${topic.toLowerCase()} y qué explicación lingüística ayuda a interpretarlos.`;
 if(!getSelectedTopics().includes(si) && getSelectedTopics().length<3){
   addTopic(si);
 }else{
   let cb=document.querySelector(`.topicPick[data-si="${si}"]`);
   if(cb){cb.checked=true;limitTopics(cb)}
   update();
 }
 dom.qTopic.scrollIntoView({behavior:"smooth",block:"center"});
}
function renderQuestions(){
 const sel=getSelectedTopics(),topic=dom.qTopic.value.trim(),ctx=contextPhrase(),data=dataPhrase(),scope=dom.qScope.value.trim(),compare=dom.qCompare.value.trim(),boundary=dom.qBoundary.value.trim();
 if(!sel.length&&!topic){
   dom.questionSuggestions.innerHTML='<p class="note">Elige un ámbito y un tema sugerido arriba. Después concreta contexto, datos y alcance.</p>';return;
 }
 const label=topic||((sel.length===1)?MASTER[sel[0]].title:"el fenómeno seleccionado");
 const focus=`el fenómeno «${label}»`;
 const scopeText=scope?` a partir de ${scope}`:"";
 const compareText=compare?` y prestando atención a ${compare}`:"";
 const boundaryText=boundary?` Quedarán fuera del análisis: ${boundary}.`:"";
 const questions=[
   {type:"Describir",q:`¿Cómo se manifiesta ${focus} en ${ctx}${scopeText}?${boundaryText}`},
   {type:"Analizar y explicar",q:`¿Qué patrones relacionados con ${focus} aparecen en ${ctx}${scopeText}${compareText}, y cómo pueden explicarse a partir de los datos y de la bibliografía relevante?${boundaryText}`},
   {type:"Conectar con la enseñanza",q:`¿Qué dificultades o patrones relacionados con ${focus} aparecen en ${ctx}${scopeText}, y qué implicaciones tiene su análisis para mi enseñanza del español?${boundaryText}`}
 ];
 if(!topic&&sel.length===1)questions.unshift({type:"Desde el ámbito",q:MASTER[sel[0]].question.replace("{contexto}",ctx)});
 dom.questionSuggestions.innerHTML=questions.map((x,i)=>`<div class="generated-q"><span class="question-type">${esc(x.type)}</span><br>${esc(x.q)}<br><button type="button" class="useGeneratedQ" data-i="${i}">Usar como borrador</button></div>`).join("");
 dom.questionSuggestions.querySelectorAll(".useGeneratedQ").forEach(b=>b.addEventListener("click",()=>{dom.qProvisional.value=questions[Number(b.dataset.i)].q;update()}));
}

function firstPrioritySource(){
 const d=textualSummaryData();
 const priorities=[
   ...d.b.study.map(x=>({area:x,type:"basis",status:"study"})),
   ...d.m.study.map(x=>({area:x,type:"master",status:"study"})),
   ...d.b.refresh.map(x=>({area:x,type:"basis",status:"refresh"})),
   ...d.m.refresh.map(x=>({area:x,type:"master",status:"refresh"}))
 ];
 if(!priorities.length)return null;
 const p=priorities[0],rr=RESOURCES[`${p.type}_${p.area.si}`]||{web:[],bib:[]};
 const web=(rr.web||[]).map(id=>WEB[id]).find(Boolean);
 const bib=(rr.bib||[]).map(id=>BIB[id]).find(Boolean);
 return { ...p, web, bib };
}
function researchDirectionData(){
 const topic=dom.qTopic.value.trim(),ctx=dom.qContext.value.trim(),practice=dom.qPractice.value.trim(),data=dom.qData.value.trim(),scope=dom.qScope.value.trim(),compare=dom.qCompare.value.trim(),boundary=dom.qBoundary.value.trim(),understand=dom.qUnderstand.value.trim(),question=dom.qProvisional.value.trim();
 const missing=[];
 if(!topic)missing.push("elige un fenómeno concreto");
 if(!ctx)missing.push("define el grupo o contexto");
 if(!practice)missing.push("describe qué observas en tu práctica");
 if(!data)missing.push("identifica datos reales");
 if(!scope)missing.push("delimita cantidad o periodo");
 if(!boundary)missing.push("decide qué dejarás fuera");
 let sentence="";
 if(topic){
   sentence=`Tu investigación puede orientarse a comprender ${topic}`;
   if(ctx)sentence+=` en ${ctx}`;
   if(scope)sentence+=`, trabajando con ${scope}`;
   if(compare)sentence+=` y observando ${compare}`;
   if(understand)sentence+=`. El propósito sería ${understand.charAt(0).toLowerCase()+understand.slice(1)}`;
   sentence+=".";
 }
 let next="";
 if(totalCounts("basis").blank+totalCounts("master").blank>0){
   next="Completa primero las preguntas pendientes del autoscan. Con datos incompletos, las prioridades y la orientación todavía son provisionales.";
 }else if(!topic){
   next="Elige un ámbito de Masterverdieping y usa el desplegable de temas para seleccionar un fenómeno concreto que reconozcas en tu práctica.";
 }else if(missing.length){
   next=`Delimita el tema completando lo que falta: ${joinEs(missing)}.`;
 }else if(!question){
   next="Tu tema ya está suficientemente delimitado para crear una pregunta de partida. Revisa las tres preguntas sugeridas y elige la que mejor corresponda a lo que quieres comprender.";
 }else{
   next="Contrasta ahora tu pregunta provisional con los datos que realmente puedes obtener y con la teoría relevante. Después llévala a una sesión de LDS o feedback para comprobar si el alcance es viable.";
 }
 return {topic,ctx,practice,data,scope,compare,boundary,understand,question,missing,sentence,next};
}
