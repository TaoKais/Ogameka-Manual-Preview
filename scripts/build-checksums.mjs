import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url)),project=path.dirname(root);
const roots=['ABOUT.md','ARCHITECTURE.md','CAPTURE-DESIGN.md','CONTRACT.md','HOWTO.md','LICENSE','LICENSE-SCOPE.md','MIGRATION.md','NOTICE.md','PRIVACY.md','README.md','manifest.json','package.json','.gitignore','extension','public','src','test','scripts'];
async function filesAt(relative){
  const full=path.join(project,relative),stat=await fs.stat(full);
  if(stat.isFile())return [relative.replaceAll(path.sep,'/')];
  const entries=(await fs.readdir(full,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'));
  const result=[];for(const entry of entries){if(entry.name.startsWith('.tmp-'))continue;result.push(...await filesAt(path.join(relative,entry.name)));}return result;
}
const files=[...new Set((await Promise.all(roots.map(filesAt))).flat())].sort((a,b)=>a.localeCompare(b,'en'));
const records=[];for(const relative of files){const data=await fs.readFile(path.join(project,relative));records.push({path:relative,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
const document={format:1,edition:'ogameka-local-planner',version:'0.3.0',license:'GPL-3.0-only (scope defined by LICENSE-SCOPE.md)',files:records,excluded:['historic integrated application and tracker collector','third-party OGame/Gameforge assets, text and catalogs','runtime dependencies','account data and secrets']};
await fs.writeFile(path.join(project,'SHA256SUMS.json'),JSON.stringify(document,null,2)+'\n','utf8');
console.log(`Wrote ${records.length} file hashes for ${document.edition} ${document.version}`);
