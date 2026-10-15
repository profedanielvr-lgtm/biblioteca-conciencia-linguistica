import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code=readFileSync(new URL('../teacher-panel.js',import.meta.url),'utf8');
const content=JSON.parse(readFileSync(new URL('../library-v2.json',import.meta.url),'utf8'));
function browser(enabled=true){
  const nodes=new Map(),storage=new Map(),calls=[],timers=new Map();let serial=0;
  class El{constructor(id){this.id=id;this.innerHTML='';this.value='';this.hidden=false;this.dataset={};this.disabled=false;this.textContent='';}append(node){nodes.set(node.id,node);}querySelector(){return null;}setAttribute(){}click(){}}
  const view=new El('view'),footer=new El('footer');nodes.set('view',view);nodes.set('footer',footer);
  const doc={body:{append(node){nodes.set(node.id,node);}},createElement(){return new El('');},getElementById(id){if(nodes.has(id))return nodes.get(id);if([...nodes.values()].some(n=>n.innerHTML.includes('id="'+id+'"'))){const n=new El(id);nodes.set(id,n);return n;}return null;}};
  const context={document:doc,window:{addEventListener(){}},location:{href:'https://example.org/'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},URL,Blob,Map,Set,Date,Intl,console,clearTimeout:id=>timers.delete(id),setTimeout:(f,ms)=>{timers.set(++serial,{f,ms});return serial;},fetch:async(url,options={})=>{
    calls.push({url,options});
    if(url.startsWith('analytics-config'))return {ok:true,json:async()=>({apiBase:'https://stats.example.org',enabled})};
    if(url.endsWith('/api/login'))return {ok:true,json:async()=>({token:'a'.repeat(64),expires:Date.now()+1800000})};
    if(url.includes('/api/dashboard'))return {ok:true,json:async()=>({rows:[{day:'2026-10-15',kind:'page',target:'tema/norma',language:'es',outcome:'',total:3}],expires:Date.now()+1800000})};
    return {ok:true,json:async()=>({ok:true})};
  }};
  vm.createContext(context);vm.runInContext(code,context);
  return {api:context.window.BCLTeacher,view,doc,storage,calls,timers,flush(){for(const [id,t]of timers)if(t.ms===1000){timers.delete(id);t.f();}},node:id=>doc.getElementById(id)};
}
test('no collection before consent; consented queries never send free text; withdrawal stops events',async()=>{
  const b=browser();await b.api.onPage({content,language:'es',route:'inicio'});
  assert(!b.calls.some(c=>c.url.includes('/api/events')));
  b.node('analytics-accept').onclick();assert(b.calls.some(c=>c.url.includes('/api/events')));
  b.api.search('Student email@example.org',false);b.flush();
  const event=b.calls.filter(c=>c.url.includes('/api/events')).at(-1);assert.equal(JSON.parse(event.options.body).target,'(other)');assert(!event.options.body.includes('email'));
  b.api.search('subjuntivo',true);b.flush();assert.equal(JSON.parse(b.calls.at(-1).options.body).target,'subjuntivo');
  b.storage.set('bcl-analytics-consent-v1','no');const count=b.calls.length;b.api.search('variacion',true);b.flush();assert.equal(b.calls.length,count);
});
test('inactive service shows explicit setup state; teacher route is excluded',async()=>{
  const inactive=browser(false);await inactive.api.onPage({content,language:'es',route:'profesor'});assert(inactive.view.innerHTML.includes(content.ui.teacherNotActive.es));
  const b=browser();b.storage.set('bcl-analytics-consent-v1','yes');await b.api.onPage({content,language:'nl',route:'profesor'});assert(b.view.innerHTML.includes('type="password"'));assert(!b.calls.some(c=>c.url.includes('/api/events')));
});
test('login clears password, uses memory-only token, renders live response and clears data on logout',async()=>{
  const b=browser();await b.api.onPage({content,language:'es',route:'profesor'});
  b.node('teacher-user').value='docent';b.node('teacher-password').value='private-password';await b.node('teacher-login').onsubmit({preventDefault(){}});
  assert.equal(b.node('teacher-password').value,'');assert(b.view.innerHTML.includes(content.ui.teacherPageviews.es));assert(b.view.innerHTML.includes('Norma, uso'));
  assert(!JSON.stringify([...b.storage]).includes('private-password'));assert(!JSON.stringify([...b.storage]).includes('aaaaaa'));
  assert(b.calls.some(c=>c.options.headers?.Authorization==='Bearer '+'a'.repeat(64)));
  await b.node('teacher-logout').onclick();assert(b.view.innerHTML.includes('type="password"'));
});
