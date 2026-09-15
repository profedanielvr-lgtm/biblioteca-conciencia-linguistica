/* PDF autónomo */
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
 lines.push({t:""});lines.push({t:"POSIBLE PROFUNDIZACIÓN",b:true,s:13});getSelectedTopics().forEach(si=>lines.push({t:MASTER[si].title,b:true}));
 [["Lo que observo en mi práctica",dom.qPractice.value],["Datos que podría analizar",dom.qData.value],["Lo que quiero comprender mejor",dom.qUnderstand.value],["Pregunta provisional",dom.qProvisional.value]].forEach(([a,b])=>{lines.push({t:a+":",b:true});lines.push({t:b||"—"})});
 if(mode==="full"){
   lines.push({t:""});lines.push({t:"TODAS MIS RESPUESTAS",b:true,s:13});
   [["BASISCHECK",BASIS,"basis"],["MASTERVERDIEPING",MASTER,"master"]].forEach(([h,list,type])=>{lines.push({t:h,b:true,s:12});list.forEach((s,si)=>{lines.push({t:s.title,b:true});s.items.forEach((txt,ii)=>{const v=document.querySelector(`input[name="${type}_${si}_${ii}"]:checked`)?.value||"";lines.push({t:`[${aLabel(v)}] ${txt}`})})})});
 }
 lines.push({t:""});lines.push({t:"La Basischeck diagnostica conocimientos de entrada. Masterverdieping orienta el desarrollo y la posible profundización. Este autoscan no es una evaluación sumativa."});
 return lines;
}
function makePDF(lines){
 const W=595,H=842,left=46,top=58,bottom=52;let y=H-top,pages=[[]];
 const addPage=()=>{pages.push([]);y=H-top};
 const addLine=(txt,bold=false,size=10)=>{const parts=txt===""?[""]:wrap(txt,Math.max(34,Math.floor((W-2*left)/(size*.52))));for(const line of parts){const lh=size*1.35;if(y-lh<bottom)addPage();pages[pages.length-1].push({x:left,y,text:line,bold,size});y-=lh}y-=size*.18};
 lines.forEach(o=>addLine(o.t,o.b||false,o.s||10));
 const objs=[],add=o=>{objs.push(o);return objs.length},catalog=add(""),pagesObj=add(""),f1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),f2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),refs=[];
 pages.forEach(items=>{let content="BT\n";items.forEach(it=>content+=`/${it.bold?"F2":"F1"} ${it.size} Tf\n1 0 0 1 ${it.x} ${it.y} Tm\n(${pdfEsc(it.text)}) Tj\n`);content+="ET\n";const bb=bytes(content),st=add({stream:bb,dict:`<< /Length ${bb.length} >>`});refs.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${st} 0 R >>`))});
 objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;objs[pagesObj-1]=`<< /Type /Pages /Kids [${refs.map(r=>r+" 0 R").join(" ")}] /Count ${refs.length} >>`;
 const chunks=[];let off=0;const push=b=>{chunks.push(b);off+=b.length},enc=s=>bytes(s);push(enc("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));const offsets=[0];
 objs.forEach((o,i)=>{offsets.push(off);push(enc(`${i+1} 0 obj\n`));if(typeof o==="string")push(enc(o+"\n"));else{push(enc(o.dict+"\nstream\n"));push(o.stream);push(enc("\nendstream\n"))}push(enc("endobj\n"))});
 const x=off;push(enc(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`));for(let i=1;i<offsets.length;i++)push(enc(String(offsets[i]).padStart(10,"0")+" 00000 n \n"));push(enc(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${x}\n%%EOF`));
 const total=chunks.reduce((n,b)=>n+b.length,0),all=new Uint8Array(total);let p=0;chunks.forEach(b=>{all.set(b,p);p+=b.length});return new Blob([all],{type:"application/pdf"});
}
function downloadPDF(mode){
 const bt=totalCounts("basis"),mt=totalCounts("master"),blanks=bt.blank+mt.blank;
 if(blanks&&!confirm(`Todavía faltan ${blanks} respuestas. ¿Quieres descargar un resultado provisional?`))return;
 const blob=makePDF(report(mode)),a=document.createElement("a"),safe=(dom.studentName.value||"estudiante").replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ-]+/g,"_");
 a.href=URL.createObjectURL(blob);a.download=`Autoscan_Conciencia_Linguistica_${mode==="full"?"completo":"resumen"}_${safe}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
