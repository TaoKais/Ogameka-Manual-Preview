import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomInt,createHash} from 'node:crypto';
import {Store} from './store.mjs';
import {Pool} from './pool.mjs';
import {InputError,LIMITS,accountKey,capture,plan,object} from './contract.mjs';
import {demo,demoPlan} from './demo.mjs';
import {supportExport} from './privacy.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex'),token=()=>randomBytes(32).toString('hex'),publicDir=fileURLToPath(new URL('../public/',import.meta.url));
async function jsonBody(req,max=LIMITS.inputBytes){
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new InputError('JSON required',415);
  return new Promise((resolve,reject)=>{let length=0,parts=[],exceeded=false;req.on('data',part=>{length+=part.length;if(length>max){exceeded=true;parts=[];reject(new InputError('Input size limit',413));}else if(!exceeded)parts.push(part);});req.on('end',()=>{if(exceeded)return;try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')));}catch{reject(new InputError('Malformed JSON'));}});req.on('error',reject);req.on('aborted',()=>reject(new InputError('Request aborted')));});
}
export async function createApp({dir,port=0,workerTimeout=LIMITS.workerMs,bridge=null,host='127.0.0.1',trustedPeer=null,onPaired=async()=>{}}={}){
  if(host!=='127.0.0.1'&&!(host==='0.0.0.0'&&trustedPeer==='10.87.16.1'))throw Error('Unsupported network boundary');
  const store=await Store.open(dir),pool=new Pool({timeout:workerTimeout});
  const sessions=new Map();let pairCode=String(randomInt(10000000,100000000)),pairUntil=Date.now()+300000,pairAttempts=0,closed=false,dataEpoch=0;
  const cleanTokens=()=>{for(const [key,v] of sessions)if(v.expires<Date.now())sessions.delete(key);};
  const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers});res.end(JSON.stringify(data));};
  const server=http.createServer({maxHeaderSize:8192},async(req,res)=>{
    try{
      const requestEpoch=dataEpoch,readBody=async(request,max)=>{const data=await jsonBody(request,max);if(requestEpoch!==dataEpoch)throw new InputError('Request invalidated by data deletion',409);return data;};
      const authority='127.0.0.1:'+server.address().port,origin='http://'+authority;
      if(req.headers.host!==authority)return send(res,403,{error:'Host rejected'});
      if(!['127.0.0.1','::ffff:127.0.0.1',...(trustedPeer?[trustedPeer]:[])].includes(req.socket.remoteAddress))return send(res,403,{error:'Network peer rejected'});
      if(req.url.length>1024||req.url.includes('?')||req.url.includes('#'))return send(res,400,{error:'Queries are not accepted; credentials never belong in URLs'});
      cleanTokens();const from=req.headers.origin;
      const extensionAllowed=bridge?.allowed(from);
      if(from&&from!==origin&&!extensionAllowed)return send(res,403,{error:'Origin rejected'});
      if(req.method==='OPTIONS'){
        if(!bridge)throw new InputError('Preflight rejected',403);bridge.preflight(req,res);return;
      }
      if(req.method==='GET'&&req.url==='/health')return send(res,200,{ok:true,version:'0.2.0'});
      const statics={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
      if(req.method==='GET'&&statics[req.url]){const [name,type]=statics[req.url];res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(await fs.readFile(path.join(publicDir,name)));return;}
      if(req.method!=='GET'&&req.headers['x-ogmk-intent']!=='user')throw new InputError('Explicit client intent required',403);
      if(req.method==='POST'&&req.url==='/api/pair'){
        if(from!==origin)throw new InputError('Pairing requires the local panel origin',403);
        if(++pairAttempts>5||Date.now()>pairUntil||!pairCode)throw new InputError('Pairing expired or exhausted; restart this isolated instance',429);
        const data=await readBody(req,1024);object(data,['code'],'pairing');if(data.code!==pairCode)throw new InputError('Pairing code rejected',403);
        const secret=token();sessions.set(sha(secret),{expires:Date.now()+3600000});pairCode=null;await onPaired().catch(()=>{});return send(res,200,{paired:true},{'Set-Cookie':'ogmk_session='+secret+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600'});
      }
      if(bridge&&await bridge.exchange(req,res,{send,jsonBody:readBody}))return;
      const cookie=/\bogmk_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1],admin=cookie&&sessions.has(sha(cookie)),role=bridge?.identify(req);
      if(req.method==='POST'&&req.url==='/api/capture'){
        if(!admin&&!role)throw new InputError('Authentication required',401);const incoming=capture(await readBody(req));
        if(role)bridge.check(role,incoming,from);
        const etag=req.headers['if-match'];if(etag!==undefined&&!/^\d+$/.test(etag))throw new InputError('Invalid revision');
        const result=await store.ingest(incoming,etag===undefined?undefined:Number(etag));return send(res,200,result,bridge?.headers(req)||{});
      }
      if(!admin)throw new InputError('Authentication required',401);
      if(from&&from!==origin)throw new InputError('Panel origin required',403);
      if(req.method==='GET'&&req.url==='/api/state')return send(res,200,store.view());
      if(req.method==='POST'&&req.url==='/api/demo'){await readBody(req,1024);const snapshot=demo();await store.ingest(snapshot);return send(res,200,{account:snapshot.account,plan:demoPlan(snapshot)});}
      if(req.method==='POST'&&req.url==='/api/analyze'){
        const request=plan(await readBody(req)),snapshot=store.latest(accountKey(request.account));if(!snapshot)throw new InputError('Unknown account',404);const result=await pool.run(snapshot,request);if(requestEpoch!==dataEpoch)throw new InputError('Result invalidated by data deletion',409);return send(res,200,result);
      }
      if(req.method==='POST'&&req.url==='/api/retention')return send(res,200,await store.retention(await readBody(req,1024)));
      if(req.method==='GET'&&req.url==='/api/support')return send(res,200,supportExport(store.read()));
      if(bridge&&await bridge.admin(req,res,{send,jsonBody:readBody}))return;
      if(req.method==='DELETE'&&req.url==='/api/data'){
        const data=await readBody(req,1024);object(data,['scope','confirm'],'deletion');if(data.scope!=='independent-store-only'||data.confirm!=='BORRAR OGAMEKA INDEPENDIENTE')throw new InputError('Deletion scope confirmation required');
        dataEpoch++;bridge?.revoke();sessions.clear();const result=await store.wipe();return send(res,200,result,{'Set-Cookie':'ogmk_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
      }
      send(res,404,{error:'Unknown endpoint'});
    }catch(error){if(!res.headersSent)send(res,error.status||500,{error:error.status?error.message:'Local operation failed; no private payload is logged'});else res.destroy();}
  });
  server.requestTimeout=10000;server.headersTimeout=5000;server.keepAliveTimeout=1000;server.maxConnections=8;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  const pruning=setInterval(()=>store.enqueue(async()=>{store.prune();await store.persist();}).catch(()=>{}),3600000);pruning.unref();
  return {server,store,pool,get pairCode(){return pairCode;},url:'http://127.0.0.1:'+server.address().port,async close(){if(closed)return;closed=true;clearInterval(pruning);await pool.close();await new Promise(resolve=>{server.close(resolve);server.closeIdleConnections();});await store.close();}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const dir=process.env.OGMK_DATA_DIR||path.join(process.cwd(),'.data-independent'),port=Number(process.env.OGMK_PORT||3176);
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid isolated port');
  const codeFile=path.join(dir,'pair-code.txt'),removeCode=()=>fs.unlink(codeFile).catch(()=>{}),app=await createApp({dir,port,onPaired:removeCode});await fs.writeFile(codeFile,app.pairCode,{mode:0o600});setTimeout(removeCode,300000).unref();console.log('OGMK manual preliminary: '+app.url);console.log('Read the one-time code from the private data directory (pair-code.txt). It expires in five minutes.');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await removeCode();await app.close();process.exit(0);});
}
