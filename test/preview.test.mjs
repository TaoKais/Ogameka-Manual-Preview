import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../src/server.mjs';
import {demo,demoPlan} from '../src/demo.mjs';

async function setup(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ogmk-preview-test-'));
  const app=await createApp({dir});
  t.after(async()=>{await app.close();await fs.rm(dir,{recursive:true,force:true});});
  return app;
}
async function pair(app){
  const response=await fetch(app.url+'/api/pair',{method:'POST',headers:{Origin:app.url,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:JSON.stringify({code:app.pairCode})});
  assert.equal(response.status,200);
  return response.headers.get('set-cookie').split(';')[0];
}
const post=(app,url,cookie,data)=>fetch(app.url+url,{method:'POST',headers:{Origin:app.url,Cookie:cookie,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:JSON.stringify(data)});

test('the synthetic demo provides ten varied planets for the multi-planet charts',()=>{
  const sample=demo(),metals=sample.bodies.map(body=>body.production.metal.value);
  assert.equal(sample.bodies.length,10);
  assert.ok(sample.bodies.every((body,index)=>body.name===`Planeta simulado ${String(index+1).padStart(2,'0')}`));
  assert.ok(new Set(metals).size>1);
});

test('the local server serves the TANSEI navigation layer used by the real dashboard',async t=>{
  const app=await setup(t),html=await (await fetch(app.url)).text();
  assert.match(html,/href="\/tansei\.css"/);
  assert.match(html,/class="tansei-sidebar"/);
  assert.match(html,/data-page="economy"/);
  const style=await fetch(app.url+'/tansei.css');
  assert.equal(style.status,200);
  assert.match(style.headers.get('content-type'),/text\/css/);
  assert.match(await style.text(),/\.tansei-sidebar/);
});

test('OGAMEKA planner pairs locally and calculates the synthetic scenario',async t=>{
  const app=await setup(t),page=await fetch(app.url),html=await page.text();
  assert.equal(page.status,200);
  assert.match(html,/https:\/\/ko-fi\.com\/yahvveh/);
  assert.match(html,/no-?referrer|noopener noreferrer/i);
  const cookie=await pair(app);
  assert.equal((await post(app,'/api/demo',cookie,{})).status,200);
  const data=await(await fetch(app.url+'/api/state',{headers:{Cookie:cookie}})).json();
  assert.equal(data.accounts['synthetic/demo'].latest.account.player,'demo');
  assert.doesNotMatch(JSON.stringify(data),/sessionToken|accessToken|bridgeToken/);
  const result=await(await post(app,'/api/analyze',cookie,demoPlan(demo()))).json();
  assert.equal(result.status,'estimated');
  assert.equal((await fetch(app.url+'/health')).status,200);
});

test('local pairing rejects cross-origin writes and keeps the extension write-only',async t=>{
  const app=await setup(t),cookie=await pair(app),sample=demo();
  const cross=await fetch(app.url+'/api/demo',{method:'POST',headers:{Origin:'https://foreign.invalid',Cookie:cookie,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:'{}'});
  assert.equal(cross.status,403);
  const hidden={...sample,sessionToken:'must reject'};
  assert.equal((await post(app,'/api/capture',cookie,hidden)).status,404);
  const panelCode=await post(app,'/api/extension/pair-code',cookie,{}),{code}=await panelCode.json();
  assert.equal(panelCode.status,200);assert.match(code,/^\d{8}$/);
  const extensionOrigin='chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const preflight=await fetch(app.url+'/api/extension/capture',{method:'OPTIONS',headers:{Origin:extensionOrigin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type,x-ogmk-intent'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),extensionOrigin);
  const webOrigin=await fetch(app.url+'/api/extension/pair',{method:'POST',headers:{Origin:'https://foreign.invalid','Content-Type':'application/json','X-OGMK-Intent':'user'},body:JSON.stringify({code})});assert.equal(webOrigin.status,403);
  const pairing=await fetch(app.url+'/api/extension/pair',{method:'POST',headers:{Origin:extensionOrigin,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:JSON.stringify({code})});
  assert.equal(pairing.status,200);const {token}=await pairing.json();assert.match(token,/^[a-f0-9]{64}$/);
  const upload=await fetch(app.url+'/api/extension/capture',{method:'POST',headers:{Origin:extensionOrigin,Authorization:'Bearer '+token,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:JSON.stringify(sample)});
  assert.equal(upload.status,200);assert.ok(app.store.read().accounts['synthetic/demo']);
  const otherExtension=await fetch(app.url+'/api/extension/capture',{method:'POST',headers:{Origin:'chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',Authorization:'Bearer '+token,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:JSON.stringify(sample)});assert.equal(otherExtension.status,401);
  const read=await fetch(app.url+'/api/state',{headers:{Origin:extensionOrigin,Authorization:'Bearer '+token}});assert.equal(read.status,403);
  const revoked=await fetch(app.url+'/api/extension/pair',{method:'DELETE',headers:{Origin:extensionOrigin,Authorization:'Bearer '+token,'X-OGMK-Intent':'user'}});assert.equal(revoked.status,200);
  const afterRevoke=await fetch(app.url+'/api/extension/capture',{method:'POST',headers:{Origin:extensionOrigin,Authorization:'Bearer '+token,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:JSON.stringify(sample)});assert.equal(afterRevoke.status,401);assert.equal(afterRevoke.headers.get('access-control-allow-origin'),extensionOrigin);
  assert.deepEqual(Object.keys(app.store.read().accounts),['synthetic/demo']);
});
