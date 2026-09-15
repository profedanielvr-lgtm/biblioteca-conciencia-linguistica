function wrapText(text,maxChars){const words=String(text).split(/\s+/),lines=[];let line="";words.forEach(w=>{const test=line?line+" "+w:w;if(test.length>maxChars){if(line)lines.push(line);line=w}else line=test});if(line)lines.push(line);return lines}
function answerLabel(v){return v==="green"?"LO TENGO CLARO":v==="orange"?"NECESITO REFRESCARLO":v==="red"?"NECESITO ESTUDIARLO":"SIN RESPONDER"}
function buildReportLines(mode){
 const lines=[],t=totalCounts(),complete=t.blank===0;
 lines.push({t:"AUTOSCAN DE CONCIENCIA LINGÜÍSTICA",b:true,s:16});lines.push({t:"Máster de Profesorado de Español",s:11});lines.push({t:complete?"Perfil final":"Resultado provisional",b:true});lines.push({t:""});
 lines.push({t:"Estudiante: "+(dom.studentName.value.trim()||"—"),b:true});lines.push({t:"Fecha: "+(dom.scanDate.value||"—")});lines.push({t:""});
 lines.push({t:"RESUMEN GENERAL",b:true,s:13});lines.push({t:`Lo tengo claro: ${t.green} · Necesito refrescarlo: ${t.orange} · Necesito estudiarlo: ${t.red} · Sin responder: ${t.blank}`});lines.push({t:""});
 lines.push({t:"RESULTADO POR TEMA",b:true,s:13});SECTIONS.forEach((s,si)=>{const c=counts(si);lines.push({t:`${s.title}: ${c.green} lo tengo claro · ${c.orange} repasar · ${c.red} aprender`,b:true})});
 lines.push({t:""});lines.push({t:"RUTA PERSONAL DE APRENDIZAJE",b:true,s:13});
 SECTIONS.map((s,si)=>({si,title:s.title,c:counts(si),score:needScore(si)})).filter(x=>x.c.red+x.c.orange>0).sort((a,b)=>b.score-a.score).slice(0,5).forEach((x,idx)=>lines.push({t:`Prioridad ${idx+1}: ${x.title} — ${x.c.red} por estudiar, ${x.c.orange} por refrescar.`}));
 const selected=getSelectedTopics();lines.push({t:""});lines.push({t:"POSIBLES TEMAS DE PROFUNDIZACIÓN",b:true,s:13});
 if(selected.length)selected.forEach(si=>{const [cls,label,desc]=matrixType(si);lines.push({t:SECTIONS[si].title,b:true});lines.push({t:`${label}. ${desc}`})});else lines.push({t:"No se han seleccionado temas."});
 lines.push({t:""});lines.push({t:"ORIENTACIÓN PARA MI INDAGACIÓN EN LA PRÁCTICA DOCENTE",b:true,s:13});
 [["Fenómeno que me interesa",dom.qInterest.value],["Lo que observo en mi práctica",dom.qPractice.value],["Dificultades o patrones del alumnado",dom.qStudents.value],["Datos que podría analizar",dom.qData.value],["Lo que quiero comprender mejor",dom.qUnderstand.value],["Posible pregunta de partida",dom.qProvisional.value]].forEach(([a,b])=>{lines.push({t:a+":",b:true});lines.push({t:b.trim()||"—"});lines.push({t:""})});
 lines.push({t:`Condiciones para la indagación: práctica ${dom.checkPractice.checked?"sí":"no"} · datos ${dom.checkData.checked?"sí":"no"} · interés ${dom.checkInterest.checked?"sí":"no"}`});
 if(mode==="full"){lines.push({t:""});lines.push({t:"TODAS MIS RESPUESTAS",b:true,s:13});SECTIONS.forEach((s,si)=>{lines.push({t:s.title,b:true,s:11});s.items.forEach((txt,ii)=>{const v=document.querySelector(`input[name="${k(si,ii)}"]:checked`)?.value||"";lines.push({t:`[${answerLabel(v)}] ${txt}`})});lines.push({t:""})})}
 lines.push({t:""});lines.push({t:"Este autoscan es una herramienta diagnóstica. No genera una nota ni determina por sí solo el tema de investigación."});
 return lines;
}
function makePDF(lines){
 const W=595,H=842,left=46,top=58,bottom=52;let y=H-top,pages=[[]];
 function newPage(){pages.push([]);y=H-top}
 function addLine(txt,bold=false,size=10){const maxChars=Math.max(34,Math.floor((W-2*left)/(size*.52))),wrapped=txt===""?[""]:wrapText(txt,maxChars);for(const line of wrapped){const lh=size*1.35;if(y-lh<bottom)newPage();pages[pages.length-1].push({x:left,y,text:line,bold,size});y-=lh}y-=size*.18}
 lines.forEach(o=>addLine(o.t,o.b||false,o.s||10));
 const objs=[],add=o=>{objs.push(o);return objs.length};const catalog=add(""),pagesObj=add("");const f1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");const f2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");const pageRefs=[];
 pages.forEach(items=>{let content="BT\n";items.forEach(it=>{content+=`/${it.bold?"F2":"F1"} ${it.size} Tf\n1 0 0 1 ${it.x.toFixed(1)} ${it.y.toFixed(1)} Tm\n(${pdfEsc(it.text)}) Tj\n`});content+="ET\n";const bytes=winAnsiBytes(content),streamObj=add({stream:bytes,dict:`<< /Length ${bytes.length} >>`});const pageObj=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${streamObj} 0 R >>`);pageRefs.push(pageObj)});
 objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;objs[pagesObj-1]=`<< /Type /Pages /Kids [${pageRefs.map(r=>r+" 0 R").join(" ")}] /Count ${pageRefs.length} >>`;
 const chunks=[];let offset=0;const push=b=>{chunks.push(b);offset+=b.length},enc=s=>winAnsiBytes(s);push(enc("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));const offsets=[0];
 objs.forEach((obj,i)=>{offsets.push(offset);push(enc(`${i+1} 0 obj\n`));if(typeof obj==="string")push(enc(obj+"\n"));else{push(enc(obj.dict+"\nstream\n"));push(obj.stream);push(enc("\nendstream\n"))}push(enc("endobj\n"))});
 const xref=offset;push(enc(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`));for(let i=1;i<offsets.length;i++)push(enc(String(offsets[i]).padStart(10,"0")+" 00000 n \n"));push(enc(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`));
 const total=chunks.reduce((n,b)=>n+b.length,0),all=new Uint8Array(total);let p=0;chunks.forEach(b=>{all.set(b,p);p+=b.length});return new Blob([all],{type:"application/pdf"});
}
function requestPDF(mode){
 const t=totalCounts();
 if(t.blank>0){
   const go=confirm(`Todavía faltan ${t.blank} afirmaciones. El PDF se marcará como resultado provisional.\n\nPulsa Aceptar para descargar de todos modos o Cancelar para volver al autoscan.`);
   if(!go){goNextUnanswered();return;}
 }
 const blob=makePDF(buildReportLines(mode)),a=document.createElement("a"),safe=(dom.studentName.value.trim()||"estudiante").replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ-]+/g,"_");
 a.href=URL.createObjectURL(blob);a.download=`Autoscan_Conciencia_Linguistica_${mode==="full"?"informe_completo":"resumen_portfolio"}_${safe}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
