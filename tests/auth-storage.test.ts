import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rememberedStorage,REMEMBER_DAYS} from '../lib/auth-storage.ts';
function setup(){const saved=new Map<string,string>();let time=0;const storage=rememberedStorage({getItem:key=>saved.get(key)||null,setItem:(key,value)=>{saved.set(key,value)},removeItem:key=>{saved.delete(key)}},()=>time);return {storage,saved,advance:(milliseconds:number)=>{time+=milliseconds}}}
const token=(sessionId:string)=>JSON.stringify({access_token:'header.'+btoa(JSON.stringify({session_id:sessionId}))+'.signature'});
test('remembered session expires after 30 days, including across refreshes',()=>{const {storage,advance}=setup();storage.setItem('session',token('a'));advance(29*86400000);storage.setItem('session',token('a'));assert.ok(storage.getItem('session'));advance(86400000);assert.equal(storage.getItem('session'),null);assert.equal(REMEMBER_DAYS,30)});
test('a new sign-in receives its own remembered period',()=>{const {storage,advance}=setup();storage.setItem('session',token('a'));advance(29*86400000);storage.setItem('session',token('b'));advance(86400000);assert.equal(storage.getItem('session'),token('b'));storage.removeItem('session');assert.equal(storage.getItem('session'),null)});
test('corrupted browser storage does not restore a session',()=>{const {storage,saved}=setup();saved.set('session','bad json');assert.equal(storage.getItem('session'),null)});
