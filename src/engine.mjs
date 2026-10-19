import {resources,blockers,plan,capture,InputError} from './contract.mjs';
// Generic economic event ledger. Gains, durations and prices are user-supplied assumptions.
// No inherited game parser, catalogue, formula implementation or optimizer is imported.
export function analyze(rawSnapshot,rawPlan,now=Date.now()){
  const snapshot=capture(rawSnapshot,now),request=plan(rawPlan),issues=blockers(snapshot,now);
  if(request.account.universe!==snapshot.account.universe||request.account.player!==snapshot.account.player)throw new InputError('Account mismatch');
  if(issues.length)return {status:'blocked',issues,quality:'conditional',samples:[]};
  const planets=snapshot.bodies.filter(b=>b.kind==='planet');if(!planets.length)throw new InputError('No economic planets');
  if(request.goals.some(g=>!planets.some(b=>b.id===g.bodyId)))throw new InputError('Unknown economic body');
  for(const goal of request.goals){const price=planets.find(b=>b.id===goal.bodyId).prices?.[goal.technologyId];goal.priceSource='manual-assumption';if(price&&price.level===goal.targetLevel&&resources.every(r=>price[r].quality==='observed'&&now-Date.parse(price[r].observedAt)<=86400000)){goal.cost=Object.fromEntries(resources.map(r=>[r,price[r].value]));goal.priceSource='observed';if(price.durationHours?.quality==='observed'&&price.durationHours.value>0&&now-Date.parse(price.durationHours.observedAt)<=86400000)goal.durationHours=price.durationHours.value;}}
  const vector=obj=>resources.map(r=>obj[r]),add=(a,b,n=1)=>a.map((x,i)=>x+b[i]*n),value=a=>a.reduce((n,x,i)=>n+x*request.weights[i],0);
  const stock=resources.map(r=>planets.reduce((n,b)=>n+b.stock[r].value,0)),baseline=resources.map(r=>planets.reduce((n,b)=>n+b.production[r].value,0));
  let balances=[...stock],rate=[...baseline],time=0,totalCost=[0,0,0],active=[],pending=[...request.goals],finished=[],events=[],segments=[{time:0,balances:[...stock],rate:[...baseline]}],guard=0;
  function advance(t){balances=add(balances,rate,t-time);time=t;}
  while((pending.length||active.length)&&time<=request.horizonHours){
    if(++guard>1000)throw new InputError('Event limit');
    const due=active.filter(g=>g.end<=time+1e-8);for(const job of due){rate=add(rate,vector(job.gain));finished.push(job.id);events.push({kind:'finish',id:job.id,bodyId:job.bodyId,time});}active=active.filter(g=>g.end>time+1e-8);
    let started=false;const firstByBody=new Set();
    for(const goal of [...pending]){
      if(firstByBody.has(goal.bodyId))continue;firstByBody.add(goal.bodyId);
      if(active.some(g=>g.bodyId===goal.bodyId)||!request.parallel&&active.length)continue;
      const cost=vector(goal.cost);if(cost.some((c,i)=>balances[i]+1e-7<c))continue;
      balances=add(balances,cost,-1);totalCost=add(totalCost,cost);active.push({...goal,end:time+goal.durationHours});pending.splice(pending.indexOf(goal),1);events.push({kind:'start',id:goal.id,bodyId:goal.bodyId,time,priceSource:goal.priceSource});started=true;
    }
    segments.push({time,balances:[...balances],rate:[...rate]});
    if(!pending.length&&!active.length)break;
    let next=Math.min(...active.map(g=>g.end));firstByBody.clear();
    for(const goal of pending){if(firstByBody.has(goal.bodyId))continue;firstByBody.add(goal.bodyId);if(active.some(g=>g.bodyId===goal.bodyId)||!request.parallel&&active.length)continue;
      const waits=vector(goal.cost).map((c,i)=>c<=balances[i]+1e-7?0:rate[i]>0?(c-balances[i])/rate[i]:Infinity),wait=Math.max(...waits);if(wait>1e-8)next=Math.min(next,time+wait);
    }
    if(!Number.isFinite(next)||next>request.horizonHours){advance(request.horizonHours);break;}
    if(next<=time+1e-8&&!started)throw new InputError('No economic progress');advance(next);
  }
  const sampleAt=t=>{let s=segments[0];for(const candidate of segments){if(candidate.time>t+1e-9)break;s=candidate;}const simulated=add(s.balances,s.rate,t-s.time),base=add(stock,baseline,t);return {hour:t,planned:simulated,baseline:base,advantage:value(add(simulated,base,-1))};};
  const samples=[];for(let t=0;t<request.horizonHours;t+=request.intervalHours)samples.push(sampleAt(t));samples.push(sampleAt(request.horizonHours));
  let breakEvenHours=null;
  for(let i=0;i<segments.length;i++){const s=segments[i],end=segments[i+1]?.time??request.horizonHours;if(!events.some(e=>e.kind==='start'&&e.time<=s.time))continue;const start=sampleAt(s.time).advantage,slope=value(add(s.rate,baseline,-1));if(start>=0&&s.time>0){breakEvenHours=s.time;break;}if(start<0&&slope>0){const crossing=s.time-start/slope;if(crossing<=end&&crossing<=request.horizonHours){breakEvenHours=crossing;break;}}}
  const gain=value(add(rate,baseline,-1)),complete=finished.length===request.goals.length;
  return {status:'estimated',quality:'conditional',completed:finished.length,completionHours:complete?time:null,events,samples,investment:value(totalCost),roiHours:complete&&gain>0?value(totalCost)/gain:null,breakEvenHours,assumptions:['User-supplied prices, durations and production gains; no verification against the game.','Shared resources; transportation and existing queues excluded.','One local construction per planet; economic goals only.','No claim of global optimum; no actions sent to OGame.']};
}
