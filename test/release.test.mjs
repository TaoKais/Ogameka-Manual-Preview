import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('release checksum manifest describes the current GPL-scoped edition',async()=>{
  const manifest=JSON.parse(await fs.readFile(new URL('../SHA256SUMS.json',import.meta.url),'utf8'));
  assert.equal(manifest.edition,'ogameka');assert.equal(manifest.version,'0.3.0');assert.match(manifest.license,/GPL-3\.0-only/);
  for(const item of manifest.files){const bytes=await fs.readFile(new URL('../'+item.path,import.meta.url));assert.equal(bytes.length,item.bytes,item.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.path);}
});
