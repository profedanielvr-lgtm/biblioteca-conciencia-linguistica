function responseChoice(name,val,label,cls){
 const id=name+"_"+val;
 return `<div class="choice"><input type="radio" id="${id}" name="${name}" value="${val}"><label class="${cls}" for="${id}">${label}</label></div>`;
}
function glossaryFor(text){
 const l=text.toLowerCase();
 for(const [term,def] of Object.entries(GLOSSARY)){if(l.includes(term.toLowerCase()))return def}
 return "";
}
function buildDomains(list,type,target){
 list.forEach((section,si)=>{
   const el=document.createElement("section");el.className="domain open";el.id=`${type}_domain_${si}`;
   const interest=type==="master"?`<label class="interest"><input id="interest_${si}" type="checkbox"> ⭐ Me interesa este tema para profundizar</label>`:"";
   el.innerHTML=`
   <div class="domain-head">
    <button class="domain-toggle" type="button" data-type="${type}" data-si="${si}" aria-expanded="true">${esc(section.title)} ▴</button>
    <div class="domain-meta"><span id="${type}_chip_${si}" class="chip">Incompleto</span><span id="${type}_score_${si}" class="note"></span>${interest}</div>
   </div>
   <div class="domain-body" id="${type}_body_${si}"></div>`;
   target.appendChild(el);
   const body=el.querySelector(".domain-body");
   section.items.forEach((txt,ii)=>{
     const name=`${type}_${si}_${ii}`,help=glossaryFor(txt),helpId=`help_${type}_${si}_${ii}`;
     const row=document.createElement("div");row.className="item";
     row.innerHTML=`<fieldset><legend>${esc(txt)} ${help?`<button type="button" class="help-btn" data-help="${helpId}" aria-expanded="false">?</button><div id="${helpId}" class="help">${esc(help)}</div>`:""}</legend>
     <div class="choice-wrap">
       ${responseChoice(name,"green","Lo tengo claro","green")}
       ${responseChoice(name,"orange","Necesito refrescarlo","orange")}
       ${responseChoice(name,"red","Necesito estudiarlo","red")}
     </div></fieldset>`;
     body.appendChild(row);
   });
 });
}
function build(){
 buildDomains(BASIS,"basis",dom.basisDomains);
 buildDomains(MASTER,"master",dom.masterDomains);
 MASTER.forEach((s,si)=>{const o=document.createElement("option");o.value=si;o.textContent=s.title;dom.allMasterTopics.appendChild(o)});
 document.querySelectorAll(".domain-toggle").forEach(b=>b.addEventListener("click",()=>toggleDomain(b.dataset.type,Number(b.dataset.si))));
 document.querySelectorAll(".help-btn").forEach(b=>b.addEventListener("click",()=>toggleHelp(b)));
 document.querySelectorAll("input,textarea,select").forEach(e=>{e.addEventListener("input",update);e.addEventListener("change",update)});
 $("startBtn").addEventListener("click",()=>showView(2));
 $("toMasterBtn").addEventListener("click",()=>showView(3));
 $("toRouteBtn").addEventListener("click",()=>showView(4));
 $("toResultsBtn").addEventListener("click",()=>showView(5));
 $("basisNextMissing").addEventListener("click",()=>nextMissing("basis"));
 $("masterNextMissing").addEventListener("click",()=>nextMissing("master"));
 $("addTopicBtn").addEventListener("click",()=>addTopic(Number(dom.allMasterTopics.value)));
 $("exportBtn").addEventListener("click",exportState);
 $("importBtn").addEventListener("click",()=>dom.progressFile.click());
 dom.progressFile.addEventListener("change",importState);
 $("eraseBtn").addEventListener("click",eraseAll);
 dom.topicHelpDomain.addEventListener("change",renderTopicHelpExamples);
 $("useTopicHelpBtn").addEventListener("click",useTopicHelp);
 initTopicHelp();
 document.querySelectorAll("[data-pdf]").forEach(b=>b.addEventListener("click",()=>downloadPDF(b.dataset.pdf)));
 migrateLegacy();
 loadState();
 if(!dom.scanDate.value)dom.scanDate.value=new Date().toISOString().slice(0,10);
 update();
}
function showView(n){
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
 $("view"+n).classList.add("active");
 document.querySelectorAll(".step").forEach(s=>{
   const sn=Number(s.dataset.step);s.classList.toggle("active",sn===n);s.classList.toggle("done",sn<n);
 });
 window.scrollTo({top:0,behavior:"smooth"});
}
function setDomainOpen(type,si,open){
 const el=$(`${type}_domain_${si}`);if(!el)return;
 el.classList.toggle("open",open);
 const b=el.querySelector(".domain-toggle");
 if(b){b.setAttribute("aria-expanded",String(open));b.innerHTML=esc((type==="basis"?BASIS:MASTER)[si].title)+(open?" ▴":" ▾");}
}
function toggleDomain(type,si){
 const el=$(`${type}_domain_${si}`),open=!el.classList.contains("open");
 setDomainOpen(type,si,open);
}
function toggleHelp(b){
 const box=$(b.dataset.help),open=box.classList.toggle("show");b.setAttribute("aria-expanded",String(open));
}
function counts(type,si){
 const list=type==="basis"?BASIS:MASTER,c={green:0,orange:0,red:0,blank:0,total:list[si].items.length};
 list[si].items.forEach((_,ii)=>{const v=document.querySelector(`input[name="${type}_${si}_${ii}"]:checked`)?.value;if(v)c[v]++;else c.blank++});
 return c;
}
function totalCounts(type){
 const list=type==="basis"?BASIS:MASTER,t={green:0,orange:0,red:0,blank:0,total:0};
 list.forEach((_,si)=>{const c=counts(type,si);["green","orange","red","blank","total"].forEach(k=>t[k]+=c[k])});return t;
}
function needScore(type,si){
 const c=counts(type,si);if(c.total===0)return 0;return (c.red*2+c.orange)/c.total;
}
function bars(c){
 const d=c.total||1;return `<span style="width:${c.green/d*100}%;background:var(--green)"></span><span style="width:${c.orange/d*100}%;background:var(--orange)"></span><span style="width:${c.red/d*100}%;background:var(--red)"></span>`;
}

function firstMissingInDomain(type,si){
 const list=type==="basis"?BASIS:MASTER;
 for(let ii=0;ii<list[si].items.length;ii++){
   if(!document.querySelector(`input[name="${type}_${si}_${ii}"]:checked`))return ii;
 }
 return -1;
}
function goToMissing(type,si=null){
 const list=type==="basis"?BASIS:MASTER;
 let targetSi=si,targetIi=-1;
 if(targetSi===null){
   for(let s=0;s<list.length;s++){
     const ii=firstMissingInDomain(type,s);
     if(ii>=0){targetSi=s;targetIi=ii;break}
   }
 }else{
   targetIi=firstMissingInDomain(type,targetSi);
 }
 if(targetSi===null || targetIi<0)return;
 showView(type==="basis"?2:3);
 setDomainOpen(type,targetSi,true);
 setTimeout(()=>{
   const el=document.querySelector(`input[name="${type}_${targetSi}_${targetIi}"]`)?.closest(".item");
   if(el){
     el.scrollIntoView({behavior:"smooth",block:"center"});
     el.classList.add("missing-focus");
     setTimeout(()=>el.classList.remove("missing-focus"),1800);
   }
 },220);
}

function nextMissing(type){
 const t=totalCounts(type);
 if(t.blank===0){alert("Has respondido todas las afirmaciones de esta parte.");return}
 goToMissing(type,null);
}
function getSelectedTopics(){return [...document.querySelectorAll(".topicPick:checked")].map(x=>Number(x.dataset.si))}
function masterInterest(si){return $("interest_"+si)?.checked||false}
