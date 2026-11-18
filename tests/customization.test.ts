import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSettings,readSettings,mealsRemovedBySettings} from '../commercial/settings-validation.ts';
import {planInventoryChange} from '../lib/inventory.ts';
test('restores four meal times and preserves requested customization',()=>{const s=readSettings();s.mealSlots=s.mealSlots!.filter(x=>x.id!=='snack');s.mealSlots[0].name='Morning';s.tableDisplay!.accent='#865A70';const saved=validateSettings(s);assert.equal(saved.mealSlots!.length,3);assert.equal(saved.mealSlots![0].name,'Morning');assert.equal(saved.tableDisplay!.accent,'#865A70');});
test('rejects empty meal times, duplicate slots and excessive navigation',()=>{const s=readSettings();assert.throws(()=>validateSettings({...s,mealSlots:[]}));assert.throws(()=>validateSettings({...s,mealSlots:[s.mealSlots![0],s.mealSlots![0]]}));assert.throws(()=>validateSettings({...s,tableDisplay:{...s.tableDisplay,pins:['weekly','additional','grocery','favorites']}}));});
test('removing a meal time releases inventory across menus without touching other meals',()=>{const inventory={id:'stock',kind:'inventory',meat:'Chicken',cut:'Thigh',stock:1,stockVersion:1};const breakfast={id:'a',kind:'meal',profileId:'main',slotId:'breakfast',date:'2026-11-17',inventoryId:'stock',inventoryQuantity:1};const second={...breakfast,id:'b',profileId:'baby'};const dinner={id:'c',kind:'meal',date:'2026-11-17',slotId:'dinner',dish:'Soup'};const p=planInventoryChange([inventory,breakfast,second,dinner],[breakfast,second],'delete');assert.equal(p.entries.find(x=>x.id==='stock')!.stock,3);assert.equal(p.deleted.length,2);assert.equal(p.entries.find(x=>x.id==='c')!.dish,'Soup');});
test('reads defaults without mutating later households',()=>{const a=readSettings();a.mealSlots![0].name='Changed';a.tableDisplay!.pins.pop();const b=readSettings();assert.equal(b.mealSlots![0].name,'Breakfast');assert.equal(b.tableDisplay!.pins.length,3);});

test('deleting a custom menu removes all its weeks and returns inventory while preserving other content',()=>{
 const previous=readSettings();previous.menuProfiles.push({id:'vegan',name:'Vegan'},{id:'baby',name:'Baby'});
 const next=validateSettings({...previous,menuProfiles:previous.menuProfiles.filter(p=>p.id!=='vegan')});
 const entries=[{id:'stock',kind:'inventory',meat:'Tofu',cut:'Firm',stock:2,stockVersion:1},
  {id:'week1',kind:'meal',profileId:'vegan',date:'2026-11-18',inventoryId:'stock',inventoryQuantity:1},
  {id:'week2',kind:'meal',profileId:'vegan',date:'2026-11-25',inventoryId:'stock',inventoryQuantity:2},
  {id:'main',kind:'meal',dish:'Main meal'}, {id:'baby',kind:'meal',profileId:'baby',dish:'Baby meal'},
  {id:'favorite',kind:'meal',profileId:'vegan',favoriteTemplate:true,dish:'Saved dish'}, {id:'grocery',kind:'grocery',name:'Milk'}];
 const deleted=mealsRemovedBySettings(entries,previous,next);assert.deepEqual(deleted.map(e=>e.id),['week1','week2']);
 const plan=planInventoryChange(entries,deleted,'delete');assert.equal(plan.entries.find(e=>e.id==='stock')!.stock,5);
 assert.deepEqual(plan.entries.filter(e=>e.kind!=='inventory'),entries.slice(3));
 assert.throws(()=>validateSettings({...previous,menuProfiles:previous.menuProfiles.filter(p=>p.id!=='main')}));
});
test('deleting a menu and meal time selects overlapping meals only once',()=>{
 const previous=readSettings();previous.menuProfiles.push({id:'baby',name:'Baby'});
 const next=validateSettings({...previous,menuProfiles:previous.menuProfiles.slice(0,1),mealSlots:previous.mealSlots!.filter(s=>s.id!=='breakfast')});
 const deleted=mealsRemovedBySettings([{kind:'meal',profileId:'baby',slotId:'breakfast'}],previous,next);assert.equal(deleted.length,1);
});
