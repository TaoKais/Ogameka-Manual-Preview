'use strict';
const $=id=>document.getElementById(id),svgNS='http://www.w3.org/2000/svg';
let state={accounts:{}};
const resourceNames={metal:'Metal',crystal:'Cristal',deuterium:'Deuterio'};
const palette=['#79e4c1','#67c9ed','#a78bfa','#f0bd73','#f37e9c','#6c9cff','#b7d67a','#ed9df1','#70d5c2','#e9a968','#89a9e8','#c4a9fa'];
const assumptionLabels={
  'User-supplied prices, durations and production gains; no verification against the game.':'Precios, duraciones y ganancias proceden de la entrada manual; no se verifican contra el juego.',
  'Shared resources; transportation and existing queues excluded.':'Se comparten recursos; se excluyen el transporte y las colas vigentes.',
  'One local construction per planet; economic goals only.':'Se modela una construcción local por planeta y solo objetivos económicos.',
  'No claim of global optimum; no actions sent to OGame.':'Es una estimación acotada; no afirma un óptimo global ni envía acciones a OGame.'
};
const status=(message,error=false)=>{$('status').lastChild.textContent=message;$('status').classList.toggle('status-error',error);};
async function api(url,data,method=data?'POST':'GET'){
  const response=await fetch(url,{method,headers:data?{'Content-Type':'application/json','X-OGMK-Intent':'user'}:{},body:data?JSON.stringify(data):undefined});
  const value=await response.json();if(!response.ok)throw Error(value.error);return value;
}
const selected=()=>state.accounts[$('account').value];
const number=(value,digits=0)=>Number(value).toLocaleString('es-ES',{maximumFractionDigits:digits});
const compact=value=>new Intl.NumberFormat('es-ES',{notation:'compact',maximumFractionDigits:1}).format(value);
function makeSvg(tag,attrs={}){const node=document.createElementNS(svgNS,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));return node;}
function renderBodies(){
  const rows=$('bodies');rows.replaceChildren();
  for(const body of selected()?.latest.bodies||[]){
    const row=document.createElement('tr');
    for(const value of [body.name||body.id,...['metal','crystal','deuterium'].map(key=>body.production?.[key]),body.energy]){
      const cell=document.createElement('td');
      if(typeof value==='string')cell.textContent=value;
      else{cell.textContent=value?.value==null?'Sin dato':number(value.value);cell.title=value?value.quality+' · '+value.observedAt:'ausente';}
      row.append(cell);
    }
    const details=document.createElement('td'),facts=[];
    for(const [key,fact] of Object.entries(body.settings||{}))if(fact?.value!==null&&fact?.value!==undefined)facts.push(key.replace('Percent','')+' '+number(fact.value)+'%');
    for(const bonus of body.bonusBreakdown||[]){const values=['metal','crystal','deuterium','energy'].filter(key=>bonus[key]?.value!==null&&bonus[key]?.value!==undefined).map(key=>key+' '+number(bonus[key].value));if(values.length)facts.push((bonus.label||bonus.technologyId)+': '+values.join(', '));}
    details.textContent=facts.join(' · ')||'Sin ajustes observados';row.append(details);rows.append(row);
  }
}
function renderPie(entries,total){
  const slices=$('pie-slices'),legend=$('pie-legend');slices.replaceChildren();legend.replaceChildren();
  if(!entries.length||total<=0){$('pie-center-value').textContent='—';$('pie-center-label').textContent='SIN DATOS';return;}
  let angle=-Math.PI/2;
  for(const [index,entry]of entries.entries()){
    const sweep=entry.value/total*Math.PI*2,end=angle+sweep-.001;
    const x1=120+91*Math.cos(angle),y1=120+91*Math.sin(angle),x2=120+91*Math.cos(end),y2=120+91*Math.sin(end),ix2=120+65*Math.cos(end),iy2=120+65*Math.sin(end),ix1=120+65*Math.cos(angle),iy1=120+65*Math.sin(angle),large=sweep>Math.PI?1:0;
    const path=makeSvg('path',{d:`M ${x1} ${y1} A 91 91 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A 65 65 0 ${large} 0 ${ix1} ${iy1} Z`,fill:palette[index%palette.length],class:'donut-slice'});
    const title=makeSvg('title');title.textContent=`${entry.name}: ${number(entry.value)} unidades por hora, ${number(entry.value/total*100,1)} por ciento`;path.append(title);slices.append(path);angle+=sweep;
    const item=document.createElement('li'),dot=document.createElement('i'),name=document.createElement('span'),value=document.createElement('span');dot.className='legend-dot';dot.style.backgroundColor=palette[index%palette.length];name.className='legend-name';name.textContent=entry.name;value.className='legend-value';value.textContent=`${number(entry.value/total*100,0)}%`;item.append(dot,name,value);legend.append(item);
  }
  $('pie-center-value').textContent=compact(total);$('pie-center-label').textContent='UNIDADES/H';
}
function renderHistogram(entries,resource){
  const svg=$('planet-histogram');svg.replaceChildren();
  const title=makeSvg('title');title.textContent=`Histograma de ${resourceNames[resource]} por hora entre ${entries.length} planetas`;svg.append(title);
  const width=620,height=270,left=49,right=15,top=20,bottom=43,plotW=width-left-right,plotH=height-top-bottom;
  const defs=makeSvg('defs'),gradient=makeSvg('linearGradient',{id:'histGradient',x1:'0',x2:'0',y1:'0',y2:'1'});gradient.append(makeSvg('stop',{offset:'0%','stop-color':'#8af0cb'}),makeSvg('stop',{offset:'100%','stop-color':'#319c9c'}));defs.append(gradient);svg.append(defs);
  if(!entries.length){const empty=makeSvg('text',{x:width/2,y:height/2,'text-anchor':'middle',class:'hist-label'});empty.textContent='Carga datos planetarios para construir la distribución';svg.append(empty);return;}
  const values=entries.map(entry=>entry.value),min=Math.min(...values),max=Math.max(...values),binCount=Math.min(7,Math.max(4,Math.ceil(Math.sqrt(values.length)))),step=max===min?1:(max-min)/binCount,bins=Array.from({length:binCount},(_,index)=>({min:min+step*index,max:index===binCount-1?max:min+step*(index+1),count:0}));
  for(const value of values){const index=max===min?0:Math.min(binCount-1,Math.floor((value-min)/step));bins[index].count++;}
  const peak=Math.max(1,...bins.map(bin=>bin.count)),ticks=4;
  for(let i=0;i<=ticks;i++){const y=top+plotH*i/ticks,amount=Math.round(peak*(1-i/ticks)),line=makeSvg('line',{x1:left,y1:y,x2:width-right,y2:y,class:i===ticks?'hist-axis':'hist-grid-line'}),label=makeSvg('text',{x:left-9,y:y+3,'text-anchor':'end',class:'hist-label'});label.textContent=String(amount);svg.append(line,label);}
  const slot=plotW/binCount,barW=slot*.59;
  bins.forEach((bin,index)=>{
    const h=bin.count/peak*plotH,x=left+slot*index+(slot-barW)/2,y=top+plotH-h,rect=makeSvg('rect',{x,y,width:barW,height:Math.max(2,h),rx:5,class:'hist-bar'}),tooltip=makeSvg('title');tooltip.textContent=`${number(bin.min)}–${number(bin.max)}: ${bin.count} planetas`;rect.append(tooltip);svg.append(rect);
    const label=makeSvg('text',{x:left+slot*index+slot/2,y:top+plotH+17,'text-anchor':'middle',class:'hist-label'});label.textContent=`${compact(bin.min)}${index===binCount-1?'+':''}`;svg.append(label);
    if(bin.count){const count=makeSvg('text',{x:left+slot*index+slot/2,y:Math.max(top+11,y-7),'text-anchor':'middle',class:'hist-count-label'});count.textContent=String(bin.count);svg.append(count);}
  });
  const axis=makeSvg('text',{x:left+plotW/2,y:height-5,'text-anchor':'middle',class:'hist-label'});axis.textContent=`${resourceNames[resource]} por hora · intervalos`;svg.append(axis);
}
function renderPlanetVisuals(){
  const resource=$('chartResource').value,bodies=(selected()?.latest.bodies||[]).filter(body=>body.kind!=='moon'),entries=bodies.map((body,index)=>({name:body.name||`Planeta ${index+1}`,value:Number(body.production?.[resource]?.value)})).filter(entry=>Number.isFinite(entry.value)&&entry.value>=0),total=entries.reduce((sum,entry)=>sum+entry.value,0),account=selected()?.latest.account,synthetic=account?.universe==='synthetic'||entries.some(entry=>entry.source==='synthetic');
  renderPie(entries,total);renderHistogram(entries,resource);
  $('metric-planets').textContent=String(entries.length);$('metric-resource').textContent=`${resourceNames[resource]} / h`;$('metric-total').textContent=number(total);$('metric-spread').textContent=entries.length?`${compact(Math.min(...entries.map(entry=>entry.value)))}–${compact(Math.max(...entries.map(entry=>entry.value)))}`:'—';
  $('metric-quality').textContent=synthetic?'valores simulados · sin cuenta real':`${entries.length} valores capturados · ${selected()?.latest.observedAt?new Date(selected().latest.observedAt).toLocaleString('es-ES'):'sin captura'}`;$('metric-unit').textContent='unidades agregadas por hora';$('hist-count').textContent=String(entries.length);$('hist-range').textContent=entries.length?`${number(Math.min(...entries.map(entry=>entry.value)))}–${number(Math.max(...entries.map(entry=>entry.value)))}`:'—';
  $('viz-source-mark').textContent=synthetic?'SIM':'OBS';$('viz-source-label').textContent=synthetic?'DEMO SINTÉTICA':'DATOS OBSERVADOS';
  const missing=bodies.length-entries.length;$('chart-quality-note').textContent=missing?`${entries.length} planetas con dato de ${bodies.length}; ${missing} sin valor válido para ${resourceNames[resource].toLowerCase()}.`:`${synthetic?'En la demo todos los valores son simulados.':'Los valores proceden de la página visible y no han sido verificados.'} Las gráficas describen los datos capturados; no validan fórmulas ni representan una cuenta real.`;
}
async function refresh(){
  state=await api('/api/state');const previous=$('account').value;
  $('account').replaceChildren(...Object.entries(state.accounts).map(([key,entry])=>{const option=document.createElement('option');option.value=key;option.textContent=entry.latest.account.universe+' / '+entry.latest.account.player;return option;}));
  if(state.accounts[previous])$('account').value=previous;$('days').value=state.retention.days;$('snapshots').value=state.retention.snapshots;$('pairing').hidden=true;$('workspace').hidden=false;renderBodies();renderPlanetVisuals();
}
$('account').addEventListener('change',()=>{renderBodies();renderPlanetVisuals();});
$('chartResource').addEventListener('change',renderPlanetVisuals);
function action(id,handler){$(id).addEventListener('click',async()=>{const button=$(id);button.disabled=true;try{await handler();}catch(error){status(error.message,true);}finally{button.disabled=false;}});}
$('pairForm').addEventListener('submit',async event=>{event.preventDefault();try{await api('/api/pair',{code:$('pairCode').value});$('pairCode').value='';await refresh();status('Sesión local emparejada. Ningún dato se envía a OGame.');}catch(error){status(error.message,true);}});
document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.page').forEach(page=>page.hidden=page.id!==button.dataset.page);document.querySelectorAll('[data-page]').forEach(tab=>tab.classList.toggle('active',tab===button));}));
action('demo',async()=>{const result=await api('/api/demo',{});await refresh();$('goals').value=JSON.stringify(result.plan.goals,null,2);status('Demo sintética cargada: '+result.plan.goals.length+' planetas simulados. Ninguna cifra procede de una cuenta real.');});
action('extensionPairCode',async()=>{const result=await api('/api/extension/pair-code',{});$('extensionCode').textContent='Código temporal: '+result.code+' · caduca en 3 min';$('extensionCode').hidden=false;status('Código creado. Introdúcelo en la extensión y confirma la captura desde la pestaña del juego.');});
action('revokeExtensions',async()=>{await api('/api/extension/revoke-all',{});$('extensionCode').hidden=true;status('Credenciales de extensión revocadas.');});
action('retention',async()=>{await api('/api/retention',{days:Number($('days').value),snapshots:Number($('snapshots').value)});await refresh();status('Retención aplicada. Historial podado.');});
action('support',async()=>{const data=await api('/api/support'),link=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));link.href=url;link.download='ogmk-diagnostico-anonimizado.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Diagnóstico anonimizado exportado. Revísalo antes de compartirlo.');});
action('wipe',async()=>{await api('/api/data',{scope:'independent-store-only',confirm:$('confirmation').value},'DELETE');$('workspace').hidden=true;$('pairing').hidden=false;$('confirmation').value='';$('goals').value='';state={accounts:{}};status('Datos de esta instancia borrados. Reinicia este proceso para generar un nuevo código de emparejamiento.');});
action('analyze',async()=>{
  if(!selected())throw Error('Captura datos con la extensión o carga la demostración sintética.');
  const horizon=Number($('horizon').value),result=await api('/api/analyze',{account:selected().latest.account,goals:JSON.parse($('goals').value||'[]'),horizonHours:horizon,intervalHours:Number($('step').value),parallel:$('execution').value==='parallel',weights:[1,1.5,3]});
  $('events').replaceChildren();$('chart').replaceChildren();$('kpis').replaceChildren();
  if(result.status==='blocked'){status('Análisis bloqueado: '+result.issues.length+' datos críticos pendientes, provisionales o antiguos.',true);$('limits').textContent=result.issues.map(issue=>issue.bodyId+' · '+issue.field+' · '+issue.reason).join('\n');return;}
  const fmt=value=>value===null?'Fuera del periodo':number(value,1);
  for(const [label,value]of [['Ventaja al final',result.samples.at(-1).advantage],['Inversión equivalente',result.investment],['Finalización · horas',result.completionHours],['Recuperación · horas',result.breakEvenHours]]){const card=document.createElement('article'),caption=document.createElement('span'),numberNode=document.createElement('strong');caption.textContent=label;numberNode.textContent=fmt(value);card.append(caption,numberNode);$('kpis').append(card);}
  for(const event of result.events){const row=document.createElement('tr');for(const value of [event.kind==='start'?'Inicio':'Fin',event.id,event.bodyId,fmt(event.time)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('events').append(row);}
  const values=result.samples.map(sample=>sample.advantage),min=Math.min(0,...values),max=Math.max(1,...values),span=max-min||1;
  for(let tick=0;tick<=4;tick++){const y=230-tick*52,line=makeSvg('line',{x1:28,x2:785,y1:y,y2:y});$('chart').append(line);}
  const curve=makeSvg('path',{d:result.samples.map((sample,index)=>`${index?'L':'M'}${28+sample.hour/horizon*757},${230-(sample.advantage-min)/span*208}`).join(' ')});$('chart').append(curve);
  const last=result.samples.at(-1),end=makeSvg('circle',{cx:28+last.hour/horizon*757,cy:230-(last.advantage-min)/span*208,r:4,fill:'#79e4c1',stroke:'#0e1827','stroke-width':2});$('chart').append(end);$('projection-horizon').textContent=`Horizonte · ${horizon/720} ${horizon===720?'mes':'meses'}`;$('limits').textContent=result.assumptions.map(text=>assumptionLabels[text]||text).join(' ');status('Proyección estimada. No demuestra un óptimo global ni valida fórmulas de OGame.');
});
refresh().catch(()=>{});
