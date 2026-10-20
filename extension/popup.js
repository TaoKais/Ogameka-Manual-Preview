import {captureVisiblePage} from './capture.js';
const $=id=>document.getElementById(id),PLANNER='http://127.0.0.1:3176',HOST=PLANNER+'/*';
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
async function ensureLocalPermission(){
  const existing=await chrome.permissions.contains({origins:[HOST]});
  return existing||await chrome.permissions.request({origins:[HOST]});
}
async function localRequest(path,{method='POST',body,token}={}){
  const headers={'Content-Type':'application/json','X-OGMK-Intent':'user'};
  if(token)headers.Authorization='Bearer '+token;
  const response=await fetch(PLANNER+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',credentials:'omit'});
  const value=await response.json().catch(()=>({error:'Respuesta local no válida.'}));
  if(!response.ok)throw Object.assign(Error(value.error||'Error de comunicación local.'),{status:response.status});
  return value;
}
async function pairIfNeeded(){
  const stored=await chrome.storage.local.get('ogmkUploadToken');
  if(stored.ogmkUploadToken)return stored.ogmkUploadToken;
  const code=$('pairCode').value.trim();
  if(!/^\d{8}$/.test(code))throw Error('En el planificador, abre Datos y privacidad, genera un código y escríbelo aquí.');
  const paired=await localRequest('/api/extension/pair',{body:{code}});
  await chrome.storage.local.set({ogmkUploadToken:paired.token});
  $('pairCode').value='';$('disconnect').hidden=false;
  return paired.token;
}
async function sendCapture(snapshot){
  let token=await pairIfNeeded();
  try{return await localRequest('/api/extension/capture',{body:snapshot,token});}
  catch(error){
    if(error.status!==401)throw error;
    await chrome.storage.local.remove('ogmkUploadToken');$('disconnect').hidden=true;
    throw Error('El emparejamiento caducó. Genera un código nuevo en el planificador.');
  }
}
if(chrome.storage.local.setAccessLevel)chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}).catch(()=>{});
chrome.storage.local.get('ogmkUploadToken').then(value=>{$('disconnect').hidden=!value.ogmkUploadToken;}).catch(()=>{});
$('capture').addEventListener('click',async()=>{
  const button=$('capture');button.disabled=true;$('counts').hidden=true;status('Solicitando acceso local…');
  try{
    if(!await ensureLocalPermission())throw Error('No se concedió permiso para el planificador local.');
    const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab?.id||!tab.url)throw Error('No hay una pestaña activa que se pueda leer.');
    status('Leyendo solo el DOM visible…');
    const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:captureVisiblePage,args:[]}),value=result?.[0]?.result;
    if(!value||value.error)throw Error(value?.error||'La página no devolvió una captura.');
    const saved=await sendCapture(value.snapshot);
    $('counts').textContent=`${value.snapshot.bodies.length} cuerpo(s) · revisión local ${saved.revision}${saved.unchanged?' · sin cambios nuevos':''}`;$('counts').hidden=false;
    status('Captura validada y guardada en el planificador local. No se envió a OGame.');
  }catch(error){status(error.message||'No se pudo completar la captura local.',true);}
  finally{button.disabled=false;}
});
$('disconnect').addEventListener('click',async()=>{
  const button=$('disconnect');button.disabled=true;
  try{
    const stored=await chrome.storage.local.get('ogmkUploadToken');
    if(stored.ogmkUploadToken&&await chrome.permissions.contains({origins:[HOST]}))await localRequest('/api/extension/pair',{method:'DELETE',token:stored.ogmkUploadToken});
  }catch{}
  await chrome.storage.local.remove('ogmkUploadToken');button.hidden=true;button.disabled=false;status('Credencial local eliminada. Si el servidor no estaba disponible, revoca los emparejamientos desde el planificador.');
});
