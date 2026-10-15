import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAnalyticsServer } from './server.mjs';
import { hashPassword } from './password.mjs';
const content = JSON.parse(readFileSync(new URL('../library-v2.json',import.meta.url),'utf8'));
const origin='https://profedanielvr-lgtm.github.io';
const password='Only-for-automated-tests-!2026';
const accounts={docent:await hashPassword(password)};
async function fixture(extra={}) {
  const server=createAnalyticsServer({accounts,origins:[origin],content,...extra});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  return { server, close:()=>new Promise(resolve=>server.close(resolve)),
    call:async(path,{method='GET',body,token,requestOrigin=origin}={})=>{
      const r=await fetch(url+'/api/'+path,{method,headers:{...(requestOrigin?{Origin:requestOrigin}:{}),'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
      return {status:r.status,headers:r.headers,data:r.status===204?null:await r.json()};
    }};
}
test('password verification, protected dashboard, logout and absolute session expiry',async()=>{
  let clock=Date.parse('2026-10-15T10:00:00Z');const f=await fixture({now:()=>clock});
  try {
    assert.equal((await f.call('dashboard')).status,401);
    assert.equal((await f.call('login',{method:'POST',body:{username:'docent',password:'wrong'}})).status,401);
    const login=await f.call('login',{method:'POST',body:{username:'docent',password}});assert.equal(login.status,200);
    assert.equal((await f.call('dashboard',{token:login.data.token})).status,200);
    await f.call('logout',{method:'POST',token:login.data.token});assert.equal((await f.call('dashboard',{token:login.data.token})).status,401);
    const second=await f.call('login',{method:'POST',body:{username:'docent',password}});clock+=1800001;
    assert.equal((await f.call('dashboard',{token:second.data.token})).status,401);
  } finally {await f.close();}
});
test('counts only allowlisted, consented events, preserves languages, rejects personal text and injection',async()=>{
  const f=await fixture();try {
    const base={consent:true,language:'nl',kind:'search',target:'subjuntivo',outcome:'empty'};
    assert.equal((await f.call('events',{method:'POST',body:base})).status,202);
    for(const bad of [{...base,consent:false},{...base,target:'Student Jane needs help'},{...base,query:'email@example.com'},{...base,target:"'; DROP TABLE counts;--"},{...base,outcome:'fake'},{...base,language:'en'}]) assert.equal((await f.call('events',{method:'POST',body:bad})).status,400);
    assert.equal((await f.call('events',{method:'POST',body:{consent:true,kind:'page',target:'tema/norma',language:'es'}})).status,202);
    assert.equal((await f.call('events',{method:'POST',body:{consent:true,kind:'page',target:'profesor',language:'es'}})).status,400);
    const login=await f.call('login',{method:'POST',body:{username:'docent',password}});
    const result=await f.call('dashboard',{token:login.data.token});assert.equal(result.data.rows.length,2);
    assert.equal(result.data.rows.find(r=>r.kind==='search').language,'nl');assert.equal(result.data.rows.find(r=>r.kind==='search').total,1);
    assert(!JSON.stringify(result.data).includes('Jane'));assert(!JSON.stringify(result.data).includes('email@example.com'));
    assert.equal((await f.call('dashboard?days=900',{token:login.data.token})).status,400);
  } finally {await f.close();}
});
test('CORS, origin validation and login throttling',async()=>{
  const f=await fixture();try {
    assert.equal((await f.call('events',{method:'POST',requestOrigin:'https://evil.invalid',body:{}})).status,403);
    assert.equal((await f.call('events',{method:'POST',requestOrigin:null,body:{}})).status,403);
    const cors=await f.call('dashboard',{method:'OPTIONS'});assert.equal(cors.status,204);assert.equal(cors.headers.get('access-control-allow-origin'),origin);
    for(let i=0;i<10;i++)assert.equal((await f.call('login',{method:'POST',body:{username:'absent',password:'x'}})).status,401);
    assert.equal((await f.call('login',{method:'POST',body:{username:'docent',password}})).status,429);
  } finally {await f.close();}
});
test('SQLite survives restart, rolls up counts, removes data after 90 days',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'bcl-analytics-'));let clock=Date.parse('2026-06-01T12:00:00Z');
  const config={database:join(dir,'data.sqlite'),now:()=>clock};let f=await fixture(config);
  try {
    for(let i=0;i<2;i++)await f.call('events',{method:'POST',body:{consent:true,language:'es',kind:'page',target:'inicio'}});
    await f.close();f=await fixture(config);
    let login=await f.call('login',{method:'POST',body:{username:'docent',password}});
    assert.equal((await f.call('dashboard',{token:login.data.token})).data.rows[0].total,2);
    clock+=91*86400000;login=await f.call('login',{method:'POST',body:{username:'docent',password}});
    assert.equal((await f.call('dashboard?days=90',{token:login.data.token})).data.rows.length,0);
  } finally {await f.close();rmSync(dir,{recursive:true,force:true});}
});
test('never starts with plaintext, missing accounts, wildcard or insecure origin',()=>{
  assert.throws(()=>createAnalyticsServer({accounts:{},origins:[origin],content}));
  assert.throws(()=>createAnalyticsServer({accounts:{docent:password},origins:[origin],content}));
  assert.throws(()=>createAnalyticsServer({accounts,origins:['*'],content}));
  assert.throws(()=>createAnalyticsServer({accounts,origins:['http://example.org'],content}));
});
