function pdfEsc(s){return String(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function bytes(str){const map={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};const out=[];for(const ch of str){let c=ch.codePointAt(0);out.push(c<=255?c:(map[c]||63))}return new Uint8Array(out)}
function wrap(t,n){const w=String(t).split(/\s+/),l=[];let x="";w.forEach(a=>{const q=x?x+" "+a:a;if(q.length>n){if(x)l.push(x);x=a}else x=q});if(x)l.push(x);return l}
function aLabel(v){return v==="green"?"LO TENGO CLARO":v==="orange"?"NECESITO REFRESCARLO":v==="red"?"NECESITO ESTUDIARLO":"SIN RESPONDER"}
function report(mode){
 const lines=[],bt=totalCounts("basis"),mt=totalCounts("master");
 lines.push({t:"AUTOSCAN DE CONCIENCIA LINGÜÍSTICA",b:true,s:16});lines.push({t:"Basischeck + Masterverdieping",b:true,s:11});lines.push({t:""});
 lines.push({t:"Estudiante: "+(dom.studentName.value||"—"),b:true});lines.push({t:"Fecha: "+(dom.scanDate.value||"—")});lines.push({t:""});
 lines.push({t:"BASISCHECK",b:true,s:13});lines.push({t:`Lo tengo claro: ${bt.green} · Necesito refrescarlo: ${bt.orange} · Necesito estudiarlo: ${bt.red} · Sin responder: ${bt.blank}`});
 BASIS.forEach((s,si)=>{const c=counts("basis",si);lines.push({t:`${s.title}: ${c.green}/${c.orange}/${c.red}`})});
 lines.push({t:""});lines.push({t:"MASTERVERDIEPING",b:true,s:13});lines.push({t:`Lo tengo claro: ${mt.green} · Necesito refrescarlo: ${mt.orange} · Necesito estudiarlo: ${mt.red} · Sin responder: ${mt.blank}`});
 MASTER.forEach((s,si)=>{const c=counts("master",si);lines.push({t:`${s.title}: ${c.green}/${c.orange}/${c.red}`})});
 lines.push({t:""});lines.push({t:"LECTURA DE LOS RESULTADOS",b:true,s:13});
 const td=textualSummaryData();td.parts.forEach(p=>lines.push({t:p}));
 const priorityPdf=[
   ...td.b.study.map(x=>({area:x,type:"basis",status:"study"})),
   ...td.m.study.map(x=>({area:x,type:"master",status:"study"})),
   ...td.b.refresh.map(x=>({area:x,type:"basis",status:"refresh"})),
   ...td.m.refresh.map(x=>({area:x,type:"master",status:"refresh"}))
 ].slice(0,5);
 if(priorityPdf.length){
   lines.push({t:""});lines.push({t:"FUENTES RECOMENDADAS PARA MIS PRIORIDADES",b:true,s:12});
   priorityPdf.forEach(x=>{
     lines.push({t:`${x.status==="study"?"Estudiar":"Refrescar"}: ${x.area.title}`,b:true});
     const rr=RESOURCES[`${x.type}_${x.area.si}`]||{web:[],bib:[]};
     (rr.web||[]).forEach(id=>{const s=WEB[id];if(s)lines.push({t:`${s.provider}: ${s.title} — ${s.url}`})});
     (rr.bib||[]).forEach(id=>{if(BIB[id])lines.push({t:`Bibliografía EVL: ${BIB[id]}`})});
   });
 }
 lines.push({t:""});lines.push({t:"POSIBLE PROFUNDIZACIÓN",b:true,s:13});getSelectedTopics().forEach(si=>lines.push({t:MASTER[si].title,b:true}));
 [["Tema concreto",dom.qTopic.value],["Grupo o contexto",dom.qContext.value],["Lo que observo en mi práctica",dom.qPractice.value],["Datos que podría analizar",dom.qData.value],["Lo que quiero comprender mejor",dom.qUnderstand.value],["Pregunta provisional",dom.qProvisional.value]].forEach(([a,b])=>{lines.push({t:a+":",b:true});lines.push({t:b||"—"})});
 if(mode==="full"){
   lines.push({t:""});lines.push({t:"DASHBOARD DETALLADO POR PREGUNTA",b:true,s:13});
   lines.push({t:"Verde = Lo tengo claro · Naranja = Necesito refrescarlo · Rojo = Necesito estudiarlo · Gris = Sin responder"});
   [["BASISCHECK",BASIS,"basis"],["MASTERVERDIEPING",MASTER,"master"]].forEach(([h,list,type])=>{
     lines.push({t:""});lines.push({t:h,b:true,s:12});
     list.forEach((s,si)=>{
       lines.push({t:s.title,b:true});
       s.items.forEach((txt,ii)=>{
         const v=document.querySelector(`input[name="${type}_${si}_${ii}"]:checked`)?.value||"blank";
         const label=v==="green"?"CLARO":v==="orange"?"REFRESCAR":v==="red"?"ESTUDIAR":"SIN RESPONDER";
         const color=v==="green"?"green":v==="orange"?"orange":v==="red"?"red":"gray";
         lines.push({t:`${label}  ·  ${txt}`,color});
       });
     });
   });
 }
 lines.push({t:""});lines.push({t:"La Basischeck diagnostica conocimientos de entrada. Masterverdieping orienta el desarrollo y la posible profundización. Este autoscan no es una evaluación sumativa."});
 return lines;
}

function makeVisualPDF(mode){
 const W=595,H=842,M=40;
 const COLORS={
   purple:[0.35,0.18,0.51],purpleSoft:[0.95,0.93,0.97],green:[0.18,0.49,0.20],greenSoft:[0.91,0.96,0.91],
   orange:[0.64,0.32,0.00],orangeSoft:[1.00,0.95,0.88],red:[0.70,0.15,0.12],redSoft:[0.99,0.92,0.91],
   gray:[0.42,0.45,0.50],graySoft:[0.95,0.96,0.97],blue:[0.14,0.32,0.58],black:[0,0,0],white:[1,1,1]
 };
 let pages=[],ops=[],y=H-M,pageNo=0;

 function rgb(c){return (COLORS[c]||c||COLORS.black).join(" ")}
 function escPdf(s){return String(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
 function rect(x,yy,w,h,fill){ops.push(`${rgb(fill)} rg\n${x} ${yy} ${w} ${h} re f\n`)}
 function line(x1,y1,x2,y2,color="gray",width=.7){ops.push(`${rgb(color)} RG\n${width} w\n${x1} ${y1} m ${x2} ${y2} l S\n`)}
 function text(x,yy,t,size=10,bold=false,color="black"){
   ops.push(`${rgb(color)} rg\nBT\n/${bold?"F2":"F1"} ${size} Tf\n1 0 0 1 ${x} ${yy} Tm\n(${escPdf(t)}) Tj\nET\n`)
 }
 function approxChars(size,width){return Math.max(22,Math.floor(width/(size*.52)))}
 function wrapLines(t,size,width){
   const words=String(t).split(/\s+/),out=[];let cur="";
   const n=approxChars(size,width);
   words.forEach(w=>{const q=cur?cur+" "+w:w;if(q.length>n){if(cur)out.push(cur);cur=w}else cur=q});
   if(cur)out.push(cur);return out;
 }
 function need(h){if(y-h<M+20)newPage(false)}
 function para(t,size=9.5,color="black",bold=false,indent=0,width=W-2*M-indent,space=5){
   const ls=wrapLines(t,size,width);
   need(ls.length*size*1.35+space);
   ls.forEach(s=>{text(M+indent,y,s,size,bold,color);y-=size*1.35});
   y-=space;
 }
 function heading(t,size=13,color="purple"){
   need(size*2.1);text(M,y,t,size,true,color);y-=size*1.55;line(M,y+4,W-M,y+4,"gray",.35);y-=5;
 }
 function pageHeader(){
   if(pageNo===1){
     rect(0,H-92,W,92,"purple");
     text(M,H-46,"AUTOSCAN DE CONCIENCIA LINGÜÍSTICA",18,true,"white");
     text(M,H-67,"Master Leraar Spaans · Basischeck + Masterverdieping",10,false,"white");
     y=H-118;
   }else{
     text(M,H-30,"Autoscan de Conciencia Lingüística",9,true,"purple");
     text(W-M-42,H-30,String(pageNo),8,false,"gray");
     line(M,H-36,W-M,H-36,"purple",1);
     y=H-54;
   }
 }
 function newPage(first=false){
   if(ops.length)pages.push(ops.join(""));
   ops=[];pageNo++;pageHeader();
 }
 function card(x,top,w,h,fill,label,value,detail,color){
   rect(x,top-h,w,h,fill);
   text(x+10,top-19,String(value),18,true,color);
   text(x+10,top-36,label,8.7,true,color);
   if(detail)text(x+10,top-50,detail,7.2,false,"gray");
 }
 function stackedBar(label,t){
   need(45);
   text(M,y,label,10,true,"black");text(W-M-82,y,`${t.total-t.blank}/${t.total}`,8,false,"gray");y-=13;
   const x=M,w=W-2*M,h=13,d=t.total||1;
   rect(x,y-h,w,h,"graySoft");
   let xx=x;
   [[t.green,"green"],[t.orange,"orange"],[t.red,"red"],[t.blank,"gray"]].forEach(([n,c])=>{if(n){const ww=w*n/d;rect(xx,y-h,ww,h,c);xx+=ww}});
   y-=22;
   text(M,y,`${t.green} claro   ${t.orange} refrescar   ${t.red} estudiar${t.blank?`   ${t.blank} pendientes`:""}`,7.8,false,"gray");y-=16;
 }
 function statusColor(v){return v==="green"?"green":v==="orange"?"orange":v==="red"?"red":"gray"}
 function statusLabel(v){return v==="green"?"CLARO":v==="orange"?"REFRESCAR":v==="red"?"ESTUDIAR":"SIN RESPONDER"}
 function domainBox(title,c){
   need(35);text(M,y,title,9.3,true,"black");y-=11;
   const x=M,w=170,h=8,d=c.total||1;rect(x,y-h,w,h,"graySoft");let xx=x;
   [[c.green,"green"],[c.orange,"orange"],[c.red,"red"],[c.blank,"gray"]].forEach(([n,col])=>{if(n){const ww=w*n/d;rect(xx,y-h,ww,h,col);xx+=ww}});
   text(M+180,y-7,`${c.green}/${c.orange}/${c.red}${c.blank?` · ${c.blank} pendiente(s)`:""}`,7.3,false,"gray");y-=18;
 }
 function sourceLines(type,area,status,limit=2){
   const rr=RESOURCES[`${type}_${area.si}`]||{web:[],bib:[]};
   const arr=[];
   (rr.web||[]).slice(0,limit).forEach(id=>{const s=WEB[id];if(s)arr.push({title:`${s.provider}: ${s.title}`,url:s.url})});
   (rr.bib||[]).slice(0,1).forEach(id=>{if(BIB[id])arr.push({title:`Bibliografía EVL: ${BIB[id]}`,url:""})});
   return arr;
 }

 newPage(true);
 const s=state(),bt=totalCounts("basis"),mt=totalCounts("master"),td=textualSummaryData();
 text(M,y,`Estudiante: ${s.name||"—"}`,10,true,"black");text(W/2+10,y,`Fecha: ${s.date||"—"}`,10,false,"gray");y-=24;

 heading("Tu perfil en una mirada",14);
 const domains=[...BASIS.map((x,si)=>domainClassification("basis",si)),...MASTER.map((x,si)=>domainClassification("master",si))];
 const dc={good:0,refresh:0,study:0,pending:0};domains.forEach(x=>dc[x]++);
 const gap=8,cw=(W-2*M-gap*3)/4,top=y;
 card(M,top,cw,62,"greenSoft","Bien asentados",dc.good,"ámbitos","green");
 card(M+(cw+gap),top,cw,62,"orangeSoft","Refrescar",dc.refresh,"ámbitos","orange");
 card(M+2*(cw+gap),top,cw,62,"redSoft","Estudiar",dc.study,"ámbitos","red");
 card(M+3*(cw+gap),top,cw,62,"graySoft","Incompletos",dc.pending,"ámbitos","gray");
 y-=78;
 stackedBar("Basischeck",bt);stackedBar("Masterverdieping",mt);

 heading("Cómo interpretar el resultado",13);
 td.parts.forEach(p=>para(p,9.3,"black",false,0, W-2*M));
 const rd=researchDirectionData();
 need(48);rect(M,y-38,W-2*M,38,"purpleSoft");text(M+10,y-14,"SIGUIENTE PASO",8,true,"purple");
 const nextLines=wrapLines(rd.next,7.8,W-2*M-20).slice(0,2);nextLines.forEach((z,j)=>text(M+10,y-27-j*9,z,7.8,false,"black"));y-=48;

 heading("Fortalezas",13,"green");
 const strengths=[
   ...td.b.strength.map(x=>x.title),
   ...td.m.strength.map(x=>x.title)
 ];
 if(strengths.length)strengths.forEach(x=>para(`• ${x}`,9.4,"green",true,0,W-2*M));
 else para("No hay todavía un ámbito completamente verde. Revisa el dashboard para localizar fortalezas parciales.",9.2,"gray");

 heading("Prioridades y siguiente paso",13,"red");
 const priorities=[
   ...td.b.study.map(x=>({x,type:"basis",status:"study"})),
   ...td.m.study.map(x=>({x,type:"master",status:"study"})),
   ...td.b.refresh.map(x=>({x,type:"basis",status:"refresh"})),
   ...td.m.refresh.map(x=>({x,type:"master",status:"refresh"}))
 ];
 if(!priorities.length)para("No aparecen prioridades de estudio o repaso con las respuestas actuales.",9.2,"gray");
 priorities.slice(0,6).forEach(({x,type,status})=>{
   need(50);
   const col=status==="study"?"red":"orange",soft=status==="study"?"redSoft":"orangeSoft";
   rect(M,y-36,W-2*M,36,soft);
   text(M+9,y-14,`${status==="study"?"ESTUDIAR":"REFRESCAR"} · ${x.title}`,9,true,col);
   const next=status==="study"?"Reconstruye la explicación, contrástala con datos o ejemplos y vuelve a comprobar tu comprensión.":"Haz un repaso breve, explícalo sin mirar la fuente y compruébalo con ejemplos nuevos.";
   const ls=wrapLines(next,7.5,W-2*M-18).slice(0,2);ls.forEach((z,j)=>text(M+9,y-26-j*9,z,7.5,false,"gray"));
   y-=44;
 });

 heading("Fuentes recomendadas",13,"blue");
 const maxSources=mode==="full"?priorities.length:Math.min(priorities.length,4);
 priorities.slice(0,maxSources).forEach(({x,type,status})=>{
   need(28);text(M,y,`${status==="study"?"Estudiar":"Refrescar"}: ${x.title}`,9,true,status==="study"?"red":"orange");y-=12;
   sourceLines(type,x,status,mode==="full"?2:1).forEach(src=>{
     para(src.title,7.8,"black",false,8,W-2*M-8);
     if(src.url)para(src.url,7.1,"blue",false,14,W-2*M-14);
   });
   y-=3;
 });

 heading("Dashboard por ámbitos",13,"purple");
 BASIS.forEach((s,si)=>domainBox(`Basis · ${s.title}`,counts("basis",si)));
 MASTER.forEach((s,si)=>domainBox(`Máster · ${s.title}`,counts("master",si)));

 if(mode==="full"){
   newPage(false);
   heading("Dashboard detallado por cada pregunta",14,"purple");
   para("Cada pregunta conserva el color elegido en el autoscan.",8.7,"gray");
   [["BASISCHECK",BASIS,"basis"],["MASTERVERDIEPING",MASTER,"master"]].forEach(([group,list,type])=>{
     heading(group,11,"purple");
     list.forEach((sec,si)=>{
       need(24);text(M,y,sec.title,9.2,true,"black");y-=12;
       sec.items.forEach((q,ii)=>{
         const v=document.querySelector(`input[name="${type}_${si}_${ii}"]:checked`)?.value||"blank";
         const col=statusColor(v);
         const lines=wrapLines(q,7.6,W-2*M-112);
         const h=Math.max(18,lines.length*9+4);need(h+4);
         rect(M,y-h+2,10,10,col);
         text(M+17,y-7,statusLabel(v),7.1,true,col);
         lines.forEach((ln,j)=>text(M+105,y-7-j*9,ln,7.6,false,"black"));
         y-=h+2;
       });
       y-=3;
     });
   });
 }

 if(s.qTopic||s.qProvisional||s.qPractice){
   heading("Posible profundización",13,"purple");
   if(rd.sentence)para(`Dirección posible: ${rd.sentence}`,9.4,"purple",true);
   if(s.qTopic)para(`Tema concreto: ${s.qTopic}`,9.3,"black",true);
   if(s.qContext)para(`Contexto: ${s.qContext}`,9.1,"black");
   if(s.qScope)para(`Cantidad o periodo: ${s.qScope}`,9.1,"black");
   if(s.qCompare)para(`Comparación u observación: ${s.qCompare}`,9.1,"black");
   if(s.qBoundary)para(`Qué queda fuera: ${s.qBoundary}`,9.1,"black");
   if(s.qPractice)para(`Lo que observo: ${s.qPractice}`,9.1,"black");
   if(s.qData)para(`Datos posibles: ${s.qData}`,9.1,"black");
   if(s.qProvisional)para(`Pregunta provisional: ${s.qProvisional}`,9.3,"purple",true);
 }

 pages.push(ops.join(""));

 const objs=[],add=o=>{objs.push(o);return objs.length},catalog=add(""),pagesObj=add(""),
 f1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
 f2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),refs=[];
 pages.forEach(content=>{
   const bb=bytes(content),st=add({stream:bb,dict:`<< /Length ${bb.length} >>`});
   refs.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${st} 0 R >>`));
 });
 objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
 objs[pagesObj-1]=`<< /Type /Pages /Kids [${refs.map(r=>r+" 0 R").join(" ")}] /Count ${refs.length} >>`;
 const chunks=[];let off=0;const push=b=>{chunks.push(b);off+=b.length},enc=s=>bytes(s);
 push(enc("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));const offsets=[0];
 objs.forEach((o,i)=>{offsets.push(off);push(enc(`${i+1} 0 obj\n`));if(typeof o==="string")push(enc(o+"\n"));else{push(enc(o.dict+"\nstream\n"));push(o.stream);push(enc("\nendstream\n"))}push(enc("endobj\n"))});
 const x=off;push(enc(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`));
 for(let i=1;i<offsets.length;i++)push(enc(String(offsets[i]).padStart(10,"0")+" 00000 n \n"));
 push(enc(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${x}\n%%EOF`));
 const total=chunks.reduce((n,b)=>n+b.length,0),all=new Uint8Array(total);let pos=0;chunks.forEach(b=>{all.set(b,pos);pos+=b.length});
 return new Blob([all],{type:"application/pdf"});
}
function downloadPDF(mode){
 const bt=totalCounts("basis"),mt=totalCounts("master"),blanks=bt.blank+mt.blank;
 if(blanks&&!confirm(`Todavía faltan ${blanks} respuestas. ¿Quieres descargar un resultado provisional?`))return;
 const blob=makeVisualPDF(mode),a=document.createElement("a"),safe=(dom.studentName.value||"estudiante").replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ-]+/g,"_");
 a.href=URL.createObjectURL(blob);a.download=`Autoscan_Conciencia_Linguistica_${mode==="full"?"informe_completo":"resumen_visual"}_${safe}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

build();
