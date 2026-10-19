import {Worker} from 'node:worker_threads';
import {LIMITS,InputError} from './contract.mjs';
export class Pool{
  constructor({timeout=LIMITS.workerMs,url=new URL('./worker.mjs',import.meta.url)}={}){this.timeout=timeout;this.url=url;this.queue=[];this.serial=0;this.closed=false;}
  run(snapshot,request){if(this.closed)return Promise.reject(new InputError('Worker closed',503));if(this.queue.length+(this.current?1:0)>=LIMITS.jobs)return Promise.reject(new InputError('Analysis queue full',429));return new Promise((resolve,reject)=>{this.queue.push({id:++this.serial,snapshot,request,resolve,reject});this.pump();});}
  pump(){if(this.current||!this.queue.length||this.closed)return;if(!this.worker){const worker=this.worker=new Worker(this.url,{execArgv:[],env:{},resourceLimits:{maxOldGenerationSizeMb:64,maxYoungGenerationSizeMb:16,stackSizeMb:4}});worker.on('message',message=>{if(this.worker!==worker||!this.current||message.id!==this.current.id)return;const job=this.current;clearTimeout(this.timer);this.current=null;message.error?job.reject(new InputError(message.error,message.status)):job.resolve(message.result);this.pump();});worker.on('error',()=>this.fail(worker,'Analysis worker failed'));worker.on('exit',code=>{if(code&&this.worker===worker)this.fail(worker,'Analysis worker exited');});}
    this.current=this.queue.shift();this.timer=setTimeout(()=>this.fail(this.worker,'Analysis deadline exceeded'),this.timeout);const {id,snapshot,request}=this.current;this.worker.postMessage({id,snapshot,request});
  }
  fail(worker,message){if(!worker||worker!==this.worker)return;this.worker=null;clearTimeout(this.timer);this.current?.reject(new InputError(message,503));this.current=null;worker.terminate();this.pump();}
  async close(){this.closed=true;clearTimeout(this.timer);this.current?.reject(new InputError('Worker closed',503));this.current=null;for(const job of this.queue)job.reject(new InputError('Worker closed',503));this.queue=[];await this.worker?.terminate();this.worker=null;}
}
