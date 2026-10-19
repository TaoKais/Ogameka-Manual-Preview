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

test('standalone manual preview pairs locally and calculates the synthetic scenario',async t=>{
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

test('manual preview rejects cross-origin writes and does not enable capture bridge',async t=>{
  const app=await setup(t),cookie=await pair(app),sample=demo();
  const cross=await fetch(app.url+'/api/demo',{method:'POST',headers:{Origin:'https://foreign.invalid',Cookie:cookie,'Content-Type':'application/json','X-OGMK-Intent':'user'},body:'{}'});
  assert.equal(cross.status,403);
  const hidden={...sample,sessionToken:'must reject'};
  assert.equal((await post(app,'/api/capture',cookie,hidden)).status,400);
  assert.deepEqual(app.store.read().accounts,{});
});
