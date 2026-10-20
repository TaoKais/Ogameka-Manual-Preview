import {createHash} from 'node:crypto';
export const LIMITS=Object.freeze({inputBytes:262144,bodies:32,items:192,accounts:8,history:120,days:30,goals:60,samples:4096,jobs:8,workerMs:1500});
export const resources=['metal','crystal','deuterium'];
const qualities=['observed','estimated','provisional','missing'];
export class InputError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const fail=message=>{throw new InputError(message);};
export function object(value,keys,label){if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail(label+': expected object');for(const key of Object.keys(value))if(!keys.includes(key))fail(label+': unexpected field');return value;}
export function id(value){if(typeof value!=='string'||!/^[-a-zA-Z0-9_]{1,64}$/.test(value))fail('Invalid identifier');return value;}
export function number(value,min=0,max=1e15){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail('Number outside range');return value;}
export function date(value,now=Date.now()){if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)||!Number.isFinite(Date.parse(value))||Date.parse(value)>now+300000)fail('Invalid observation date');const iso=new Date(value).toISOString();if(iso!==value&&iso.replace('.000Z','Z')!==value)fail('Invalid calendar date');return iso;}
export function fact(value,now=Date.now()){
  object(value,['value','quality','observedAt','source'],'fact');if(!qualities.includes(value.quality))fail('Unknown quality');const source=value.source??'declared';if(!['declared','manual','visible-dom','synthetic','migration'].includes(source))fail('Unknown observation source');
  if(value.quality==='missing'){if(value.value!==null)fail('Missing fact must be null');}else number(value.value,-1e15);
  return {value:value.value,quality:value.quality,observedAt:date(value.observedAt,now),source};
}
const factMap=(value,keys,now)=>{object(value,keys,'facts');return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,fact(v,now)]));};
const levelMap=(value,now)=>{
  object(value,Object.keys(value||{}).filter(k=>/^\d{1,6}$/.test(k)),'levels');if(Object.keys(value).length>LIMITS.items)fail('Too many levels');
  return Object.fromEntries(Object.entries(value).map(([k,v])=>{const f=fact(v,now);if(f.value!==null&&(!Number.isInteger(f.value)||f.value<0||f.value>10000))fail('Invalid level');return [k,f];}));
};
export function accountKey(account){object(account,['universe','player'],'account');return id(account.universe)+'/'+id(account.player);}
export function capture(value,now=Date.now()){
  object(value,['schema','account','observedAt','bodies','research'],'capture');if(value.schema!=='ogmk.capture/1')fail('Unsupported capture schema');accountKey(value.account);
  if(!Array.isArray(value.bodies)||!value.bodies.length||value.bodies.length>LIMITS.bodies)fail('Body limit');
  const seen=new Set(),bodies=value.bodies.map(b=>{
    object(b,['id','kind','name','stock','production','temperature','energy','settings','bonuses','bonusBreakdown','levels','lifeformBuildings','lifeformResearch','prices'],'body');id(b.id);
    if(seen.has(b.id))fail('Duplicate body');seen.add(b.id);if(!['planet','moon'].includes(b.kind))fail('Invalid body kind');
    const out={id:b.id,kind:b.kind};
    if(b.name!==undefined){if(typeof b.name!=='string'||b.name.length>80||/[\x00-\x1f]/.test(b.name))fail('Invalid name');out.name=b.name;}
    for(const key of ['stock','production','bonuses'])if(b[key]!==undefined){out[key]=factMap(b[key],resources,now);if(key==='stock'&&Object.values(out[key]).some(f=>f.value!==null&&f.value<0))fail('Negative stock');}
    for(const key of ['temperature','energy'])if(b[key]!==undefined)out[key]=fact(b[key],now);
    if(b.settings!==undefined){out.settings=factMap(b.settings,['metalPercent','crystalPercent','deuteriumPercent','solarPercent','fusionPercent','satellitePercent','crawlerPercent'],now);if(Object.values(out.settings).some(f=>f.value!==null&&(f.value<0||f.value>150)))fail('Invalid percentage');}
    if(b.bonusBreakdown!==undefined){if(!Array.isArray(b.bonusBreakdown)||b.bonusBreakdown.length>64)fail('Bonus breakdown limit');out.bonusBreakdown=b.bonusBreakdown.map(row=>{object(row,['technologyId','label','metal','crystal','deuterium','energy'],'bonus row');if(typeof row.technologyId!=='string'||!/^[1-9]\d{2,3}$/.test(row.technologyId))fail('Invalid bonus technology ID');const entry={technologyId:row.technologyId};if(row.label!==undefined){if(typeof row.label!=='string'||row.label.length>100)fail('Invalid bonus label');entry.label=row.label;}for(const key of [...resources,'energy'])if(row[key]!==undefined)entry[key]=fact(row[key],now);if(![...resources,'energy'].some(key=>entry[key]))fail('Empty bonus row');return entry;});}
    for(const key of ['levels','lifeformBuildings','lifeformResearch'])if(b[key]!==undefined)out[key]=levelMap(b[key],now);
    if(b.prices!==undefined){object(b.prices,Object.keys(b.prices||{}).filter(k=>/^\d{1,6}$/.test(k)),'prices');if(Object.keys(b.prices).length>LIMITS.items)fail('Price limit');out.prices={};for(const [id,p] of Object.entries(b.prices)){object(p,['level',...resources,'durationHours'],'price');number(p.level,1,10000);if(!Number.isInteger(p.level))fail('Invalid price level');out.prices[id]={level:p.level};for(const k of [...resources,...(p.durationHours!==undefined?['durationHours']:[])]){const f=fact(p[k],now);if(f.value!==null&&f.value<0)fail('Negative price');out.prices[id][k]=f;}}}
    return out;
  });
  bodies.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const result={schema:value.schema,account:{...value.account},observedAt:date(value.observedAt,now),bodies,...(value.research!==undefined?{research:levelMap(value.research,now)}:{})};if(Buffer.byteLength(JSON.stringify(result))>LIMITS.inputBytes)fail('Capture content size limit');return result;
}
export function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(k=>k!=='observedAt').sort().map(k=>[k,canonical(value[k])]));return value;}
export const digest=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const replaceFact=(old,next)=>!old||next.quality!=='missing'&&next.observedAt>=old.observedAt&&({observed:3,estimated:2,provisional:1,missing:0}[next.quality]>=({observed:3,estimated:2,provisional:1,missing:0}[old.quality]));
export function reconcile(previous,incoming){
  if(!previous)return incoming;if(accountKey(previous.account)!==accountKey(incoming.account))fail('Account mismatch');
  const merged=structuredClone(previous);
  for(const [id,f] of Object.entries(incoming.research||{})){merged.research||={};if(replaceFact(merged.research[id],f))merged.research[id]=f;}
  for(const body of incoming.bodies){let target=merged.bodies.find(b=>b.id===body.id);if(!target){merged.bodies.push(structuredClone(body));continue;}if(target.kind!==body.kind)fail('Body kind changed');
    if(body.name!==undefined&&incoming.observedAt>=previous.observedAt)target.name=body.name;
    for(const key of ['temperature','energy'])if(body[key]&&replaceFact(target[key],body[key]))target[key]=body[key];
    for(const key of ['stock','production','settings','bonuses','levels','lifeformBuildings','lifeformResearch'])for(const [k,f] of Object.entries(body[key]||{})){target[key]||={};if(replaceFact(target[key][k],f))target[key][k]=f;}
    if(body.bonusBreakdown!==undefined)target.bonusBreakdown=structuredClone(body.bonusBreakdown);
    for(const [id,p] of Object.entries(body.prices||{})){target.prices||={};const old=target.prices[id];if(!old||old.level!==p.level&&incoming.observedAt>=previous.observedAt)target.prices[id]=structuredClone(p);else if(old.level===p.level)for(const k of [...resources,'durationHours'])if(p[k]&&replaceFact(old[k],p[k]))old[k]=p[k];}
  }
  if(merged.bodies.length>LIMITS.bodies)fail('Merged body limit');merged.observedAt=[previous.observedAt,incoming.observedAt].sort().at(-1);return capture(merged);
}
export function plan(value){
  object(value,['account','goals','horizonHours','intervalHours','parallel','weights'],'plan');accountKey(value.account);
  if(!Array.isArray(value.goals)||value.goals.length>LIMITS.goals)fail('Goal limit');
  const goals=value.goals.map(g=>{object(g,['id','bodyId','cost','gain','durationHours','technologyId','targetLevel'],'goal');id(g.id);id(g.bodyId);number(g.durationHours,1/3600,8760);for(const k of ['cost','gain']){object(g[k],resources,k);for(const r of resources)number(g[k][r]);}if(g.technologyId!==undefined||g.targetLevel!==undefined){if(typeof g.technologyId!=='string'||!/^\d{1,6}$/.test(g.technologyId))fail('Invalid technology ID');number(g.targetLevel,1,10000);if(!Number.isInteger(g.targetLevel))fail('Invalid target level');}return structuredClone(g);});
  if(new Set(goals.map(g=>g.id)).size!==goals.length)fail('Duplicate goal');number(value.horizonHours,1,8760);number(value.intervalHours,.25,168);
  if(Math.ceil(value.horizonHours/value.intervalHours)+1>LIMITS.samples)fail('Sample limit; choose a coarser interval');
  if(typeof value.parallel!=='boolean')fail('Execution mode required');const weights=value.weights===undefined?[1,1.5,3]:value.weights;if(!Array.isArray(weights)||weights.length!==3)fail('Three weights required');weights.forEach(n=>number(n,.01,100));
  return {account:{...value.account},goals,horizonHours:value.horizonHours,intervalHours:value.intervalHours,parallel:value.parallel,weights:[...weights]};
}
export function blockers(snapshot,now=Date.now(),maxAgeHours=24){
  const issues=[];for(const body of snapshot.bodies.filter(b=>b.kind==='planet')){
    const facts=[...resources.map(r=>['stock.'+r,body.stock?.[r]]),...resources.map(r=>['production.'+r,body.production?.[r]]),['temperature',body.temperature],['energy',body.energy],...['metalPercent','crystalPercent','deuteriumPercent','solarPercent','fusionPercent','crawlerPercent'].map(k=>['settings.'+k,body.settings?.[k]]),...resources.map(r=>['bonuses.'+r,body.bonuses?.[r]])];
    for(const [field,f] of facts)if(!f||f.quality!=='observed'||f.value===null)issues.push({bodyId:body.id,field,reason:'missing-or-unconfirmed'});else if(now-Date.parse(f.observedAt)>maxAgeHours*3600000)issues.push({bodyId:body.id,field,reason:'stale'});
    if(resources.some(r=>(body.production?.[r]?.value??0)<0))issues.push({bodyId:body.id,field:'production',reason:'negative-net-rate-not-modeled'});
    if(body.energy?.value<0)issues.push({bodyId:body.id,field:'energy',reason:'negative-energy-requires-calibration'});
  }return issues;
}
