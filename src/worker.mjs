import {parentPort} from 'node:worker_threads';
import {analyze} from './engine.mjs';
parentPort.on('message',({id,snapshot,request})=>{try{parentPort.postMessage({id,result:analyze(snapshot,request)});}catch(error){parentPort.postMessage({id,error:error.message,status:error.status||400});}});
