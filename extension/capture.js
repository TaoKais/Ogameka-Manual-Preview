export function captureVisiblePage(page=document,pageUrl=location.href,observedAt=new Date().toISOString()) {
  const allowedHost=host=>typeof host==='string'&&host.endsWith('.ogame.gameforge.com')&&host.length>'.ogame.gameforge.com'.length;
  let url;
  try { url=new URL(pageUrl); } catch { return {error:'No se pudo identificar la pestaña.'}; }
  if(url.protocol!=='https:'||!allowedHost(url.hostname)||!url.pathname.startsWith('/game/'))
    return {error:'Abre una página del juego OGame antes de capturar.'};

  const attrs=(node,name)=>node?.getAttribute?.(name)||'';
  const visible=node=>{
    if(!node)return false;
    if(typeof node.getClientRects==='function'&&node.getClientRects().length===0)return false;
    return true;
  };
  const all=(root,selector)=>[...(root?.querySelectorAll?.(selector)||[])].filter(visible);
  // Identity comes from visible UI only; hidden metadata and storage are out of scope.
  const playerNode=all(page,'[data-player-name], #playerName, .playerName, [class*="playerName"]')[0];
  const player=(attrs(playerNode,'data-player-name')||playerNode?.textContent||'').trim();
  if(!player)return {error:'La página no expone la identidad de la cuenta. Abre el juego y vuelve a intentarlo.'};
  const universe=url.hostname.split('.')[0];
  const observed=()=>({quality:'observed',source:'visible-dom',observedAt});
  const numericValue=raw=>{
    if(raw==null)return null;
    let token=String(raw).replace(/\u00a0/g,' ').match(/-?\d[\d\s.,]*/)?.[0]?.trim();
    if(!token)return null;
    token=token.replace(/\s/g,'');
    token=token.replace(/[.,](?=\d{3}(?:[.,]|$))/g,'').replace(',','.');
    const value=Number(token);
    return Number.isFinite(value)?value:null;
  };
  const readValue=node=>{
    for(const name of ['data-value','data-amount','value','aria-valuetext']){
      const value=numericValue(attrs(node,name));
      if(value!==null)return value;
    }
    const descendants=all(node,'[data-value], [data-amount], .value, .amount, .resourceAmount');
    for(const child of descendants){
      for(const name of ['data-value','data-amount','value','aria-valuetext']){
        const value=numericValue(attrs(child,name));
        if(value!==null)return value;
      }
      const value=numericValue(child.textContent);
      if(value!==null)return value;
    }
    return numericValue(node.textContent);
  };
  const selectorsFor=resource=>[
    `[data-resource="${resource}"]`,
    `[data-resource-type="${resource}"]`,
    `[data-resource-id="${resource}"]`,
    `#resources_${resource}`,
    `#${resource}_box`
  ];
  const fact=(root,selectors)=>{
    for(const selector of selectors){
      for(const node of all(root,selector)){
        const value=readValue(node);
        if(value!==null)return {value,...observed()};
      }
    }
    return null;
  };
  const bodyId=node=>attrs(node,'data-body-id')||attrs(node,'data-planet-id')||attrs(node,'data-moon-id')||
    (attrs(node,'id').match(/(?:planet|moon)[-_]?(\d+)/i)?.[1]||null);
  const bodyName=node=>attrs(node,'data-body-name')||attrs(node,'data-planet-name')||
    all(node,'.planetname, .planetName, .name, [data-name]')[0]?.textContent?.trim()||'';
  const levelFacts=node=>{
    const result={};
    for(const item of all(node,'[data-technology-id][data-level]')){
      const id=attrs(item,'data-technology-id'),level=numericValue(attrs(item,'data-level'));
      if(/^\d{1,6}$/.test(id)&&Number.isInteger(level)&&level>=0)result[id]={value:level,...observed()};
    }
    return result;
  };
  const observedFact=value=>value===null?null:{value,quality:'observed',source:'visible-dom',observedAt};
  const gridCells=row=>{const result=[];let index=0;for(const cell of Array.from(row?.cells||[])){result[index]=cell;index+=cell.colSpan||1;}return result;};
  const readResourceSettings=()=>{
    const table=all(page,'table.listOfResourceSettingsPerPlanet')[0];if(!table)return null;
    const settings={},technologies=[[1,'metalPercent'],[2,'crystalPercent'],[3,'deuteriumPercent'],[4,'solarPercent'],[12,'fusionPercent'],[212,'satellitePercent'],[217,'crawlerPercent']],controls=all(table,'select');
    for(const [index,[id,key]] of technologies.entries()){
      const row=Array.from(table.querySelectorAll('tr')||[]).find(item=>Array.from(item.classList||[]).includes(String(id)));
      const control=all(page,`select[name="last${id}"], select#last${id}, select[data-technology="${id}"], [data-technology="${id}"] select[data-production-percentage]`)[0]||all(row,'select, input[type="range"], input[type="number"]')[0]||(controls.length===7?controls[index]:null);
      const option=Array.from(control?.options||[]).find(item=>item.defaultSelected)||control?.selectedOptions?.[0];
      const percent=(option?.textContent||'').match(/(\d+)\s*%/)||row?.cells?.[row.cells.length-1]?.textContent?.match(/^\s*(\d+)\s*%\s*$/);
      let amount=numericValue(percent?.[1]??option?.value??control?.value);
      if(!percent&&amount!==null){const values=Array.from(control?.options||[]).map(item=>numericValue(item.value)).filter(value=>value!==null),max=Math.max(0,...values);if(values.length&&max>0&&max<=10)amount*=10;else if(!values.length&&control?.type==='range'&&Number(control.max)>0&&Number(control.max)<=15)amount*=10;else if(!values.length&&!['range','number'].includes(control?.type))amount=null;}
      if(amount!==null&&amount>=0&&amount<=(id===217?150:100))settings[key]=observedFact(amount);
    }
    const summary=Array.from(table.querySelectorAll('tr')||[]).find(row=>Array.from(row.classList||[]).includes('summary')),
      production=Object.fromEntries(['metal','crystal','deuterium'].map((key,index)=>{const cell=gridCells(summary)[index+2];return [key,observedFact(numericValue(cell?.getAttribute?.('data-raw')??cell?.getAttribute?.('data-value')??cell?.textContent))];}));
    const result={};if(Object.keys(settings).length)result.settings=settings;if(Object.values(production).every(Boolean))result.production=production;
    const bonusBreakdown=[];
    for(const row of Array.from(table.querySelectorAll('tr')||[])){
      const technologyId=Array.from(row.classList||[]).find(value=>/^\d+$/.test(value)&&Number(value)>=1000&&Number(value)<2000);if(!technologyId)continue;
      const cells=gridCells(row),values=Object.fromEntries(['metal','crystal','deuterium','energy'].map((key,index)=>[key,observedFact(numericValue(cells[index+2]?.getAttribute?.('data-raw')??cells[index+2]?.getAttribute?.('data-value')??cells[index+2]?.textContent))]).filter(([,value])=>value));
      if(Object.keys(values).length)bonusBreakdown.push({technologyId,label:String(row.querySelector('.label')?.textContent||cells[0]?.textContent||'').trim().slice(0,100),...values});
    }
    if(bonusBreakdown.length)result.bonusBreakdown=bonusBreakdown;
    return Object.keys(result).length?result:null;
  };
  const makeBody=(node,id,kind,name)=>{
    if(!id)return null;
    const body={id:String(id),kind:kind==='moon'?'moon':'planet'};
    if(name)body.name=name.slice(0,80);
    const stock={};
    for(const resource of ['metal','crystal','deuterium']){
      const value=fact(node,selectorsFor(resource));
      if(value)stock[resource]=value;
    }
    if(Object.keys(stock).length)body.stock=stock;
    const production={};
    for(const resource of ['metal','crystal','deuterium']){
      const value=fact(node,[`[data-production-resource="${resource}"]`,`[data-production-${resource}]`]);
      if(value)production[resource]=value;
    }
    if(Object.keys(production).length)body.production=production;
    const levels=levelFacts(node);
    if(Object.keys(levels).length)body.levels=levels;
    return Object.keys(body).some(key=>!['id','kind','name'].includes(key))?body:null;
  };

  const rows=all(page,'#empire .planet:not(.summary), #empireView .planet:not(.summary), .empireView .planet:not(.summary)');
  const bodies=[];
  for(const row of rows){
    const id=bodyId(row);
    if(!id)continue;
    const descriptor=(attrs(row,'data-body-type')+' '+attrs(row,'data-type')+' '+attrs(row,'class')+' '+attrs(row,'id')).toLowerCase();
    const kind=/moon|luna/.test(descriptor)?'moon':'planet';
    const body=makeBody(row,id,kind,bodyName(row));
    if(body)bodies.push(body);
  }
  if(!bodies.length){
    const active=all(page,'.smallplanet.active, #planetList .smallplanet.active, [data-active-body="true"]')[0];
    const id=active&&bodyId(active);
    const name=active&&bodyName(active);
    const descriptor=active?`${attrs(active,'data-body-type')} ${attrs(active,'data-type')} ${attrs(active,'class')} ${attrs(active,'id')}`:'';
    const kind=/moon|luna/.test(descriptor.toLowerCase())?'moon':'planet';
    const body=makeBody(page,id,kind,name);
    if(body)bodies.push(body);
  }
  if(!bodies.length)return {error:'No se detectaron valores económicos visibles reconocidos. Abre Imperio o la vista de recursos; no se inventarán los campos ausentes.'};
  const unique=[...new Map(bodies.map(body=>[`${body.kind}:${body.id}`,body])).values()];
  const resourceSettings=readResourceSettings();
  if(resourceSettings){
    const active=all(page,'.smallplanet.active, #planetList .smallplanet.active, [data-active-body="true"]')[0],activeId=active&&bodyId(active),target=unique.find(body=>body.id===activeId)||(unique.length===1?unique[0]:null);
    if(target)Object.assign(target,resourceSettings);
  }
  if(unique.length>32)return {error:'La captura supera el límite de 32 cuerpos.'};
  const snapshot={schema:'ogmk.capture/1',account:{universe,player},observedAt,bodies:unique};
  if(new TextEncoder().encode(JSON.stringify(snapshot)).length>131072)return {error:'La captura supera el límite local de 128 KiB.'};
  return {snapshot};
}
