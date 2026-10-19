import {captureVisiblePage} from './capture.js';
const $=id=>document.getElementById(id);
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
$('capture').addEventListener('click',async()=>{
  const button=$('capture');button.disabled=true;$('result').hidden=true;status('Leyendo únicamente el DOM visible…');
  try{
    const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab?.id||!tab.url)throw Error('No hay una pestaña activa que se pueda leer.');
    const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:captureVisiblePage,args:[]});
    const value=result?.[0]?.result;
    if(!value||value.error)throw Error(value?.error||'La página no devolvió una captura.');
    const payload=JSON.stringify(value.snapshot,null,2);
    $('payload').value=payload;
    $('counts').textContent=`${value.snapshot.bodies.length} cuerpo(s) · ${new TextEncoder().encode(payload).length.toLocaleString('es-ES')} bytes · capturado ${value.snapshot.observedAt}`;
    $('result').hidden=false;
    status('Captura lista. Revisa el JSON y cópialo tú mismo al planificador local.');
  }catch(error){status(error.message||'No se pudo leer esta página.',true);}
  finally{button.disabled=false;}
});
$('select').addEventListener('click',()=>{$('payload').focus();$('payload').select();status('JSON seleccionado. Pulsa Ctrl+C para copiarlo.');});
