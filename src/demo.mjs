export function demo(count=10,now=new Date().toISOString()){
  const f=value=>({value,quality:'observed',observedAt:now,source:'synthetic'});
  const profile=[.48,.66,.81,.98,1.12,1.31,.75,1.55,.9,1.22,.57,1.42],n=Math.max(1,Math.min(profile.length,Math.floor(count)||10));
  return {schema:'ogmk.capture/1',account:{universe:'synthetic',player:'demo'},observedAt:now,bodies:Array.from({length:n},(_,i)=>{
    const scale=profile[i],round=value=>Math.round(value/10)*10;
    return {id:'planet-'+String(i+1).padStart(2,'0'),name:'Planeta simulado '+String(i+1).padStart(2,'0'),kind:'planet',stock:{metal:f(round(85000+scale*42000)),crystal:f(round(46000+scale*29000)),deuterium:f(round(18000+scale*11500))},production:{metal:f(round(760*scale+110)),crystal:f(round(430*scale+65)),deuterium:f(round(165*scale+25))},temperature:f(22-i*4),energy:f(round(300+scale*410)),settings:Object.fromEntries(['metalPercent','crystalPercent','deuteriumPercent','solarPercent','fusionPercent','crawlerPercent'].map(key=>[key,f(key==='crawlerPercent'?30:100)])),bonuses:{metal:f(1.2),crystal:f(1.2),deuterium:f(1.2)},levels:{1:f(18+i%8),2:f(16+i%7),3:f(13+i%6)},lifeformBuildings:{11101:f(8+i%7)},lifeformResearch:{11201:f(2+i%5)}};
  })};
}
export function demoPlan(snapshot){return {account:snapshot.account,goals:snapshot.bodies.filter(body=>body.kind==='planet').map((body,index)=>({id:'upgrade-'+index,bodyId:body.id,cost:{metal:50000,crystal:25000,deuterium:5000},gain:{metal:150,crystal:90,deuterium:25},durationHours:6+index})),horizonHours:720,intervalHours:6,parallel:true,weights:[1,1.5,3]};}
