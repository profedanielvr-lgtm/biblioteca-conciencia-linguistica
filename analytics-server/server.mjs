import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
const derive = promisify(scrypt);
const normalize = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const digest = s => createHash('sha256').update(s).digest('hex');
const DAY = 86400000, SESSION = 30 * 60 * 1000;
const accountPattern = /^[a-zA-Z0-9._@-]{2,80}$/;
const hashPattern = /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/;
export function createAnalyticsServer(options) {
  const { accounts, origins, content, database = ':memory:', now = () => Date.now(), trustProxy = false } = options;
  if (!accounts || !Object.keys(accounts).length || Object.entries(accounts).some(([name, hash]) => !accountPattern.test(name) || !hashPattern.test(hash))) throw new Error('Configure TEACHER_ACCOUNTS with individual scrypt hashes.');
  const allowed = new Set(origins);
  if (!allowed.size || [...allowed].some(x => new URL(x).origin !== x || (!x.startsWith('https://') && !x.startsWith('http://localhost') && !x.startsWith('http://127.0.0.1')))) throw new Error('Use explicit HTTPS origins.');
  if (database !== ':memory:') mkdirSync(dirname(database), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS counts (
    day TEXT NOT NULL, kind TEXT NOT NULL, target TEXT NOT NULL, language TEXT NOT NULL,
    outcome TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(day,kind,target,language,outcome));`);
  const topics = content.topics.filter(t => t.status === 'published');
  const refs = content.references.filter(r => r.status === 'verified');
  const samples = (content.samples || []).filter(s => s.status === 'published');
  const terms = new Set(topics.flatMap(t => t.terms).map(normalize).filter(x => x.length <= 100));
  for (const p of content.popularTopics || []) for (const q of Object.values(p.query || {})) terms.add(normalize(q));
  const pages = new Set(['inicio','bok','indice','muestras','comparar','fuentes','estudio','corpus','cuaderno','dossier',...topics.map(t => 'tema/' + t.slug),...refs.map(r => 'lectura/' + r.id),...samples.map(s => 'muestra/' + s.id)]);
  const resources = new Set(refs.map(r => r.id));
  const sections = new Set(topics.flatMap(t => ['overview','theory','examples','samples','case','reasoning','critical','teacher','classroom','comparison','enquiry','progress','related','deepen','strategic','synthesis'].map(s => t.slug + '/' + s)));
  const sessions = new Map(), throttles = new Map();
  const dummy = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128);
  let cleanedDay = '';
  function cleanup() {
    const today = new Date(now()).toISOString().slice(0,10);
    if (cleanedDay !== today) {
      db.prepare('DELETE FROM counts WHERE day < ?').run(new Date(now() - 89 * DAY).toISOString().slice(0,10)); cleanedDay = today;
    }
    for (const [k,v] of sessions) if (v.expires <= now()) sessions.delete(k);
    for (const [k,v] of throttles) if (v.until <= now()) throttles.delete(k);
  }
  function rate(key, max, windowMs) {
    const row = throttles.get(key) || { count:0, until:now()+windowMs };
    row.count++; throttles.set(key,row); return row.count <= max;
  }
  function send(res, status, value) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(value)); }
  async function body(req) {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new Error('body');
    let text = ''; for await (const chunk of req) { text += chunk; if (text.length > 4096) throw new Error('body'); }
    return JSON.parse(text);
  }
  function authenticated(req) {
    const token = req.headers.authorization;
    if (!/^Bearer [a-f0-9]{64}$/.test(token || '')) return null;
    return sessions.get(digest(token.slice(7))) || null;
  }
  const server = http.createServer(async (req,res) => {
    res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
    try {
      cleanup(); const url = new URL(req.url, 'http://local');
      const origin = req.headers.origin;
      if (origin && !allowed.has(origin)) return send(res,403,{error:'origin'});
      if (origin) { res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin'); }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
        return res.writeHead(204).end();
      }
      if (req.method === 'GET' && url.pathname === '/api/status') return send(res,200,{ready:true,retentionDays:90});
      const address = trustProxy ? String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim() : req.socket.remoteAddress;
      const network = digest(address || 'unknown'); // Temporary abuse limit, never written to analytics or logs.
      if (req.method === 'POST' && url.pathname === '/api/login') {
        if (!origin) return send(res,403,{error:'origin'});
        if (!rate('login:' + network,10,15*60000) || !rate('login:all',100,15*60000)) return send(res,429,{error:'rate'});
        const data = await body(req);
        if (typeof data.username !== 'string' || typeof data.password !== 'string' || data.password.length > 200) return send(res,401,{error:'credentials'});
        const [_,salt,expected] = (Object.hasOwn(accounts,data.username) ? accounts[data.username] : dummy).split('$');
        const actual = await derive(data.password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
        if (!timingSafeEqual(actual,Buffer.from(expected,'hex')) || !Object.hasOwn(accounts,data.username)) return send(res,401,{error:'credentials'});
        const token = randomBytes(32).toString('hex'), expires = now()+SESSION;
        sessions.set(digest(token),{username:data.username,expires});
        return send(res,200,{token,expires,username:data.username});
      }
      if (req.method === 'POST' && url.pathname === '/api/logout') {
        if (authenticated(req)) sessions.delete(digest(req.headers.authorization.slice(7)));
        return send(res,200,{ok:true});
      }
      if (req.method === 'POST' && url.pathname === '/api/events') {
        if (!origin) return send(res,403,{error:'origin'});
        if (!rate('event:' + network,300,60000)) return send(res,429,{error:'rate'});
        const data = await body(req);
        if (data.consent !== true || !['es','nl'].includes(data.language) || Object.keys(data).some(k => !['consent','language','kind','target','outcome'].includes(k))) return send(res,400,{error:'event'});
        const {kind,target,language} = data;
        const outcome = kind === 'search' ? data.outcome : '';
        if (typeof target !== 'string' || target.length > 180 || !(
          (kind === 'page' && pages.has(target)) || (kind === 'resource' && resources.has(target)) ||
          (kind === 'section' && sections.has(target)) || (kind === 'search' && (terms.has(target) || target === '(other)') && ['results','empty'].includes(outcome))
        )) return send(res,400,{error:'event'});
        const day = new Date(now()).toISOString().slice(0,10);
        db.prepare('INSERT INTO counts(day,kind,target,language,outcome,total) VALUES(?,?,?,?,?,1) ON CONFLICT(day,kind,target,language,outcome) DO UPDATE SET total=total+1').run(day,kind,target,language,outcome);
        return send(res,202,{ok:true});
      }
      if (req.method === 'GET' && url.pathname === '/api/dashboard') {
        const session = authenticated(req); if (!session) return send(res,401,{error:'session'});
        const days = Number(url.searchParams.get('days') || 30); if (![7,30,90].includes(days)) return send(res,400,{error:'range'});
        const since = new Date(now()-(days-1)*DAY).toISOString().slice(0,10);
        const rows = db.prepare('SELECT day,kind,target,language,outcome,total FROM counts WHERE day >= ? ORDER BY day,kind,total DESC').all(since);
        return send(res,200,{rows,since,until:new Date(now()).toISOString().slice(0,10),days,retentionDays:90,username:session.username,expires:session.expires});
      }
      send(res,404,{error:'not_found'});
    } catch { if (!res.headersSent) send(res,400,{error:'request'}); else res.end(); }
  });
  server.requestTimeout=10000; server.headersTimeout=10000;
  server.on('close',()=>db.close());
  return server;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const base = dirname(fileURLToPath(import.meta.url));
  const server = createAnalyticsServer({
    accounts:JSON.parse(process.env.TEACHER_ACCOUNTS || '{}'),
    origins:(process.env.ALLOWED_ORIGINS || 'https://profedanielvr-lgtm.github.io').split(',').map(s=>s.trim()),
    content:JSON.parse(readFileSync(resolve(base,'../library-v2.json'),'utf8')),
    database:process.env.ANALYTICS_DB || resolve(base,'data/analytics.sqlite'),
    trustProxy:process.env.TRUST_PROXY === 'true'
  });
  server.listen(Number(process.env.PORT || 8787),'0.0.0.0',()=>console.log('Analytics service ready.'));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close());
}
