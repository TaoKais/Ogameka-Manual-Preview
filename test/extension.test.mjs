import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {captureVisiblePage} from '../extension/capture.js';

class Element {
  constructor(attrs={},text=''){this.attrs=attrs;this.textContent=text;}
  getAttribute(name){return this.attrs[name]??null;}
  getClientRects(){return [{}];}
}
class Page {
  constructor(entries){this.entries=entries;}
  querySelectorAll(selector){return this.entries[selector]||[];}
}

test('MV3 manifest is loadable from the ZIP root and has only temporary capture permissions',async()=>{
  const manifest=JSON.parse(await fs.readFile(new URL('../manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.permissions,['activeTab','scripting']);
  assert.equal(manifest.host_permissions,undefined);
  assert.equal(manifest.background,undefined);
  await fs.access(new URL(`../${manifest.action.default_popup}`,import.meta.url));
});

test('one-click adapter emits actual visible fixture values and leaves unsupported values absent',()=>{
  const player=new Element({},'Yahvveh');
  const active=new Element({'data-body-name':'Capital','data-planet-id':'991','class':'smallplanet active'});
  const metal=new Element({'data-value':'1.234.500'});
  const crystal=new Element({'data-value':'42,500'});
  const level=new Element({'data-technology-id':'1','data-level':'28'});
  const page=new Page({
    '[data-player-name], #playerName, .playerName, [class*="playerName"]':[player],
    '#empire .planet:not(.summary), #empireView .planet:not(.summary), .empireView .planet:not(.summary)':[],
    '.smallplanet.active, #planetList .smallplanet.active, [data-active-body="true"]':[active],
    '#resources_metal':[metal], '#resources_crystal':[crystal],
    '[data-technology-id][data-level]':[level]
  });
  const result=captureVisiblePage(page,'https://s123-es.ogame.gameforge.com/game/index.php','2026-10-20T10:00:00.000Z');
  assert.equal(result.snapshot.schema,'ogmk.capture/1');
  assert.deepEqual(result.snapshot.account,{universe:'s123-es',player:'Yahvveh'});
  assert.deepEqual(result.snapshot.bodies[0].stock.metal,{value:1234500,quality:'observed',source:'visible-dom',observedAt:'2026-10-20T10:00:00.000Z'});
  assert.equal(result.snapshot.bodies[0].stock.crystal.value,42500);
  assert.equal(result.snapshot.bodies[0].levels['1'].value,28);
  assert.equal(result.snapshot.bodies[0].production,undefined);
  assert.equal(result.snapshot.bodies[0].stock.deuterium,undefined);
});

test('adapter rejects non-game origins and does not synthesize values on unsupported pages',()=>{
  assert.match(captureVisiblePage(new Page({}),'https://example.org/game/index.php').error,/OGame/);
  const page=new Page({'[data-player-name], #playerName, .playerName, [class*="playerName"]':[new Element({},'player')]});
  assert.match(captureVisiblePage(page,'https://s1-en.ogame.gameforge.com/game/index.php').error,/No se detectaron/);
});
