import test from 'node:test';
import assert from 'node:assert/strict';
import {hasSeenWelcome,WELCOME_SEEN_KEY} from '../commercial/onboarding.ts';
import {defaultSettings,getTableDisplay} from '../commercial/settings.ts';
import {validateSettings} from '../commercial/settings-validation.ts';

test('existing user metadata does not accidentally count as a completed introduction',()=>{
 assert.equal(hasSeenWelcome({email_verified:true,provider:'email'}),false);
 assert.equal(hasSeenWelcome({[WELCOME_SEEN_KEY]:false}),false);
 assert.equal(hasSeenWelcome({[WELCOME_SEEN_KEY]:''}),false);
 const persisted=JSON.parse(JSON.stringify({email_verified:true,[WELCOME_SEEN_KEY]:'2026-11-17T09:00:00.000Z'}));
 assert.equal(hasSeenWelcome(persisted),true);
});
test('choosing a welcome color preserves custom menus, meal times, and navigation',()=>{
 const current=structuredClone(defaultSettings);
 current.menuProfiles.push({id:'vegan',name:'Vegan'});
 current.mealSlots=[{id:'dinner',name:'Evening meal'}];
 current.tableDisplay!.pins=['inventory','grocery'];
 const raw=structuredClone(current);
 const before=validateSettings(current);
 const updated=validateSettings({...current,tableDisplay:{...getTableDisplay(current),accent:'#865A70',surface:'#F5EBF0'}});
 assert.deepEqual(updated.menuProfiles,before.menuProfiles);
 assert.deepEqual(updated.mealSlots,before.mealSlots);
 assert.deepEqual(updated.tableDisplay!.pins,before.tableDisplay!.pins);
 assert.deepEqual(updated.tableDisplay!.homeSections,before.tableDisplay!.homeSections);
 assert.equal(updated.tableDisplay!.accent,'#865A70');
 assert.deepEqual(current,raw);
});
