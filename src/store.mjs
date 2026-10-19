import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {accountKey,capture,digest,reconcile,InputError,LIMITS,object,number} from './contract.mjs';
const hash=data=>createHash('sha256').update(data).digest('hex');
const encode=data=>JSON.stringify({checksum:hash(JSON.stringify(data)),data});
export function migrate(data){
  if(data.version===1){const original=structuredClone(data);return {data:{version:2,revision:data.revision||0,retention:{days:30,snapshots:120},accounts:data.accounts||{}},original};}
  if(data.version!==2)throw Error('Unsupported store version');return {data};
}
const initial=()=>({version:2,revision:0,retention:{days:30,snapshots:120},accounts:{}});
function pruneState(state,retention=state.retention,now=Date.now()){const cutoff=now-retention.days*86400000;for(const [key,account] of Object.entries(state.accounts)){if(Date.parse(account.latest.observedAt)<cutoff){delete state.accounts[key];continue;}account.history=account.history.filter(row=>Date.parse(row.snapshot.observedAt)>=cutoff).slice(-retention.snapshots);}}
export class Store{
  static async open(dir){const store=new Store(dir);try{await store.open();return store;}catch(error){if(store.lock)await store.close().catch(()=>{});throw error;}}
  constructor(dir){this.dir=path.resolve(dir);this.file=path.join(this.dir,'store.json');this.tail=Promise.resolve();this.recovered=false;}
  async open(){
    await fs.mkdir(this.dir,{recursive:true,mode:0o700});const entries=await fs.readdir(this.dir);
    if(entries.length&&!entries.includes('.ogmk-owned'))throw Error('Refusing a non-owned directory; never use a legacy data directory');
    await fs.writeFile(path.join(this.dir,'.ogmk-owned'),'OGMK independent store v2\n',{mode:0o600});
    try{this.lock=await fs.open(path.join(this.dir,'writer.lock'),'wx',0o600);}catch(error){if(error.code==='EEXIST')throw Error('Store is locked; verify its owner process before offline recovery');throw error;}
    await this.lock.writeFile(String(process.pid));
    try{this.state=await this.load(this.file);}catch(error){if(error.code==='ENOENT')this.state=initial();else{try{this.state=await this.load(this.file+'.bak');this.recovered=true;await fs.copyFile(this.file,this.file+'.damaged');}catch{await this.close();throw Error('Store damaged; original preserved, explicit recovery required');}}}
    const migration=migrate(this.state);this.state=migration.data;if(migration.original){await fs.writeFile(this.file+'.v1',encode(migration.original),{mode:0o600});await this.persist();}
    this.prune();await this.persist();return this;
  }
  async load(file){const stat=await fs.stat(file);if(stat.size>8*1024*1024)throw Error('Store size limit');const packet=JSON.parse(await fs.readFile(file,'utf8'));if(hash(JSON.stringify(packet.data))!==packet.checksum)throw Error('Store checksum mismatch');
    const data=packet.data;if(![1,2].includes(data?.version)||!Number.isSafeInteger(data.revision)||!data.accounts||Object.keys(data.accounts).length>LIMITS.accounts)throw Error('Invalid store envelope');
    if(data.version===2){object(data.retention,['days','snapshots'],'stored retention');number(data.retention.days,1,365);number(data.retention.snapshots,1,120);if(!Number.isInteger(data.retention.days)||!Number.isInteger(data.retention.snapshots))throw Error('Invalid stored retention');}
    for(const [key,entry] of Object.entries(data.accounts)){if(!entry.latest||accountKey(capture(entry.latest).account)!==key||!Number.isSafeInteger(entry.revision)||!Array.isArray(entry.history)||entry.history.length>120)throw Error('Invalid account record');for(const row of entry.history)if(accountKey(capture(row.snapshot).account)!==key||row.hash!==digest(row.snapshot))throw Error('Invalid history record');}
    return data;
  }
  async persist(){const serialized=encode(this.state);if(Buffer.byteLength(serialized)>8*1024*1024)throw new InputError('Store size limit',413);const temp=this.file+'.tmp-'+randomBytes(6).toString('hex');
    try{const fd=await fs.open(temp,'wx',0o600);try{await fd.writeFile(serialized);await fd.sync();}finally{await fd.close();}
      if(!this.recovered)try{const previous=migrate(await this.load(this.file)).data;previous.retention={...this.state.retention};pruneState(previous);await fs.writeFile(this.file+'.bak',encode(previous),{mode:0o600});}catch(error){if(error.code!=='ENOENT')throw error;}
      await fs.rename(temp,this.file);this.recovered=false;
    }finally{await fs.unlink(temp).catch(()=>{});}
  }
  enqueue(fn){const run=this.tail.then(async()=>{const before=structuredClone(this.state);try{return await fn();}catch(error){this.state=before;throw error;}});this.tail=run.catch(()=>{});return run;}
  read(){return structuredClone(this.state);}
  latest(key){return this.state.accounts[key]?structuredClone(this.state.accounts[key].latest):null;}
  view(){return {version:this.state.version,revision:this.state.revision,retention:{...this.state.retention},accounts:Object.fromEntries(Object.entries(this.state.accounts).map(([key,e])=>[key,{revision:e.revision,historyEntries:e.history.length,latest:structuredClone(e.latest)}]))};}
  prune(now=Date.now()){
    pruneState(this.state,this.state.retention,now);
  }
  async ingest(raw,expectedRevision){const incoming=capture(raw),key=accountKey(incoming.account);return this.enqueue(async()=>{
    const previous=this.state.accounts[key];if(expectedRevision!==undefined&&expectedRevision!==(previous?.revision||0))throw new InputError('Revision conflict',409);
    if(!previous&&Object.keys(this.state.accounts).length>=LIMITS.accounts)throw new InputError('Account limit',413);
    const latest=reconcile(previous?.latest,incoming),contentHash=digest(latest),unchanged=previous?.hash===contentHash;
    const entry={latest,hash:contentHash,revision:(previous?.revision||0)+1,history:[...(previous?.history||[])]};
    if(!unchanged)entry.history.push({hash:contentHash,snapshot:structuredClone(latest)});this.state.accounts[key]=entry;this.state.revision++;this.prune();await this.persist();return {revision:entry.revision,unchanged,hash:contentHash};
  });}
  async retention(value){object(value,['days','snapshots'],'retention');number(value.days,1,365);number(value.snapshots,1,120);if(!Number.isInteger(value.days)||!Number.isInteger(value.snapshots))throw new InputError('Integer retention required');return this.enqueue(async()=>{this.state.retention={...value};this.state.revision++;this.prune();await this.persist();await fs.copyFile(this.file,this.file+'.bak');return this.state.retention;});}
  async wipe(){return this.enqueue(async()=>{this.state=initial();for(const entry of await fs.readdir(this.dir))if(entry==='pair-code.txt'||/^store\.json(?:\.(?:bak|v1|damaged)|\.tmp-[a-f0-9]+)?$/.test(entry))await fs.unlink(path.join(this.dir,entry));await this.persist();return {cleared:true,scope:'independent-store-only'};});}
  async close(){await this.tail;await this.lock?.close();await fs.unlink(path.join(this.dir,'writer.lock')).catch(()=>{});}
}
