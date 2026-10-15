'use strict';
window.BCLTeacher = (() => {
  let content, language='es', currentRoute='', config=null, configPromise, token='', expires=0, rows=[], days=30, filter='all', loading=false, timer, lastSearch='', lastPage='', sequence=0, expiryTimer;
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const tr = k => content?.ui[k]?.[language] || k;
  const val = x => typeof x==='object' ? x?.[language] || x?.es || '' : x;
  const $ = id => document.getElementById(id);
  const teacherRoute = () => currentRoute.split('/')[0] === 'profesor';
  const choice = () => { try { return localStorage.getItem('bcl-analytics-consent-v1'); } catch { return null; } };
  const active = () => config?.enabled === true && !!config.apiBase;
  const number = n => new Intl.NumberFormat(language).format(n);
  function endpoint(path) { return config.apiBase.replace(/\/$/,'') + '/api/' + path; }
  async function request(path, options={}) {
    const headers={'Content-Type':'application/json',...(options.auth?{Authorization:'Bearer '+(options.token??token)}:{})};
    const result=await fetch(endpoint(path),{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
    if(!result.ok) { const error=new Error(result.status===401?tr('teacherLoginError'):result.status===429?tr('teacherRateError'):tr('teacherNetworkError')); error.status=result.status; throw error; }
    return result.json();
  }
  async function loadConfig() {
    if (!configPromise) configPromise=fetch('analytics-config.json?v=20261015',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(c=>{
      const url=c.apiBase?new URL(c.apiBase,location.href):null;
      if(url && (url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname)))) throw Error();
      config={enabled:c.enabled===true,apiBase:url?.origin || ''}; return config;
    }).catch(()=>{config={enabled:false,apiBase:''};return config;});
    return configPromise;
  }
  function consentUI() {
    let host=$('analytics-consent');
    if(!host){host=document.createElement('aside');host.id='analytics-consent';document.body.append(host);}
    host.className='analytics-consent';
    if(!active() || choice() || teacherRoute() || window.BCL_PREVIEW_CONTENT){host.hidden=true;return;}
    host.hidden=false;host.setAttribute('aria-label',tr('analyticsConsentTitle'));
    host.innerHTML='<h2>'+esc(tr('analyticsConsentTitle'))+'</h2><p>'+esc(tr('analyticsConsentText'))+'</p><div class="actions"><button id="analytics-accept">'+esc(tr('analyticsAccept'))+'</button><button class="secondary" id="analytics-decline">'+esc(tr('analyticsDecline'))+'</button></div>';
    $('analytics-accept').onclick=()=>setConsent('yes');$('analytics-decline').onclick=()=>setConsent('no');
  }
  function footerLink() {
    const footer=$('footer');if(!footer)return;
    footer.querySelector('.analytics-footer')?.remove();
    const p=document.createElement('div');p.className='analytics-footer';
    p.innerHTML='<a href="#profesor">'+esc(tr('teacherPanel'))+'</a>'+(active()?' <button class="secondary" id="analytics-preferences">'+esc(tr('analyticsPreferences'))+'</button>':'');footer.append(p);
    if($('analytics-preferences'))$('analytics-preferences').onclick=()=>{
      try{localStorage.removeItem('bcl-analytics-consent-v1');}catch{}
      clearTimeout(timer);lastPage='';consentUI();
    };
  }
  function setConsent(value) {
    try{localStorage.setItem('bcl-analytics-consent-v1',value);}catch{ $('analytics-consent').innerHTML='<p>'+esc(tr('analyticsStorageError'))+'</p>';return; }
    clearTimeout(timer);consentUI();if(value==='yes')pageEvent();
  }
  function send(kind,target,outcome) {
    if(!active() || choice()!=='yes' || window.BCL_PREVIEW_CONTENT || ['profesor','admin','profesorado'].includes(currentRoute.split('/')[0]))return;
    // Only catalogued labels/IDs go to the service. No URL, free text, student answer or identifier.
    request('events',{method:'POST',body:{consent:true,language,kind,target,...(outcome?{outcome}:{})}}).catch(()=>{});
  }
  function normalizedPage() {
    const parts=currentRoute.split('?')[0].split('/');
    if(['tema','lectura','muestra'].includes(parts[0]))return parts.slice(0,2).join('/');
    if(['buscar','biblioteca','teoria','actividades','materiales','ruta','modulo'].includes(parts[0]))return 'bok';
    if(['referencias','fuente'].includes(parts[0]))return 'fuentes';
    return parts[0] || 'inicio';
  }
  function pageEvent() { const page=normalizedPage();if(page!==lastPage && choice()==='yes'){send('page',page);lastPage=page;} }
  function search(query,hadResults) {
    clearTimeout(timer);
    if(!query?.trim() || !active() || choice()!=='yes')return;
    const original=norm(query),known=new Set(content.topics.filter(t=>t.status==='published').flatMap(t=>t.terms).map(norm));
    for(const p of content.popularTopics||[])for(const q of Object.values(p.query||{}))known.add(norm(q));
    const target=known.has(original)?original:'(other)', outcome=hadResults?'results':'empty';
    const key=original+'|'+outcome;
    timer=setTimeout(()=>{if(lastSearch!==key){send('search',target,outcome);lastSearch=key;}},1000);
  }
  function label(kind,target) {
    if(target==='(other)')return tr('teacherOtherSearch');
    if(kind==='search')return target;
    if(kind==='resource')return content.references.find(r=>r.id===target)?.title||target;
    if(kind==='section'){const [id,section]=target.split('/');return val(content.topics.find(t=>t.slug===id)?.title)+' · '+tr(section==='reasoning'?'reasoningLab':section);}
    const [route,id]=target.split('/');
    if(route==='tema')return val(content.topics.find(t=>t.slug===id)?.title)||id;
    if(route==='lectura')return content.references.find(r=>r.id===id)?.title||id;
    if(route==='muestra')return val(content.samples.find(s=>s.id===id)?.title)||id;
    return tr(({inicio:'home',bok:'bok',indice:'index',muestras:'samples',comparar:'compare',fuentes:'sources',estudio:'myStudy',corpus:'corpusLab',cuaderno:'work',dossier:'work'})[route]||route);
  }
  function grouped(data,key) { const out=new Map();for(const r of data){const k=key(r);out.set(k,(out.get(k)||0)+r.total);}return [...out].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])); }
  function ranking(data,kind,title,emptyOnly=false) {
    const items=grouped(data.filter(r=>r.kind===kind&&(!emptyOnly||r.outcome==='empty')),r=>r.target);
    return '<section class="teacher-section"><h2>'+esc(tr(title))+'</h2>'+(items.length?'<div class="tablewrap"><table><caption class="sr-only">'+esc(tr(title))+'</caption><thead><tr><th scope="col">'+esc(tr(kind==='search'?'teacherTerm':'teacherItem'))+'</th><th scope="col">'+esc(tr('teacherEvents'))+'</th></tr></thead><tbody>'+items.slice(0,20).map(([target,total])=>'<tr><th scope="row">'+esc(label(kind,target))+'</th><td>'+number(total)+'</td></tr>').join('')+'</tbody></table></div>':'<p class="meta">'+esc(tr('teacherNoData'))+'</p>')+'</section>';
  }
  function dashboard() {
    const data=rows.filter(r=>filter==='all'||r.language===filter);
    const total=kind=>data.filter(r=>r.kind===kind).reduce((a,r)=>a+r.total,0);
    const empty=data.filter(r=>r.kind==='search'&&r.outcome==='empty').reduce((a,r)=>a+r.total,0);
    const daily=grouped(data.filter(r=>r.kind==='page'),r=>r.day).sort((a,b)=>a[0].localeCompare(b[0]));
    const max=Math.max(1,...daily.map(x=>x[1]));
    return '<p class="eyebrow">'+esc(tr('teacherPrivate'))+'</p><h1>'+esc(tr('teacherPanel'))+'</h1><p class="lead">'+esc(tr('teacherIntro'))+'</p><div class="actions"><a class="button secondary" href="#admin">'+esc(tr('admin'))+'</a><button class="secondary" id="teacher-logout">'+esc(tr('teacherLogout'))+'</button></div><p class="meta">'+esc(tr('teacherSession'))+' '+esc(new Date(expires).toLocaleTimeString(language,{hour:'2-digit',minute:'2-digit'}))+'</p><div class="teacher-toolbar"><label>'+esc(tr('teacherPeriod'))+'<select id="teacher-days">'+[7,30,90].map(n=>'<option value="'+n+'"'+(days===n?' selected':'')+'>'+n+' '+esc(tr('teacherDays'))+'</option>').join('')+'</select></label><label>'+esc(tr('language'))+'<select id="teacher-language"><option value="all">'+esc(tr('all'))+'</option><option value="es"'+(filter==='es'?' selected':'')+'>Español</option><option value="nl"'+(filter==='nl'?' selected':'')+'>Nederlands</option></select></label><button id="teacher-refresh"'+(loading?' disabled':'')+'>'+esc(tr('teacherRefresh'))+'</button><button class="secondary" id="teacher-csv"'+(!data.length?' disabled':'')+'>'+esc(tr('teacherExport'))+'</button></div><p id="teacher-status" role="status">'+esc(loading?tr('teacherLoading'):tr('teacherUpdated'))+'</p><div class="teacher-metrics">'+[['teacherPageviews',total('page')],['teacherSearches',total('search')],['teacherEmptySearches',empty],['teacherResources',total('resource')]].map(([title,n])=>'<article class="panel"><h2>'+esc(tr(title))+'</h2><strong>'+number(n)+'</strong></article>').join('')+'</div><p class="notice">'+esc(tr('teacherLimits'))+'</p><section class="teacher-section"><h2>'+esc(tr('teacherTimeline'))+'</h2>'+(daily.length?'<div class="teacher-bars" role="list">'+daily.map(([day,n])=>'<div role="listitem"><span>'+esc(new Intl.DateTimeFormat(language,{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z')))+'</span><meter min="0" max="'+max+'" value="'+n+'" aria-label="'+esc(day)+'">'+n+'</meter><strong>'+number(n)+'</strong></div>').join('')+'</div>':'<p>'+esc(tr('teacherNoData'))+'</p>')+'</section><div class="teacher-columns">'+ranking(data,'search','teacherPopularSearches')+ranking(data,'search','teacherMissingSearches',true)+ranking(data,'page','teacherPopularPages')+ranking(data,'resource','teacherPopularResources')+ranking(data,'section','teacherPopularSections')+'</div><section class="panel"><h2>'+esc(tr('teacherInterpret'))+'</h2><p>'+esc(tr('teacherInterpretText'))+'</p><h3>'+esc(tr('teacherQuestions'))+'</h3><p>'+esc(tr('teacherQuestionsText'))+'</p></section><p class="meta">'+esc(tr('teacherRetention'))+'</p>';
  }
  function render() {
    if(!teacherRoute())return;
    const view=$('view');
    if(!config){view.innerHTML='<h1>'+esc(tr('teacherPanel'))+'</h1><p role="status">'+esc(tr('teacherLoading'))+'</p>';return;}
    if(!active()){view.innerHTML='<h1>'+esc(tr('teacherPanel'))+'</h1><p class="lead">'+esc(tr('teacherIntro'))+'</p><section class="panel"><h2>'+esc(tr('teacherNotActive'))+'</h2><p>'+esc(tr('teacherSetupText'))+'</p><p>'+esc(tr('teacherNoHistory'))+'</p><a href="https://github.com/profedanielvr-lgtm/biblioteca-conciencia-linguistica/blob/main/analytics-server/README.md" target="_blank" rel="noopener">'+esc(tr('teacherSetupLink'))+'</a></section><a class="button secondary" href="#admin">'+esc(tr('admin'))+'</a>';return;}
    if(!token||Date.now()>=expires){token='';rows=[];view.innerHTML='<h1>'+esc(tr('teacherPanel'))+'</h1><p class="lead">'+esc(tr('teacherLoginIntro'))+'</p><form id="teacher-login" class="teacher-login panel"><label for="teacher-user">'+esc(tr('teacherUser'))+'</label><input id="teacher-user" name="username" autocomplete="username" required maxlength="80"><label for="teacher-password">'+esc(tr('teacherPassword'))+'</label><input id="teacher-password" name="password" type="password" autocomplete="current-password" required maxlength="200"><button id="teacher-login-button">'+esc(tr('teacherLogin'))+'</button><p id="teacher-status" role="status"></p></form><p class="meta">'+esc(tr('teacherSecurity'))+'</p>';
      $('teacher-login').onsubmit=login;return;}
    view.innerHTML=dashboard();
    $('teacher-logout').onclick=logout;$('teacher-refresh').onclick=refresh;
    $('teacher-days').onchange=e=>{days=Number(e.target.value);refresh();};$('teacher-language').onchange=e=>{filter=e.target.value;render();};$('teacher-csv').onclick=exportCSV;
  }
  async function login(event) {
    event.preventDefault();const button=$('teacher-login-button');button.disabled=true;
    const password=$('teacher-password').value,username=$('teacher-user').value;
    $('teacher-password').value='';$('teacher-status').textContent=tr('teacherLoading');
    try{const response=await request('login',{method:'POST',body:{username,password}});token=response.token;expires=response.expires;clearTimeout(expiryTimer);expiryTimer=setTimeout(()=>{token='';rows=[];sequence++;render();},Math.max(0,expires-Date.now()));await refresh();}
    catch(error){if($('teacher-status'))$('teacher-status').textContent=error.message;}
    finally{if($('teacher-login-button'))$('teacher-login-button').disabled=false;}
  }
  async function refresh() {
    if(!token)return;const seq=++sequence;loading=true;render();
    try{const result=await request('dashboard?days='+days,{auth:true});if(seq!==sequence||!token)return;rows=result.rows;expires=result.expires;loading=false;render();}
    catch(error){if(seq!==sequence)return;loading=false;if(error.status===401){token='';rows=[];render();}if($('teacher-status'))$('teacher-status').textContent=error.message;}
  }
  async function logout(){const old=token;token='';rows=[];loading=false;sequence++;clearTimeout(expiryTimer);render();try{if(old)await request('logout',{method:'POST',auth:true,token:old});}catch{}}
  function exportCSV(){
    const quote=s=>'"'+String(s).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
    const data=rows.filter(r=>filter==='all'||r.language===filter);
    const csv='\uFEFF'+[['date','event','item','language','result','count'],...data.map(r=>[r.day,r.kind,label(r.kind,r.target),r.language,r.outcome,r.total])].map(r=>r.map(quote).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='biblioteca-statistics.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function onPage({content:c,language:l,route}){
    content=c;language=l;currentRoute=route;const wanted=route;
    footerLink();render();await loadConfig();if(currentRoute!==wanted)return;
    if(active()&&!$('analytics-preferences'))footerLink();consentUI();pageEvent();render();
    if(route.startsWith('buscar/'))search(decodeURIComponent(route.slice(7)),!!$('results')?.querySelector('a.card'));
  }
  if(typeof window.addEventListener==='function'){
    window.addEventListener('storage',event=>{if(event.key==='bcl-analytics-consent-v1'){clearTimeout(timer);lastPage='';consentUI();}});
    window.addEventListener('click',event=>{
      const a=event.target.closest?.('a');if(!a||!content)return;
      if(a.dataset.scroll){const slug=currentRoute.split('/')[1]?.split('?')[0];if(slug)send('section',slug+'/'+a.dataset.scroll);return;}
      const href=a.getAttribute('href');const ref=content.references.find(r=>r.url===href);if(ref)send('resource',ref.id);
    });
  }
  return {onPage,search};
})();
