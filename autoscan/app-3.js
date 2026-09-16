function renderResearchDirection(){
 const r=researchDirectionData();
 const items=[
   ["Fenómeno",r.topic],["Contexto",r.ctx],["Datos",r.data],["Alcance",r.scope],["Observación/comparación",r.compare],["Fuera del estudio",r.boundary]
 ].filter(x=>x[1]);
 const theory=firstPrioritySource();
 let theoryHtml="";
 if(theory && theory.web){
   theoryHtml=`<div class="theory-path"><strong>Para fundamentar el siguiente paso:</strong><br><a href="${theory.web.url}" target="_blank" rel="noopener">${esc(theory.web.provider)}: ${esc(theory.web.title)} ↗</a>${theory.bib?`<div class="note">Después puedes profundizar con: ${esc(theory.bib)}</div>`:""}</div>`;
 }
 const content=`<h4>Tu investigación va tomando esta dirección</h4>${r.sentence?`<div class="direction-sentence">${esc(r.sentence)}</div>`:`<div class="note">Selecciona un tema concreto arriba para construir una dirección de investigación.</div>`}${items.length?`<div class="direction-grid">${items.map(([a,b])=>`<div class="direction-item"><strong>${esc(a)}</strong><br>${esc(b)}</div>`).join("")}</div>`:""}<div class="direction-next"><strong>Siguiente paso:</strong> ${esc(r.next)}</div>${theoryHtml}`;
 dom.researchDirection.innerHTML=content;
 dom.researchDirectionFinal.innerHTML=content;
}

function renderTopicCheck(){
 const n=[dom.checkPractice.checked,dom.checkData.checked,dom.checkInterest.checked,$("checkScope").checked].filter(Boolean).length;
 dom.topicCheckStatus.textContent=n===4?"Has comprobado las cuatro condiciones básicas. Ahora revisa el resumen de delimitación antes de formular la pregunta.":`${n} de 4 condiciones comprobadas.`;
 renderScopeCoach();
}
function renderScopeCoach(){
 const checks=[
   ["Tema concreto",!!dom.qTopic.value.trim()],
   ["Contexto definido",!!dom.qContext.value.trim()],
   ["Datos identificados",!!dom.qData.value.trim()],
   ["Cantidad o periodo delimitado",!!dom.qScope.value.trim()],
   ["Límite explícito",!!dom.qBoundary.value.trim()]
 ];
 const n=checks.filter(x=>x[1]).length;
 dom.scopeCoach.className="scope-coach "+(n>=4?"good":"warn");
 const title=n===5?"Tu tema está bastante bien delimitado.":n>=3?"Vas por buen camino, pero todavía puedes delimitarlo más.":"El tema sigue siendo demasiado amplio para una profundización manejable.";
 dom.scopeCoach.innerHTML=`<strong>${title}</strong><div class="scope-grid">${checks.map(([a,v])=>`<div class="scope-item">${v?"✓":"○"} ${esc(a)}</div>`).join("")}</div><div class="note" style="margin-top:7px">${n<5?"Intenta concretar especialmente lo que todavía aparece con ○.": "Ya puedes utilizar las preguntas sugeridas como borrador y ajustarlas a tu formulación final."}</div>`;
 renderResearchDirection();
}

function joinEs(arr){
 if(!arr.length)return "";
 if(arr.length===1)return arr[0];
 if(arr.length===2)return arr[0]+" y "+arr[1];
 return arr.slice(0,-1).join(", ")+" y "+arr[arr.length-1];
}
function areaBuckets(type){
 const list=type==="basis"?BASIS:MASTER;
 const out={study:[],refresh:[],strength:[],mixed:[],incomplete:[]};
 list.forEach((s,si)=>{
   const c=counts(type,si),x={si,title:s.title,c,type};
   if(c.blank>0)out.incomplete.push(x);
   if(c.red>0)out.study.push(x);
   else if(c.orange>0)out.refresh.push(x);
   else if(c.blank===0 && c.green===c.total)out.strength.push(x);
   else if(c.green>0)out.mixed.push(x);
 });
 return out;
}
function actionSteps(type,status){
 if(type==="basis" && status==="study")return [
   "Empieza por una explicación de referencia y reconstruye los conceptos básicos con tus propias palabras.",
   "Trabaja después con varios ejemplos nuevos y comprueba si puedes explicar qué ocurre en cada uno.",
   "Cierra el repaso volviendo a la afirmación del autoscan y comprobando si ahora puedes justificar tu respuesta."
 ];
 if(type==="basis")return [
   "Haz un repaso breve de la explicación y de los ejemplos centrales.",
   "Explícalo sin mirar la fuente y compruébalo con algunos ejemplos nuevos.",
   "Anota solo aquello que todavía te genera duda para retomarlo cuando aparezca en el módulo."
 ];
 if(status==="study")return [
   "Comienza con una fuente accesible para fijar el marco conceptual.",
   "Pasa después a una fuente de la bibliografía del EVL y toma notas de los conceptos que necesitas para analizar datos.",
   "Busca muestras reales, compara más de una explicación y formula qué permiten concluir los datos y qué queda abierto."
 ];
 return [
   "Relee el marco conceptual y localiza el punto exacto que necesitas reactivar.",
   "Contrástalo con datos o ejemplos auténticos, no solo con frases inventadas.",
   "Comprueba al menos un caso que no encaje fácilmente y anota qué implicación tendría para tu enseñanza."
 ];
}
function resourceHTML(type,area,status,index){
 const key=`${type}_${area.si}`,r=RESOURCES[key]||{web:[],bib:[]};
 const list=type==="basis"?BASIS:MASTER;
 const verb=status==="study"?"Estudiar con más profundidad":"Refrescar";
 const steps=actionSteps(type,status);
 let sources="";
 (r.web||[]).forEach(id=>{
   const s=WEB[id];if(!s)return;
   sources+=`<div class="resource-source"><span class="source-kind">Recurso abierto</span><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a><div class="note">${esc(s.provider)} · ${esc(s.why)}</div><a class="resource-link" href="${s.url}" target="_blank" rel="noopener">Abrir fuente oficial ↗</a></div>`;
 });
 (r.bib||[]).forEach(id=>{
   const s=BIB[id];if(!s)return;
   sources+=`<div class="resource-source"><span class="source-kind">Bibliografía del EVL</span><strong>${esc(s)}</strong></div>`;
 });
 return `<details class="resource-card" ${index<3?"open":""}>
   <summary>${verb}: ${esc(area.title)}</summary>
   <div class="resource-body">
     <p class="priority-note">${area.c.red} marcado(s) como «Necesito estudiarlo» · ${area.c.orange} como «Necesito refrescarlo».</p>
     <strong>Cómo trabajarlo</strong>
     <ol class="action-steps">${steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
     <strong>Fuentes recomendadas</strong>
     ${sources||'<p class="note">No hay una fuente específica vinculada a este ámbito.</p>'}
   </div>
 </details>`;
}

function domainClassification(type,si){
 const c=counts(type,si);
 if(c.blank>0)return "pending";
 if(c.red>0)return "study";
 if(c.orange>0)return "refresh";
 return "good";
}

function renderMissingActions(){
 const incomplete=[];
 BASIS.forEach((s,si)=>{const c=counts("basis",si);if(c.blank)incomplete.push({type:"basis",si,title:s.title,blank:c.blank})});
 MASTER.forEach((s,si)=>{const c=counts("master",si);if(c.blank)incomplete.push({type:"master",si,title:s.title,blank:c.blank})});
 if(!incomplete.length){dom.missingActions.innerHTML="";return}
 const total=incomplete.reduce((n,x)=>n+x.blank,0);
 const buttons=incomplete.map(x=>`<button type="button" class="missing-btn" data-missing-type="${x.type}" data-missing-si="${x.si}">${x.type==="basis"?"Basis":"Máster"} · ${esc(x.title)} (${x.blank})</button>`).join("");
 dom.missingActions.innerHTML=`<div class="missing-box"><h3>Completa el autoscan para obtener una lectura final</h3><div>Faltan ${total} respuestas en ${incomplete.length} ámbito(s). Puedes ir directamente a las preguntas pendientes.</div><div class="missing-actions"><button type="button" class="missing-btn primary-missing" id="firstMissingAny">Ir a la primera pregunta pendiente</button>${buttons}</div></div>`;
 $("firstMissingAny").addEventListener("click",()=>{
   const first=incomplete[0];goToMissing(first.type,first.si);
 });
 dom.missingActions.querySelectorAll("[data-missing-type]").forEach(b=>b.addEventListener("click",()=>goToMissing(b.dataset.missingType,Number(b.dataset.missingSi))));
}

function renderResultOverview(){
 const bt=totalCounts("basis"),mt=totalCounts("master");
 const allDomains=[
   ...BASIS.map((s,si)=>({type:"basis",si,title:s.title,cls:domainClassification("basis",si)})),
   ...MASTER.map((s,si)=>({type:"master",si,title:s.title,cls:domainClassification("master",si)}))
 ];
 const dcounts={good:0,refresh:0,study:0,pending:0};
 allDomains.forEach(x=>dcounts[x.cls]++);
 const bar=(t)=>{const d=t.total||1;return `<div class="big-bar"><span style="width:${t.green/d*100}%;background:var(--green)"></span><span style="width:${t.orange/d*100}%;background:var(--orange)"></span><span style="width:${t.red/d*100}%;background:var(--red)"></span><span style="width:${t.blank/d*100}%;background:#d1d5db"></span></div>`};
 const layer=(name,t)=>`<div class="layer-card"><div class="layer-head"><strong>${name}</strong><span class="note">${t.total-t.blank}/${t.total} respondidas</span></div>${bar(t)}<div class="bar-legend"><span><i class="dot" style="background:var(--green)"></i>${t.green} claro</span><span><i class="dot" style="background:var(--orange)"></i>${t.orange} refrescar</span><span><i class="dot" style="background:var(--red)"></i>${t.red} estudiar</span>${t.blank?`<span><i class="dot" style="background:#d1d5db"></i>${t.blank} pendientes</span>`:""}</div></div>`;
 dom.resultOverview.innerHTML=`<div class="result-overview">
   <div class="overview-title"><div><h3>Tu perfil en una mirada</h3><div class="note">La clasificación por ámbito utiliza la respuesta más urgente: si aparece rojo, el ámbito se muestra como «estudiar»; si no hay rojo pero sí naranja, como «refrescar».</div></div></div>
   <div class="overview-cards">
     <div class="overview-card good"><b>${dcounts.good}</b><span>Ámbitos bien asentados</span><small>Todos los ítems están en verde.</small></div>
     <div class="overview-card refresh"><b>${dcounts.refresh}</b><span>Ámbitos para refrescar</span><small>Hay naranja, pero no rojo.</small></div>
     <div class="overview-card study"><b>${dcounts.study}</b><span>Ámbitos para estudiar</span><small>Aparece al menos una respuesta roja.</small></div>
     <div class="overview-card pending"><b>${dcounts.pending}</b><span>Ámbitos incompletos</span><small>Todavía falta alguna respuesta.</small></div>
   </div>
   ${layer("Basischeck",bt)}
   ${layer("Masterverdieping",mt)}
 </div>`;
}

function textualSummaryData(){
 const b=areaBuckets("basis"),m=areaBuckets("master"),bt=totalCounts("basis"),mt=totalCounts("master");
 const parts=[],incomplete=bt.blank+mt.blank;
 parts.push("Las barras muestran cómo se distribuyen tus respuestas dentro de cada ámbito: verde = lo tengo claro, naranja = necesito refrescarlo y rojo = necesito estudiarlo. Una barra mezclada significa que dentro del mismo ámbito hay aspectos con distinto nivel de seguridad.");
 if(incomplete)parts.push(`El resultado es todavía provisional porque faltan ${incomplete} respuestas.`);
 if(b.study.length)parts.push(`En los conocimientos de entrada, tu prioridad principal es estudiar ${joinEs(b.study.map(x=>x.title))}. Antes de utilizar estos contenidos en análisis complejos, conviene reconstruir la base con una fuente fiable y ejemplos nuevos.`);
 if(b.refresh.length)parts.push(`En la Basischeck conviene refrescar ${joinEs(b.refresh.map(x=>x.title))}. Aquí un repaso breve, seguido de una comprobación con ejemplos, puede ser suficiente.`);
 if(m.study.length)parts.push(`A nivel máster necesitas profundizar especialmente en ${joinEs(m.study.map(x=>x.title))}. En estos ámbitos trabaja con datos reales, contrasta explicaciones y deja claro qué puedes concluir y qué sigue abierto.`);
 if(m.refresh.length)parts.push(`En Masterverdieping conviene reactivar ${joinEs(m.refresh.map(x=>x.title))} antes de utilizarlos con plena seguridad en una microanálisis o en tu profundización.`);
 const strengths=[...b.strength.map(x=>x.title),...m.strength.map(x=>x.title)];
 const partial=[
   ...BASIS.map((s,si)=>({title:s.title,c:counts("basis",si)})),
   ...MASTER.map((s,si)=>({title:s.title,c:counts("master",si)}))
 ].filter(x=>x.c.green>=2&&x.c.red===0&&x.c.green<x.c.total).map(x=>x.title);
 if(strengths.length)parts.push(`Tus fortalezas percibidas más claras son ${joinEs(strengths)}.`);
 if(partial.length)parts.push(`También aparecen fortalezas parciales en ${joinEs(partial)}: allí predominan las respuestas verdes, aunque queda algún aspecto por refrescar.`);
 if(!strengths.length&&!partial.length)parts.push("Todavía no aparece un ámbito claramente asentado en su totalidad. Utiliza el dashboard por pregunta para localizar los elementos concretos que sí tienes claros.");
 return {b,m,bt,mt,parts,partial};
}

