const SECTIONS=[...window.SECTIONS_PART1,...window.SECTIONS_PART2];
const AREA_MAP=window.AREA_MAP;
const GLOSSARY=window.GLOSSARY;
const QUESTION_TEMPLATES=window.QUESTION_TEMPLATES;
const STORAGE_KEY="autoscan_conciencia_linguistica_master";
const SCHEMA_VERSION=5;

const $=id=>document.getElementById(id);
const dom={};
["studentName","scanDate","gc","oc","rc","bc","progressText","progressPct","prog","statusChip","sectionJump",
"sections","routeStatus","learningRoute","strengths","matrixView","suggestions","allTopics","selectedTopicList",
"qInterest","qPractice","qStudents","qData","qUnderstand","checkPractice","checkData","checkInterest",
"eligibilityStatus","qProvisional","generatedQuestions","summaryTitle","intro","sectionResults","redList","orangeList",
"chosenTopics","researchSummary","pdfWarning","progressFile"].forEach(id=>dom[id]=$(id));

const k=(s,i)=>`s${s}_i${i}`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function helpFor(text){
 const lower=text.toLowerCase();
 for(const [term,desc] of Object.entries(GLOSSARY)){
   if(lower.includes(term.toLowerCase())) return desc;
 }
 return "";
}
function choice(key,val,label){
 const id=key+"_"+val;
 return `<div class="choice"><input type="radio" name="${key}" id="${id}" value="${val}"><label for="${id}" class="${val}">${label}</label></div>`;
}
function build(){
 let currentArea="";
 SECTIONS.forEach((s,si)=>{
   const [letter,area]=AREA_MAP[String(si)];
   if(area!==currentArea){
     currentArea=area;
     const ah=document.createElement("div");ah.className="area-heading";
     ah.innerHTML=`<strong>${letter}. ${esc(area)}</strong><span class="note">Bloques relacionados con esta área.</span>`;
     dom.sections.appendChild(ah);
   }

   const opt=document.createElement("option");opt.value=si;opt.textContent=`${letter}. ${s.title}`;dom.sectionJump.appendChild(opt);
   const opt2=document.createElement("option");opt2.value=si;opt2.textContent=s.title;dom.allTopics.appendChild(opt2);

   const el=document.createElement("section");el.className="section";el.id="section_"+si;
   el.innerHTML=`
   <div class="section-head">
     <button class="section-toggle" type="button" aria-expanded="${si===0?'true':'false'}" aria-controls="section_body_${si}" data-si="${si}">
       <h3>${esc(s.title)} <span id="chev_${si}" class="chev">${si===0?'▲':'▼'}</span></h3>
     </button>
     <div class="section-meta">
       <span id="complete_${si}" class="complete-chip">Incompleto</span>
       <span id="score_${si}" class="note score"></span>
       <label class="interest"><input type="checkbox" id="interest_${si}"> ⭐ Me interesa profundizar</label>
     </div>
   </div>
   <div class="section-body" id="section_body_${si}">
     <div id="items_${si}"></div>
     <div class="section-footer">
       <button type="button" ${si===0?'disabled':''} data-prev="${si-1}">← Anterior</button>
       <button type="button" ${si===SECTIONS.length-1?'disabled':''} data-next="${si+1}">Siguiente →</button>
     </div>
   </div>`;
   dom.sections.appendChild(el);
   if(si===0)el.classList.add("open");

   const box=$("items_"+si);
   s.items.forEach((txt,ii)=>{
      const row=document.createElement("div");row.className="item";const key=k(si,ii);
      const help=helpFor(txt);
      const helpId=`help_${si}_${ii}`;
      row.innerHTML=`
      <fieldset>
        <legend>
          <span class="statement">${esc(txt)}</span>
          ${help?`<button type="button" class="help-btn" aria-expanded="false" aria-controls="${helpId}" data-help="${helpId}">?</button>`:""}
          ${help?`<div class="help-text" id="${helpId}">${esc(help)}</div>`:""}
        </legend>
        <div class="choice-wrap">
          ${choice(key,"green","Lo tengo claro")}
          ${choice(key,"orange","Necesito refrescarlo")}
          ${choice(key,"red","Necesito estudiarlo")}
        </div>
      </fieldset>`;
      box.appendChild(row);
   });
 });

 document.querySelectorAll(".section-toggle").forEach(b=>b.addEventListener("click",()=>toggleSection(Number(b.dataset.si))));
 document.querySelectorAll("[data-prev]").forEach(b=>b.addEventListener("click",()=>openSection(Number(b.dataset.prev))));
 document.querySelectorAll("[data-next]").forEach(b=>b.addEventListener("click",()=>openSection(Number(b.dataset.next))));
 document.querySelectorAll(".help-btn").forEach(b=>b.addEventListener("click",()=>toggleHelp(b)));
 document.querySelectorAll("input,textarea,select").forEach(e=>{e.addEventListener("input",update);e.addEventListener("change",update)});

 $("openBlockBtn").addEventListener("click",()=>openSection(Number(dom.sectionJump.value)));
 $("nextUnansweredBtn").addEventListener("click",goNextUnanswered);
 $("routeBtn").addEventListener("click",()=>$("route").scrollIntoView({behavior:"smooth",block:"start"}));
 $("researchBtn").addEventListener("click",()=>$("research").scrollIntoView({behavior:"smooth",block:"start"}));
 $("summaryBtn").addEventListener("click",()=>$("results").scrollIntoView({behavior:"smooth",block:"start"}));
 $("clearBtn").addEventListener("click",clearAll);
 $("eraseDeviceBtn").addEventListener("click",eraseDeviceData);
 $("exportBtn").addEventListener("click",exportProgress);
 $("importBtn").addEventListener("click",()=>dom.progressFile.click());
 dom.progressFile.addEventListener("change",importProgress);
 $("addAnyTopicBtn").addEventListener("click",()=>addSelectedTopic(Number(dom.allTopics.value)));
 document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>requestPDF(b.dataset.mode)));

 migrateLegacy();
 load();
 if(!dom.scanDate.value)dom.scanDate.value=new Date().toISOString().slice(0,10);
 update();
}
function toggleHelp(btn){
 const box=$(btn.dataset.help),open=box.classList.toggle("show");btn.setAttribute("aria-expanded",String(open));
}
function toggleSection(si){
 const el=$("section_"+si),isOpen=el.classList.contains("open");
 el.classList.toggle("open");el.querySelector(".section-toggle").setAttribute("aria-expanded",String(!isOpen));$("chev_"+si).textContent=!isOpen?"▲":"▼";
}
function openSection(si){
 if(si<0||si>=SECTIONS.length)return;
 document.querySelectorAll(".section").forEach((el,idx)=>{
   const open=idx===si;el.classList.toggle("open",open);el.querySelector(".section-toggle").setAttribute("aria-expanded",String(open));$("chev_"+idx).textContent=open?"▲":"▼";
 });
 dom.sectionJump.value=si;$("section_"+si).scrollIntoView({behavior:"smooth",block:"start"});
}
function firstUnanswered(){
 for(let si=0;si<SECTIONS.length;si++){
   for(let ii=0;ii<SECTIONS[si].items.length;ii++){
     if(!document.querySelector(`input[name="${k(si,ii)}"]:checked`))return {si,ii};
   }
 }
 return null;
}
function goNextUnanswered(){
 const f=firstUnanswered();
 if(!f){alert("Has respondido todas las afirmaciones.");return;}
 openSection(f.si);
 setTimeout(()=>document.querySelector(`input[name="${k(f.si,f.ii)}"]`)?.closest(".item")?.scrollIntoView({behavior:"smooth",block:"center"}),350);
}
function counts(si){
 const c={green:0,orange:0,red:0,blank:0,total:SECTIONS[si].items.length};
 SECTIONS[si].items.forEach((_,ii)=>{const v=document.querySelector(`input[name="${k(si,ii)}"]:checked`)?.value;if(v)c[v]++;else c.blank++});
 return c;
}
function totalCounts(){
 const t={green:0,orange:0,red:0,blank:0,total:0};
 SECTIONS.forEach((_,si)=>{const c=counts(si);Object.keys(t).forEach(x=>t[x]+=c[x]||0)});return t;
}
function needScore(si){
 const c=counts(si),answered=c.total-c.blank;
 if(answered===0)return 0;
 return (c.red*2+c.orange)/c.total;
}
function interestMarked(si){return $("interest_"+si).checked}
function needLevel(si){
 const s=needScore(si);
 if(s>=0.85)return "alta";
 if(s>=0.35)return "media";
 return "baja";
}
